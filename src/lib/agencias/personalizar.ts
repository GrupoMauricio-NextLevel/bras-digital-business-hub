import { eq } from "drizzle-orm";
import type { z } from "zod";
import type { Database } from "@/db/client";
import { agencias } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { ForbiddenError } from "@/lib/domain/errors";
import { escopoDaAgencia } from "./acesso";
import { compactar, vocabulario, type personalizacaoSchema } from "./personalizacao";

/** O painel como a empresa da pessoa vê (nomes, departamentos, etapas, tipos e gavetas), para telas e menu (D340). */
export async function vocabularioDaAgencia(db: Database, actor: Actor) {
  const { agencia, membro } = await escopoDaAgencia(db, actor);
  return { v: vocabulario(agencia.personalizacao), membro, agencia };
}

/** Grava a personalização (só o Administrador). Guarda só o que difere do modelo do segmento. */
export async function salvarPersonalizacao(db: Database, actor: Actor, raw: z.input<typeof personalizacaoSchema>) {
  const { agencia, membro } = await escopoDaAgencia(db, actor);
  if (membro.funcao !== "ADMIN") throw new ForbiddenError("Só o administrador personaliza o painel.");
  const valor = compactar(raw);
  await db.update(agencias).set({ personalizacao: valor, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agencia.id));
  await recordAudit(db, actor, { action: "PAINEL_PERSONALIZADO", entityType: "agencia", entityId: agencia.id, before: agencia.personalizacao, after: valor }, { force: true });
  return { segmento: valor.segmento };
}
