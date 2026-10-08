"use client";
import * as React from "react";
import { toast } from "sonner";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { createBrasRequestAction } from "@/app/actions/bras";
import { formatBRL } from "@/lib/money";
import type { z } from "zod";
import type { brasRequestSchema } from "@/lib/domain/bras/catalogo";

type UF = z.input<typeof brasRequestSchema>["shipState"];

type Offer = { priceBoxCents: number; unitsPerBox: number; boxesAvailable: number | null };
type Ship = { carrier: string; shipName: string; shipAddress: string; shipCity: string; shipState: string; shipZip: string } | null;

export function RequestForm({ videoId, youtubeId, title, offer, ufs, initial }: { videoId: string; youtubeId: string; title: string; offer: Offer; ufs: string[]; initial: Ship }) {
  const max = offer.boxesAvailable ?? 9999;
  const [boxes, setBoxes] = React.useState(1);
  const [f, setF] = React.useState({ carrier: initial?.carrier ?? "", shipName: initial?.shipName ?? "", shipAddress: initial?.shipAddress ?? "", shipCity: initial?.shipCity ?? "", shipState: initial?.shipState ?? "SP", shipZip: initial?.shipZip ?? "", notes: "" });
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const clamp = (n: number) => Math.max(1, Math.min(max, Math.floor(n) || 1));
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    start(async () => { const r = await createBrasRequestAction({ videoId, boxes, ...f, shipState: f.shipState as UF }); if (r && !r.ok) { setError(r.error); toast.error(r.error); } });
  };
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_22rem]" aria-label={`Pedido de ${title}`}>
      <div className="space-y-6">
        <section aria-labelledby="pd-qtd" className="ds-card flex flex-wrap items-center gap-4 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do próprio YouTube */}
          <img src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`} alt="" width={120} height={68} className="h-[68px] w-[120px] rounded-md bg-surface-muted object-cover" />
          <div className="min-w-0 flex-1">
            <h2 id="pd-qtd" className="font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground"><span className="tabular-nums">{formatBRL(offer.priceBoxCents)}</span> a caixa · {offer.unitsPerBox} un. por caixa · importadora parceira verificada</p>
            <p className="text-sm text-muted-foreground">{offer.boxesAvailable == null ? "Caixas disponíveis: a equipe confirma" : `${offer.boxesAvailable} caixa(s) disponíve${offer.boxesAvailable === 1 ? "l" : "is"}`}</p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Quantidade de caixas">
            <Button type="button" variant="secondary" size="icon" aria-label="Uma caixa a menos" disabled={boxes <= 1} onClick={() => setBoxes((b) => clamp(b - 1))}><Minus className="size-4" aria-hidden /></Button>
            <label htmlFor="pd-boxes" className="sr-only">Caixas</label>
            <Input id="pd-boxes" type="number" inputMode="numeric" min={1} max={max} value={boxes} onChange={(e) => setBoxes(clamp(Number(e.target.value)))} className="w-20 text-center tabular-nums" />
            <Button type="button" variant="secondary" size="icon" aria-label="Uma caixa a mais" disabled={boxes >= max} onClick={() => setBoxes((b) => clamp(b + 1))}><Plus className="size-4" aria-hidden /></Button>
          </div>
        </section>
        <fieldset className="ds-card grid gap-3 p-4 sm:grid-cols-2">
          <legend className="px-1 text-base font-bold">Envio</legend>
          <p className="text-sm text-muted-foreground sm:col-span-2">A sua transportadora retira as caixas na importadora, no Brás. O nome e o endereço de retirada aparecem quando o pedido for confirmado. A importadora recebe só estes dados de envio.</p>
          <FormField label="Transportadora que vai retirar" htmlFor="pd-carrier" className="sm:col-span-2"><Input id="pd-carrier" required maxLength={80} value={f.carrier} onChange={(e) => set({ carrier: e.target.value })} placeholder="Ex.: Braspress, Jadlog, transportadora própria" /></FormField>
          <FormField label="Destinatário" htmlFor="pd-name" className="sm:col-span-2"><Input id="pd-name" required maxLength={80} autoComplete="name" value={f.shipName} onChange={(e) => set({ shipName: e.target.value })} /></FormField>
          <FormField label="Endereço de entrega" htmlFor="pd-addr" className="sm:col-span-2"><Input id="pd-addr" required maxLength={200} autoComplete="street-address" value={f.shipAddress} onChange={(e) => set({ shipAddress: e.target.value })} placeholder="Rua, número, complemento, bairro" /></FormField>
          <FormField label="Cidade" htmlFor="pd-city"><Input id="pd-city" required maxLength={80} autoComplete="address-level2" value={f.shipCity} onChange={(e) => set({ shipCity: e.target.value })} /></FormField>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <FormField label="UF" htmlFor="pd-uf"><Select id="pd-uf" value={f.shipState} onChange={(e) => set({ shipState: e.target.value })}>{ufs.map((u) => <option key={u} value={u}>{u}</option>)}</Select></FormField>
            <FormField label="CEP" htmlFor="pd-cep"><Input id="pd-cep" required inputMode="numeric" autoComplete="postal-code" maxLength={9} value={f.shipZip} onChange={(e) => set({ shipZip: e.target.value.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2") })} placeholder="00000-000" /></FormField>
          </div>
          <FormField label="Observação para a equipe (opcional)" htmlFor="pd-notes" className="sm:col-span-2"><Textarea id="pd-notes" rows={2} maxLength={300} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></FormField>
        </fieldset>
      </div>
      <aside className="ds-card h-fit space-y-3 p-4 lg:sticky lg:top-20" aria-label="Resumo do pedido">
        <h2 className="font-bold">Resumo</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-3"><dt>{boxes} caixa(s) × {formatBRL(offer.priceBoxCents)}</dt><dd className="tabular-nums">{formatBRL(offer.priceBoxCents * boxes)}</dd></div>
          <div className="flex justify-between gap-3 text-muted-foreground"><dt>Unidades</dt><dd className="tabular-nums">{offer.unitsPerBox * boxes}</dd></div>
          <div className="flex justify-between gap-3 text-muted-foreground"><dt>Frete</dt><dd>por sua transportadora</dd></div>
        </dl>
        <p className="flex justify-between border-t border-border pt-3 text-lg font-extrabold"><span>Total</span><span className="tabular-nums">{formatBRL(offer.priceBoxCents * boxes)}</span></p>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" loading={pending}>Enviar pedido</Button>
        <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" aria-hidden />Nada é cobrado agora. A equipe confirma as caixas e combina o pagamento com você antes da retirada.</p>
      </aside>
    </form>
  );
}
