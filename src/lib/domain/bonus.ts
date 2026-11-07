import { and, asc, eq, gte, inArray, lt, ne, sum } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bonusCampanhas, bonusPremios, commissionRules, partnerCommissions, partners, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { CAMPANHAS_PADRAO, conferirTeto, custoMaxPorPonto, faixaDe, periodoDe, periodosParaApurar, pontosDaVenda, validarFaixas, type Faixa, type Publico } from "@/lib/finance/bonus-regras";
import { requireMasterFn, type Actor } from "./access";
import { commissionBase, getFinanceSettings } from "./corporate-commissions";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { getCatalogItem } from "./nl-catalog";

/**
 * Bônus gamificado (BG1, D271). Campanhas por público (online × rua) e período (semana × mês), ligadas pelo dono.
 * Paga uma vez por loja nova, só depois da garantia das vendas do período, com teto de custo por ponto (somando as
 * campanhas ativas do público) e orçamento por período. Racional: docs/prompts/bonus-gamificado-parceiros-executivos.md.
 */
const DAY = 86_400_000;
const GARANTIA_PADRAO = 30;
const digitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

export async function garantirCampanhasPadrao(db: Database) {
  const existentes = await db.select({ chave: bonusCampanhas.chave }).from(bonusCampanhas);
  const ja = new Set(existentes.map((e) => e.chave));
  const novas = CAMPANHAS_PADRAO.filter((c) => !ja.has(c.chave));
  if (novas.length) await db.insert(bonusCampanhas).values(novas.map((c) => ({ id: newId("bnc"), ...c, ativa: true }))).onConflictDoNothing();
}

/** Mensalidade do Start na tabela de hoje, já com o mesmo desconto de imposto da comissão (1 ponto). */
export async function referenciaDoPonto(db: Database, now = new Date()) {
  const p = await getCatalogItem(db, { key: "COMMERCE_START" }, { includeUnpublished: true }, now);
  const bruto = p?.prices.MONTHLY?.amountCents ?? 6_700;
  const { taxBps } = await getFinanceSettings(db);
  return { brutoCents: bruto, refCents: commissionBase(bruto, null, taxBps) };
}

async function garantiaDias(db: Database) {
  const r = await db.select({ hold: commissionRules.holdDays }).from(commissionRules).where(eq(commissionRules.family, "COMMERCE_PLAN"));
  return r.reduce((m, x) => Math.max(m, x.hold), 0) || GARANTIA_PADRAO;
}

const doPublico = (publico: Publico) => eq(partners.executivo, publico === "RUA");

/**
 * Pontos de cada parceiro do público num intervalo: só a 1ª venda de cada loja (linha SALE), sem estornadas,
 * sem venda para o próprio CPF/CNPJ. `garantidos` = já passou da garantia; `emGarantia` = ainda pode cair.
 */
export async function pontosDoPublico(db: Database, publico: Publico, inicio: Date, fim: Date, refCents: number, soParceiro?: string) {
  const rows = await db.select({ partnerId: partnerCommissions.partnerId, base: partnerCommissions.baseCents, status: partnerCommissions.status, ciclo: commissionRules.cycle, lojaDoc: stores.taxId, parceiroDoc: partners.taxId })
    .from(partnerCommissions).innerJoin(partners, eq(partners.id, partnerCommissions.partnerId)).leftJoin(commissionRules, eq(commissionRules.id, partnerCommissions.ruleId)).leftJoin(stores, eq(stores.id, partnerCommissions.storeId))
    .where(and(eq(partnerCommissions.kind, "SALE"), ne(partnerCommissions.status, "VOID"), gte(partnerCommissions.createdAt, inicio.toISOString()), lt(partnerCommissions.createdAt, fim.toISOString()), doPublico(publico), ...(soParceiro ? [eq(partnerCommissions.partnerId, soParceiro)] : [])));
  const out = new Map<string, { garantidos: number; emGarantia: number }>();
  for (const r of rows) {
    if (r.lojaDoc && digitos(r.lojaDoc) === digitos(r.parceiroDoc)) continue;
    const pts = pontosDaVenda(r.base, r.ciclo, refCents);
    const cur = out.get(r.partnerId) ?? { garantidos: 0, emGarantia: 0 };
    if (r.status === "PENDING") cur.emGarantia += pts; else cur.garantidos += pts;
    out.set(r.partnerId, cur);
  }
  return out;
}

/** Rotina diária: apura os períodos encerrados há mais que a garantia. Idempotente (um prêmio por campanha, parceiro e período). */
export async function apurarBonus(db: Database, now = new Date()) {
  await garantirCampanhasPadrao(db);
  const [campanhas, dias, { refCents }] = await Promise.all([db.select().from(bonusCampanhas).where(eq(bonusCampanhas.ativa, true)), garantiaDias(db), referenciaDoPonto(db, now)]);
  let pagos = 0, semOrcamento = 0;
  for (const c of campanhas) {
    for (const per of periodosParaApurar(c.periodo, now, dias, new Date(c.createdAt))) {
      const pontos = await pontosDoPublico(db, c.publico, per.inicio, per.fim, refCents);
      const jaApurados = new Set((await db.select({ p: bonusPremios.partnerId }).from(bonusPremios).where(and(eq(bonusPremios.campanhaId, c.id), eq(bonusPremios.periodo, per.chave)))).map((x) => x.p));
      let gasto = Number((await db.select({ t: sum(bonusPremios.valorCents) }).from(bonusPremios).where(and(eq(bonusPremios.campanhaId, c.id), eq(bonusPremios.periodo, per.chave))))[0]?.t ?? 0);
      // Quem fez mais pontos é apurado primeiro (orçamento curto premia quem mais produziu).
      const fila = [...pontos.entries()].filter(([pid]) => !jaApurados.has(pid)).sort((a, b) => b[1].garantidos - a[1].garantidos);
      for (const [partnerId, p] of fila) {
        const { atingida } = faixaDe(c.faixas, p.garantidos);
        if (!atingida) continue;
        const cabe = gasto + atingida.valorCents <= c.orcamentoCents;
        const id = newId("bnp");
        const ins = await db.insert(bonusPremios).values({ id, campanhaId: c.id, partnerId, periodo: per.chave, pontos: p.garantidos, faixaPontos: atingida.pontos, valorCents: cabe ? atingida.valorCents : 0, status: cabe ? "PAGO" : "SEM_ORCAMENTO", versaoCampanha: c.versao }).onConflictDoNothing().returning({ id: bonusPremios.id });
        if (!ins.length) continue;
        if (!cabe) { semOrcamento++; continue; }
        gasto += atingida.valorCents;
        const com = await db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId, kind: "BONUS", baseCents: 0, rateBps: 0, amountCents: atingida.valorCents, period: per.chave.slice(0, 7), status: "AVAILABLE", availableAt: now.toISOString(), note: `Bônus: ${c.nome} (${per.rotulo}) · ${atingida.pontos} pontos`, dedupeKey: `BONUS:${c.id}:${per.chave}:${partnerId}` }).onConflictDoNothing().returning({ id: partnerCommissions.id });
        if (com[0]) await db.update(bonusPremios).set({ comissaoId: com[0].id }).where(eq(bonusPremios.id, id));
        pagos++;
      }
    }
  }
  return { pagos, semOrcamento };
}

// ---------------------------------------------------------------------------------------------------------------------
// Master: campanhas
// ---------------------------------------------------------------------------------------------------------------------
const exigir = (actor: Actor) => requireMasterFn(actor, ["FINANCEIRO"]);
const faixasSchema = z.array(z.object({ pontos: z.number().int(), valorCents: z.number().int() }));
export const campanhaSchema = z.object({ nome: z.string().trim().min(3).max(60), faixas: faixasSchema, orcamentoCents: z.number().int().min(0).max(100_000_000), ativa: z.boolean() });

export async function salvarCampanha(db: Database, actor: Actor, id: string, raw: z.input<typeof campanhaSchema>, now = new Date()) {
  exigir(actor);
  const v = campanhaSchema.parse(raw);
  const erro = validarFaixas(v.faixas);
  if (erro) throw new DomainError("BONUS_FAIXAS", erro);
  const c = await db.query.bonusCampanhas.findFirst({ where: eq(bonusCampanhas.id, id) });
  if (!c) throw new NotFoundError("Campanha não encontrada.");
  if (v.ativa) {
    const outras = (await db.select().from(bonusCampanhas).where(and(eq(bonusCampanhas.publico, c.publico), eq(bonusCampanhas.ativa, true)))).filter((o) => o.id !== id);
    const { refCents, brutoCents } = await referenciaDoPonto(db, now);
    const t = conferirTeto(c.publico, [...outras, { faixas: v.faixas }], refCents);
    if (!t.cabe) throw new DomainError("BONUS_TETO", `Passa do teto: somando as campanhas ativas, o bônus de uma loja Start chegaria a R$ ${(t.custoPorPontoCents / 100).toFixed(2).replace(".", ",")} (${t.percentual}% da mensalidade de R$ ${(brutoCents / 100).toFixed(2).replace(".", ",")}). O máximo é ${c.publico === "RUA" ? "75%" : "50%"}.`);
  }
  await db.update(bonusCampanhas).set({ nome: v.nome, faixas: v.faixas, orcamentoCents: v.orcamentoCents, ativa: v.ativa, versao: c.versao + 1, atualizadoPor: actor.userId, updatedAt: now.toISOString() }).where(eq(bonusCampanhas.id, id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "BONUS_CAMPAIGN_SAVED", entityType: "bonus_campanha", entityId: id, before: { faixas: c.faixas, orcamentoCents: c.orcamentoCents, ativa: c.ativa }, after: v });
}

/** Tela do Master: campanhas, custo por loja, gasto do período atual e do anterior, e quem está perto da próxima faixa. */
export async function painelDeBonus(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  await garantirCampanhasPadrao(db);
  const [campanhas, ref, dias] = await Promise.all([db.select().from(bonusCampanhas).orderBy(asc(bonusCampanhas.publico), asc(bonusCampanhas.periodo)), referenciaDoPonto(db, now), garantiaDias(db)]);
  const nomes = new Map((await db.select({ id: partners.id, nome: partners.displayName }).from(partners)).map((p) => [p.id, p.nome]));
  const porPublico = (pub: Publico) => conferirTeto(pub, campanhas.filter((c) => c.publico === pub && c.ativa), ref.refCents);
  const lista = [];
  for (const c of campanhas) {
    const atual = periodoDe(c.periodo, now);
    const pontos = await pontosDoPublico(db, c.publico, atual.inicio, atual.fim, ref.refCents);
    const premios = await db.select().from(bonusPremios).where(eq(bonusPremios.campanhaId, c.id));
    const participantes = [...pontos.entries()].map(([pid, p]) => {
      const total = p.garantidos + p.emGarantia;
      const f = faixaDe(c.faixas, total);
      return { partnerId: pid, nome: nomes.get(pid) ?? "Parceiro", pontos: total, emGarantia: p.emGarantia, faixa: f.atingida, proxima: f.proxima, falta: f.faltaCent };
    }).sort((a, b) => b.pontos - a.pontos).slice(0, 10);
    lista.push({
      ...c, custoPorPontoCents: Math.round(custoMaxPorPonto(c.faixas)), periodoAtual: atual,
      pagoTotalCents: premios.filter((p) => p.status === "PAGO").reduce((t, p) => t + p.valorCents, 0),
      semOrcamento: premios.filter((p) => p.status === "SEM_ORCAMENTO").length,
      potencialAtualCents: participantes.reduce((t, p) => t + (p.faixa?.valorCents ?? 0), 0),
      participantes,
    });
  }
  return { campanhas: lista, referencia: ref, garantiaDias: dias, teto: { ONLINE: porPublico("ONLINE"), RUA: porPublico("RUA") } };
}

// ---------------------------------------------------------------------------------------------------------------------
// Parceiro: o cartão "Seus bônus"
// ---------------------------------------------------------------------------------------------------------------------
export async function bonusDoParceiro(db: Database, partnerId: string, now = new Date()) {
  await garantirCampanhasPadrao(db);
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p) return null;
  const publico: Publico = p.executivo ? "RUA" : "ONLINE";
  const [campanhas, ref, dias] = await Promise.all([db.select().from(bonusCampanhas).where(and(eq(bonusCampanhas.publico, publico), eq(bonusCampanhas.ativa, true))).orderBy(asc(bonusCampanhas.periodo)), referenciaDoPonto(db, now), garantiaDias(db)]);
  const cards = [];
  for (const c of campanhas) {
    const atual = periodoDe(c.periodo, now);
    const pts = (await pontosDoPublico(db, publico, atual.inicio, atual.fim, ref.refCents, partnerId)).get(partnerId) ?? { garantidos: 0, emGarantia: 0 };
    const total = pts.garantidos + pts.emGarantia;
    const f = faixaDe(c.faixas, total);
    cards.push({ id: c.id, nome: c.nome, periodo: c.periodo, rotulo: atual.rotulo, terminaEm: atual.fim.toISOString(), pagaEm: new Date(atual.fim.getTime() + dias * DAY).toISOString(), faixas: c.faixas, pontos: total, emGarantia: pts.emGarantia, atingida: f.atingida, proxima: f.proxima, faltaCent: f.faltaCent });
  }
  const recebidos = await db.select({ valor: bonusPremios.valorCents, periodo: bonusPremios.periodo, nome: bonusCampanhas.nome, status: bonusPremios.status }).from(bonusPremios).innerJoin(bonusCampanhas, eq(bonusCampanhas.id, bonusPremios.campanhaId)).where(and(eq(bonusPremios.partnerId, partnerId), inArray(bonusPremios.status, ["PAGO"]))).orderBy(asc(bonusPremios.createdAt));
  return { publico, cards, recebidos: recebidos.reverse().slice(0, 6), totalRecebidoCents: recebidos.reduce((t, r) => t + r.valor, 0), pontoBrutoCents: ref.brutoCents };
}

export type BonusDoParceiro = NonNullable<Awaited<ReturnType<typeof bonusDoParceiro>>>;
export type FaixaBonus = Faixa;
