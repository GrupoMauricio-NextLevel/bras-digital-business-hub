import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { crmAcompanhamento, origensContato, robosVisitasDiarias, stores, trafegoSessoes } from "@/db/schema";
import { CONHECEU_POR, type ConheceuPor } from "@/lib/trafego/conheceu";
import { type Actor, requireMasterFn } from "../access";
import { situacoesComerciais } from "../situacao-comercial";

/**
 * O que cada página trouxe de cliente (D303, plano de busca v3, seção 13.6). Para cada contato (formulário, diagnóstico,
 * janela de saída, cadastro da loja) vale a página por onde a pessoa ENTROU no site da primeira vez (primeiro toque, D290;
 * sem ele, a página de entrada da visita). Daí: quantos contatos, quantas lojas criadas, quantas pagantes hoje, quanto
 * isso soma de mensalidade e quanto a equipe fechou à mão no Comercial. Também o resumo do "Como nos conheceu?".
 */
const equipe = (actor: Actor) => requireMasterFn(actor, ["COMERCIAL", "CONTEUDO"]);

export type LinhaContato = { pagina: string; conta: boolean; pagante: boolean; mensalCents: number; fechadoCents: number; conheceuPor: string | null };
export type PaginaQueTrouxe = { pagina: string; contatos: number; contas: number; pagantes: number; mensalCents: number; fechadoCents: number };
export type RespostaConheceu = { chave: ConheceuPor; rotulo: string; grupo: string; contatos: number; pagantes: number };

/** Junta os contatos por página de entrada, da que trouxe mais dinheiro para a que trouxe menos. Puro. */
export function agruparPorPagina(linhas: LinhaContato[]): PaginaQueTrouxe[] {
  const m = new Map<string, PaginaQueTrouxe>();
  for (const l of linhas) {
    const p = m.get(l.pagina) ?? { pagina: l.pagina, contatos: 0, contas: 0, pagantes: 0, mensalCents: 0, fechadoCents: 0 };
    p.contatos += 1; if (l.conta) p.contas += 1; if (l.pagante) p.pagantes += 1;
    p.mensalCents += l.mensalCents; p.fechadoCents += l.fechadoCents;
    m.set(l.pagina, p);
  }
  return [...m.values()].sort((a, b) => (b.mensalCents + b.fechadoCents) - (a.mensalCents + a.fechadoCents) || b.pagantes - a.pagantes || b.contatos - a.contatos || a.pagina.localeCompare(b.pagina));
}

/** Respostas do "Como nos conheceu?", na ordem da lista (só as que apareceram). Puro. */
export function agruparConheceu(linhas: LinhaContato[]): { respostas: RespostaConheceu[]; semResposta: number } {
  const respostas = CONHECEU_POR.map((c) => ({ chave: c.chave, rotulo: c.rotulo, grupo: c.grupo, contatos: 0, pagantes: 0 }));
  let semResposta = 0;
  for (const l of linhas) {
    const r = respostas.find((x) => x.chave === l.conheceuPor);
    if (!r) { semResposta += 1; continue; }
    r.contatos += 1; if (l.pagante) r.pagantes += 1;
  }
  return { respostas: respostas.filter((r) => r.contatos > 0), semResposta };
}

const SEM_PAGINA = "(página não registrada)";

export async function clientesPorConteudo(db: Database, actor: Actor, dias: 7 | 30 | 90, agora = new Date()) {
  equipe(actor);
  const desde = new Date(agora.getTime() - dias * 86_400_000).toISOString();
  const rows = await db.select({ chave: origensContato.chave, primeiraPagina: origensContato.primeiraPagina, conheceuPor: origensContato.conheceuPor, entrada: trafegoSessoes.paginaEntrada })
    .from(origensContato).leftJoin(trafegoSessoes, eq(trafegoSessoes.id, origensContato.sessaoId))
    .where(gte(origensContato.capturadaEm, desde)).limit(5000);
  const lojaIds = rows.filter((r) => r.chave.startsWith("loja:")).map((r) => r.chave.slice(5));
  const lojas = lojaIds.length ? await db.select({ id: stores.id, paidUntil: stores.paidUntil, trialEndsAt: stores.trialEndsAt, entryOffer: stores.entryOffer }).from(stores).where(inArray(stores.id, lojaIds)) : [];
  const sit = await situacoesComerciais(db, lojas, agora);
  const chaves = rows.map((r) => r.chave);
  const fechados = chaves.length ? await db.select({ chave: crmAcompanhamento.chave, valor: crmAcompanhamento.valorFechadoCents }).from(crmAcompanhamento).where(and(inArray(crmAcompanhamento.chave, chaves), sql`${crmAcompanhamento.fechouEm} is not null`)) : [];
  const fechadoDe = new Map(fechados.map((f) => [f.chave, f.valor ?? 0]));
  const linhas: LinhaContato[] = rows.map((r) => {
    const s = r.chave.startsWith("loja:") ? sit.get(r.chave.slice(5)) : undefined;
    const pagante = s?.pagamento === "pagante" || fechadoDe.has(r.chave);
    return { pagina: r.primeiraPagina || r.entrada || SEM_PAGINA, conta: r.chave.startsWith("loja:"), pagante, mensalCents: s?.pagamento === "pagante" ? s.valorCents : 0, fechadoCents: fechadoDe.get(r.chave) ?? 0, conheceuPor: r.conheceuPor };
  });
  return { paginas: agruparPorPagina(linhas), conheceu: agruparConheceu(linhas), total: linhas.length };
}

// ---------------------------------------------------------------------------------------------------------------------
// Robôs de busca e de IA
// ---------------------------------------------------------------------------------------------------------------------
export type RoboResumo = { robo: string; visitas: number; paginas: { caminho: string; visitas: number }[] };

/** Visitas dos robôs nas páginas públicas no período, por robô, com as páginas que cada um mais leu. */
export async function robosNoSite(db: Database, actor: Actor, dias: 7 | 30 | 90, agora = new Date()): Promise<RoboResumo[]> {
  equipe(actor);
  const desde = new Date(agora.getTime() - (dias - 1) * 86_400_000).toISOString().slice(0, 10);
  const rows = await db.select({ robo: robosVisitasDiarias.robo, caminho: robosVisitasDiarias.caminho, visitas: sql<number>`sum(${robosVisitasDiarias.visitas})` })
    .from(robosVisitasDiarias).where(gte(robosVisitasDiarias.dia, desde))
    .groupBy(robosVisitasDiarias.robo, robosVisitasDiarias.caminho).orderBy(desc(sql`sum(${robosVisitasDiarias.visitas})`)).limit(2000);
  const m = new Map<string, RoboResumo>();
  for (const r of rows) {
    const x = m.get(r.robo) ?? { robo: r.robo, visitas: 0, paginas: [] };
    const v = Number(r.visitas);
    x.visitas += v; if (x.paginas.length < 5) x.paginas.push({ caminho: r.caminho, visitas: v });
    m.set(r.robo, x);
  }
  return [...m.values()].sort((a, b) => b.visitas - a.visitas);
}
