import { and, asc, desc, eq, gte, inArray, isNull, isNotNull, lte, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bonusCampanhas, executivoRecebimentos, executivoVisitas, financeInvoices, organizations, partnerCommissions, partners, stores, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { formatBRL } from "@/lib/money";
import { nomePlanoEc } from "@/lib/marcas/nextlevel-ecommerce";
import { periodoDe } from "@/lib/finance/bonus-regras";
import { RESULTADOS_DA_VISITA, atrasado, codigoDeRecibo, linkDoRecibo, metaDaSemana, montarAgenda, prazoDeEntrega, textoDoRecibo, type ResultadoDaVisita } from "@/lib/finance/executivo-regras";
import { dataSP, somarDias } from "@/lib/finance/caixa-regras";
import { isMasterOwner, type Actor } from "./access";
import { desfazerPagamento, pagarAssinaturaManual } from "./assinaturas-master";
import { lancar, podeOperarCaixa } from "./caixa";
import { COMMERCE_PLAN_KEYS, subscriptionOf } from "./commerce-plans";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { partnerOfActor, registerPartner } from "./partners";
import { clientesAtivos } from "./niveis-parceiro";
import { NIVEIS, nomeDoNivel } from "@/lib/finance/niveis-regras";

/**
 * Executivos de venda (CX3, D273): a equipe de rua da NextLevel. É um parceiro do tipo vendedor marcado como executivo,
 * cadastrado pelo dono, com a mesma comissão do programa. Vende na rua em dinheiro ou na maquininha: a loja é liberada na
 * hora, o lojista recebe recibo pelo WhatsApp e o dinheiro fica com o executivo até a prestação de contas (2 dias úteis),
 * que entra no caixa do dia. Atrasou: não registra nova venda em dinheiro até entregar (a loja do cliente não é bloqueada).
 */
const exigirOperador = (actor: Actor) => { if (!podeOperarCaixa(actor)) throw new ForbiddenError("Só o dono e o Financeiro recebem dos executivos."); };

// ---------------------------------------------------------------------------------------------------------------------
// Master
// ---------------------------------------------------------------------------------------------------------------------
export const executivoSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "Senha provisória com pelo menos 8 caracteres"),
  taxId: z.string().min(11, "Informe o CPF ou CNPJ"),
  telefone: z.string().min(10, "WhatsApp com DDD"),
});

/** Só o dono cadastra um executivo (nunca pela página pública). */
export async function cadastrarExecutivo(db: Database, actor: Actor, raw: z.input<typeof executivoSchema>, now = new Date()) {
  if (!isMasterOwner(actor)) throw new ForbiddenError("Só o dono cadastra executivos de venda.");
  const v = executivoSchema.parse(raw);
  const r = await registerPartner(db, { name: v.nome, email: v.email, password: v.senha, taxId: v.taxId, phone: v.telefone, acceptTerms: true, brand: "NEXTLEVEL_COMMERCE" }, now);
  const p = (await db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
  await db.update(partners).set({ kind: "REPRESENTATIVE", executivo: true, status: "ACTIVE" }).where(eq(partners.id, p.id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_CRIADO", entityType: "partner", entityId: p.id, partnerId: p.id, after: { nome: v.nome, email: v.email } });
  return { partnerId: p.id };
}

/** Lista de executivos com o que importa no dia: vendas, comissão, dinheiro na mão e atrasos. */
export async function painelDosExecutivos(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  const lista = await db.select({ p: partners, email: users.email }).from(partners).innerJoin(users, eq(users.id, partners.userId)).where(eq(partners.executivo, true)).orderBy(asc(partners.displayName));
  const ids = lista.map((x) => x.p.id);
  const sem = periodoDe("SEMANA", now), mes = periodoDe("MES", now);
  const [vendas, comissoes, recebimentos, visitas] = ids.length ? await Promise.all([
    db.select({ partnerId: partnerCommissions.partnerId, criado: partnerCommissions.createdAt }).from(partnerCommissions).where(and(inArray(partnerCommissions.partnerId, ids), eq(partnerCommissions.kind, "SALE"), ne(partnerCommissions.status, "VOID"), gte(partnerCommissions.createdAt, mes.inicio.toISOString()))),
    db.select({ partnerId: partnerCommissions.partnerId, valor: partnerCommissions.amountCents }).from(partnerCommissions).where(and(inArray(partnerCommissions.partnerId, ids), inArray(partnerCommissions.kind, ["SALE", "RECURRING", "BONUS", "CLAWBACK"]), ne(partnerCommissions.status, "VOID"), gte(partnerCommissions.createdAt, mes.inicio.toISOString()))),
    db.select().from(executivoRecebimentos).where(inArray(executivoRecebimentos.partnerId, ids)),
    db.select({ partnerId: executivoVisitas.partnerId }).from(executivoVisitas).where(and(inArray(executivoVisitas.partnerId, ids), gte(executivoVisitas.createdAt, sem.inicio.toISOString()))),
  ]) : [[], [], [], []];
  return lista.map(({ p, email }) => {
    const minhas = recebimentos.filter((r) => r.partnerId === p.id);
    const comigo = minhas.filter((r) => r.status === "COM_EXECUTIVO" && r.meio === "DINHEIRO");
    const entregas = minhas.filter((r) => r.status === "ENTREGUE").map((r) => r.entregueEm!).sort();
    return {
      id: p.id, nome: p.displayName, email, telefone: p.phone, status: p.status, nivel: p.tier,
      vendasSemana: vendas.filter((v) => v.partnerId === p.id && Date.parse(v.criado) >= sem.inicio.getTime()).length, // o banco devolve "AAAA-MM-DD hh:mm:ss+00": comparar instantes, nunca texto
      vendasMes: vendas.filter((v) => v.partnerId === p.id).length,
      comissaoMesCents: comissoes.filter((c) => c.partnerId === p.id).reduce((t, c) => t + c.valor, 0),
      dinheiroComEleCents: comigo.reduce((t, r) => t + r.valorCents, 0),
      atrasados: comigo.filter((r) => atrasado(r.prazoAte, now)).length,
      maquininhaAConferir: minhas.filter((r) => r.status === "COM_EXECUTIVO" && r.meio === "MAQUININHA_VENDEDOR").length,
      ultimaPrestacao: entregas.at(-1) ?? null,
      metaSemanal: p.metaSemanal,
      visitasSemana: visitas.filter((v) => v.partnerId === p.id).length,
    };
  });
}

/** Tudo que está com os executivos (dinheiro a entregar e maquininha a conferir), dos mais antigos aos mais novos. */
export async function pendenciasDosExecutivos(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  const rows = await db.select({ r: executivoRecebimentos, loja: stores.name, executivo: partners.displayName }).from(executivoRecebimentos).innerJoin(stores, eq(stores.id, executivoRecebimentos.storeId)).innerJoin(partners, eq(partners.id, executivoRecebimentos.partnerId)).where(eq(executivoRecebimentos.status, "COM_EXECUTIVO")).orderBy(asc(executivoRecebimentos.recebidoEm));
  return rows.map(({ r, loja, executivo }) => ({ ...r, loja, executivo, atrasado: atrasado(r.prazoAte, now) }));
}

/** Prestação de contas: o dono confere e o valor entra no caixa do dia (dinheiro na gaveta; maquininha no Mercado Pago). */
export async function receberDoExecutivo(db: Database, actor: Actor, id: string, now = new Date()) {
  exigirOperador(actor);
  const r = await db.query.executivoRecebimentos.findFirst({ where: eq(executivoRecebimentos.id, id) });
  if (!r) throw new NotFoundError("Recebimento não encontrado.");
  if (r.status !== "COM_EXECUTIVO") throw new DomainError("EXECUTIVO_STATUS", r.status === "ENTREGUE" ? "Este valor já foi recebido." : "Esta venda foi estornada.");
  const p = (await db.query.partners.findFirst({ where: eq(partners.id, r.partnerId) }))!;
  const dinheiro = r.meio === "DINHEIRO";
  const l = await lancar(db, actor, dinheiro
    ? { meio: "DINHEIRO", destino: "DINHEIRO_MAURICIO", origem: "PRESTACAO_EXECUTIVO", valorCents: r.valorCents, storeId: r.storeId, partnerId: r.partnerId, invoiceId: r.invoiceId, descricao: `Prestação de contas de ${p.displayName} · ${r.codigo}` }
    : { meio: "MAQUININHA_VENDEDOR", destino: "MP_MEGATRON", origem: "ASSINATURA", valorCents: r.valorCents, storeId: r.storeId, partnerId: r.partnerId, invoiceId: r.invoiceId, descricao: `Maquininha de ${p.displayName} conferida · ${r.codigo}` }, now);
  await db.update(executivoRecebimentos).set({ status: "ENTREGUE", entregueEm: now.toISOString(), recebidoPor: actor.userId, lancamentoId: l.id }).where(eq(executivoRecebimentos.id, id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_PRESTOU_CONTAS", entityType: "executivo_recebimento", entityId: id, partnerId: r.partnerId, storeId: r.storeId, after: { valorCents: r.valorCents, meio: r.meio, lancamentoId: l.id } });
  return { lancamentoId: l.id };
}

/** Estorna uma venda de rua ainda com o executivo: fatura cancelada, comissão desfeita e período devolvido. */
export async function estornarVendaDeRua(db: Database, actor: Actor, id: string, motivo: string, now = new Date()) {
  exigirOperador(actor);
  const m = z.string().trim().min(3, "Diga o motivo do estorno").max(300).parse(motivo);
  const r = await db.query.executivoRecebimentos.findFirst({ where: eq(executivoRecebimentos.id, id) });
  if (!r) throw new NotFoundError("Recebimento não encontrado.");
  if (r.status !== "COM_EXECUTIVO") throw new DomainError("EXECUTIVO_STATUS", "Já entrou no caixa: estorne pelo caixa.");
  const inv = (await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, r.invoiceId) }))!;
  await desfazerPagamento(db, inv, m, now);
  await db.update(executivoRecebimentos).set({ status: "ESTORNADO", motivoEstorno: m }).where(eq(executivoRecebimentos.id, id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_VENDA_ESTORNADA", entityType: "executivo_recebimento", entityId: id, partnerId: r.partnerId, storeId: r.storeId, reason: m });
}

// ---------------------------------------------------------------------------------------------------------------------
// Executivo (painel do parceiro)
// ---------------------------------------------------------------------------------------------------------------------
async function executivoDoActor(db: Database, actor: Actor) {
  const p = await partnerOfActor(db, actor);
  if (!p.executivo) throw new ForbiddenError("Área dos executivos de venda da NextLevel.");
  return p;
}

export const vendaDeRuaSchema = z.object({
  storeId: z.string().min(1, "Escolha a loja"),
  productKey: z.enum(COMMERCE_PLAN_KEYS),
  cycle: z.enum(["MONTHLY", "ANNUAL"]),
  meio: z.enum(["DINHEIRO", "MAQUININHA_VENDEDOR"]),
  observacao: z.string().trim().max(300).optional(),
});

/** Venda na rua: libera a loja na hora, gera a comissão do executivo e o recibo; o valor fica "com o executivo". */
export async function registrarVendaDeRua(db: Database, actor: Actor, raw: z.input<typeof vendaDeRuaSchema>, now = new Date()) {
  const p = await executivoDoActor(db, actor);
  if (p.status !== "ACTIVE") throw new DomainError("EXECUTIVO_INATIVO", "Seu cadastro não está ativo. Fale com a NextLevel.");
  const v = vendaDeRuaSchema.parse(raw);
  if (v.meio === "DINHEIRO") {
    const pend = await db.select().from(executivoRecebimentos).where(and(eq(executivoRecebimentos.partnerId, p.id), eq(executivoRecebimentos.status, "COM_EXECUTIVO"), eq(executivoRecebimentos.meio, "DINHEIRO")));
    if (pend.some((x) => atrasado(x.prazoAte, now))) throw new DomainError("EXECUTIVO_ATRASADO", "Você tem dinheiro com prazo vencido. Entregue à NextLevel para registrar nova venda em dinheiro (maquininha continua liberada).");
  }
  const loja = (await db.select({ s: stores, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, v.storeId)).limit(1))[0];
  if (!loja || loja.brand !== "NEXTLEVEL_COMMERCE") throw new NotFoundError("Loja não encontrada.");
  if (loja.s.partnerId && loja.s.partnerId !== p.id) throw new ForbiddenError("Esta loja foi indicada por outro parceiro.");
  const pg = await pagarAssinaturaManual(db, null, loja.s, { productKey: v.productKey, cycle: v.cycle, partnerId: p.id }, now);
  let codigo = codigoDeRecibo();
  while (await db.query.executivoRecebimentos.findFirst({ where: eq(executivoRecebimentos.codigo, codigo), columns: { id: true } })) codigo = codigoDeRecibo();
  const id = newId("exr");
  await db.insert(executivoRecebimentos).values({ id, codigo, partnerId: p.id, storeId: loja.s.id, invoiceId: pg.paga.id, meio: v.meio, valorCents: pg.valor, recebidoEm: now.toISOString(), prazoAte: prazoDeEntrega(now).toISOString(), observacao: v.observacao ?? null });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_VENDEU", entityType: "executivo_recebimento", entityId: id, partnerId: p.id, storeId: loja.s.id, after: { codigo, meio: v.meio, valorCents: pg.valor, invoiceId: pg.paga.id } });
  const s = (await db.query.stores.findFirst({ where: eq(stores.id, loja.s.id) }))!;
  const texto = textoDoRecibo({ codigo, loja: s.name, plano: `${nomePlanoEc(v.productKey)} ${v.cycle === "ANNUAL" ? "anual" : "mensal"}`, valor: formatBRL(pg.valor), meio: v.meio, executivo: p.displayName, quando: now, pagoAte: s.paidUntil ? new Date(s.paidUntil) : null });
  return { id, codigo, valorCents: pg.valor, pagoAte: s.paidUntil, recibo: texto, whatsapp: linkDoRecibo(texto, s.whatsapp) };
}

/** Primeira faixa da campanha semanal da rua (meta padrão quando o dono não definiu uma). */
export async function primeiraFaixaDaRua(db: Database) {
  const c = await db.query.bonusCampanhas.findFirst({ where: and(eq(bonusCampanhas.publico, "RUA"), eq(bonusCampanhas.periodo, "SEMANA"), eq(bonusCampanhas.ativa, true)) });
  return c?.faixas.length ? Math.min(...c.faixas.map((f) => f.pontos)) : null;
}

/** O que o executivo vê: meta, comissão, nível, agenda, lojas que pode cobrar, dinheiro com ele e os últimos recibos. */
export async function painelDoExecutivo(db: Database, actor: Actor, now = new Date()) {
  const p = await executivoDoActor(db, actor);
  const hoje = dataSP(now);
  const sem = periodoDe("SEMANA", now), mes = periodoDe("MES", now);
  const [lojas, recs, vendasSemana, comissoesMes, retornos, faixa, ativos, visitasSemana, ultimas] = await Promise.all([
    db.select({ id: stores.id, nome: stores.name, pagoAte: stores.paidUntil, testeAte: stores.trialEndsAt }).from(stores).where(eq(stores.partnerId, p.id)).orderBy(asc(stores.name)),
    db.select({ r: executivoRecebimentos, loja: stores.name }).from(executivoRecebimentos).innerJoin(stores, eq(stores.id, executivoRecebimentos.storeId)).where(eq(executivoRecebimentos.partnerId, p.id)).orderBy(desc(executivoRecebimentos.recebidoEm)).limit(30),
    db.select({ id: partnerCommissions.id }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.kind, "SALE"), ne(partnerCommissions.status, "VOID"), gte(partnerCommissions.createdAt, sem.inicio.toISOString()))),
    db.select({ valor: partnerCommissions.amountCents }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), inArray(partnerCommissions.kind, ["SALE", "RECURRING", "BONUS", "CLAWBACK"]), ne(partnerCommissions.status, "VOID"), gte(partnerCommissions.createdAt, mes.inicio.toISOString()))),
    db.select().from(executivoVisitas).where(and(eq(executivoVisitas.partnerId, p.id), isNotNull(executivoVisitas.retornoEm), isNull(executivoVisitas.retornoFeitoEm), lte(executivoVisitas.retornoEm, somarDias(hoje, 7)))),
    primeiraFaixaDaRua(db),
    clientesAtivos(db, p.id),
    db.select({ partnerId: executivoVisitas.partnerId, tipo: executivoVisitas.tipo }).from(executivoVisitas).where(gte(executivoVisitas.createdAt, sem.inicio.toISOString())),
    db.select().from(executivoVisitas).where(eq(executivoVisitas.partnerId, p.id)).orderBy(desc(executivoVisitas.createdAt)).limit(8),
  ]);
  const planos = await Promise.all(lojas.map(async (l) => ({ ...l, assinatura: await subscriptionOf(db, l.id) })));
  const comigo = recs.filter((x) => x.r.status === "COM_EXECUTIVO" && x.r.meio === "DINHEIRO").map((x) => ({ ...x.r, loja: x.loja, atrasado: atrasado(x.r.prazoAte, now) }));
  const proximo = NIVEIS.find((n) => n.minimo > ativos) ?? null;
  // Ranking de esforço da semana: visitas registradas (demonstração conta como visita), só primeiro nome dos colegas.
  const porExec = new Map<string, number>();
  for (const v of visitasSemana) porExec.set(v.partnerId, (porExec.get(v.partnerId) ?? 0) + 1);
  if (!porExec.has(p.id)) porExec.set(p.id, 0);
  const nomes = new Map((await db.select({ id: partners.id, nome: partners.displayName }).from(partners).where(and(eq(partners.executivo, true), inArray(partners.id, [...porExec.keys()])))).map((x) => [x.id, x.nome]));
  const esforco = [...porExec.entries()].filter(([id]) => nomes.has(id)).sort((a, b) => b[1] - a[1]).map(([id, n], i) => ({ posicao: i + 1, nome: id === p.id ? "Você" : nomes.get(id)!.split(" ")[0]!, visitas: n, voce: id === p.id }));
  return {
    executivo: { id: p.id, nome: p.displayName, primeiroNome: p.displayName.split(" ")[0]!, code: p.code },
    meta: metaDaSemana(p.metaSemanal, faixa, vendasSemana.length),
    comissaoMesCents: comissoesMes.reduce((t, c) => t + c.valor, 0),
    nivel: { atual: nomeDoNivel(p.tier), ativos, proximo: proximo ? { nome: proximo.nome, falta: proximo.minimo - ativos } : null },
    agenda: montarAgenda(hoje, retornos.map((r) => ({ id: r.id, loja: r.loja, contato: r.contato, whatsapp: r.whatsapp, retornoEm: r.retornoEm!, resultado: r.resultado })), planos.map((l) => ({ loja: l.nome, testeAte: l.testeAte, pagoAte: l.pagoAte }))),
    visitasSemana: porExec.get(p.id) ?? 0,
    esforco: esforco.slice(0, 5).concat(esforco.slice(5).filter((x) => x.voce)),
    ultimasVisitas: ultimas.map((v) => ({ id: v.id, loja: v.loja, tipo: v.tipo, resultado: v.resultado, em: v.createdAt })),
    lojas: planos.map((l) => ({ id: l.id, nome: l.nome, pagoAte: l.pagoAte, testeAte: l.testeAte, productKey: l.assinatura?.productKey ?? null, ciclo: l.assinatura?.cycle ?? null })),
    comigo, totalComigoCents: comigo.reduce((t, r) => t + r.valorCents, 0), travado: comigo.some((r) => r.atrasado),
    recibos: recs.map((x) => ({ id: x.r.id, codigo: x.r.codigo, loja: x.loja, valorCents: x.r.valorCents, meio: x.r.meio, status: x.r.status, recebidoEm: x.r.recebidoEm })),
  };
}
export type PainelDoExecutivo = Awaited<ReturnType<typeof painelDoExecutivo>>;

export const visitaSchema = z.object({
  loja: z.string().trim().min(2, "Nome da loja").max(120),
  storeId: z.string().optional(),
  contato: z.string().trim().max(80).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  tipo: z.enum(["VISITA", "DEMONSTRACAO"]),
  resultado: z.enum(Object.keys(RESULTADOS_DA_VISITA) as [ResultadoDaVisita, ...ResultadoDaVisita[]]),
  retornoEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data do retorno").optional().or(z.literal("")),
  observacao: z.string().trim().max(300).optional(),
});

/** Registra uma visita ou demonstração (BG3): conta nas missões e no ranking de esforço; o retorno entra na agenda. */
export async function registrarVisita(db: Database, actor: Actor, raw: z.input<typeof visitaSchema>, now = new Date()) {
  const p = await executivoDoActor(db, actor);
  const v = visitaSchema.parse(raw);
  if (v.retornoEm && v.retornoEm < dataSP(now)) throw new DomainError("VISITA_RETORNO", "O retorno precisa ser hoje ou depois.");
  if (v.resultado === "PENSAR" && !v.retornoEm) throw new DomainError("VISITA_RETORNO", "Quem pediu para pensar precisa de um dia para você voltar.");
  if (v.storeId) {
    const s = await db.query.stores.findFirst({ where: eq(stores.id, v.storeId), columns: { partnerId: true } });
    if (!s || s.partnerId !== p.id) throw new ForbiddenError("Esta loja não é sua.");
  }
  // Limite simples contra registro em massa: até 60 registros por dia.
  const hojeInicio = new Date(`${dataSP(now)}T00:00:00-03:00`).toISOString();
  const doDia = await db.select({ id: executivoVisitas.id }).from(executivoVisitas).where(and(eq(executivoVisitas.partnerId, p.id), gte(executivoVisitas.createdAt, hojeInicio)));
  if (doDia.length >= 60) throw new DomainError("VISITA_LIMITE", "Limite de 60 registros por dia.");
  const id = newId("vis");
  await db.insert(executivoVisitas).values({ id, partnerId: p.id, storeId: v.storeId || null, loja: v.loja, contato: v.contato || null, whatsapp: v.whatsapp?.replace(/\D/g, "") || null, tipo: v.tipo, resultado: v.resultado, retornoEm: v.retornoEm || null, observacao: v.observacao || null, createdAt: now.toISOString() });
  return { id };
}

/** O executivo marca o retorno como feito (sai da agenda). */
export async function concluirRetorno(db: Database, actor: Actor, visitaId: string, now = new Date()) {
  const p = await executivoDoActor(db, actor);
  const v = await db.query.executivoVisitas.findFirst({ where: eq(executivoVisitas.id, visitaId) });
  if (!v || v.partnerId !== p.id) throw new NotFoundError("Visita não encontrada.");
  await db.update(executivoVisitas).set({ retornoFeitoEm: now.toISOString() }).where(eq(executivoVisitas.id, visitaId));
}

/** Master: meta semanal de lojas pagas de um executivo (vazia volta ao padrão da campanha). Só o dono. */
export async function definirMetaSemanal(db: Database, actor: Actor, partnerId: string, meta: number | null) {
  if (!isMasterOwner(actor)) throw new ForbiddenError("Só o dono define as metas dos executivos.");
  const m = meta === null ? null : z.number().int().min(1, "Meta de pelo menos 1 loja").max(100).parse(meta);
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p?.executivo) throw new NotFoundError("Executivo não encontrado.");
  await db.update(partners).set({ metaSemanal: m }).where(eq(partners.id, partnerId));
}

/** Master: o que a equipe fez (visitas, demonstrações e vendas), mais recente primeiro. */
export async function feedDaEquipe(db: Database, actor: Actor, limite = 40) {
  if (actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  const [vis, ven] = await Promise.all([
    db.select({ v: executivoVisitas, nome: partners.displayName }).from(executivoVisitas).innerJoin(partners, eq(partners.id, executivoVisitas.partnerId)).orderBy(desc(executivoVisitas.createdAt)).limit(limite),
    db.select({ r: executivoRecebimentos, nome: partners.displayName, loja: stores.name }).from(executivoRecebimentos).innerJoin(partners, eq(partners.id, executivoRecebimentos.partnerId)).innerJoin(stores, eq(stores.id, executivoRecebimentos.storeId)).orderBy(desc(executivoRecebimentos.recebidoEm)).limit(limite),
  ]);
  const itens = [
    ...vis.map(({ v, nome }) => ({ id: v.id, em: v.createdAt, executivo: nome, tipo: v.tipo === "DEMONSTRACAO" ? "Demonstração" : "Visita", texto: `${v.loja}: ${RESULTADOS_DA_VISITA[v.resultado].toLowerCase()}${v.retornoEm ? ` · volta ${v.retornoEm.split("-").reverse().slice(0, 2).join("/")}` : ""}` })),
    ...ven.map(({ r, nome, loja }) => ({ id: r.id, em: r.recebidoEm, executivo: nome, tipo: r.status === "ESTORNADO" ? "Venda estornada" : "Venda", texto: `${loja} · ${formatBRL(r.valorCents)} ${r.meio === "DINHEIRO" ? "em dinheiro" : "na maquininha"} · ${r.codigo}` })),
  ];
  return itens.sort((a, b) => b.em.localeCompare(a.em)).slice(0, limite);
}
