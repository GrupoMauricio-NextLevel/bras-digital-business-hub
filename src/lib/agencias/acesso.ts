import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { agencias, agenciaMembros, type AgenciaFuncao } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";

/**
 * Painel da Agência (D313). Tudo atrás da chave AGENCIAS_V1: desligada, o painel e a tela do Master não existem.
 * Regras de acesso puras (testadas) e o escopo da pessoa logada, sempre resolvido no servidor.
 */
export const agenciasLigado = (env: Record<string, string | undefined> = process.env) => ["true", "1"].includes((env.AGENCIAS_V1 ?? "").trim().toLowerCase());

export function exigirAgenciasLigado(env: Record<string, string | undefined> = process.env) {
  if (!agenciasLigado(env)) throw new DomainError("AGENCIAS_DESLIGADO", "O Painel da Agência ainda não está liberado.");
}

export const FUNCAO_ROTULO: Record<AgenciaFuncao, string> = {
  ADMIN: "Administrador", GESTOR: "Gestor", ATENDIMENTO: "Atendimento", ROTEIRO: "Roteiro", GRAVACAO: "Gravação", EDICAO: "Edição",
  SOCIAL_MEDIA: "Social media", TRAFEGO: "Tráfego pago", FINANCEIRO: "Financeiro",
};

export type Membro = { agenciaId: string; userId: string; funcao: AgenciaFuncao; todosClientes: boolean };

/** O que cada função pode fazer. ADMIN tudo; FINANCEIRO vê valores; ATENDIMENTO cuida da carteira (sem valores). */
export const pode = {
  verValores: (m: Membro) => m.funcao === "ADMIN" || m.funcao === "FINANCEIRO",
  gerirEquipe: (m: Membro) => m.funcao === "ADMIN",
  editarClientes: (m: Membro) => m.funcao === "ADMIN" || m.funcao === "GESTOR" || m.funcao === "ATENDIMENTO",
  editarContrato: (m: Membro) => m.funcao === "ADMIN" || m.funcao === "FINANCEIRO",
  importar: (m: Membro) => m.funcao === "ADMIN",
  verTodosClientes: (m: Membro) => m.todosClientes || m.funcao === "ADMIN" || m.funcao === "GESTOR" || m.funcao === "ATENDIMENTO" || m.funcao === "FINANCEIRO",
  /** Distribui, transfere, muda prazo e move qualquer peça (D314). */
  gerirProducao: (m: Membro) => m.funcao === "ADMIN" || m.funcao === "GESTOR",
  /** Cria peças e planeja o mês. */
  planejar: (m: Membro) => m.funcao === "ADMIN" || m.funcao === "GESTOR" || m.funcao === "ROTEIRO" || m.funcao === "ATENDIMENTO",
  /** Tráfego e Mesa de anúncios (D325). */
  trafego: (m: Membro) => m.funcao === "ADMIN" || m.funcao === "GESTOR" || m.funcao === "TRAFEGO",
  /** Metas da equipe (D325). */
  definirMetas: (m: Membro) => m.funcao === "ADMIN" || m.funcao === "GESTOR",
};

/** Vê o cliente se vê a carteira toda, se é o responsável ou se está na equipe do cliente. */
export function podeVerCliente(m: Membro, c: { responsavelId: string | null }, equipe: readonly string[]): boolean {
  return pode.verTodosClientes(m) || c.responsavelId === m.userId || equipe.includes(m.userId);
}

/** A agência e a função de quem está logado. Só o papel AGENCY passa, e só com a chave ligada. */
export async function escopoDaAgencia(db: Database, actor: Actor) {
  exigirAgenciasLigado();
  if (actor.role !== "AGENCY") throw new ForbiddenError("Área disponível apenas para agências.");
  const m = await db.query.agenciaMembros.findFirst({ where: eq(agenciaMembros.userId, actor.userId) });
  if (!m) throw new ForbiddenError("Seu acesso à agência não foi encontrado.");
  const agencia = await db.query.agencias.findFirst({ where: and(eq(agencias.id, m.agenciaId), eq(agencias.organizationId, actor.organizationId)) });
  if (!agencia) throw new ForbiddenError("Agência não encontrada.");
  if (agencia.situacao === "PAUSADA") throw new ForbiddenError("O acesso desta agência está pausado. Fale com a NextLevel.");
  const membro: Membro = { agenciaId: m.agenciaId, userId: m.userId, funcao: m.funcao, todosClientes: m.todosClientes };
  return { agencia, membro };
}
