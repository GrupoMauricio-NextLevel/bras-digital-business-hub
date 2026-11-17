"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { COOKIE_PREVIA, passeVerComoCliente } from "@/lib/agencias/portal";
import { criarCampanha, definirComissao, lancarNumeros, mudarSituacaoCampanha, perguntarAoAgente, responderNaConversa, salvarMetas, type campanhaSchema, type metasSchema, type numerosSchema } from "@/lib/agencias/gestao";
import type { CAMPANHA_SITUACOES } from "@/db/schema";

/** Gestão da agência (D325). Permissões no domínio, a partir da sessão. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => revalidatePath("/agencia", "layout");
const idCampanha = z.string().regex(/^agcp_[a-z0-9]+$/i);

export async function salvarMetasAction(mes: string, input: z.input<typeof metasSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); await salvarMetas(db, actor, mes, input); refresh(); return undefined; });
}
export async function definirComissaoAction(userId: string, pct: number | null) {
  return runAction(async () => { const { actor, db } = await ctx(); await definirComissao(db, actor, z.string().regex(/^usr_[a-z0-9]+$/i).parse(userId), pct); refresh(); return undefined; });
}
export async function criarCampanhaAction(input: z.input<typeof campanhaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarCampanha(db, actor, input); refresh(); return r; });
}
export async function mudarSituacaoCampanhaAction(id: string, situacao: (typeof CAMPANHA_SITUACOES)[number]) {
  return runAction(async () => { const { actor, db } = await ctx(); await mudarSituacaoCampanha(db, actor, idCampanha.parse(id), situacao); refresh(); return undefined; });
}
export async function lancarNumerosAction(id: string, input: z.input<typeof numerosSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); await lancarNumeros(db, actor, idCampanha.parse(id), input); refresh(); return undefined; });
}
export async function responderNaConversaAction(id: string, texto: string, encerrar: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); await responderNaConversa(db, actor, z.string().regex(/^agso_[a-z0-9]+$/i).parse(id), texto, encerrar); refresh(); return undefined; });
}
export async function perguntarAoAgenteAction(pergunta: string) {
  return runAction(async () => { const { actor, db } = await ctx(); return perguntarAoAgente(db, actor, pergunta); });
}
/** Ver como cliente: passe de 30 minutos (cookie só leitura) e o endereço do portal daquele cliente. */
export async function verComoClienteAction(clienteId: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    const p = await passeVerComoCliente(db, actor, z.string().regex(/^agcl_[a-z0-9]+$/i).parse(clienteId));
    const proto = (await headers()).get("x-forwarded-proto") ?? "http";
    (await cookies()).set(`${COOKIE_PREVIA}-${p.slug}`, p.token, { path: "/", httpOnly: true, sameSite: "lax", secure: proto === "https", maxAge: 30 * 60 });
    return { redirectTo: `/portal/${p.slug}?previa=1` };
  });
}
