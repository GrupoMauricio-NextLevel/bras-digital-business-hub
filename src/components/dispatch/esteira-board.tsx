"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck, PackageCheck, Printer, ScanLine, Tag, Truck, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EsteiraOrder } from "@/lib/domain/operations";
import { advanceDispatchAction, createWaveAction, releaseClaimAction, scanOrderAction } from "@/app/actions/dispatch";

const COL_LABEL: Record<string, { title: string; hint: string; tone: string }> = {
  AWAITING_CENTRAL_PAYMENT: { title: "Aguardando recarga", hint: "Lojista sem saldo", tone: "border-t-warning" },
  AWAITING_LABEL: { title: "Aguardando etiqueta", hint: "Lojista não anexou o PDF", tone: "border-t-warning" },
  READY_TO_PICK: { title: "Pronto para separar", hint: "Saldo debitado e etiqueta anexada", tone: "border-t-info" },
  PICKING: { title: "Em separação", hint: "Alguém está separando", tone: "border-t-accent" },
  READY_TO_SHIP: { title: "Conferido", hint: "Pronto para despachar", tone: "border-t-success" },
  SHIPPED: { title: "Enviados hoje", hint: "Concluídos", tone: "border-t-border-strong" },
};

const age = (m: number) => (m >= 1440 ? `${Math.floor(m / 1440)}d` : m >= 60 ? `${Math.floor(m / 60)}h` : `${m} min`);

function OrderCard({ o, variant, selected, onSelect, busy, onAdvance, onRelease, highlight }: { o: EsteiraOrder; variant: "adm" | "dispatch"; selected: boolean; onSelect: (v: boolean) => void; busy: boolean; onAdvance: (n: "PICKING" | "READY_TO_SHIP" | "SHIPPED") => void; onRelease: () => void; highlight: boolean }) {
  const big = variant === "dispatch";
  const late = o.status !== "SHIPPED" && o.ageMinutes > 24 * 60;
  const claimedByOther = o.claim && !o.claim.mine;
  return (
    <article id={`ord-${o.id}`} className={cn("rounded-lg border bg-surface p-3 shadow-sm", highlight ? "border-accent ring-2 ring-accent" : "border-border", big && "p-4")} aria-label={`Pedido ${o.number}`}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={cn("font-display font-semibold tabular-nums", big ? "text-xl" : "text-base")}>#{o.number}</div>
          <div className="truncate text-xs text-muted-foreground">{o.storeName} · {o.customerName}{o.city ? ` · ${o.city}/${o.state}` : ""}</div>
        </div>
        {o.status === "READY_TO_PICK" && o.labelCount > 0 && !o.wave ? <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} className={cn("mt-1 accent-[var(--color-accent)]", big ? "size-6" : "size-4")} aria-label={`Selecionar pedido ${o.number}`} /> : null}
      </header>
      <ul className={cn("mt-2 space-y-0.5", big ? "text-base" : "text-sm")}>
        {o.items.slice(0, big ? 6 : 3).map((i, k) => <li key={k} className="flex justify-between gap-2"><span className="truncate">{i.productName} <span className="text-muted-foreground">· {i.label.split(" (")[0]}</span></span><span className="font-semibold tabular-nums">×{i.quantity}</span></li>)}
        {o.items.length > (big ? 6 : 3) ? <li className="text-xs text-muted-foreground">+{o.items.length - (big ? 6 : 3)} item(ns)</li> : null}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className={cn("rounded-full px-2 py-0.5 font-medium", late ? "bg-danger-soft text-danger" : "bg-surface-muted text-muted-foreground")}>{age(o.ageMinutes)}{late ? " · atrasado" : ""}</span>
        {o.labelCount > 0 ? <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5"><Tag className="size-3" aria-hidden />{o.labelCount} etiq.{o.labelPrinted ? " · impressa" : ""}</span> : null}
        {o.wave ? <span className="rounded-full bg-info-soft px-2 py-0.5 font-medium text-info">Onda {o.wave.number}</span> : null}
        {o.bucket === "NEXT" ? <span className="rounded-full bg-warning-soft px-2 py-0.5 font-medium text-warning">Sai no próximo corte</span> : null}
        {o.claim ? <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", o.claim.mine ? "bg-accent-soft text-accent" : "bg-warning-soft text-warning")}><User className="size-3" aria-hidden />{o.claim.mine ? "Você" : o.claim.userName}</span> : null}
      </div>
      <div className={cn("mt-3 flex flex-wrap gap-2", big && "[&_button]:min-h-14 [&_button]:flex-1 [&_button]:text-base")}>
        {o.status === "READY_TO_PICK" ? <Button size={big ? "lg" : "sm"} loading={busy} disabled={Boolean(claimedByOther)} onClick={() => onAdvance("PICKING")}><PackageCheck /> Iniciar separação</Button> : null}
        {o.status === "PICKING" ? (
          <>
            <Button size={big ? "lg" : "sm"} loading={busy} disabled={Boolean(claimedByOther) && variant === "dispatch"} onClick={() => onAdvance("READY_TO_SHIP")}><CheckCheck /> Conferido</Button>
            {o.claim && (o.claim.mine || variant === "adm") ? <Button size={big ? "lg" : "sm"} variant="ghost" loading={busy} onClick={onRelease}>Liberar</Button> : null}
          </>
        ) : null}
        {o.status === "READY_TO_SHIP" ? <Button size={big ? "lg" : "sm"} loading={busy} onClick={() => onAdvance("SHIPPED")}><Truck /> Marcar enviado</Button> : null}
        {o.status === "AWAITING_CENTRAL_PAYMENT" ? <span className="inline-flex items-center gap-1 text-xs text-warning"><Wallet className="size-3.5" aria-hidden /> Sai da fila quando o lojista recarregar</span> : null}
      </div>
    </article>
  );
}

/** Esteira de pedidos. `adm`: colunas lado a lado (gestor). `dispatch`: seções empilhadas com alvos grandes (tablet, expedição). */
export function EsteiraBoard({ orders, columns, variant }: { orders: EsteiraOrder[]; columns: readonly string[]; variant: "adm" | "dispatch" }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [scan, setScan] = React.useState("");
  const [found, setFound] = React.useState<string | null>(null);
  const [waving, setWaving] = React.useState(false);
  const scanRef = React.useRef<HTMLInputElement>(null);

  // Some da seleção o que saiu da fila (mudança ao vivo).
  const readyIds = React.useMemo(() => new Set(orders.filter((o) => o.status === "READY_TO_PICK" && o.labelCount > 0 && !o.wave).map((o) => o.id)), [orders]);
  const validSelected = React.useMemo(() => [...selected].filter((id) => readyIds.has(id)), [selected, readyIds]);
  const todayIds = orders.filter((o) => readyIds.has(o.id) && o.bucket === "TODAY").map((o) => o.id);

  const advance = async (id: string, next: "PICKING" | "READY_TO_SHIP" | "SHIPPED") => {
    setBusyId(id);
    const r = await advanceDispatchAction(id, next);
    setBusyId(null);
    if (r.ok) { toast.success(next === "PICKING" ? "Separação iniciada" : next === "READY_TO_SHIP" ? "Pedido conferido" : "Pedido enviado"); router.refresh(); } else toast.error(r.error);
  };
  const release = async (id: string) => { setBusyId(id); const r = await releaseClaimAction(id); setBusyId(null); if (r.ok) router.refresh(); else toast.error(r.error); };
  const makeWave = async (input: { orderIds?: string[]; untilCutoff?: boolean }) => {
    setWaving(true);
    const r = await createWaveAction(input);
    if (!r.ok) { setWaving(false); return toast.error(r.error); }
    toast.success(`Onda ${r.data.number} criada com ${r.data.orders} pedido(s)`);
    router.push(`/supplier/dispatch/wave/${r.data.id}`);
  };
  const onScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await scanOrderAction(scan);
    setScan("");
    if (!r.ok) { toast.error(r.error); return scanRef.current?.focus(); }
    setFound(r.data.id);
    document.getElementById(`ord-${r.data.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast.success(`Pedido #${r.data.number} localizado`);
    scanRef.current?.focus();
  };
  const toggle = (id: string, v: boolean) => setSelected((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; });

  const big = variant === "dispatch";
  return (
    <div className="space-y-4">
      <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3", big && "p-4")}>
        <form onSubmit={onScan} className="flex min-w-60 flex-1 items-center gap-2">
          <ScanLine className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input ref={scanRef} value={scan} onChange={(e) => setScan(e.target.value)} placeholder="Ler ou digitar nº do pedido / código da etiqueta" aria-label="Ler pedido" className={big ? "h-14 text-lg" : ""} autoComplete="off" />
          <Button type="submit" variant="secondary" size={big ? "lg" : "md"}>Buscar</Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size={big ? "lg" : "md"} disabled={todayIds.length === 0} onClick={() => setSelected(new Set(todayIds))}>Selecionar todos até o corte ({todayIds.length})</Button>
          <Button size={big ? "lg" : "md"} loading={waving} disabled={validSelected.length === 0} onClick={() => makeWave({ orderIds: validSelected })}><Printer /> Criar onda e imprimir ({validSelected.length})</Button>
        </div>
      </div>

      <div className={cn(big ? "space-y-8" : "flex snap-x gap-3 overflow-x-auto pb-3 [&>section]:w-72 [&>section]:shrink-0 [&>section]:snap-start")}>
        {columns.map((col) => {
          const list = orders.filter((o) => o.status === col);
          const meta = COL_LABEL[col]!;
          return (
            <section key={col} aria-label={meta.title} className={cn(!big && "rounded-lg border border-border border-t-4 bg-surface-muted/50 p-2", !big && meta.tone)}>
              <header className={cn("mb-2 flex items-baseline justify-between px-1", big && "mb-3")}>
                <h3 className={cn("font-display font-semibold", big ? "text-xl" : "text-sm")}>{meta.title}</h3>
                <span className={cn("rounded-full bg-surface px-2 py-0.5 font-semibold tabular-nums", big ? "text-base" : "text-xs")}>{list.length}</span>
              </header>
              {list.length === 0 ? <p className="px-1 py-3 text-sm text-muted-foreground">{meta.hint}. Nada por aqui.</p> : (
                <div className={cn("space-y-2", big && "grid gap-3 space-y-0 md:grid-cols-2")}>
                  {list.map((o) => <OrderCard key={o.id} o={o} variant={variant} selected={selected.has(o.id)} onSelect={(v) => toggle(o.id, v)} busy={busyId === o.id} onAdvance={(n) => advance(o.id, n)} onRelease={() => release(o.id)} highlight={found === o.id} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
