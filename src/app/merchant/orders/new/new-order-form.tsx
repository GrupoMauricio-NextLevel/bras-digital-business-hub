"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { ProductArt } from "@/components/app/product-art";
import { formatBRL } from "@/lib/money";
import { createManualOrderAction } from "@/app/actions/orders";
import { createProposalAction } from "@/app/actions/proposals";
import { EmptyState } from "@/components/app/empty-state";

export type CatalogItem = {
  productId: string; name: string; images: string[]; priceCents: number; packPriceCents: number | null; sellsUnit: boolean; sellsPack: boolean;
  variants: { id: string; size: string; available: number }[];
  packs: { id: string; name: string; available: number; priceCents: number }[];
};
type Line = { key: string; productId: string; variantId?: string; packId?: string; quantity: number; label: string; unitPrice: number };

export function NewOrderForm({ items }: { items: CatalogItem[] }) {
  const router = useRouter();
  const [lines, setLines] = React.useState<Line[]>([]);
  const first = items[0];
  const [productId, setProductId] = React.useState(first?.productId ?? "");
  const [mode, setMode] = React.useState<"unit" | "pack">(first?.sellsUnit === false ? "pack" : "unit");
  const [choice, setChoice] = React.useState(first ? (first.sellsUnit ? first.variants[0]?.id ?? "" : first.packs[0]?.id ?? "") : "");
  const [qty, setQty] = React.useState(1);
  const [customer, setCustomer] = React.useState({ name: "", email: "", phone: "", marketingOptIn: false });
  const [channel, setChannel] = React.useState<"WHATSAPP" | "INSTAGRAM" | "MANUAL" | "ONLINE_STORE">("WHATSAPP");
  const [paid, setPaid] = React.useState(true);
  const [shippingCents, setShippingCents] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [discountCode, setDiscountCode] = React.useState("");
  const [pending, start] = React.useTransition();

  const product = items.find((i) => i.productId === productId);
  const selectProduct = (id: string) => {
    const p = items.find((i) => i.productId === id);
    setProductId(id);
    if (!p) return;
    const m = p.sellsUnit ? "unit" : "pack";
    setMode(m);
    setChoice(m === "unit" ? p.variants[0]?.id ?? "" : p.packs[0]?.id ?? "");
  };

  const add = () => {
    if (!product || !choice) return;
    if (mode === "unit") {
      const v = product.variants.find((x) => x.id === choice)!;
      if (v.available < qty) return toast.error(`Apenas ${v.available} disponíveis no tamanho ${v.size}.`);
      setLines([...lines, { key: crypto.randomUUID(), productId: product.productId, variantId: v.id, quantity: qty, label: `${product.name} · Tam. ${v.size}`, unitPrice: product.priceCents }]);
    } else {
      const p = product.packs.find((x) => x.id === choice)!;
      if (p.available < qty) return toast.error(`Apenas ${p.available} grade(s) disponíveis.`);
      setLines([...lines, { key: crypto.randomUUID(), productId: product.productId, packId: p.id, quantity: qty, label: `${product.name} · ${p.name}`, unitPrice: p.priceCents }]);
    }
    setQty(1);
  };

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const hasPack = lines.some((l) => l.packId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return toast.error("Adicione ao menos um item.");
    start(async () => {
      const r = await createManualOrderAction({
        channel, saleType: hasPack ? "WHOLESALE" : "RETAIL",
        customer: { name: customer.name, email: customer.email, phone: customer.phone || undefined, marketingOptIn: customer.marketingOptIn },
        shipping: { costCents: shippingCents },
        items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, packId: l.packId, quantity: l.quantity })),
        customerPaymentStatus: paid ? "PAID" : "PENDING", notes: notes || undefined, discountCode: discountCode.trim() || undefined,
      });
      if (r.ok) { toast.success(`Pedido #${r.data.number} criado`); router.push(`/merchant/orders/${r.data.orderId}`); } else toast.error(r.error);
    });
  };

  const propose = () => {
    if (lines.length === 0) return toast.error("Adicione ao menos um item.");
    if (!customer.name || !customer.email) return toast.error("Informe nome e e-mail do cliente para gerar a proposta.");
    start(async () => {
      const r = await createProposalAction({ customer: { name: customer.name, email: customer.email, phone: customer.phone || undefined }, items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, packId: l.packId, quantity: l.quantity })), validDays: 3 });
      if (r.ok) { toast.success("Proposta criada (válida por 3 dias)"); router.push("/merchant/orders/propostas"); } else toast.error(r.error);
    });
  };

  if (items.length === 0) return <EmptyState title="Nenhum produto ativo" description="Ative produtos do catálogo para criar pedidos." />;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <FormField label="Produto" htmlFor="product"><Select id="product" value={productId} onChange={(e) => selectProduct(e.target.value)}>{items.map((i) => <option key={i.productId} value={i.productId}>{i.name}</option>)}</Select></FormField>
              {product?.sellsUnit && product?.sellsPack ? (
                <FormField label="Tipo" htmlFor="mode"><Select id="mode" value={mode} onChange={(e) => { const m = e.target.value as "unit" | "pack"; setMode(m); setChoice(m === "unit" ? product.variants[0]?.id ?? "" : product.packs[0]?.id ?? ""); }}><option value="unit">Unidade</option><option value="pack">Grade</option></Select></FormField>
              ) : null}
              <FormField label={mode === "unit" ? "Tamanho" : "Grade"} htmlFor="choice">
                <Select id="choice" value={choice} onChange={(e) => setChoice(e.target.value)}>
                  {mode === "unit" ? product?.variants.map((v) => <option key={v.id} value={v.id} disabled={v.available === 0}>{v.size} ({v.available} disp.)</option>) : product?.packs.map((p) => <option key={p.id} value={p.id} disabled={p.available === 0}>{p.name} ({p.available} disp.)</option>)}
                </Select>
              </FormField>
              <div className="flex items-end gap-2">
                <FormField label="Qtd" htmlFor="qty" className="w-20"><Input id="qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} /></FormField>
                <Button type="button" variant="secondary" onClick={add}><Plus /> Adicionar</Button>
              </div>
            </div>
            {lines.length === 0 ? <p className="rounded-md border border-dashed border-border-strong p-4 text-center text-sm text-muted-foreground">Nenhum item adicionado.</p> : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {lines.map((l) => {
                  const p = items.find((i) => i.productId === l.productId)!;
                  return (
                    <li key={l.key} className="flex items-center gap-3 p-3 text-sm">
                      <ProductArt images={p.images} size="sm" />
                      <div className="min-w-0 flex-1"><div className="truncate font-medium">{l.label}</div><div className="text-xs text-muted-foreground">{l.quantity} × {formatBRL(l.unitPrice)}</div></div>
                      <div className="font-medium tabular-nums">{formatBRL(l.unitPrice * l.quantity)}</div>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setLines(lines.filter((x) => x.key !== l.key))} aria-label="Remover"><Trash2 /></Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nome" htmlFor="cname"><Input id="cname" required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></FormField>
            <FormField label="E-mail" htmlFor="cemail"><Input id="cemail" type="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></FormField>
            <FormField label="WhatsApp" htmlFor="cphone"><Input id="cphone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="11 99999-0000" /></FormField>
            <div className="flex items-end pb-2"><Switch checked={customer.marketingOptIn} onCheckedChange={(v) => setCustomer({ ...customer, marketingOptIn: v })} label="Cliente autorizou contato de marketing" /></div>
            <FormField label="Observações" htmlFor="notes" className="sm:col-span-2"><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: retirar na loja; presente" /></FormField>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Canal de venda" htmlFor="channel"><Select id="channel" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}><option value="WHATSAPP">WhatsApp</option><option value="INSTAGRAM">Instagram</option><option value="MANUAL">Manual / balcão</option></Select></FormField>
            <FormField label="Frete (R$)" htmlFor="ship"><Input id="ship" type="number" min={0} step="0.01" value={(shippingCents / 100).toFixed(2)} onChange={(e) => setShippingCents(Math.round(Number(e.target.value) * 100))} /></FormField>
            <Switch checked={paid} onCheckedChange={setPaid} label="Cliente já pagou" />
            <dl className="space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground"><dt>Subtotal</dt><dd className="tabular-nums">{formatBRL(subtotal)}</dd></div>
              <div className="flex justify-between text-muted-foreground"><dt>Frete</dt><dd className="tabular-nums">{formatBRL(shippingCents)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(subtotal + shippingCents)}</dd></div>
            </dl>
            <label className="block text-sm font-medium">Cupom de desconto (opcional)<Input className="mt-1" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Ex.: BEMVINDO10" maxLength={24} /></label>
            <Button type="submit" className="w-full" size="lg" loading={pending} disabled={lines.length === 0}>Criar pedido</Button>
            <Button type="button" variant="secondary" className="w-full" loading={pending} disabled={lines.length === 0} onClick={propose}>Gerar proposta (link para o cliente)</Button>
            <p className="text-xs text-muted-foreground">{hasPack ? "Venda de atacado (grade)." : "Venda de varejo."} O estoque será reservado na Central.</p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
