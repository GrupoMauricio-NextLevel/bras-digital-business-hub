"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { convidarMembro, criarAgencia, desligarMembro, mudarFuncao, mudarSituacaoDaAgencia, type novaAgenciaSchema, type novoMembroSchema } from "@/lib/agencias/agencias";
import { atualizarCliente, criarCliente, definirEquipeDoCliente, importarClientes, mudarSituacaoDoCliente, type ClienteInput } from "@/lib/agencias/clientes";
import type { AgenciaClienteSituacao, AgenciaFuncao } from "@/db/schema";

/** Ações do Painel da Agência (D313). Permissão e agência conferidas no domínio, a partir da sessão. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const idCliente = z.string().regex(/^agcl_[a-z0-9]+$/i);
const idUsuario = z.string().regex(/^usr_[a-z0-9]+$/i);
const refresh = () => revalidatePath("/agencia", "layout");

export async function criarAgenciaAction(input: z.input<typeof novaAgenciaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarAgencia(db, actor, input); revalidatePath("/master/agencias"); return r; });
}
export async function mudarSituacaoDaAgenciaAction(agenciaId: string, situacao: "PILOTO" | "ATIVA" | "PAUSADA") {
  return runAction(async () => { const { actor, db } = await ctx(); await mudarSituacaoDaAgencia(db, actor, z.string().regex(/^agc_[a-z0-9]+$/i).parse(agenciaId), situacao); revalidatePath("/master/agencias"); return undefined; });
}
export async function convidarMembroAction(input: z.input<typeof novoMembroSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await convidarMembro(db, actor, input); refresh(); return r; });
}
export async function mudarFuncaoAction(userId: string, input: { funcao: AgenciaFuncao; todosClientes: boolean }) {
  return runAction(async () => { const { actor, db } = await ctx(); await mudarFuncao(db, actor, idUsuario.parse(userId), input); refresh(); return undefined; });
}
export async function desligarMembroAction(userId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await desligarMembro(db, actor, idUsuario.parse(userId)); refresh(); return undefined; });
}
export async function criarClienteAction(input: ClienteInput) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarCliente(db, actor, input); refresh(); return r; });
}
export async function atualizarClienteAction(id: string, input: Partial<ClienteInput>) {
  return runAction(async () => { const { actor, db } = await ctx(); await atualizarCliente(db, actor, idCliente.parse(id), input); refresh(); return undefined; });
}
export async function mudarSituacaoDoClienteAction(id: string, input: { situacao: AgenciaClienteSituacao; motivo?: string | null }) {
  return runAction(async () => { const { actor, db } = await ctx(); await mudarSituacaoDoCliente(db, actor, idCliente.parse(id), input); refresh(); return undefined; });
}
export async function definirEquipeDoClienteAction(id: string, userIds: string[]) {
  return runAction(async () => { const { actor, db } = await ctx(); await definirEquipeDoCliente(db, actor, idCliente.parse(id), userIds); refresh(); return undefined; });
}
export async function importarClientesAction(texto: string, confirmar: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await importarClientes(db, actor, texto, { confirmar }); if (confirmar) refresh(); return r; });
}
