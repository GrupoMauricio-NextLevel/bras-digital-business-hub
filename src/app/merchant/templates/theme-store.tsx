"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Eye, Monitor, Palette, Smartphone, Tablet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InvoicePay } from "@/components/finance/invoice-pay";
import { ThemeMock } from "@/components/portal/theme-showcase";
import { buyThemeAction, exitTryThemeAction, installThemeAction, tryThemeAction } from "@/app/actions/theme";
import type { ThemeCard } from "@/lib/themes/install";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

const DEVICES = [{ key: "desktop", label: "Computador", icon: Monitor, px: null }, { key: "tablet", label: "Tablet", icon: Tablet, px: 768 }, { key: "mobile", label: "Celular", icon: Smartphone, px: 390 }] as const;
type Mock = "starter" | "arena" | "editorial" | "signature";

/** Vitrine de temas: ver com os produtos da loja, comprar por Pix e instalar com 1 clique. */
export function ThemeStore({ cards, slug, demo }: { cards: ThemeCard[]; slug: string; demo: boolean }) {
  const router = useRouter();
  const [preview, setPreview] = React.useState<ThemeCard | null>(null);
  const [confirm, setConfirm] = React.useState<ThemeCard | null>(null);
  const [device, setDevice] = React.useState<(typeof DEVICES)[number]["key"]>("desktop");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [invoices, setInvoices] = React.useState<Record<string, string>>({});
  const dev = DEVICES.find((d) => d.key === device)!;

  const openPreview = async (c: ThemeCard) => { setBusy(`try-${c.key}`); const r = await tryThemeAction(c.key); setBusy(null); if (!r.ok) return toast.error(r.error); setPreview(c); };
  const closePreview = async () => { setPreview(null); await exitTryThemeAction(); };
  const buy = async (c: ThemeCard) => { setBusy(`buy-${c.key}`); const r = await buyThemeAction(c.key); setBusy(null); if (!r.ok) return toast.error(r.error); setInvoices((x) => ({ ...x, [c.key]: r.data.invoiceId })); router.refresh(); };
  const install = async (c: ThemeCard) => {
    setBusy(`install-${c.key}`); const r = await installThemeAction(c.key); setBusy(null);
    if (!r.ok) return toast.error(r.error);
    setConfirm(null); setPreview(null); toast.success(`Tema ${r.data.name} instalado. Sua loja já usa o novo visual.`, { action: { label: "Editar no editor", onClick: () => router.push("/theme-editor") } }); router.refresh();
  };

  const action = (c: ThemeCard, size: "sm" | "md" = "md") => {
    const inv = invoices[c.key] ?? c.openInvoiceId;
    if (c.active) return <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success-soft px-3 text-sm font-medium text-success"><Check className="size-4" aria-hidden /> Tema ativo</span>;
    if (c.owned) return <Button size={size} onClick={() => setConfirm(c)} loading={busy === `install-${c.key}`}>Instalar com 1 clique</Button>;
    if (inv) return <InvoicePay invoiceId={inv} label={`Pagar ${formatBRL(c.priceCents)} por Pix`} demo={demo} />;
    return <Button size={size} onClick={() => buy(c)} loading={busy === `buy-${c.key}`}>Comprar por {formatBRL(c.priceCents)}</Button>;
  };

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Temas">
        {cards.map((c) => (
          <li key={c.key}>
            <Card className={cn("flex h-full flex-col overflow-hidden", c.active && "ring-2 ring-accent")}>
              <div className="relative border-b border-border bg-neutral-100 p-3" aria-hidden><div className="pointer-events-none overflow-hidden rounded-md border border-neutral-200 shadow-sm"><ThemeMock k={c.key as Mock} /></div></div>
              <CardContent className="flex flex-1 flex-col gap-3 pt-4">
                <div className="flex items-start justify-between gap-2"><div><h3 className="text-base font-semibold">{c.name}</h3><p className="text-xs text-muted-foreground">{c.tagline}</p></div><div className="text-right"><div className="text-lg font-bold tabular-nums">{c.priceCents === 0 ? "Grátis" : formatBRL(c.priceCents)}</div>{c.priceCents > 0 ? <div className="text-[11px] text-muted-foreground">licença permanente</div> : null}</div></div>
                <div className="flex flex-wrap gap-1.5">{c.active ? <Badge tone="success" dot>Ativo</Badge> : null}{c.owned && c.priceCents > 0 ? <Badge tone="info">Comprado</Badge> : null}</div>
                <ul className="flex-1 space-y-1.5 text-sm">{c.features.slice(0, 4).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden /><span>{f}</span></li>)}</ul>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {action(c)}
                  <Button variant="ghost" size="md" onClick={() => openPreview(c)} loading={busy === `try-${c.key}`}><Eye aria-hidden /> Ver com meus produtos</Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">Quer ajustar cores, fontes e seções? <Link href="/theme-editor" className="inline-flex items-center gap-1 font-medium text-accent-foreground underline"><Palette className="size-3.5" aria-hidden /> Abrir o editor do tema</Link></p>

      <Dialog open={preview !== null} onOpenChange={(o) => { if (!o) void closePreview(); }}>
        {preview ? (
          <DialogContent title={`Tema ${preview.name} com os seus produtos`} description="É só uma prévia: nada foi instalado e o público continua vendo o seu tema atual." className="flex h-[88vh] max-w-6xl flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div role="radiogroup" aria-label="Tamanho da prévia" className="flex gap-0.5 rounded-lg bg-surface-muted p-0.5">
                {DEVICES.map((d) => { const Icon = d.icon; return <button key={d.key} type="button" role="radio" aria-checked={device === d.key} onClick={() => setDevice(d.key)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium", device === d.key ? "bg-surface shadow-sm" : "text-muted-foreground")}><Icon className="size-4" aria-hidden />{d.label}</button>; })}
              </div>
              <div className="flex items-center gap-2"><span className="text-sm font-semibold tabular-nums">{preview.priceCents === 0 ? "Grátis" : formatBRL(preview.priceCents)}</span>{action(preview, "sm")}</div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface-muted p-2">
              <div className="mx-auto h-full overflow-hidden rounded-md bg-white shadow-md transition-[width] duration-200" style={{ width: dev.px ? `${dev.px + 2}px` : "100%", maxWidth: "100%" }}>
                <iframe title={`Prévia do tema ${preview.name}`} src={`/store/${slug}`} className="h-full w-full bg-white" />
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={confirm !== null} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        {confirm ? (
          <DialogContent title={`Instalar o tema ${confirm.name}?`} description="A sua loja passa a usar este tema agora.">
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> Produtos, clientes, pedidos e o nome da loja continuam iguais.</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> O texto do destaque, o aviso e o rodapé que você já escreveu são aproveitados.</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> O visual de agora fica no histórico do editor e você pode voltar quando quiser.</li>
            </ul>
            <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Button><Button onClick={() => install(confirm)} loading={busy === `install-${confirm.key}`}>Instalar agora</Button></div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
