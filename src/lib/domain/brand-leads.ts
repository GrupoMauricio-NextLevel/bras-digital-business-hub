import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { brandLeads } from "@/db/schema";
import { newId } from "@/lib/ids";
import { BRAND_CODES, type BrandCode } from "@/lib/brand";
import { emails, sendEmail } from "@/lib/email";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

export const leadSchema = z.object({
  brand: z.enum(BRAND_CODES),
  name: z.string().trim().min(3, "Informe o seu nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp inválido (com DDD)"),
  storeName: z.string().trim().max(120).optional(),
  segment: z.string().trim().max(60).optional(),
  message: z.string().trim().max(600).optional(),
  affiliateRef: z.string().trim().max(60).optional(),
  /** Caminho escolhido na entrada (NB1, D306): site da empresa, loja virtual ou ainda não sabe. Vai para `needs` como "caminho:<valor>". */
  caminho: z.enum(["site", "loja", "indeciso"]).optional(),
  /** "Como você conheceu a NextLevel?" (D303): opcional; guardado na origem do contato, não no pedido. */
  conheceuPor: z.string().max(20).optional(),
});

/** Marca o caminho nas necessidades do interessado, trocando a escolha anterior (um caminho só). */
export function comCaminho(needs: string[], caminho: "site" | "loja" | "indeciso" | undefined): string[] {
  if (!caminho) return needs;
  return [...needs.filter((n) => !n.startsWith("caminho:")), `caminho:${caminho}`];
}

/** Caminho que o interessado escolheu (para o Comercial e para criar a conta no formato certo). */
export const caminhoDoInteressado = (needs: readonly string[]): "site" | "loja" | "indeciso" | null => {
  const v = needs.find((n) => n.startsWith("caminho:"))?.slice(8);
  return v === "site" || v === "loja" || v === "indeciso" ? v : null;
};

/** Interessado numa marca (lista de espera e implantação assistida). Repetir o mesmo e-mail na marca atualiza o pedido em vez de duplicar. */
export async function createBrandLead(db: Database, raw: z.input<typeof leadSchema>) {
  const input = leadSchema.parse(raw);
  const existing = await db.query.brandLeads.findFirst({ where: and(eq(brandLeads.brand, input.brand), eq(brandLeads.email, input.email)) });
  if (existing) {
    await db.update(brandLeads).set({ name: input.name, phone: input.phone, storeName: input.storeName ?? existing.storeName, segment: input.segment ?? existing.segment, message: input.message ?? existing.message, needs: comCaminho(existing.needs, input.caminho), updatedAt: new Date().toISOString() }).where(eq(brandLeads.id, existing.id));
    return { id: existing.id, created: false };
  }
  const id = newId("bld");
  await db.insert(brandLeads).values({ id, brand: input.brand, name: input.name, email: input.email, phone: input.phone, storeName: input.storeName || null, segment: input.segment || null, message: input.message || null, affiliateRef: input.affiliateRef || null, needs: comCaminho([], input.caminho) });
  await sendEmail(db, { kind: "LEAD_RECEIVED", to: input.email, brand: input.brand, dedupeKey: `LEAD:${id}`, ...emails.leadReceived(input.name.split(" ")[0]!) });
  return { id, created: true };
}

export const leadSaidaSchema = z.object({
  brand: z.enum(BRAND_CODES),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  consent: z.literal(true, { error: "Marque a caixa para concordar em receber comunicações." }),
  pagina: z.string().trim().max(200).default("/"),
  affiliateRef: z.string().trim().max(60).optional(),
});

/**
 * Janela de resgate na saída (D280): o visitante que ia embora deixa só o e-mail, com o consentimento marcado. Vira um
 * interessado (tipo SAIDA) no CRM do Master e recebe por e-mail o caminho para criar a loja. O mesmo e-mail não duplica.
 */
export async function capturarLeadSaida(db: Database, raw: z.input<typeof leadSaidaSchema>, cadastroUrl: string, now = new Date()) {
  const input = leadSaidaSchema.parse(raw);
  const existing = await db.query.brandLeads.findFirst({ where: and(eq(brandLeads.brand, input.brand), eq(brandLeads.email, input.email)) });
  const attribution = { origem: "janela-saida", pagina: input.pagina, consentimento: now.toISOString() };
  if (existing) {
    await db.update(brandLeads).set({ attribution: { ...existing.attribution, ...attribution }, updatedAt: now.toISOString() }).where(eq(brandLeads.id, existing.id));
    return { id: existing.id, created: false };
  }
  const id = newId("bld");
  await db.insert(brandLeads).values({ id, brand: input.brand, kind: "SAIDA", name: "Visitante do site", email: input.email, phone: "", affiliateRef: input.affiliateRef || null, attribution });
  await sendEmail(db, {
    kind: "LEAD_SAIDA", to: input.email, brand: input.brand, dedupeKey: `LEAD_SAIDA:${id}`,
    subject: "Sua loja virtual pode ficar pronta hoje",
    text: "Olá! Você passou pelo site da {marca} e pediu para receber o caminho para criar a sua loja.\n\nÉ simples: crie a conta, escolha um tema, cadastre os produtos e conecte o Mercado Pago para receber as vendas direto na sua conta. Os preços e as condições de cada plano aparecem antes de qualquer pagamento.\n\nSe preferir ajuda, responda este e-mail que a equipe NextLevel fala com você.\n\n— Equipe NextLevel",
    cta: { label: "Criar minha loja", url: cadastroUrl },
  });
  return { id, created: true };
}

const need = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel."); };

export async function listBrandLeads(db: Database, actor: Actor, opts: { brand?: BrandCode } = {}) {
  need(actor);
  return db.select().from(brandLeads).where(opts.brand ? eq(brandLeads.brand, opts.brand) : undefined).orderBy(desc(brandLeads.createdAt));
}

export async function updateBrandLead(db: Database, actor: Actor, id: string, patch: { status?: "NEW" | "CONTACTED" | "WON" | "LOST"; notes?: string }) {
  need(actor);
  const l = await db.query.brandLeads.findFirst({ where: eq(brandLeads.id, id) });
  if (!l) throw new NotFoundError("Interessado não encontrado.");
  if (patch.status && !["NEW", "CONTACTED", "WON", "LOST"].includes(patch.status)) throw new DomainError("STATUS", "Situação inválida.");
  await db.update(brandLeads).set({ ...(patch.status ? { status: patch.status } : {}), ...(patch.notes !== undefined ? { notes: patch.notes.slice(0, 1000) } : {}), updatedAt: new Date().toISOString() }).where(eq(brandLeads.id, id));
}
