import type { OwnerRef } from "@/lib/domain/independent";
import Link from "next/link";
import { AlertTriangle, Archive, Package, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { requireRole } from "@/lib/require-session";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { buttonVariants } from "@/components/ui/button";
import { ProductsList, type ProductRow } from "./products-list";
import { produtosQuePrecisamDeVoce } from "@/lib/domain/produtos-agora";
import { ProdutosAgora } from "@/components/commerce/produtos-agora";

export default async function SupplierProducts() {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <ProductsBody supplierId={session.supplier!.id} />;
}

/** Corpo compartilhado com a conta simples do lojista (`/merchant/catalogo`). */
export async function ProductsBody({ supplierId, base = "/supplier/products", independent = false, commerce = false, ver }: { supplierId: OwnerRef; base?: string; independent?: boolean; commerce?: boolean; ver?: string }) {
  const { items, categories } = await getSupplierProducts(supplierId);
  const rows: ProductRow[] = items.map((r) => ({ id: r.product.id, name: r.product.name, sku: r.product.sku, category: r.categoryName, images: r.product.images, sellsUnit: r.product.sellsUnit, sellsPack: r.product.sellsPack, distribution: r.product.distribution, costCents: r.product.costCents, suggestedPriceCents: r.product.suggestedPriceCents, status: r.product.status, available: r.available, onHand: r.onHand }));
  const active = rows.filter((r) => r.status === "ACTIVE").length;
  const draft = rows.filter((r) => r.status === "DRAFT").length;
  const low = rows.filter((r) => r.available > 0 && r.available < 10).length;
  const out = rows.filter((r) => r.available === 0).length;
  // E-commerce (D211): lista produto a produto com o botão que resolve, no lugar da fila só com contagens.
  const urgentes = commerce ? produtosQuePrecisamDeVoce(rows) : [];
  const filtrando = commerce && ver === "atencao";
  const lista = filtrando ? rows.filter((r) => urgentes.some((u) => u.id === r.id)) : rows;
  const queue = ([
    out > 0 ? { id: "out", title: "Produtos sem estoque disponível", description: commerce ? "Esses itens não podem ser vendidos até que o estoque seja reposto." : "Esses itens podem interromper vendas ou ativações na rede.", count: out, tone: "danger", icon: AlertTriangle, href: base, actionLabel: "Revisar catálogo" } : null,
    low > 0 ? { id: "low", title: "Produtos com estoque baixo", description: "Disponibilidade abaixo de 10 unidades.", count: low, tone: "warning", icon: Package, href: base, actionLabel: "Acompanhar" } : null,
    draft > 0 ? { id: "draft", title: "Produtos ainda em rascunho", description: "Revise cadastro, preço e estoque antes de ativar.", count: draft, tone: "neutral", icon: Archive, href: base, actionLabel: "Revisar" } : null,
  ] as (ActionQueueItem | null)[]).filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title={commerce ? "Produtos" : independent ? "Meus produtos" : "Produtos"} description={commerce ? "Seu catálogo de e-commerce: produtos, variantes, preços, estoque e publicação." : independent ? "Cadastre o que você vende, com fotos, preço e estoque." : "Catálogo central. Cadastre uma vez e distribua para a rede."} actions={<><Link href={`${base}/categorias`} className={buttonVariants({ variant: "ghost" })}>Categorias</Link><Link href={`${base}/import`} className={buttonVariants({ variant: "secondary" })}><Upload /> Importar planilha</Link><Link href={`${base}/new`} className={buttonVariants()}><Plus /> Novo produto</Link></>} />
      {commerce ? <ProdutosAgora itens={urgentes} base={base} filtrando={filtrando} /> : null}
      <OperationalPulse className="mb-5" items={[
        { label: "Produtos ativos", value: active, icon: Package, tone: active ? "success" : "neutral", hint: "disponíveis para operação" },
        { label: "Estoque baixo", value: low, icon: AlertTriangle, tone: low ? "warning" : "success", hint: "menos de 10 disponíveis" },
        { label: "Sem estoque", value: out, icon: AlertTriangle, tone: out ? "danger" : "success", hint: out ? "exigem atenção" : "nenhum zerado" },
        { label: "Rascunhos", value: draft, icon: Archive, tone: draft ? "neutral" : "success", hint: "ainda não ativos" },
      ]} />
      {commerce ? null : <ActionQueue className="mb-6" items={queue} title="Atenção do catálogo" description="Problemas que podem afetar venda e distribuição." emptyMessage="Catálogo sem pendências críticas agora." />}
      <ProductsList rows={lista} categories={categories.map((c) => c.name)} base={base} independent={independent} />
    </>
  );
}
