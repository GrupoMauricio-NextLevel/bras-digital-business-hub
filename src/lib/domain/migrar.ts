import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { storeRedirects, stores, storeWaitlist } from "@/db/schema";
import { encryptSecret } from "@/lib/security/crypto";
import { DomainError, ForbiddenError } from "./errors";
import { assertStoreAdmin, type Actor } from "./access";
import { storeModality } from "./order-policy";

/**
 * Migrar sem medo (W4, D187), só na loja independente da Commerce:
 * - redirecionamentos de endereço antigo (de outra plataforma) para o novo, sem perder o Google;
 * - Pixel da Meta (número público) e token da API de conversões (só criptografado);
 * - loja em lançamento com lista de espera.
 */
async function lojaIndependente(db: Database, actor: Actor): Promise<string> {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Só o dono da loja.");
  assertStoreAdmin(actor);
  if ((await storeModality(db, actor.storeId)) !== "INDEPENDENT") throw new DomainError("NOT_ALLOWED", "Disponível na loja da NextLevel Commerce.");
  return actor.storeId;
}

// ---------------------------------------------------------------------------
// Redirecionamentos
// ---------------------------------------------------------------------------
export const MAX_REDIRECIONAMENTOS = 5000;

/** Só o caminho: "/produto/x?id=1" → "/produto/x". Endereço completo vira o caminho dele. Vazio se for inválido. */
export function normalizarCaminho(entrada: string): string {
  let c = entrada.trim();
  if (!c) return "";
  if (/^https?:\/\//i.test(c)) { try { c = new URL(c).pathname; } catch { return ""; } }
  if (c.startsWith("//") || c.includes("\\")) return "";
  c = c.split(/[?#]/)[0]!;
  if (!c.startsWith("/")) c = `/${c}`;
  c = c.replace(/\/{2,}/g, "/");
  if (c.length > 1) c = c.replace(/\/$/, "");
  return c.length > 300 ? "" : c.toLowerCase();
}

export type LinhaRedirecionamento = { de: string; para: string };

/**
 * Lê a planilha "endereço antigo;endereço novo" (vírgula, ponto e vírgula ou tabulação). Recusa destino em outro site,
 * laço (A→B e B→A) e origem que é página da própria loja. Devolve as linhas boas e os erros por linha.
 */
export function lerRedirecionamentos(texto: string): { linhas: LinhaRedirecionamento[]; erros: string[] } {
  const linhas = new Map<string, string>(); const erros: string[] = [];
  const RESERVADOS = /^\/(cart|checkout|catalog|order|acompanhar|proposta|carrinho|api|_next)(\/|$)/;
  texto.split(/\r?\n/).forEach((bruta, i) => {
    const l = bruta.trim();
    if (!l || /^(de|origem|antigo|from)\b/i.test(l)) return;
    const [a, b] = l.split(/[;,\t]/).map((x) => x.trim());
    if (!a || !b) { erros.push(`Linha ${i + 1}: faltou o endereço novo.`); return; }
    if (/^https?:\/\//i.test(b) || b.startsWith("//")) { erros.push(`Linha ${i + 1}: o destino precisa ser um caminho da própria loja (ex.: /product/vestido).`); return; }
    const de = normalizarCaminho(a), para = normalizarCaminho(b);
    if (!de || !para) { erros.push(`Linha ${i + 1}: endereço inválido.`); return; }
    if (de === "/" || RESERVADOS.test(de)) { erros.push(`Linha ${i + 1}: ${de} é uma página da loja e não pode ser redirecionada.`); return; }
    if (de === para) { erros.push(`Linha ${i + 1}: origem e destino iguais.`); return; }
    linhas.set(de, para);
  });
  for (const [de, para] of linhas) if (linhas.get(para) === de) { erros.push(`Laço entre ${de} e ${para}: nenhum dos dois foi salvo.`); linhas.delete(de); linhas.delete(para); }
  if (linhas.size > MAX_REDIRECIONAMENTOS) erros.push(`Mais de ${MAX_REDIRECIONAMENTOS} linhas: só as primeiras foram consideradas.`);
  return { linhas: [...linhas].slice(0, MAX_REDIRECIONAMENTOS).map(([de, para]) => ({ de, para })), erros };
}

export async function importarRedirecionamentos(db: Database, actor: Actor, texto: string) {
  const storeId = await lojaIndependente(db, actor);
  const r = lerRedirecionamentos(texto);
  for (const l of r.linhas) {
    await db.insert(storeRedirects).values({ storeId, fromPath: l.de, toPath: l.para })
      .onConflictDoUpdate({ target: [storeRedirects.storeId, storeRedirects.fromPath], set: { toPath: l.para } });
  }
  return { salvos: r.linhas.length, erros: r.erros };
}

export async function listarRedirecionamentos(db: Database, actor: Actor) {
  const storeId = await lojaIndependente(db, actor);
  return db.select().from(storeRedirects).where(eq(storeRedirects.storeId, storeId)).orderBy(desc(storeRedirects.hits), storeRedirects.fromPath).limit(500);
}

export async function removerRedirecionamento(db: Database, actor: Actor, fromPath: string) {
  const storeId = await lojaIndependente(db, actor);
  await db.delete(storeRedirects).where(and(eq(storeRedirects.storeId, storeId), eq(storeRedirects.fromPath, fromPath)));
}

/** Para a página "não encontrada" da loja: existe redirecionamento? Conta o uso. */
export async function destinoDoRedirecionamento(db: Database, storeId: string, caminho: string): Promise<string | null> {
  const de = normalizarCaminho(caminho);
  if (!de) return null;
  const [r] = await db.update(storeRedirects).set({ hits: sql`${storeRedirects.hits} + 1` }).where(and(eq(storeRedirects.storeId, storeId), eq(storeRedirects.fromPath, de))).returning({ to: storeRedirects.toPath });
  return r?.to ?? null;
}

// ---------------------------------------------------------------------------
// Pixel da Meta
// ---------------------------------------------------------------------------
const pixelSchema = z.object({
  pixelId: z.string().trim().regex(/^\d{8,20}$|^$/, "O número do pixel tem só algarismos (de 8 a 20)."),
  token: z.string().trim().max(400).optional(),
});

/** Salva o número do pixel (vazio desliga) e, se vier, o token da API de conversões (criptografado; nunca volta para a tela). */
export async function salvarPixel(db: Database, actor: Actor, raw: z.input<typeof pixelSchema>) {
  const storeId = await lojaIndependente(db, actor);
  const v = pixelSchema.parse(raw);
  await db.update(stores).set({
    metaPixelId: v.pixelId || null,
    ...(v.pixelId ? (v.token ? { metaCapiTokenEnc: encryptSecret(v.token) } : {}) : { metaCapiTokenEnc: null }),
  }).where(eq(stores.id, storeId));
}

// ---------------------------------------------------------------------------
// Loja em lançamento
// ---------------------------------------------------------------------------
export async function definirLancamento(db: Database, actor: Actor, ligado: boolean) {
  const storeId = await lojaIndependente(db, actor);
  await db.update(stores).set({ launchMode: ligado }).where(eq(stores.id, storeId));
}

const esperaSchema = z.object({ email: z.string().trim().toLowerCase().email("E-mail inválido."), consent: z.literal(true, { message: "Marque que aceita receber o aviso." }) });

/** Quem quer ser avisado quando a loja abrir. Repetir o e-mail não duplica. */
export async function entrarNaListaDeEspera(db: Database, storeId: string, raw: unknown) {
  const v = esperaSchema.parse(raw);
  const st = await db.query.stores.findFirst({ where: eq(stores.id, storeId), columns: { launchMode: true } });
  if (!st?.launchMode) throw new DomainError("NOT_LAUNCHING", "Esta loja já está aberta.");
  await db.insert(storeWaitlist).values({ storeId, email: v.email }).onConflictDoNothing();
}

export async function listaDeEspera(db: Database, actor: Actor) {
  const storeId = await lojaIndependente(db, actor);
  return db.select().from(storeWaitlist).where(eq(storeWaitlist.storeId, storeId)).orderBy(desc(storeWaitlist.createdAt));
}
