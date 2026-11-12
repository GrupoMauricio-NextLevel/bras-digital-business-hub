import { and, asc, desc, eq, inArray, isNull, like, lte, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { contratoParcelas, contratos, organizations, stores } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { CONTRATADA_PADRAO, MODELO_LOJA_PRONTA, VERSAO_LOJA_PRONTA, conferirDados, formatar, impressaoDigital, montarSecoes, type DadosLojaPronta } from "@/lib/contratos/loja-pronta-express";
import { gerarPdfContrato } from "@/lib/contratos/pdf";
import { sendEmail } from "@/lib/email";
import { newId } from "@/lib/ids";
import { assertCanAccess, assertStoreAdmin, requireStoreId, type Actor } from "./access";
import { estenderVencimento } from "./assinaturas-master";
import { lancar, podeOperarCaixa } from "./caixa";
import { dataSP, somarDias } from "@/lib/finance/caixa-regras";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";

/**
 * Contratos com aceite no painel (CT1+CT2, D276). O Master (dono ou Financeiro) cria e envia: o envio é a assinatura
 * da contratada. O dono da loja lê e aceita no próprio painel; o aceite guarda a prova. O texto fica congelado.
 */
const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD");
const centavos = z.number().int();
export const contratoLojaProntaSchema = z.object({
  storeId: z.string().min(1),
  cliente: z.object({ nome: z.string().trim().min(3, "Nome do cliente"), documento: z.string().trim().min(11, "CPF ou CNPJ do cliente"), email: z.string().trim().email("E-mail do cliente") }),
  contratada: z.object({
    razao: z.string().trim().min(3).default(CONTRATADA_PADRAO.razao), cnpj: z.string().trim().min(14).default(CONTRATADA_PADRAO.cnpj),
    banco: z.string().trim().min(2).default(CONTRATADA_PADRAO.banco), chavePix: z.string().trim().min(5).default(CONTRATADA_PADRAO.chavePix),
    favorecido: z.string().trim().min(3).default(CONTRATADA_PADRAO.favorecido), representante: z.string().trim().min(3).default(CONTRATADA_PADRAO.representante),
    cpfRepresentante: z.string().trim().optional(), emailRepresentante: z.string().trim().email().default(CONTRATADA_PADRAO.emailRepresentante),
  }).default({ ...CONTRATADA_PADRAO }),
  valorCheioCents: centavos, valorCents: centavos, sinalCents: centavos, dataSinal: dataIso, restanteCents: centavos, dataRestante: dataIso,
  produtos: z.number().int().min(1).max(10_000).default(40), prazoDias: z.number().int().min(1).max(120).default(5),
  cortesiaMeses: z.number().int().min(0).max(12).default(0),
});
export type ContratoLojaProntaInput = z.input<typeof contratoLojaProntaSchema>;

const exigirMaster = (actor: Actor) => { if (!podeOperarCaixa(actor)) throw new ForbiddenError("Só o dono e o Financeiro enviam contratos."); };
const dia = (now: Date) => now.toISOString().slice(0, 10).replaceAll("-", "");

async function lojaEcommerce(db: Database, storeId: string) {
  const row = (await db.select({ id: stores.id, nome: stores.name, slug: stores.slug, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, storeId)).limit(1))[0];
  if (!row) throw new NotFoundError("Loja não encontrada.");
  if (row.brand !== "NEXTLEVEL_COMMERCE") throw new DomainError("NOT_COMMERCE", "Contratos são só para lojas da NextLevel E-commerce.");
  return row;
}

/** Monta, congela e envia. Com cortesia, estende o acesso da loja (90 dias por vez, como o Caixa permite). */
export async function enviarContratoLojaPronta(db: Database, actor: Actor, raw: ContratoLojaProntaInput, now = new Date()) {
  exigirMaster(actor);
  const input = contratoLojaProntaSchema.parse(raw);
  const loja = await lojaEcommerce(db, input.storeId);
  const dados: DadosLojaPronta = { ...input, contratada: input.contratada, loja: { nome: loja.nome, slug: loja.slug } };
  const problemas = conferirDados(dados);
  if (problemas.length) throw new DomainError("CONTRATO_INVALIDO", problemas.join(" "));
  const secoes = montarSecoes(dados);
  const hash = impressaoDigital(dados, secoes);
  const prefixo = `LPX-${dia(now)}-`;
  const doDia = await db.select({ numero: contratos.numero }).from(contratos).where(like(contratos.numero, `${prefixo}%`));
  const numero = `${prefixo}${String(doDia.length + 1).padStart(2, "0")}`;
  const id = newId("ctr");
  await db.insert(contratos).values({ id, numero, modelo: MODELO_LOJA_PRONTA, versaoModelo: VERSAO_LOJA_PRONTA, storeId: loja.id, titulo: `Loja Virtual Pronta Express · ${loja.nome}`, dados: dados as unknown as Record<string, unknown>, conteudo: { secoes }, hash, status: "ENVIADO", enviadoPor: actor.userId, enviadoEm: now.toISOString() });
  if (input.cortesiaMeses > 0) {
    let restam = input.cortesiaMeses * 30;
    while (restam > 0) { const vez = Math.min(90, restam); await estenderVencimento(db, actor, loja.id, vez, `Cortesia de ${input.cortesiaMeses} meses do contrato ${numero}`, now); restam -= vez; }
  }
  const base = brandByCode("NEXTLEVEL_COMMERCE").baseUrl.replace(/\/$/, "");
  await sendEmail(db, {
    kind: "CONTRATO_ENVIADO", to: input.cliente.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `contrato:${id}:enviado`,
    subject: `Seu contrato ${numero} está esperando o seu aceite`,
    text: `Olá, ${input.cliente.nome.split(" ")[0]}!\n\nO contrato da sua Loja Virtual Pronta Express (${loja.nome}) já está no seu painel.\n\nEntre com o seu login, leia com calma e, se estiver tudo certo, marque "Li e concordo" e aperte "Aceitar contrato".\n\nResumo: ${formatar.brl(input.valorCents)} no Pix (chave ${input.contratada.chavePix}, ${input.contratada.banco}), sendo ${formatar.brl(input.sinalCents)} em ${formatar.data(input.dataSinal)} e ${formatar.brl(input.restanteCents)} até ${formatar.data(input.dataRestante)}.`,
    cta: { label: "Abrir o contrato no painel", url: `${base}/merchant/contratos/${id}` }, ceo: true,
  });
  await emitEvent(db, { type: "CONTRATO_ENVIADO", storeId: loja.id, actorRole: actor.role, payload: { contratoId: id, numero, hash } });
  return { id, numero, hash };
}

/** Lista do Master (dono, Financeiro e Comercial veem). */
export async function contratosDoMaster(db: Database, actor: Actor) {
  if (actor.role !== "NEXTLEVEL_MASTER" || actor.masterFunction === "CONTADOR") throw new ForbiddenError();
  return db.select({ id: contratos.id, numero: contratos.numero, titulo: contratos.titulo, status: contratos.status, enviadoEm: contratos.enviadoEm, aceitoEm: contratos.aceitoEm, aceitoNome: contratos.aceitoNome, storeId: contratos.storeId }).from(contratos).orderBy(desc(contratos.enviadoEm)).limit(200);
}

/** Contratos da loja de quem está logado (só o dono da loja; a equipe da loja não vê). */
export async function contratosDaLoja(db: Database, actor: Actor) {
  const storeId = requireStoreId(actor);
  assertStoreAdmin(actor);
  return db.select({ id: contratos.id, numero: contratos.numero, titulo: contratos.titulo, status: contratos.status, enviadoEm: contratos.enviadoEm, aceitoEm: contratos.aceitoEm }).from(contratos).where(and(eq(contratos.storeId, storeId), inArray(contratos.status, ["ENVIADO", "ACEITO"]))).orderBy(desc(contratos.enviadoEm));
}


/** Quantos contratos a loja ainda precisa aceitar (aviso na tela inicial). */
export async function contratosPendentes(db: Database, actor: Actor): Promise<{ id: string; numero: string }[]> {
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") return [];
  return db.select({ id: contratos.id, numero: contratos.numero }).from(contratos).where(and(eq(contratos.storeId, actor.storeId), eq(contratos.status, "ENVIADO")));
}

/** Um contrato, para o Master ou para o dono da loja dele. */
export async function verContrato(db: Database, actor: Actor, id: string) {
  const c = (await db.select().from(contratos).where(eq(contratos.id, id)).limit(1))[0];
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  assertCanAccess(actor, { storeId: c.storeId });
  if (actor.role === "STORE_OWNER") assertStoreAdmin(actor);
  if (c.status === "CANCELADO" && actor.role === "STORE_OWNER") throw new NotFoundError("Contrato não encontrado.");
  return c;
}

export const aceiteSchema = z.object({ concordo: z.literal(true, { error: "Marque \"Li e concordo\" para aceitar." }), hashVisto: z.string().length(64), nome: z.string().trim().min(3, "Digite o seu nome completo") });

/** Aceite do dono da loja: só uma vez, só do texto que ele viu (impressão digital igual), com a prova gravada. */
export async function aceitarContrato(db: Database, actor: Actor, id: string, raw: z.input<typeof aceiteSchema>, prova: { ip: string | null; aparelho: string | null }, now = new Date()) {
  const storeId = requireStoreId(actor);
  assertStoreAdmin(actor);
  const input = aceiteSchema.parse(raw);
  const c = (await db.select().from(contratos).where(eq(contratos.id, id)).limit(1))[0];
  if (!c || c.storeId !== storeId || c.status === "CANCELADO") throw new NotFoundError("Contrato não encontrado.");
  if (c.status === "ACEITO") throw new DomainError("JA_ACEITO", "Este contrato já foi aceito.");
  if (input.hashVisto !== c.hash || impressaoDigital(c.dados, c.conteudo.secoes) !== c.hash) throw new DomainError("CONTRATO_MUDOU", "O contrato mudou desde que você abriu a página. Recarregue e leia de novo.");
  const r = await db.update(contratos).set({ status: "ACEITO", aceitoPor: actor.userId, aceitoNome: input.nome, aceitoEm: now.toISOString(), aceitoIp: prova.ip?.slice(0, 100) ?? null, aceitoAparelho: prova.aparelho?.slice(0, 300) ?? null, aceitoHash: c.hash }).where(and(eq(contratos.id, id), eq(contratos.status, "ENVIADO"))).returning({ id: contratos.id });
  if (!r.length) throw new DomainError("JA_ACEITO", "Este contrato já foi aceito.");
  const dados = c.dados as unknown as DadosLojaPronta;
  const quando = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const pdf = await gerarPdfContrato({ numero: c.numero, titulo: c.titulo, hash: c.hash, dados, secoes: c.conteudo.secoes, enviadoEm: c.enviadoEm, aceitoEm: now.toISOString(), aceitoNome: input.nome, aceitoIp: prova.ip, aceitoAparelho: prova.aparelho });
  const anexo = [{ filename: `Contrato-${c.numero}.pdf`, contentBase64: Buffer.from(pdf).toString("base64") }];
  // Cópia assinada para os dois lados (D276): o contrato só se completa com o aceite do cliente.
  await sendEmail(db, { kind: "CONTRATO_ACEITO", to: dados.contratada.emailRepresentante, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `contrato:${id}:aceito`, subject: `Contrato ${c.numero} assinado pelas duas partes`, text: `O contrato ${c.numero} (${c.titulo}) foi aceito por ${input.nome} no painel da loja em ${quando}.\n\nA cópia assinada, com o registro do aceite, está em anexo.\n\nImpressão digital: ${c.hash}`, attachments: anexo });
  await sendEmail(db, { kind: "CONTRATO_ACEITO_CLIENTE", to: dados.cliente.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `contrato:${id}:aceito-cliente`, subject: `Seu contrato ${c.numero} está assinado`, text: `Olá, ${dados.cliente.nome.split(" ")[0]}!\n\nRegistramos o seu aceite do contrato ${c.numero} em ${quando}. A cópia assinada pelas duas partes está em anexo e também fica no seu painel, em Contratos.\n\nPróximo passo: o Pix de ${formatar.brl(dados.sinalCents)} na chave ${dados.contratada.chavePix} (${dados.contratada.banco}, ${dados.contratada.favorecido}). Envie o comprovante para ${dados.contratada.emailRepresentante}.`, attachments: anexo });
  await emitEvent(db, { type: "CONTRATO_ACEITO", storeId, actorRole: actor.role, payload: { contratoId: id, numero: c.numero, hash: c.hash } });
  return { numero: c.numero };
}

/** Cancela um contrato que ainda não foi aceito (o Master). */
export async function cancelarContrato(db: Database, actor: Actor, id: string, now = new Date()) {
  exigirMaster(actor);
  const r = await db.update(contratos).set({ status: "CANCELADO", canceladoEm: now.toISOString() }).where(and(eq(contratos.id, id), eq(contratos.status, "ENVIADO"))).returning({ id: contratos.id });
  if (!r.length) throw new DomainError("NAO_CANCELA", "Só dá para cancelar contrato que ainda não foi aceito.");
}

/** Lojas da E-commerce para escolher no formulário do Master. */
export async function lojasParaContrato(db: Database, actor: Actor) {
  exigirMaster(actor);
  return db.select({ id: stores.id, nome: stores.name, slug: stores.slug, email: stores.contactEmail }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(organizations.brand, "NEXTLEVEL_COMMERCE")).orderBy(stores.name).limit(500);
}

/* ───────────────────────── CT3 · Parcelas e "Já fiz o Pix" (D277) ───────────────────────── */

type Contrato = typeof contratos.$inferSelect;
type Parcela = typeof contratoParcelas.$inferSelect;
const linkBase = () => brandByCode("NEXTLEVEL_COMMERCE").baseUrl.replace(/\/$/, "");

/** Cria as parcelas (sinal e restante) a partir dos dados congelados, se ainda não existem. Vale para contrato antigo. */
async function garantirParcelas(db: Database, c: Contrato) {
  if (c.status === "CANCELADO") return;
  const d = c.dados as unknown as DadosLojaPronta;
  const linhas = [
    { ordem: 1, descricao: "Sinal", valorCents: d.sinalCents, vencimento: d.dataSinal },
    ...(d.restanteCents > 0 ? [{ ordem: 2, descricao: "Restante", valorCents: d.restanteCents, vencimento: d.dataRestante }] : []),
  ];
  await db.insert(contratoParcelas).values(linhas.map((l) => ({ id: newId("ctp"), contratoId: c.id, storeId: c.storeId, ...l }))).onConflictDoNothing();
}

/** Parcelas de um contrato, para o Master ou para o dono da loja dele. */
export async function parcelasDoContrato(db: Database, actor: Actor, contratoId: string): Promise<Parcela[]> {
  const c = await verContrato(db, actor, contratoId);
  await garantirParcelas(db, c);
  return db.select().from(contratoParcelas).where(eq(contratoParcelas.contratoId, c.id)).orderBy(asc(contratoParcelas.ordem));
}

async function parcelaComContrato(db: Database, parcelaId: string) {
  const r = (await db.select({ p: contratoParcelas, c: contratos }).from(contratoParcelas).innerJoin(contratos, eq(contratos.id, contratoParcelas.contratoId)).where(eq(contratoParcelas.id, parcelaId)).limit(1))[0];
  if (!r || r.c.status === "CANCELADO") throw new NotFoundError("Parcela não encontrada.");
  return { ...r, d: r.c.dados as unknown as DadosLojaPronta };
}

export const avisoPixSchema = z.object({ nota: z.string().trim().max(300).optional() });

/** O cliente avisa que fez o Pix. Não marca como pago: só avisa o Master para conferir no banco. */
export async function avisarPixFeito(db: Database, actor: Actor, parcelaId: string, raw: z.input<typeof avisoPixSchema> = {}, now = new Date()) {
  const storeId = requireStoreId(actor);
  assertStoreAdmin(actor);
  const { nota } = avisoPixSchema.parse(raw);
  const { p, c, d } = await parcelaComContrato(db, parcelaId);
  if (p.storeId !== storeId) throw new NotFoundError("Parcela não encontrada.");
  if (p.status === "PAGA") throw new DomainError("PARCELA_PAGA", "Esta parcela já foi confirmada pela NextLevel.");
  if (p.status === "AVISADA") throw new DomainError("PARCELA_AVISADA", "Você já avisou este Pix. A NextLevel está conferindo no banco.");
  const r = await db.update(contratoParcelas).set({ status: "AVISADA", avisadoEm: now.toISOString(), avisadoPor: actor.userId, avisoNota: nota || null }).where(and(eq(contratoParcelas.id, p.id), eq(contratoParcelas.status, "ABERTA"))).returning({ id: contratoParcelas.id });
  if (!r.length) throw new DomainError("PARCELA_AVISADA", "Você já avisou este Pix. A NextLevel está conferindo no banco.");
  await sendEmail(db, {
    kind: "CONTRATO_PIX_AVISADO", to: d.contratada.emailRepresentante, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `parcela:${p.id}:aviso:${now.toISOString()}`,
    subject: `Confira no ${d.contratada.banco}: Pix de ${formatar.brl(p.valorCents)} do contrato ${c.numero}`,
    text: `${d.cliente.nome} (${d.loja.nome}) avisou que fez o Pix da parcela "${p.descricao}" de ${formatar.brl(p.valorCents)} do contrato ${c.numero}.${nota ? `\n\nRecado do cliente: ${nota}` : ""}\n\nConfira no extrato do ${d.contratada.banco} e confirme (ou diga que não encontrou) no Master.`,
    cta: { label: "Conferir no Master", url: `${linkBase()}/master/contratos/${c.id}` },
  });
  await emitEvent(db, { type: "CONTRATO_PIX_AVISADO", storeId, actorRole: actor.role, payload: { contratoId: c.id, parcelaId: p.id, valorCents: p.valorCents } });
}

/** Lança a parcela paga no caixa do dia (Pix no Itaú da NextLevel). Uma vez só: a reserva da coluna impede o lançamento duplo. */
async function lancarNoCaixa(db: Database, actor: Actor, p: Parcela, numero: string, cliente: string, now: Date): Promise<string | null> {
  const reservada = await db.update(contratoParcelas).set({ caixaLancamentoId: "RESERVANDO" }).where(and(eq(contratoParcelas.id, p.id), eq(contratoParcelas.status, "PAGA"), isNull(contratoParcelas.caixaLancamentoId))).returning({ id: contratoParcelas.id });
  if (!reservada.length) return null;
  try {
    const { id } = await lancar(db, actor, { tipo: "ENTRADA", meio: "PIX", origem: "OUTRO", destino: "PIX_ITAU_NEXTLEVEL", valorCents: p.valorCents, storeId: p.storeId, descricao: `Contrato ${numero} · ${p.descricao} · ${cliente}`.slice(0, 300) }, now);
    await db.update(contratoParcelas).set({ caixaLancamentoId: id }).where(eq(contratoParcelas.id, p.id));
    return id;
  } catch (e) {
    await db.update(contratoParcelas).set({ caixaLancamentoId: null }).where(eq(contratoParcelas.id, p.id));
    // Caixa do dia não aberto ou já fechado: a confirmação vale; o lançamento fica para depois.
    if (e instanceof DomainError && ["CAIXA_FECHADO", "CAIXA_MOTIVO"].includes(e.code)) return null;
    throw e;
  }
}

/** O Master conferiu no banco e confirma. Lança no caixa se o dia estiver aberto; senão fica para "Lançar no caixa". */
export async function confirmarRecebimento(db: Database, actor: Actor, parcelaId: string, now = new Date()) {
  exigirMaster(actor);
  const { p, c, d } = await parcelaComContrato(db, parcelaId);
  const r = await db.update(contratoParcelas).set({ status: "PAGA", confirmadoEm: now.toISOString(), confirmadoPor: actor.userId }).where(and(eq(contratoParcelas.id, p.id), ne(contratoParcelas.status, "PAGA"))).returning();
  if (!r.length) throw new DomainError("PARCELA_PAGA", "Esta parcela já foi confirmada.");
  const lancamentoId = await lancarNoCaixa(db, actor, r[0]!, c.numero, d.cliente.nome, now);
  const resto = (await db.select({ status: contratoParcelas.status }).from(contratoParcelas).where(eq(contratoParcelas.contratoId, c.id))).filter((x) => x.status !== "PAGA").length;
  await sendEmail(db, {
    kind: "CONTRATO_PIX_CONFIRMADO", to: d.cliente.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `parcela:${p.id}:confirmada`,
    subject: `Recebemos o seu Pix de ${formatar.brl(p.valorCents)}`,
    text: `Olá, ${d.cliente.nome.split(" ")[0]}!\n\nConfirmamos o recebimento da parcela "${p.descricao}" (${formatar.brl(p.valorCents)}) do contrato ${c.numero}. Obrigado!${resto ? "" : "\n\nCom isso, o contrato está todo pago. O prazo de entrega começa a contar quando recebermos todo o material da loja."}`,
    cta: { label: "Ver no painel", url: `${linkBase()}/merchant/contratos/${c.id}` },
  });
  await emitEvent(db, { type: "CONTRATO_PIX_CONFIRMADO", storeId: c.storeId, actorRole: actor.role, payload: { contratoId: c.id, parcelaId: p.id, valorCents: p.valorCents, lancamentoId } });
  return { lancamentoId, quitado: resto === 0 };
}

/** O Master não achou o Pix no extrato: a parcela volta a ficar aberta e o cliente é avisado. */
export async function pixNaoEncontrado(db: Database, actor: Actor, parcelaId: string, now = new Date()) {
  exigirMaster(actor);
  const { p, c, d } = await parcelaComContrato(db, parcelaId);
  const r = await db.update(contratoParcelas).set({ status: "ABERTA", naoEncontradoEm: now.toISOString() }).where(and(eq(contratoParcelas.id, p.id), eq(contratoParcelas.status, "AVISADA"))).returning({ id: contratoParcelas.id });
  if (!r.length) throw new DomainError("PARCELA_ESTADO", "Só dá para marcar \"não encontrei\" num Pix que o cliente avisou e ainda não foi confirmado.");
  await sendEmail(db, {
    kind: "CONTRATO_PIX_NAO_ENCONTRADO", to: d.cliente.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `parcela:${p.id}:nao:${now.toISOString()}`,
    subject: `Ainda não encontramos o seu Pix de ${formatar.brl(p.valorCents)}`,
    text: `Olá, ${d.cliente.nome.split(" ")[0]}!\n\nConferimos o extrato e ainda não encontramos o Pix da parcela "${p.descricao}" (${formatar.brl(p.valorCents)}) do contrato ${c.numero}.\n\nConfira se ele foi para a chave ${d.contratada.chavePix} (${d.contratada.banco}, favorecido ${d.contratada.favorecido}). Se já pagou, responda este e-mail com o comprovante ou mande para ${d.contratada.emailRepresentante} e avise de novo no painel.`,
    cta: { label: "Abrir o contrato", url: `${linkBase()}/merchant/contratos/${c.id}` },
  });
  await emitEvent(db, { type: "CONTRATO_PIX_NAO_ENCONTRADO", storeId: c.storeId, actorRole: actor.role, payload: { contratoId: c.id, parcelaId: p.id } });
}

/** Parcela confirmada com o caixa do dia fechado: lança depois, uma vez só. */
export async function lancarParcelaNoCaixa(db: Database, actor: Actor, parcelaId: string, now = new Date()) {
  exigirMaster(actor);
  const { p, c, d } = await parcelaComContrato(db, parcelaId);
  if (p.status !== "PAGA") throw new DomainError("PARCELA_ESTADO", "Confirme o recebimento antes de lançar no caixa.");
  if (p.caixaLancamentoId) throw new DomainError("PARCELA_NO_CAIXA", "Esta parcela já está no caixa.");
  const id = await lancarNoCaixa(db, actor, p, c.numero, d.cliente.nome, now);
  if (!id) throw new DomainError("CAIXA_FECHADO", "O caixa de hoje não está aberto (ou já foi fechado). Abra o caixa do dia e tente de novo.");
  return { id };
}

/** Pix que os clientes avisaram e o Master ainda não conferiu (topo da tela de Contratos). */
export async function pixParaConferir(db: Database, actor: Actor) {
  exigirMaster(actor);
  return db.select({ id: contratoParcelas.id, contratoId: contratos.id, numero: contratos.numero, titulo: contratos.titulo, descricao: contratoParcelas.descricao, valorCents: contratoParcelas.valorCents, avisadoEm: contratoParcelas.avisadoEm }).from(contratoParcelas).innerJoin(contratos, eq(contratos.id, contratoParcelas.contratoId)).where(and(eq(contratoParcelas.status, "AVISADA"), ne(contratos.status, "CANCELADO"))).orderBy(asc(contratoParcelas.avisadoEm));
}

/** Parcelas abertas da loja que vencem em até 3 dias (ou já venceram): faixa na tela inicial do dono. */
export async function parcelasAPagar(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") return [];
  const ativos = await db.select().from(contratos).where(and(eq(contratos.storeId, actor.storeId), ne(contratos.status, "CANCELADO")));
  for (const c of ativos) await garantirParcelas(db, c);
  return db.select({ id: contratoParcelas.id, contratoId: contratoParcelas.contratoId, descricao: contratoParcelas.descricao, valorCents: contratoParcelas.valorCents, vencimento: contratoParcelas.vencimento }).from(contratoParcelas).innerJoin(contratos, eq(contratos.id, contratoParcelas.contratoId)).where(and(eq(contratoParcelas.storeId, actor.storeId), eq(contratoParcelas.status, "ABERTA"), ne(contratos.status, "CANCELADO"), lte(contratoParcelas.vencimento, somarDias(dataSP(now), 3)))).orderBy(asc(contratoParcelas.vencimento));
}

/**
 * Lembretes das parcelas (D284), na rotina diária: ao cliente 2 dias antes e no dia do vencimento; à contratada quando
 * a parcela vence sem o "Já fiz o Pix". Cada aviso sai uma vez só (dedupeKey). Parcela avisada ou paga não recebe lembrete.
 */
export async function lembretesDeParcelas(db: Database, now = new Date()) {
  const ativos = await db.select().from(contratos).where(ne(contratos.status, "CANCELADO"));
  for (const c of ativos) await garantirParcelas(db, c);
  const hoje = dataSP(now);
  const abertas = await db.select({ p: contratoParcelas, c: contratos }).from(contratoParcelas).innerJoin(contratos, eq(contratos.id, contratoParcelas.contratoId)).where(and(eq(contratoParcelas.status, "ABERTA"), ne(contratos.status, "CANCELADO"), lte(contratoParcelas.vencimento, somarDias(hoje, 2))));
  let enviados = 0;
  for (const { p, c } of abertas) {
    const d = c.dados as unknown as DadosLojaPronta;
    const venc = p.vencimento.slice(0, 10);
    const link = `${linkBase()}/merchant/contratos/${c.id}`;
    const pix = `Pix na chave ${d.contratada.chavePix} (${d.contratada.banco}, favorecido ${d.contratada.favorecido}).`;
    if (venc === somarDias(hoje, 2) || venc === hoje) {
      const noDia = venc === hoje;
      const r = await sendEmail(db, {
        kind: "CONTRATO_PARCELA_LEMBRETE", to: d.cliente.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `parcela:${p.id}:lembrete:${noDia ? "dia" : "2dias"}`,
        subject: noDia ? `Hoje vence a parcela de ${formatar.brl(p.valorCents)} do seu contrato` : `Em 2 dias vence a parcela de ${formatar.brl(p.valorCents)} do seu contrato`,
        text: `Olá, ${d.cliente.nome.split(" ")[0]}!\n\nA parcela "${p.descricao}" de ${formatar.brl(p.valorCents)} do contrato ${c.numero} vence ${noDia ? "hoje" : `em ${formatar.data(venc)}`}.\n\n${pix}\n\nDepois de pagar, aperte "Já fiz o Pix" no painel, em Contratos, para a NextLevel conferir. Se já pagou, desconsidere este lembrete.`,
        cta: { label: "Abrir o contrato", url: link },
      });
      if (r !== "SKIPPED") enviados++;
    } else if (venc < hoje) {
      const r = await sendEmail(db, {
        kind: "CONTRATO_PARCELA_VENCIDA", to: d.contratada.emailRepresentante, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `parcela:${p.id}:vencida`,
        subject: `Parcela vencida sem aviso de Pix: ${c.numero}`,
        text: `A parcela "${p.descricao}" de ${formatar.brl(p.valorCents)} do contrato ${c.numero} (${d.cliente.nome}, ${d.loja.nome}) venceu em ${formatar.data(venc)} e o cliente ainda não avisou o Pix.\n\nConfira no extrato do ${d.contratada.banco}: se o dinheiro entrou, confirme no Master; se não, fale com o cliente.`,
        cta: { label: "Abrir no Master", url: `${linkBase()}/master/contratos/${c.id}` },
      });
      if (r !== "SKIPPED") enviados++;
    }
  }
  return { enviados };
}
