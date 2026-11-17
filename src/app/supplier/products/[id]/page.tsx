import { eq } from "drizzle-orm";
import { ownedBy, toOwner, type OwnerRef } from "@/lib/domain/independent";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { categories, stores } from "@/db/schema";
import { storeUrl } from "@/lib/store-url";
import { painelDeAtacado } from "@/lib/domain/atacado";
import { Grades } from "@/app/merchant/atacado/painel-atacado";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/require-session";
import { getSupplierProduct } from "@/lib/queries/supplier";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { SIZE_GRIDS } from "@/lib/domain/size-grids";
import { DistributionForm } from "./product-forms";
import { ProductEditor } from "./product-editor";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOVEMENT: Record<string, string> = { IN: "Entrada", RESERVE: "Reserva", RELEASE: "Liberação", SALE: "Venda", ADJUSTMENT: "Ajuste" };

export default async function SupplierProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  const { id } = await params;
  return <ProductBody supplierId={session.supplier!.id} id={id} />;
}

/** Corpo compartilhado com a conta simples do lojista (`/merchant/catalogo/[id]`): sem rede, sem distribuição. */
export async function ProductBody({ supplierId, id, base = "/supplier/products", independent = false, commerce = false }: { supplierId: OwnerRef; id: string; base?: string; independent?: boolean; commerce?: boolean }) {
  const data = await getSupplierProduct(supplierId, id);
  if (!data) notFound();
  const { product, variants, packs, movements } = data;
  const db = await getDb();
  const owner = toOwner(supplierId);
  const categorias = (await db.select({ name: categories.name }).from(categories).where(ownedBy(categories, owner)).orderBy(categories.name)).map((c) => c.name);
  // Loja independente: endereço real da loja (prévia do Google e "Ver na loja") e grades de atacado editáveis aqui mesmo.
  const loja = owner.storeId ? await db.query.stores.findFirst({ where: eq(stores.id, owner.storeId) }) : null;
  const baseLoja = loja ? storeUrl(loja.slug, loja.offer, loja.customDomain, loja.domainStatus) : null;
  const hostDaLoja = baseLoja ? baseLoja.replace(/^https?:\/\//, "").replace(/^\//, "") : "loja-da-rede.com.br";
  const atacado = owner.storeId ? await painelDeAtacado(db, owner.storeId) : null;
  const atacadoDoProduto = atacado?.produtos.find((p) => p.productId === product.id) ?? null;

  return (
    <>
      <PageHeader backHref={base} title={product.name} badge={<StatusBadge value={product.status} dot />} description={`${product.sku} · ${data.category?.name ?? "Sem categoria"} · ${SIZE_GRIDS[product.sizeGrid].label}`} />
      <ProductEditor
        key={`${product.updatedAt}-${variants.map((v) => v.id).join()}`}
        produto={{ id: product.id, name: product.name, description: product.description, category: data.category?.name ?? "", sku: product.sku, slug: product.slug, images: product.images, costCents: product.costCents, suggestedPriceCents: product.suggestedPriceCents, minimumPriceCents: product.minimumPriceCents, status: product.status === "DELETED" ? "ARCHIVED" : product.status, sellsUnit: product.sellsUnit, sellsPack: product.sellsPack, seoTitle: product.seoTitle, seoDescription: product.seoDescription, sizeGrid: product.sizeGrid, weightG: product.weightG, lengthCm: product.lengthCm, widthCm: product.widthCm, heightCm: product.heightCm }}
        variacoes={variants.map((v) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, barcode: v.barcode, onHand: v.onHand, reserved: v.reserved }))}
        categorias={categorias} base={base} independent={independent} commerce={commerce}
        enderecoProduto={baseLoja ? `${baseLoja}/product/${product.slug}` : null} hostDaLoja={hostDaLoja}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0 space-y-6">
          <Tabs defaultValue="packs">
            <TabsList>
              <TabsTrigger value="packs">Grades de atacado</TabsTrigger>
              <TabsTrigger value="movements">Movimentações do estoque</TabsTrigger>
              {independent ? null : <TabsTrigger value="listings">Lojas que vendem</TabsTrigger>}
            </TabsList>
            <TabsContent value="packs">
              {atacado ? (
                <Card><CardContent className="pt-5">{atacadoDoProduto ? <Grades p={atacadoDoProduto} limites={atacado.limites} /> : <p className="text-sm text-muted-foreground">Ative o produto para montar grades de atacado (ex.: grade com 12 peças).</p>}</CardContent></Card>
              ) : packs.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Este produto é vendido apenas por unidade.</CardContent></Card>
              ) : packs.map((p) => (
                <Card key={p.id}>
                  <CardHeader><div><CardTitle>{p.name}</CardTitle><CardDescription>{p.totalQuantity} peças · distribuição configurável por tamanho</CardDescription></div><Badge tone="info">Atacado</Badge></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">{p.items.map((i) => <span key={i.variantId} className="rounded-md border border-border px-3 py-1.5 text-sm"><span className="font-medium">{i.size}</span> <span className="text-muted-foreground">× {i.quantity}</span></span>)}</div>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div><dt className="text-xs text-muted-foreground">Custo da grade</dt><dd className="font-medium">{formatBRL(p.costCents)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Preço sugerido</dt><dd className="font-medium">{formatBRL(p.suggestedPriceCents)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Preço mínimo</dt><dd className="font-medium">{formatBRL(p.minimumPriceCents)}</dd></div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="movements">
              <Card>
                <Table>
                  <THead><TR className="hover:bg-transparent"><TH>Tipo</TH><TH>Tam.</TH><TH className="text-right">Qtd</TH><TH>Referência</TH><TH className="text-right">Quando</TH></TR></THead>
                  <TBody>
                    {movements.map(({ m, size }) => (
                      <TR key={m.id}><TD><Badge tone={m.type === "IN" ? "success" : m.type === "SALE" ? "info" : m.type === "RELEASE" ? "neutral" : m.type === "RESERVE" ? "warning" : "outline"}>{MOVEMENT[m.type]}</Badge></TD><TD>{size}</TD><TD className="text-right tabular-nums">{m.type === "SALE" || (m.type === "ADJUSTMENT" && m.quantity < 0) ? "−" : "+"}{Math.abs(m.quantity)}</TD><TD className="text-muted-foreground">{m.referenceType ?? "—"} {m.note ? `· ${m.note}` : ""}</TD><TD className="text-right text-muted-foreground">{formatDateTime(m.createdAt)}</TD></TR>
                    ))}
                  </TBody>
                </Table>
              </Card>
            </TabsContent>
            {independent ? null : <TabsContent value="listings">
              <Card>
                <Table>
                  <THead><TR className="hover:bg-transparent"><TH>Loja</TH><TH className="text-right">Preço na loja</TH><TH className="text-right">Grade</TH><TH>Status</TH></TR></THead>
                  <TBody>
                    {data.networkStores.map((s) => {
                      const l = data.listings.find((x) => x.storeId === s.id);
                      const allowed = product.distribution === "ALL_NETWORK" || data.accessStoreIds.includes(s.id);
                      return <TR key={s.id}><TD className="font-medium">{s.name}</TD><TD className="text-right tabular-nums">{l ? formatBRL(l.priceCents) : "—"}</TD><TD className="text-right tabular-nums">{l?.packPriceCents ? formatBRL(l.packPriceCents) : "—"}</TD><TD>{!allowed ? <Badge tone="outline">Sem acesso</Badge> : l?.active ? <Badge tone="success" dot>Vendendo</Badge> : <Badge tone="neutral">Não ativado</Badge>}</TD></TR>;
                    })}
                  </TBody>
                </Table>
              </Card>
            </TabsContent>}
          </Tabs>
        </div>

        <div className="min-w-0 space-y-6">
          {independent ? null : <Card>
            <CardHeader><div><CardTitle>Distribuição</CardTitle><CardDescription>Quais lojas podem vender este produto.</CardDescription></div></CardHeader>
            <CardContent><DistributionForm productId={product.id} distribution={product.distribution} stores={data.networkStores} selected={data.accessStoreIds} /></CardContent>
          </Card>}
        </div>
      </div>
    </>
  );
}
