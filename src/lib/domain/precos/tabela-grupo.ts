import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { coupons } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { ENTRY_OFFER_KEY } from "@/lib/finance/catalog-seed";
import { FAMILY_LABEL } from "@/lib/finance/catalog-labels";
import { requireMaster, type Actor } from "../access";
import { getPriceBook } from "../finance";
import { activeOffer, listCatalog } from "../nl-catalog";
import { getBrasRules } from "../bras/regras";
import { getExcursionRules } from "../cargas/regras-excursao";
import { getClubRules } from "../club/regras";
import { getPartnerSettings } from "../partners";
import { getMeuContadorSettings } from "../fiscal/meu-contador";

/**
 * Tabela de preços do grupo (D123, fase P0 do prompt de público e preço): **o que vale hoje**, por marca, lido das
 * fontes reais (catálogo do Master, tabela do SuperDrop, regras da Brás, da Excursão, do Club, dos parceiros e do Meu
 * Contador). Só leitura: cada linha diz de onde vem e onde se edita. Nenhum preço é escrito aqui.
 */
export type PriceKind = "MENSAL" | "ANUAL" | "SETUP" | "AVULSO" | "TAXA" | "TESTE" | "DESCONTO" | "COMISSAO" | "PONTOS" | "SOB_CONSULTA";
export type GroupPriceRow = {
  brand: string;
  item: string;
  kind: PriceKind;
  value: string;
  cents: number | null;
  bps: number | null;
  /** Onde mora o valor (fonte única por linha). */
  source: string;
  /** Tela do Master onde se edita. */
  editHref: string;
  status: "VALENDO" | "RASCUNHO" | "DESLIGADO";
};
export type Divergence = { topic: string; detail: string; suggestion: string };

const BRANDS: Record<string, string> = {
  NEXTLEVEL_COMMERCE: "NextLevel Commerce", SUPERDROP: "SuperDrop", BRAS_DIGITAL: "Brás Digital", NEXTLEVEL_CARGAS: "NextLevel Cargas", NEXTLEVEL: "NextLevel (serviços)",
};
const pct = (bps: number) => `${String(bps / 100).replace(".", ",")}%`;
const CYCLE_KIND: Record<string, PriceKind> = { MONTHLY: "MENSAL", ANNUAL: "ANUAL", ONE_TIME: "AVULSO", QUOTE: "SOB_CONSULTA" };

export async function groupPriceTable(db: Database, actor: Actor) {
  requireMaster(actor);
  const [book, catalog, entry, bras, excursion, club, partners, contador, couponRows] = await Promise.all([
    getPriceBook(db), listCatalog(db, { includeUnpublished: true }), activeOffer(db, ENTRY_OFFER_KEY), getBrasRules(db), getExcursionRules(db), getClubRules(db), getPartnerSettings(db), getMeuContadorSettings(db),
    db.select({ trialDays: coupons.trialDays }).from(coupons).where(eq(coupons.active, true)),
  ]);
  const rows: GroupPriceRow[] = [];
  const add = (r: Omit<GroupPriceRow, "value"> & { value?: string }) => rows.push({ ...r, value: r.value ?? (r.cents !== null ? formatBRL(r.cents) : r.bps !== null ? pct(r.bps) : "—") });

  // SuperDrop: tabela própria (price book).
  const SD = "/master/finance?tab=rules";
  for (const [key, o] of Object.entries(book.offers)) {
    add({ brand: "SuperDrop", item: `${o.name}: mensalidade`, kind: "MENSAL", cents: o.monthlyCents, bps: null, source: `price_book.offers.${key}`, editHref: SD, status: "VALENDO" });
    if (o.setupCents) add({ brand: "SuperDrop", item: `${o.name}: setup`, kind: "SETUP", cents: o.setupCents, bps: null, source: `price_book.offers.${key}`, editHref: SD, status: "VALENDO" });
    add({ brand: "SuperDrop", item: `${o.name}: taxa por pedido`, kind: "TAXA", cents: null, bps: book.orderFees[key as keyof typeof book.orderFees], source: `price_book.orderFees.${key}`, editHref: SD, status: "VALENDO" });
  }
  for (const [key, t] of Object.entries(book.supplierTiers)) add({ brand: "SuperDrop", item: `Fornecedor ${t.name}: mensalidade`, kind: "MENSAL", cents: t.monthlyCents, bps: null, source: `price_book.supplierTiers.${key}`, editHref: SD, status: "VALENDO" });
  add({ brand: "SuperDrop", item: "Fornecedor: taxa por pedido", kind: "TAXA", cents: null, bps: book.superdrop.volumeFeeBps, source: "price_book.superdrop", editHref: SD, status: "VALENDO" });
  add({ brand: "SuperDrop", item: "White Label: setup", kind: "SETUP", cents: book.whiteLabel.setupCents, bps: null, source: "price_book.whiteLabel", editHref: SD, status: "VALENDO" });
  add({ brand: "SuperDrop", item: "White Label: mensalidade", kind: "MENSAL", cents: book.whiteLabel.monthlyCents, bps: null, source: "price_book.whiteLabel", editHref: SD, status: "VALENDO" });
  add({ brand: "SuperDrop", item: "White Label: taxa por pedido", kind: "TAXA", cents: null, bps: book.whiteLabel.volumeFeeBps, source: "price_book.whiteLabel", editHref: SD, status: "VALENDO" });
  add({ brand: "SuperDrop", item: "Desconto no Pix (planos)", kind: "DESCONTO", cents: null, bps: book.billing.pixDiscountBps, source: "price_book.billing", editHref: SD, status: "VALENDO" });
  const trialDays = [...new Set(couponRows.map((c) => c.trialDays))].sort((a, b) => a - b);
  add({ brand: "SuperDrop", item: "Teste grátis do lojista (por cupom do fornecedor)", kind: "TESTE", cents: null, bps: null, value: trialDays.length ? `${trialDays.join(" ou ")} dias, depois bloqueia` : "sem cupom ativo", source: "coupons.trial_days", editHref: "/master/suppliers", status: trialDays.length ? "VALENDO" : "DESLIGADO" });
  for (const [key, a] of Object.entries(book.addons)) add({ brand: "NextLevel (serviços)", item: `${a.name}: mensal`, kind: "MENSAL", cents: a.monthlyCents, bps: null, source: `price_book.addons.${key}`, editHref: SD, status: "VALENDO" });

  // Catálogo do Master (Commerce, temas, serviços, Brás, importadora, transportadora).
  for (const p of catalog) {
    const brandCode = (p.meta as { brands?: string[] } | null)?.brands?.[0] ?? "NEXTLEVEL";
    const brand = BRANDS[brandCode] ?? brandCode;
    const status = p.status === "PUBLISHED" ? "VALENDO" : "RASCUNHO";
    const label = `${p.name} (${FAMILY_LABEL[p.family] ?? p.family})`;
    const fee = (p.meta as { platformFeeBps?: number } | null)?.platformFeeBps;
    const prices = Object.values(p.prices);
    if (!prices.length) add({ brand, item: label, kind: "SOB_CONSULTA", cents: null, bps: null, value: "sob consulta", source: `catalog:${p.key}`, editHref: "/master/financeiro/catalogo", status });
    for (const v of prices) {
      if (!v) continue;
      add({ brand, item: label, kind: CYCLE_KIND[v.cycle] ?? "AVULSO", cents: v.amountCents, bps: null, value: v.amountCents === null ? "sob consulta" : undefined, source: `catalog:${p.key} v${v.version}`, editHref: "/master/financeiro/catalogo", status });
    }
    if (fee) add({ brand, item: `${p.name}: taxa de plataforma`, kind: "TAXA", cents: null, bps: fee, source: `catalog:${p.key}`, editHref: "/master/financeiro/catalogo", status });
  }
  if (entry) add({ brand: "NextLevel Commerce", item: `Oferta de entrada (v${entry.version})`, kind: "TESTE", cents: entry.rules.firstPeriodCents, bps: null, value: `${entry.rules.trialDays} dias grátis · 1º mês ${entry.rules.firstPeriodCents === null ? "sem preço especial" : formatBRL(entry.rules.firstPeriodCents)} · taxa zero por ${entry.rules.feeHolidayMonths} meses`, source: `offer:${entry.key} v${entry.version}`, editHref: "/master/financeiro/ofertas", status: entry.status === "ACTIVE" ? "VALENDO" : "DESLIGADO" });

  // Brás e Cargas: regras.
  add({ brand: "Brás Digital", item: "Cadastro do membro com CNPJ", kind: "TESTE", cents: 0, bps: null, value: "grátis (compra de caixa sempre grátis)", source: "bras.rules", editHref: "/bras/regras", status: "VALENDO" });
  for (const [plan, bps] of Object.entries(bras.carriers.commissionBps)) add({ brand: "NextLevel Cargas", item: `Comissão sobre o frete (plano ${plan.toLowerCase()})`, kind: "COMISSAO", cents: null, bps, source: "bras.rules.carriers", editHref: "/bras/regras?aba=regras", status: "VALENDO" });
  add({ brand: "NextLevel Cargas", item: "Cargas grátis por mês (plano grátis)", kind: "TESTE", cents: null, bps: null, value: `${bras.carriers.freeLoadsPerMonth} cargas`, source: "bras.rules.carriers", editHref: "/bras/regras?aba=regras", status: "VALENDO" });
  add({ brand: "NextLevel Cargas", item: "Excursão: taxa por fardo", kind: "TAXA", cents: excursion.fee.mode === "VOLUME" ? excursion.fee.perParcelCents : null, bps: excursion.fee.mode === "PERCENT" ? excursion.fee.bps : null, source: "cargas.excursion_rules.fee", editHref: "/bras/excursao", status: excursion.fee.charging ? "VALENDO" : "DESLIGADO" });
  add({ brand: "NextLevel Cargas", item: "Excursão: frete por Pix na conta do ônibus", kind: "TAXA", cents: null, bps: null, value: excursion.pixOnline ? "ligado" : "desligado", source: "cargas.excursion_rules.pixOnline", editHref: "/bras/excursao", status: excursion.pixOnline ? "VALENDO" : "DESLIGADO" });

  // Club, parceiros e Meu Contador.
  add({ brand: "Brás Digital Club", item: "Valor do ponto no resgate", kind: "PONTOS", cents: null, bps: null, value: `${club.pointsPerReal} pontos = R$ 1,00`, source: "club.rules", editHref: "/bras/club", status: "VALENDO" });
  add({ brand: "Brás Digital Club", item: "Pontos por compra no balcão", kind: "PONTOS", cents: null, bps: null, value: `${club.purchase.pointsPerReal} pontos por R$ 1,00 (${club.purchase.companies.join(", ")})`, source: "club.rules.purchase", editHref: "/bras/club", status: "VALENDO" });
  add({ brand: "Brás Digital Club", item: "Vale cobre até", kind: "DESCONTO", cents: null, bps: club.purchase.maxDiscountPct * 100, source: "club.rules.purchase", editHref: "/bras/club", status: "VALENDO" });
  add({ brand: "Brás Digital Club", item: "Fardo entregue por ônibus do grupo", kind: "PONTOS", cents: null, bps: null, value: `${club.cross.parcelDeliveredPoints} pontos`, source: "club.rules.cross", editHref: "/bras/club", status: "VALENDO" });
  add({ brand: "Brás Digital Club", item: "Guia de excursão", kind: "PONTOS", cents: null, bps: club.cross.guidePct * 100, source: "club.rules.cross", editHref: "/bras/club", status: "VALENDO" });
  for (const [kind, pts] of Object.entries(club.referral)) add({ brand: "Brás Digital Club", item: `Indicação ativada: ${kind.toLowerCase()}`, kind: "PONTOS", cents: null, bps: null, value: `${pts} pontos`, source: "club.rules.referral", editHref: "/bras/club", status: "VALENDO" });
  for (const t of partners.tiers) add({ brand: "Parceiros", item: `Comissão do setup (${t.min}${t.max ? ` a ${t.max}` : "+"} ativações)`, kind: "COMISSAO", cents: null, bps: t.bps, source: "partners.settings.tiers", editHref: "/master/partners", status: "VALENDO" });
  add({ brand: "Parceiros", item: "Comissão de manutenção (mensalidades)", kind: "COMISSAO", cents: null, bps: partners.maintenanceBps, source: "partners.settings", editHref: "/master/partners", status: "VALENDO" });
  add({ brand: "Brás Digital", item: "Meu Contador: chamado urgente", kind: "AVULSO", cents: contador.priceCents, bps: null, value: contador.priceCents ? undefined : "preço em rascunho", source: "fiscal.meu_contador", editHref: "/bras/meu-contador", status: contador.charging ? "VALENDO" : "DESLIGADO" });

  return { rows, divergences: divergencesOf({ entryTrialDays: entry?.rules.trialDays ?? null, couponTrialDays: trialDays, catalog, annualCatalog: catalog.some((p) => Object.values(p.prices).some((v) => v?.cycle === "ANNUAL")) }) };
}

/** Divergências estruturais entre as fontes (o que impede uma regra única do grupo). */
function divergencesOf(x: { entryTrialDays: number | null; couponTrialDays: number[]; catalog: { family: string; status: string; name: string }[]; annualCatalog: boolean }): Divergence[] {
  const out: Divergence[] = [];
  const trials = [x.entryTrialDays !== null ? `Commerce ${x.entryTrialDays} dias` : null, x.couponTrialDays.length ? `SuperDrop ${x.couponTrialDays.join("/")} dias com cupom (depois bloqueia)` : null, "Brás e Cargas grátis"].filter(Boolean);
  if (trials.length > 1) out.push({ topic: "Teste grátis", detail: `Cada marca tem uma regra: ${trials.join(" · ")}.`, suggestion: "Uma regra do grupo: grátis permanente com taxa sobre a venda + 14 dias do plano do meio que caem para o grátis (fase P5)." });
  out.push({ topic: "Duas tabelas de preço", detail: "Os planos do SuperDrop moram na tabela do SuperDrop (price book); Commerce, Brás, Cargas e serviços moram no catálogo do Master.", suggestion: "O catálogo do Master vira a fonte única; o SuperDrop passa a ler dele, com teste de regressão, por último." });
  if (x.annualCatalog) out.push({ topic: "Desconto anual", detail: "O catálogo dá 25% no anual (Commerce); a tabela do SuperDrop não tem ciclo anual; o PLANOS.md diz que não há desconto por ciclo nos planos.", suggestion: "Anual do grupo: \"pague 8, leve 12\" no Pix, igual em todas as marcas (fase P5)." });
  const drafts = x.catalog.filter((p) => ["BRAS_MEMBER_PLAN", "BRAS_IMPORTER_PLAN", "CARRIER_PLAN"].includes(p.family) && p.status !== "PUBLISHED");
  if (drafts.length) out.push({ topic: "Planos em rascunho", detail: `${drafts.length} planos da Brás e da Cargas estão em rascunho no catálogo (${drafts.map((d) => d.name).join(", ")}).`, suggestion: "Publicar quando a cobrança for ligada; até lá, o painel mostra o valor como rascunho." });
  out.push({ topic: "Documento × sistema", detail: "O docs/PLANOS.md (v2) tem valores do fornecedor SuperDrop (setup R$ 1.500 e R$ 300/mês) diferentes da tabela do sistema.", suggestion: "O PLANOS.md fica como histórico; o preço que vale é esta tabela (D123)." });
  return out;
}
