import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { aprenderProgresso } from "@/db/schema";
import { newId } from "@/lib/ids";
import { aulas as montarAulas, trilhasDa, type Aula } from "@/lib/conhecimento/aulas";
import { fatosAoVivo, type Fatos } from "@/lib/conhecimento/fatos";
import { corrigir, perguntasDa } from "@/lib/conhecimento/perguntas";
import { isMasterOwner, type Actor } from "./access";
import { listMasterTeam } from "./equipe-master";
import { ForbiddenError, NotFoundError } from "./errors";

/**
 * Aprender (BC2, D267): perguntas por aula, progresso por pessoa e o painel do dono ("quem está pronto").
 * A correção é sempre no servidor, com as perguntas montadas dos números de agora. Só a equipe do Master usa.
 */
const soEquipe = (actor: Actor) => { if (actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError("Só a equipe do Master usa o Aprender."); };

export const respostaSchema = z.object({ aulaId: z.string().min(1).max(60), respostas: z.array(z.number().int().min(0).max(9)).max(10) });

export async function responderAula(db: Database, actor: Actor, raw: z.input<typeof respostaSchema>, fatos?: Fatos) {
  soEquipe(actor);
  const v = respostaSchema.parse(raw);
  const f = fatos ?? await fatosAoVivo(db);
  const aula = montarAulas(f).find((a) => a.id === v.aulaId && trilhasDa(actor.masterFunction ?? null).includes(a.trilha));
  if (!aula) throw new NotFoundError("Aula não encontrada.");
  const r = corrigir(perguntasDa(aula.id, f), v.respostas);
  const agora = new Date().toISOString();
  await db.insert(aprenderProgresso).values({ id: newId("apr"), userId: actor.userId, aulaId: aula.id, trilha: aula.trilha, acertos: r.acertos, total: r.total, tentativas: 1, concluidaAt: r.concluida ? agora : null, updatedAt: agora })
    .onConflictDoUpdate({
      target: [aprenderProgresso.userId, aprenderProgresso.aulaId],
      // Concluída uma vez, continua concluída (errar de novo depois não apaga); guarda o melhor resultado.
      set: { acertos: sql`greatest(${aprenderProgresso.acertos}, ${r.acertos})`, total: r.total, trilha: aula.trilha, tentativas: sql`${aprenderProgresso.tentativas} + 1`, concluidaAt: r.concluida ? sql`coalesce(${aprenderProgresso.concluidaAt}, ${agora})` : sql`${aprenderProgresso.concluidaAt}`, updatedAt: agora },
    });
  return r;
}

/** Aulas concluídas por uma pessoa (id da aula → data). */
export async function progressoDe(db: Database, userId: string): Promise<Map<string, string>> {
  const rows = await db.select({ aulaId: aprenderProgresso.aulaId, concluidaAt: aprenderProgresso.concluidaAt }).from(aprenderProgresso).where(and(eq(aprenderProgresso.userId, userId), sql`${aprenderProgresso.concluidaAt} is not null`));
  return new Map(rows.map((r) => [r.aulaId, r.concluidaAt!]));
}

export type ResumoTrilha = { trilha: string; feitas: number; total: number };
/** Quanto de cada trilha a pessoa já fez (só aulas que existem hoje contam). */
export function resumoPorTrilha(lista: Aula[], trilhas: string[], feitas: Map<string, string>): ResumoTrilha[] {
  return trilhas.map((t) => { const daTrilha = lista.filter((a) => a.trilha === t); return { trilha: t, feitas: daTrilha.filter((a) => feitas.has(a.id)).length, total: daTrilha.length }; });
}

/** Painel do dono: cada pessoa da equipe, as trilhas da função e se está pronta (todas as trilhas concluídas). */
export async function painelDaEquipe(db: Database, actor: Actor, fatos?: Fatos) {
  if (!isMasterOwner(actor)) throw new ForbiddenError("Só o dono vê o progresso da equipe.");
  const equipe = (await listMasterTeam(db, actor)).filter((u) => u.masterFunction && !u.disabledAt);
  const lista = montarAulas(fatos ?? await fatosAoVivo(db));
  const rows = await db.select({ userId: aprenderProgresso.userId, aulaId: aprenderProgresso.aulaId, concluidaAt: aprenderProgresso.concluidaAt }).from(aprenderProgresso).where(sql`${aprenderProgresso.concluidaAt} is not null`);
  return equipe.map((u) => {
    const feitas = new Map(rows.filter((r) => r.userId === u.id).map((r) => [r.aulaId, r.concluidaAt!]));
    const trilhas = resumoPorTrilha(lista, trilhasDa(u.masterFunction), feitas);
    const total = trilhas.reduce((s, t) => s + t.total, 0), feitasN = trilhas.reduce((s, t) => s + t.feitas, 0);
    const ultima = [...feitas.values()].sort().at(-1) ?? null;
    return { id: u.id, nome: u.name, email: u.email, funcao: u.masterFunction!, trilhas, feitas: feitasN, total, pronto: total > 0 && feitasN === total, ultima };
  });
}

/** Para o card da tela Agora: quanto falta da trilha da função da pessoa. O dono (sem função) não recebe o card. */
export async function pendenteDoAprender(db: Database, actor: Actor, fatos?: Fatos): Promise<{ feitas: number; total: number } | null> {
  if (actor.role !== "NEXTLEVEL_MASTER" || !actor.masterFunction) return null;
  const lista = montarAulas(fatos ?? await fatosAoVivo(db));
  const r = resumoPorTrilha(lista, trilhasDa(actor.masterFunction), await progressoDe(db, actor.userId));
  const total = r.reduce((s, t) => s + t.total, 0), feitas = r.reduce((s, t) => s + t.feitas, 0);
  return feitas < total ? { feitas, total } : null;
}
