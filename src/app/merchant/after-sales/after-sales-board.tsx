"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Copy, MessageCircle, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AfterSalesOrder, AfterSalesStage } from "@/lib/domain/after-sales";
import { addOrderNoteAction } from "@/app/actions/after-sales";
import { formatBRL } from "@/lib/money";

const TONE: Record<AfterSalesStage, string> = { AWAITING_CUSTOMER: "border-t-warning", AWAITING_FUNDS: "border-t-warning", AWAITING_LABEL: "border-t-warning", IN_DISPATCH: "border-t-info", IN_TRANSIT: "border-t-accent", DELIVERED: "border-t-success" };
const age = (h: number) => (h >= 48 ? `${Math.floor(h / 24)}d` : h >= 1 ? `${h}h` : "agora");

function NoteButton({ orderId, number }: { orderId: string; number: number }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><NotebookPen /> Anotar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`Anotação no pedido #${number}`} description="Registre o que combinou com o cliente. Fica no histórico do pedido.">
          <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await addOrderNoteAction(orderId, text); setBusy(false); if (r.ok) { toast.success("Anotação registrada"); setOpen(false); setText(""); router.refresh(); } else toast.error(r.error); }}>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Cliente pediu para trocar o tamanho para G" aria-label="Anotação" required minLength={2} maxLength={500} />
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" loading={busy} disabled={text.trim().length < 2}>Salvar</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Card({ o }: { o: AfterSalesOrder }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-3 shadow-sm" aria-label={`Pedido ${o.number}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><Link href={`/merchant/orders/${o.id}`} className="font-display font-semibold hover:underline">#{o.number}</Link><div className="truncate text-sm">{o.customerName}</div><div className="truncate text-xs text-muted-foreground">{o.city ? `${o.city}/${o.state} · ` : ""}{formatBRL(o.totalCents)}</div></div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground">{age(o.ageHours)}</span>
      </div>
      <ul className="mt-2 space-y-0.5 text-sm">{o.items.slice(0, 2).map((i, k) => <li key={k} className="flex justify-between gap-2"><span className="truncate">{i.productName.replace("Camisa Tailandesa ", "")} <span className="text-muted-foreground">· {i.label.split(" (")[0]}</span></span><span className="tabular-nums">×{i.quantity}</span></li>)}</ul>
      {o.attention ? <p className="mt-2 flex items-start gap-1.5 rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />{o.attention}</p> : null}
      {o.tracking ? (
        <button type="button" className="mt-2 inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-1 font-mono text-xs" onClick={() => { void navigator.clipboard?.writeText(o.tracking!.code); toast.success("Código de rastreio copiado"); }}><Copy className="size-3" aria-hidden />{o.tracking.carrier ? `${o.tracking.carrier} · ` : ""}{o.tracking.code}</button>
      ) : null}
      {o.notes.length ? <ul className="mt-2 space-y-1 border-l-2 border-border pl-2 text-xs text-muted-foreground">{o.notes.map((n) => <li key={n.id}>{n.text}</li>)}</ul> : null}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {o.whatsappUrl ? <a href={o.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-success px-3 text-xs font-medium text-canvas hover:opacity-90"><MessageCircle className="size-3.5" aria-hidden />Falar no WhatsApp</a> : <span className="text-xs text-muted-foreground">Sem telefone</span>}
        <NoteButton orderId={o.id} number={o.number} />
      </div>
    </article>
  );
}

export function AfterSalesBoard({ byStage, stages, labels }: { byStage: Record<AfterSalesStage, AfterSalesOrder[]>; stages: AfterSalesStage[]; labels: Record<AfterSalesStage, { title: string; hint: string }> }) {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-3 [&>section]:w-72 [&>section]:shrink-0 [&>section]:snap-start">
      {stages.map((st) => (
        <section key={st} aria-label={labels[st].title} className={cn("rounded-lg border border-border border-t-4 bg-surface-muted/50 p-2", TONE[st])}>
          <header className="mb-2 flex items-baseline justify-between px-1"><h3 className="font-display text-sm font-semibold">{labels[st].title}</h3><span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums">{byStage[st].length}</span></header>
          {byStage[st].length === 0 ? <p className="px-1 py-3 text-sm text-muted-foreground">{labels[st].hint}. Nada por aqui.</p> : <div className="space-y-2">{byStage[st].map((o) => <Card key={o.id} o={o} />)}</div>}
        </section>
      ))}
    </div>
  );
}
