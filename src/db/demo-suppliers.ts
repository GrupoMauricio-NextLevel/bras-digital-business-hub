import { eq } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { createSupplier } from "@/lib/domain/provisioning";
import { createProduct } from "@/lib/domain/products";
import { newId } from "@/lib/ids";
import { receiveStock } from "@/lib/domain/inventory";

/**
 * Páginas dos dois primeiros fornecedores (Alpha Outfit e MantosShop) no ambiente de demonstração.
 * Todo o conteúdo é demonstrativo (`demoContent`): a página avisa "conteúdo a fornecer" até o dono enviar logos e fotos.
 * Logos: coloque os arquivos em `public/brand/suppliers/<slug>.png` e preencha `logoUrl` no cadastro da página.
 */
export const DEMO_SUPPLIERS = [
  {
    name: "Alpha Outfit", slug: "alpha-outfit", whatsapp: "5511976640355", contact: "Alex", city: "São Paulo", state: "SP", adminName: "Alex (Alpha Outfit)", adminEmail: "alpha@demo.superdrop.com.br",
    headline: "Alpha Outfit: moda esportiva pronta para a sua loja vender", subheadline: "Catálogo pronto, envio pela Central e loja online no ar no mesmo dia. Você escolhe, a Alpha Outfit separa e despacha.",
    primaryColor: "#0b1220", accentColor: "#facc15", coupon: "ALPHA7",
    products: [["Conjunto Treino Alpha Preto", "AO-TR-01", "#0b1220,#22c55e,#e5e7eb"], ["Camiseta Dry Alpha Verde", "AO-DR-02", "#166534,#ffffff,#22c55e"], ["Regata Performance Alpha", "AO-RG-03", "#111827,#f97316,#ffffff"], ["Short Running Alpha", "AO-SH-04", "#1e293b,#38bdf8,#ffffff"]] as const,
  },
  {
    name: "MantosShop", slug: "mantosshop", whatsapp: "5511958784061", contact: "Thiago", city: "Campinas", state: "SP", adminName: "Thiago (MantosShop)", adminEmail: "mantosshop@demo.superdrop.com.br",
    headline: "MantosShop: camisas de time para você revender sem estoque", subheadline: "Os modelos mais procurados, com fotos e grade de tamanhos prontas. Ative os produtos, recarregue por Pix e comece a vender.",
    primaryColor: "#111111", accentColor: "#d4a017", coupon: "MANTOSSHOP7",
    products: [["Camisa Tailandesa Verde e Amarela", "MS-TH-01", "#166534,#facc15,#ffffff"], ["Camisa Tailandesa Vermelha e Preta", "MS-TH-02", "#b91c1c,#111827,#ffffff"], ["Camisa Tailandesa Azul Marinho", "MS-TH-03", "#1e3a8a,#ffffff,#93c5fd"], ["Camisa Retrô Branca Clássica", "MS-RT-04", "#f8fafc,#166534,#facc15"]] as const,
  },
] as const;

export async function seedDemoSuppliers(db: Database): Promise<void> {
  for (const d of DEMO_SUPPLIERS) {
    const exists = await db.query.users.findFirst({ where: eq(s.users.email, d.adminEmail) });
    if (exists) continue;
    const { supplierId } = await createSupplier(db, { name: d.name, city: d.city, state: d.state, businessModel: "SUPERDROP", tier: "START", waiveFees: true, adminName: d.adminName, adminEmail: d.adminEmail });
    for (const [name, sku, art] of d.products) {
      const { productId } = await createProduct(db, supplierId, { name, sku, categoryName: "Destaques", images: [`art:${art}`], description: "Produto de demonstração. Fotos e detalhes reais serão enviados pelo fornecedor.", costCents: 8000, suggestedPriceCents: 12000, minimumPriceCents: 10000, sizes: ["P", "M", "G", "GG"].map((size) => ({ size, initialStock: 0, packQuantity: 0 })) });
      const vs = await db.select().from(s.productVariants).where(eq(s.productVariants.productId, productId));
      for (const v of vs) await receiveStock(db, v.id, 10, { referenceType: "SEED", note: "Estoque de demonstração" });
    }
    await db.insert(s.coupons).values({ id: newId("cpn"), code: d.coupon, supplierId, trialDays: 7 });
    await db.insert(s.supplierPages).values({
      supplierId, headline: d.headline, subheadline: d.subheadline, logoText: d.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(), logoUrl: `/brand/suppliers/${d.slug}.webp`, primaryColor: d.primaryColor, accentColor: d.accentColor, whatsapp: d.whatsapp,
      benefits: ["Catálogo pronto com fotos e tamanhos", "Envio direto da Central: você só anexa a etiqueta", "Loja online com pagamento por Pix", "Recarga de saldo por Pix, sem burocracia", "Academy para ir do zero à primeira venda", "Teste de 7 dias com o seu cupom"],
      faq: [
        { q: "Preciso ter estoque?", a: "Não. O estoque fica na Central e o custo de cada pedido é debitado do seu saldo." },
        { q: "Como recebo dos meus clientes?", a: "Por Pix, direto na sua conta do Mercado Pago. A plataforma não segura o seu dinheiro." },
        { q: "Como uso o cupom de teste?", a: `Use o cupom ${d.coupon} em superdrop.com.br/cadastro para testar tudo por 7 dias, sem cartão.` },
        { q: "Posso ter minha própria marca?", a: "Sim, nos planos com loja própria: domínio, logo e cores da sua marca." },
      ],
      testimonials: [
        { name: "Depoimento de lojista", role: "Conteúdo a fornecer", text: "Espaço reservado para o depoimento real de um lojista da rede." },
        { name: "Depoimento de lojista", role: "Conteúdo a fornecer", text: "Espaço reservado para o depoimento real de um lojista da rede." },
      ],
      demoContent: true,
    });
  }
}

/**
 * Produção: se o Master já cadastrou Alpha Outfit ou MantosShop, aplica logo, cores, WhatsApp e cupom da página.
 * Idempotente e sem criar fornecedor nem usuário. Não sobrescreve uma página já personalizada.
 */
export async function applyLaunchBranding(db: Database): Promise<string[]> {
  const log: string[] = [];
  for (const d of DEMO_SUPPLIERS) {
    const sup = await db.query.suppliers.findFirst({ where: eq(s.suppliers.slug, d.slug) });
    if (!sup) continue;
    if (!(await db.query.coupons.findFirst({ where: eq(s.coupons.code, d.coupon) }))) { await db.insert(s.coupons).values({ id: newId("cpn"), code: d.coupon, supplierId: sup.id, trialDays: 7 }); log.push(`cupom ${d.coupon} criado`); }
    if (await db.query.supplierPages.findFirst({ where: eq(s.supplierPages.supplierId, sup.id) })) continue;
    await db.insert(s.supplierPages).values({ supplierId: sup.id, headline: d.headline, subheadline: d.subheadline, logoText: d.name.slice(0, 2).toUpperCase(), logoUrl: `/brand/suppliers/${d.slug}.webp`, primaryColor: d.primaryColor, accentColor: d.accentColor, whatsapp: d.whatsapp, benefits: [], faq: [], testimonials: [], demoContent: false });
    log.push(`página de ${d.name} criada`);
  }
  return log;
}
