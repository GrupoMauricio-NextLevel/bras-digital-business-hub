import { and, eq, gte, inArray, ne } from "drizzle-orm";
import type { Database } from "@/db/client";
import { commissionRules, partnerClicks, partnerCommissions, partnerLinks, partners, stores } from "@/db/schema";
import { dataSP, semanaDe } from "@/lib/finance/caixa-regras";
import { periodoDe, pontosDaVenda, type Publico } from "@/lib/finance/bonus-regras";
import { SELOS, melhorSequencia, missoesDaSemana, posicaoNoRanking, sequenciaDeSemanas, type IndicadoresDaSemana } from "@/lib/finance/engajamento-regras";
import { pontosDoPublico, referenciaDoPonto } from "./bonus";

/**
 * Engajamento sem dinheiro (BG2, D272): missões da semana, sequência, selos e ranking do parceiro (online ou rua).
 * Tudo calculado do que já existe (cliques, cadastros e vendas); nada é pago aqui.
 */
const semanaDoInstante = (iso: string | Date) => semanaDe(dataSP(new Date(iso)))[0]!;
const JANELA_SEMANAS = 26;

export async function engajamentoDoParceiro(db: Database, partnerId: string, now = new Date()) {
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p) return null;
  const publico: Publico = p.executivo ? "RUA" : "ONLINE";
  const desde = new Date(now.getTime() - JANELA_SEMANAS * 7 * 86_400_000).toISOString();
  const [{ refCents }, vendas, todasComissoes, cliques, cadastros] = await Promise.all([
    referenciaDoPonto(db, now),
    db.select({ criadoEm: partnerCommissions.createdAt, base: partnerCommissions.baseCents, ciclo: commissionRules.cycle }).from(partnerCommissions).leftJoin(commissionRules, eq(commissionRules.id, partnerCommissions.ruleId)).where(and(eq(partnerCommissions.partnerId, partnerId), eq(partnerCommissions.kind, "SALE"), ne(partnerCommissions.status, "VOID"))),
    db.select({ storeId: partnerCommissions.storeId }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, partnerId), inArray(partnerCommissions.kind, ["SALE", "RECURRING"]), ne(partnerCommissions.status, "VOID"))),
    db.select({ at: partnerClicks.at }).from(partnerClicks).innerJoin(partnerLinks, eq(partnerLinks.id, partnerClicks.linkId)).where(and(eq(partnerLinks.partnerId, partnerId), gte(partnerClicks.at, desde))),
    db.select({ em: stores.attributedAt, criada: stores.createdAt }).from(stores).where(eq(stores.partnerId, partnerId)),
  ]);

  // Indicadores por semana (para as missões de agora e as "semanas completas" do histórico).
  const porSemana = new Map<string, IndicadoresDaSemana>();
  const ind = (k: string) => { let x = porSemana.get(k); if (!x) { x = { cliques: 0, cadastros: 0, vendas: 0, vendasPlanoMaior: 0, vendasAnuais: 0 }; porSemana.set(k, x); } return x; };
  for (const c of cliques) ind(semanaDoInstante(c.at)).cliques++;
  for (const c of cadastros) ind(semanaDoInstante(c.em ?? c.criada)).cadastros++;
  const porMes = new Map<string, number>();
  let temScale = false, temAnual = false;
  for (const v of vendas) {
    const i = ind(semanaDoInstante(v.criadoEm));
    const pts = pontosDaVenda(v.base, v.ciclo, refCents);
    i.vendas++;
    if (pts >= 200) i.vendasPlanoMaior++;
    if (pts >= 450) temScale = true;
    if (v.ciclo === "ANNUAL") { i.vendasAnuais++; temAnual = true; }
    const mes = dataSP(new Date(v.criadoEm)).slice(0, 7);
    porMes.set(mes, (porMes.get(mes) ?? 0) + 1);
  }
  const semanaAtual = semanaDoInstante(now);
  const missoes = missoesDaSemana(publico, porSemana.get(semanaAtual) ?? { cliques: 0, cadastros: 0, vendas: 0, vendasPlanoMaior: 0, vendasAnuais: 0 });
  const semanasComVenda = new Set([...porSemana.entries()].filter(([, x]) => x.vendas > 0).map(([k]) => k));
  const sequencia = sequenciaDeSemanas(semanasComVenda, semanaAtual);
  const semanasCompletas = [...porSemana.values()].filter((x) => missoesDaSemana(publico, x).completa).length;
  const pagamentosPorLoja = new Map<string, number>();
  for (const c of todasComissoes) if (c.storeId) pagamentosPorLoja.set(c.storeId, (pagamentosPorLoja.get(c.storeId) ?? 0) + 1);
  const fatos = { vendas: vendas.length, maiorMesVendas: Math.max(0, ...porMes.values()), temScale, temAnual, nivel: p.tier, clienteMaisAntigoPagamentos: Math.max(0, ...pagamentosPorLoja.values()), melhorSequencia: melhorSequencia(semanasComVenda), semanasCompletas };
  const selos = SELOS.map((s) => ({ id: s.id, nome: s.nome, descricao: s.descricao, ganhou: s.ganhou(fatos) }));

  // Ranking do público (semana e mês), com os pontos de agora (inclui os que estão em garantia).
  const nomes = new Map((await db.select({ id: partners.id, nome: partners.displayName }).from(partners).where(eq(partners.executivo, publico === "RUA"))).map((x) => [x.id, x.nome]));
  const ranking = async (per: "SEMANA" | "MES") => {
    const pr = periodoDe(per, now);
    const pts = await pontosDoPublico(db, publico, pr.inicio, pr.fim, refCents);
    const lista = [...pts.entries()].map(([id, x]) => ({ partnerId: id, nome: nomes.get(id) ?? "Parceiro", pontos: x.garantidos + x.emGarantia }));
    if (!lista.some((x) => x.partnerId === partnerId)) lista.push({ partnerId, nome: p.displayName, pontos: 0 });
    const r = posicaoNoRanking(lista, partnerId);
    const top = [...lista].sort((a, b) => b.pontos - a.pontos).slice(0, 5).map((x, i) => ({ posicao: i + 1, nome: x.partnerId === partnerId ? "Você" : x.nome.split(" ")[0]!, pontos: x.pontos, voce: x.partnerId === partnerId }));
    return { ...r, top, rotulo: pr.rotulo };
  };
  return { publico, missoes, sequencia: { ...sequencia, melhor: fatos.melhorSequencia }, selos, ranking: { semana: await ranking("SEMANA"), mes: await ranking("MES") } };
}

export type Engajamento = NonNullable<Awaited<ReturnType<typeof engajamentoDoParceiro>>>;
