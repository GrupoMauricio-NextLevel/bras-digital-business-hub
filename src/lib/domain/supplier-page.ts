import { and, asc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { products, supplierPages, suppliers, type SupplierPageFaq, type SupplierPageTestimonial } from "@/db/schema";
import { getPriceBook } from "./finance";
import { OFFER_KEYS, type OfferKey } from "@/lib/finance/price-book";

export type PublicSupplierPage = {
  slug: string; name: string; headline: string; subheadline: string; logoText: string; primaryColor: string; accentColor: string; whatsapp: string | null;
  benefits: string[]; faq: SupplierPageFaq[];
  logoUrl: string | null; heroUrl: string | null; testimonials: SupplierPageTestimonial[]; demoContent: boolean;
  products: { id: string; name: string; images: string[]; suggestedPriceCents: number }[];
  plans: { key: OfferKey; name: string; description: string; monthlyCents: number; setupCents: number }[];
};

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 3).toUpperCase();

/** Texto padrão quando o fornecedor ainda não personalizou a página. */
export function defaultContent(name: string) {
  return {
    headline: `Venda com a ${name}, sem estoque e sem burocracia`,
    subheadline: "Catálogo pronto, envio pela Central e loja online em minutos. Você escolhe os produtos, recarrega o saldo por Pix e vende.",
    benefits: ["Catálogo pronto com fotos e tamanhos", "Envio direto da Central: você só anexa a etiqueta", "Loja online com pagamento por Pix", "Recarga de saldo por Pix", "Academy para ir do zero à primeira venda"],
    faq: [
      { q: "Preciso ter estoque?", a: "Não. O estoque fica na Central e o custo de cada pedido é debitado do seu saldo." },
      { q: "Como recebo dos meus clientes?", a: "Por Pix, direto na sua conta do Mercado Pago." },
      { q: "Posso testar antes de assinar?", a: "Sim: peça o seu cupom e teste por 7 dias sem cartão." },
    ] as SupplierPageFaq[],
  };
}

/**
 * Dados públicos da página de vendas do fornecedor. Nunca inclui custo, estoque, contrato nem qualquer dado de cliente.
 * Fornecedores suspensos ou encerrados não têm página.
 */
export async function getPublicSupplierPage(db: Database, slug: string): Promise<PublicSupplierPage | null> {
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.slug, slug) });
  if (!supplier || supplier.status === "SUSPENDED" || supplier.status === "CLOSED") return null;
  const row = await db.query.supplierPages.findFirst({ where: eq(supplierPages.supplierId, supplier.id) });
  if (row && !row.published) return null;
  const d = defaultContent(supplier.name);
  const list = await db.select().from(products).where(and(eq(products.supplierId, supplier.id), eq(products.status, "ACTIVE"), eq(products.distribution, "ALL_NETWORK"))).orderBy(asc(products.name)).limit(8);
  const book = await getPriceBook(db);
  return {
    slug: supplier.slug, name: supplier.name,
    headline: row?.headline ?? d.headline, subheadline: row?.subheadline ?? d.subheadline,
    logoText: row?.logoText ?? initials(supplier.name), primaryColor: row?.primaryColor ?? "#0f172a", accentColor: row?.accentColor ?? "#16a34a", whatsapp: row?.whatsapp ?? null,
    benefits: row?.benefits?.length ? row.benefits : d.benefits, faq: row?.faq?.length ? row.faq : d.faq,
    logoUrl: row?.logoUrl ?? null, heroUrl: row?.heroUrl ?? null, testimonials: row?.testimonials ?? [], demoContent: row?.demoContent ?? false,
    products: list.map((p) => ({ id: p.id, name: p.name, images: p.images, suggestedPriceCents: p.suggestedPriceCents })),
    plans: OFFER_KEYS.map((k) => ({ key: k, name: book.offers[k].name, description: book.offers[k].description, monthlyCents: book.offers[k].monthlyCents, setupCents: book.offers[k].setupCents })),
  };
}
