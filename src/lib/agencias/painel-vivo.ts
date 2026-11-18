/**
 * Painel da Agência com vida (D334): regras puras dos gráficos do início (esteira da produção e frase do crescimento)
 * e o movimento ao vivo da equipe. Os números vêm de `producaoDoMes` e `crescimentoDaAgencia`; nada é inventado.
 */
import { and, desc, eq, notInArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { agenciaPecaEventos, agenciaPecas, type PecaEtapa } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { formatBRL } from "@/lib/money";
import { escopoDaAgencia, pode } from "./acesso";

/** As etapas da produção agrupadas em 6 trechos da esteira, cada um com a sua família de cor. */
export const TRECHOS = [
  { chave: "planejar", rotulo: "Planejar", etapas: ["PLANEJAMENTO"], cor: "var(--ds-muted)" },
  { chave: "roteiro", rotulo: "Roteiro", etapas: ["ROTEIRO"], cor: "var(--vida-clientes)" },
  { chave: "gravacao", rotulo: "Gravação", etapas: ["CAPTACAO"], cor: "var(--vida-visitas)" },
  { chave: "edicao", rotulo: "Edição", etapas: ["EDICAO", "REVISAO"], cor: "var(--vida-festa)" },
  { chave: "aprovacao", rotulo: "Aprovação", etapas: ["APROVACAO", "AGENDAMENTO"], cor: "var(--vida-pedidos)" },
  { chave: "publicado", rotulo: "Publicado", etapas: ["PUBLICADO", "CONCLUIDO"], cor: "var(--vida-crescimento)" },
] as const satisfies readonly { chave: string; rotulo: string; etapas: readonly PecaEtapa[]; cor: string }[];

/** Quantas peças há em cada trecho e a fatia de cada um (soma 100 quando há peças). */
export function esteiraDoMes(porEtapa: Partial<Record<PecaEtapa, number>>) {
  const trechos = TRECHOS.map((t) => ({ chave: t.chave, rotulo: t.rotulo, cor: t.cor, n: t.etapas.reduce((s, e) => s + (porEtapa[e] ?? 0), 0) }));
  const total = trechos.reduce((s, t) => s + t.n, 0);
  return { total, trechos: trechos.map((t) => ({ ...t, pct: total ? Math.round((t.n / total) * 1000) / 10 : 0 })) };
}

/** Título do gráfico de receita: a conclusão dos últimos meses. */
export function fraseDaReceita(serie: { mes: string; recorrenteCents: number }[]): string {
  const primeiro = serie.find((s) => s.recorrenteCents > 0);
  const ultimo = serie.at(-1);
  if (!primeiro || !ultimo || ultimo.recorrenteCents === 0) return "A receita aparece aqui quando a carteira tiver contratos com valor.";
  if (primeiro === ultimo) return `Receita recorrente de ${formatBRL(ultimo.recorrenteCents)} por mês.`;
  const d = Math.round(((ultimo.recorrenteCents - primeiro.recorrenteCents) / primeiro.recorrenteCents) * 100);
  if (d === 0) return `Receita recorrente estável em ${formatBRL(ultimo.recorrenteCents)} por mês.`;
  return d > 0 ? `A receita recorrente cresceu ${d}% no período: ${formatBRL(ultimo.recorrenteCents)} por mês.` : `A receita recorrente caiu ${Math.abs(d)}% no período: ${formatBRL(ultimo.recorrenteCents)} por mês.`;
}

/** "agora", "há 5 min", "há 2 h", "há 3 dias". */
export function haQuanto(iso: string, agora: Date): string {
  const m = Math.max(0, Math.round((agora.getTime() - new Date(iso).getTime()) / 60_000));
  return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} dia${Math.round(m / 1440) > 1 ? "s" : ""}`;
}

/**
 * Movimento ao vivo: as últimas mudanças de verdade na produção (etapa, situação, versão, brutos, ajuste, transferência;
 * sem "peça criada", prazo e prioridade, que não são trabalho andando), com quem
 * fez. Só para quem vê a carteira toda; só a agência da pessoa (um tenant nunca lê outro).
 */
export async function movimentoDaAgencia(db: Database, actor: Actor, limite = 8) {
  const { agencia, membro } = await escopoDaAgencia(db, actor);
  if (!pode.verTodosClientes(membro)) return [];
  return db.select({ id: agenciaPecaEventos.id, tipo: agenciaPecaEventos.tipo, mensagem: agenciaPecaEventos.mensagem, autor: agenciaPecaEventos.autorNome, createdAt: agenciaPecaEventos.createdAt, titulo: agenciaPecas.titulo, pecaId: agenciaPecas.id })
    .from(agenciaPecaEventos).innerJoin(agenciaPecas, eq(agenciaPecas.id, agenciaPecaEventos.pecaId))
    .where(and(eq(agenciaPecaEventos.agenciaId, agencia.id), notInArray(agenciaPecaEventos.tipo, ["CRIADA", "PRIORIDADE", "PRAZO"])))
    .orderBy(desc(agenciaPecaEventos.createdAt)).limit(limite);
}
