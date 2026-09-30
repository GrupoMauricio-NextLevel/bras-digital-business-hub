import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/require-session";
import { getSupplierProduct } from "@/lib/queries/supplier";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { SIZE_GRIDS } from "@/lib/domain/size-grids";
import { StockActions, DistributionForm, ProductForm, ProductHeaderActions } from "./product-forms";
import { ImagesEditor } from "./images-editor";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOVEMENT: Record<string, string> = { IN: "Entrada", RESERVE: "Reserva", RELEASE: "Liberação", SALE: "Venda", ADJUSTMENT: "Ajuste" };

export default async function SupplierProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  const { id } = await params;
  const data = await getSupplierProduct(session.supplier!.id, id);
  if (!data) notFound();
  const { product, variants, packs, movements } = data;
  const onHand = variants.reduce((s, v) => s + v.onHand, 0);
  const reserved = variants.reduce((s, v) => s + v.reserved, 0);

  return (
    <>
      <PageHeader backHref="/supplier/products" title={product.name} badge={<StatusBadge value={product.status} dot />} description={`${product.sku} · ${data.category?.name ?? "Sem categoria"} · ${SIZE_GRIDS[product.sizeGrid].label}`} actions={<ProductHeaderActions productId={product.id} status={product.status} />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><div><CardTitle>Estoque central por tamanho</CardTitle><CardDescription>Disponível = físico − reservado. Pedidos reservam; a expedição baixa.</CardDescription></div><StockActions variants={variants.map((v) => ({ id: v.id, size: v.size }))} /></CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <THead><TR className="hover:bg-transparent"><TH>Tamanho</TH><TH>SKU</TH><TH className="text-right">Físico</TH><TH className="text-right">Reservado</TH><TH className="text-right">Disponível</TH></TR></THead>
                <TBody>
                  {variants.map((v) => (
                    <TR key={v.id}><TD className="font-medium">{v.size}</TD><TD className="text-muted-foreground">{v.sku}</TD><TD className="text-right tabular-nums">{v.onHand}</TD><TD className="text-right tabular-nums text-warning">{v.reserved}</TD><TD className="text-right font-medium tabular-nums">{v.available}</TD></TR>
                  ))}
                  <TR className="bg-surface-muted/50 font-medium hover:bg-surface-muted/50"><TD>Total</TD><TD /><TD className="text-right tabular-nums">{onHand}</TD><TD className="text-right tabular-nums">{reserved}</TD><TD className="text-right tabular-nums">{Math.max(0, onHand - reserved)}</TD></TR>
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Tabs defaultValue="packs">
            <TabsList>
              <TabsTrigger value="packs">Grades</TabsTrigger>
              <TabsTrigger value="movements">Movimentações</TabsTrigger>
              <TabsTrigger value="listings">Lojas que vendem</TabsTrigger>
            </TabsList>
            <TabsContent value="packs">
              {packs.length === 0 ? (
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
            <TabsContent value="listings">
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
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5"><div className="mb-4"><ImagesEditor productId={product.id} images={product.images} /></div>
              <ProductForm product={{ id: product.id, name: product.name, description: product.description, costCents: product.costCents, suggestedPriceCents: product.suggestedPriceCents, minimumPriceCents: product.minimumPriceCents, status: product.status, sellsUnit: product.sellsUnit, sellsPack: product.sellsPack, slug: product.slug, seoTitle: product.seoTitle, seoDescription: product.seoDescription, weightG: product.weightG, lengthCm: product.lengthCm, widthCm: product.widthCm, heightCm: product.heightCm }} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div><CardTitle>Distribuição</CardTitle><CardDescription>Quais lojas podem vender este produto.</CardDescription></div></CardHeader>
            <CardContent><DistributionForm productId={product.id} distribution={product.distribution} stores={data.networkStores} selected={data.accessStoreIds} /></CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
