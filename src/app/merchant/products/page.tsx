import { AlertTriangle, Package, PackageCheck, Power } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { requireRole } from "@/lib/require-session";
import { getMerchantProducts } from "@/lib/queries/merchant";
import { getMinActivationStock } from "@/lib/domain/catalog";
import { activationCheck } from "@/lib/domain/size-grids";
import { getDb } from "@/db/client";
import { MerchantProductList } from "./product-list";

export default async function MerchantProductsPage() {
  const session = await requireRole("STORE_OWNER");
  const catalog = await getMerchantProducts(session.store!.id);
  const db = await getDb();
  const minBySupplier = new Map<string, number>();
  for (const c of catalog) if (!minBySupplier.has(c.product.supplierId)) minBySupplier.set(c.product.supplierId, await getMinActivationStock(db, c.product.supplierId));
  const items = catalog.map((c) => ({
    shortSizes: (() => { const chk = activationCheck(c.variants.map((v) => ({ size: v.size, available: v.level.available })), minBySupplier.get(c.product.supplierId) ?? 4); return chk.ok ? null : { min: chk.min, sizes: chk.short.map((x) => x.size) }; })(),
    productId: c.product.id, name: c.product.name, sku: c.product.sku, images: c.product.images, description: c.product.description,
    costCents: c.product.costCents, suggestedPriceCents: c.product.suggestedPriceCents, minimumPriceCents: c.product.minimumPriceCents,
    sellsPack: c.product.sellsPack, packSuggested: c.packs[0]?.suggestedPriceCents ?? null, packMinimum: c.packs[0]?.minimumPriceCents ?? null,
    active: c.storeProduct.active, priceCents: c.storeProduct.priceCents, packPriceCents: c.storeProduct.packPriceCents,
    available: c.variants.reduce((s, v) => s + v.level.available, 0), sizes: c.variants.map((v) => `${v.size}:${v.level.available}`).join(" "),
  }));
  const active = items.filter((i) => i.active).length;
  const inactive = items.length - active;
  const blockedByStock = items.filter((i) => !i.active && !!i.shortSizes).length;
  const low = items.filter((i) => i.available < 5).length;
  const queue: ActionQueueItem[] = [
    blockedByStock > 0 ? { id: "blocked", title: "Produtos que ainda não podem ser ativados", description: "A grade mínima de estoque não foi atingida em alguns tamanhos.", count: blockedByStock, tone: "warning", icon: AlertTriangle, href: "/merchant/products", actionLabel: "Ver produtos" } : null,
    inactive - blockedByStock > 0 ? { id: "inactive", title: "Produtos disponíveis, mas fora da sua loja", description: "Você pode ativar esses itens e definir o preço de venda.", count: inactive - blockedByStock, tone: "info", icon: Power, href: "/merchant/products", actionLabel: "Ativar produtos" } : null,
    low > 0 ? { id: "low", title: "Produtos com pouca disponibilidade", description: "Estoque baixo pode interromper vendas em breve.", count: low, tone: "warning", icon: Package, href: "/merchant/products", actionLabel: "Acompanhar" } : null,
  ].filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title="Produtos" description="Veja o que está vendendo, o que pode ser ativado e onde o estoque da Central limita sua oferta." />
      <OperationalPulse className="mb-5" items={[
        { label: "Vendendo agora", value: active, icon: PackageCheck, tone: active ? "success" : "neutral", hint: "ativos na sua loja" },
        { label: "Fora da loja", value: inactive, icon: Power, tone: inactive ? "info" : "success", hint: "ainda não ativos" },
        { label: "Bloqueados por estoque", value: blockedByStock, icon: AlertTriangle, tone: blockedByStock ? "warning" : "success", hint: "grade mínima incompleta" },
        { label: "Baixa disponibilidade", value: low, icon: Package, tone: low ? "warning" : "success", hint: "menos de 5 unidades" },
      ]} />
      <ActionQueue className="mb-6" items={queue} title="O que revisar no catálogo" description="Prioridades que afetam o que sua loja consegue vender." emptyMessage="Seu catálogo está pronto para vender." />
      <MerchantProductList items={items} />
    </>
  );
}
