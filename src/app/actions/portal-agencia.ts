"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { runAction } from "@/lib/action-result";
import { DomainError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { aceitarContratoNoPortal } from "@/lib/agencias/contratos";
import { COOKIE_PORTAL, COOKIE_PREVIA, agenciaDoPortal, responderPeloCliente, ajustePeloCliente, aprovarPeloCliente, entrarNoPortal, enviarSolicitacao, pedirCodigoDoPortal, type solicitacaoSchema } from "@/lib/agencias/portal";

/** Portal do cliente da agência (D320): código no e-mail, sessão por agência, ações só do próprio cliente. */
async function limite(chave: string, n: number) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (!rateLimit(`${chave}:${ip}`, n, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo daqui a pouco.");
}
const nome = (slug: string) => `${COOKIE_PORTAL}-${slug.replace(/[^a-z0-9-]/g, "")}`;
async function sessao(slug: string) { const db = await getDb(); const a = await agenciaDoPortal(db, String(slug)); return { db, a, token: (await cookies()).get(nome(a.slug))?.value }; }
const id = z.string().regex(/^[a-z]+_[a-z0-9]+$/i);

export async function pedirCodigoPortalAction(slug: string, email: string) {
  return runAction(async () => { await limite("portal-codigo", 8); return pedirCodigoDoPortal(await getDb(), String(slug), String(email)); });
}
export async function entrarPortalAction(slug: string, email: string, codigo: string) {
  return runAction(async () => {
    await limite("portal-entrar", 20);
    const token = await entrarNoPortal(await getDb(), String(slug), String(email), String(codigo));
    const proto = (await headers()).get("x-forwarded-proto") ?? "http";
    (await cookies()).set(nome(slug), token, { path: "/", httpOnly: true, sameSite: "lax", secure: proto === "https", maxAge: 30 * 86_400 });
    return undefined;
  });
}
export async function sairPortalAction(slug: string) { (await cookies()).delete(nome(slug)); }
export async function aprovarNoPortalAction(slug: string, clienteId: string, pecaId: string) {
  return runAction(async () => { const { db, a, token } = await sessao(slug); await aprovarPeloCliente(db, a.id, token, id.parse(clienteId), id.parse(pecaId)); revalidatePath(`/portal/${a.slug}`); return undefined; });
}
export async function ajusteNoPortalAction(slug: string, clienteId: string, pecaId: string, comentario: string) {
  return runAction(async () => { const { db, a, token } = await sessao(slug); await ajustePeloCliente(db, a.id, token, id.parse(clienteId), id.parse(pecaId), comentario); revalidatePath(`/portal/${a.slug}`); return undefined; });
}
export async function solicitacaoNoPortalAction(slug: string, clienteId: string, input: z.input<typeof solicitacaoSchema>) {
  return runAction(async () => { const { db, a, token } = await sessao(slug); const r = await enviarSolicitacao(db, a.id, token, id.parse(clienteId), input); revalidatePath(`/portal/${a.slug}`); return r; });
}
export async function aceitarContratoPortalAction(slug: string, clienteId: string, contratoId: string, input: { concordo: boolean; hashVisto: string; nome: string }) {
  return runAction(async () => {
    const { db, a, token } = await sessao(slug); const h = await headers();
    const r = await aceitarContratoNoPortal(db, a.id, token, id.parse(clienteId), id.parse(contratoId), input as { concordo: true; hashVisto: string; nome: string }, { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, aparelho: h.get("user-agent") });
    revalidatePath(`/portal/${a.slug}`); return r;
  });
}
export async function responderConversaPortalAction(slug: string, clienteId: string, solicitacaoId: string, texto: string) {
  return runAction(async () => { const { db, a, token } = await sessao(slug); await responderPeloCliente(db, a.id, token, id.parse(clienteId), id.parse(solicitacaoId), texto); revalidatePath(`/portal/${a.slug}`); return undefined; });
}
export async function sairDaPreviaAction(slug: string) { (await cookies()).delete(`${COOKIE_PREVIA}-${slug.replace(/[^a-z0-9-]/g, "")}`); }
