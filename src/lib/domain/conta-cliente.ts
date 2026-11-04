import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orders, organizations, stores } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { DomainError, NotFoundError } from "./errors";
import { JOURNEY_LABEL, toTracked, type TrackedOrder } from "./tracking";

/**
 * Minha conta do cliente final (D240, fase L4): entrada SEM SENHA, por código de 6 dígitos no e-mail.
 * - O código é derivado (HMAC do segredo da plataforma + loja + e-mail + janela de 10 min): nada de tabela nova.
 * - A sessão é um cookie assinado, por loja, válido por 30 dias. Só dá acesso aos pedidos daquele e-mail naquela loja.
 * - Resposta igual para e-mail com e sem pedido (não revela quem comprou).
 */
const JANELA_MS = 10 * 60_000;
const SESSAO_MS = 30 * 86_400_000;
export const COOKIE_CLIENTE = "nl-cliente";

function segredo(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET não definido.");
  return "dev-only-secret-change-me-please";
}
const hmac = (v: string) => createHmac("sha256", segredo()).update(v).digest();
const normal = (email: string) => email.trim().toLowerCase();
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 160;

/** Código de 6 dígitos da janela (puro; testável). */
export function codigoDaJanela(storeId: string, email: string, janela: number): string {
  const n = hmac(`codigo|${storeId}|${normal(email)}|${janela}`).readUInt32BE(0) % 1_000_000;
  return String(n).padStart(6, "0");
}
const janelaDe = (agora: Date) => Math.floor(agora.getTime() / JANELA_MS);

async function lojaAtiva(db: Database, slug: string) {
  const [l] = await db.select({ id: stores.id, name: stores.name, slug: stores.slug, status: stores.status, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.slug, slug)).limit(1);
  if (!l || l.status !== "ACTIVE") throw new NotFoundError("Loja não encontrada.");
  return l;
}

/** Manda o código por e-mail. */
export async function pedirCodigo(db: Database, slug: string, emailRaw: string, baseUrl: string, agora = new Date()) {
  const email = normal(emailRaw);
  if (!emailValido(email)) throw new DomainError("EMAIL_INVALIDO", "Confira o e-mail.");
  const loja = await lojaAtiva(db, slug);
  const codigo = codigoDaJanela(loja.id, email, janelaDe(agora));
  await sendEmail(db, {
    kind: "CLIENTE_CODIGO", to: email, brand: loja.brand ?? "NEXTLEVEL_COMMERCE",
    subject: `Seu código de acesso à ${loja.name}: ${codigo}`,
    text: `Use o código ${codigo} para entrar na sua conta da ${loja.name}. Ele vale por 10 minutos.\n\nSe não foi você, ignore este e-mail.`,
    cta: { label: "Abrir minha conta", url: `${baseUrl}/store/${loja.slug}/conta` },
    dedupeKey: `cliente-codigo:${loja.id}:${email}:${janelaDe(agora)}`,
  });
  return { ok: true as const };
}

/** Confere o código (janela atual ou anterior) e devolve o valor do cookie da sessão. */
export async function entrarComCodigo(db: Database, slug: string, emailRaw: string, codigo: string, agora = new Date()): Promise<string> {
  const email = normal(emailRaw);
  const loja = await lojaAtiva(db, slug);
  const c = codigo.replace(/\D/g, "");
  const j = janelaDe(agora);
  const ok = [j, j - 1].some((x) => { const a = Buffer.from(codigoDaJanela(loja.id, email, x)); const b = Buffer.from(c.padStart(6, "0").slice(-6)); return c.length === 6 && timingSafeEqual(a, b); });
  if (!ok) throw new DomainError("CODIGO_INVALIDO", "Código inválido ou vencido. Peça um novo.");
  return assinarSessao({ s: loja.id, e: email, x: agora.getTime() + SESSAO_MS });
}

type Sessao = { s: string; e: string; x: number };
export function assinarSessao(p: Sessao): string {
  const corpo = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `v1.${corpo}.${hmac(`sessao|${corpo}`).toString("base64url")}`;
}
/** E-mail do cliente se o cookie é válido para esta loja; senão null. */
export function lerSessao(token: string | undefined, storeId: string, agora = new Date()): string | null {
  if (!token) return null;
  const [v, corpo, sig] = token.split(".");
  if (v !== "v1" || !corpo || !sig) return null;
  const esperado = hmac(`sessao|${corpo}`).toString("base64url");
  if (esperado.length !== sig.length || !timingSafeEqual(Buffer.from(esperado), Buffer.from(sig))) return null;
  try {
    const p = JSON.parse(Buffer.from(corpo, "base64url").toString()) as Sessao;
    return p.s === storeId && p.x > agora.getTime() ? p.e : null;
  } catch { return null; }
}

export type PedidoDaConta = Pick<TrackedOrder, "number" | "createdAt" | "totalCents" | "canceled" | "trackingCode" | "items"> & { etapa: string; id: string };
/** Pedidos do cliente naquela loja (mais recentes primeiro, até 30). */
export async function pedidosDoCliente(db: Database, storeId: string, email: string): Promise<PedidoDaConta[]> {
  const rows = await db.select().from(orders).where(and(eq(orders.storeId, storeId), sql`lower(${orders.customerEmail}) = ${normal(email)}`)).orderBy(desc(orders.createdAt)).limit(30);
  return Promise.all(rows.map(async (o) => {
    const t = await toTracked(db, o);
    return { id: o.id, number: t.number, createdAt: t.createdAt, totalCents: t.totalCents, canceled: t.canceled, trackingCode: t.trackingCode, items: t.items, etapa: t.canceled ? "Cancelado" : JOURNEY_LABEL[t.step].title };
  }));
}
