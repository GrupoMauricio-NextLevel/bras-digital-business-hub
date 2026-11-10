import { and, desc, eq, inArray, like } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { contratos, organizations, stores } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { CONTRATADA_PADRAO, MODELO_LOJA_PRONTA, VERSAO_LOJA_PRONTA, conferirDados, formatar, impressaoDigital, montarSecoes, type DadosLojaPronta } from "@/lib/contratos/loja-pronta-express";
import { gerarPdfContrato } from "@/lib/contratos/pdf";
import { sendEmail } from "@/lib/email";
import { newId } from "@/lib/ids";
import { assertCanAccess, assertStoreAdmin, requireStoreId, type Actor } from "./access";
import { estenderVencimento } from "./assinaturas-master";
import { podeOperarCaixa } from "./caixa";
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
