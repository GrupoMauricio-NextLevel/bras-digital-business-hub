"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, RefreshCw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { MoneyField } from "@/components/finance/fields";
import { formatBRL } from "@/lib/money";
import { counterLookupAction, createCounterAction, markSettledAction, registerPurchaseAction, renewClubCardAction, revokeCounterAction } from "@/app/actions/club-balcao";

/** Cartão do Club no balcão das empresas do grupo e o acerto entre elas (D120). */
type Result = { ok: boolean; error?: string };
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends Result>(fn: () => Promise<T>, msg: string | null, after?: (r: T) => void) => start(async () => { const r = await fn(); if (r.ok) { if (msg) toast.success(msg); after?.(r); router.refresh(); } else toast.error(r.error); }) };
}
const data = <T,>(r: unknown) => (r as { data: T }).data;

export function RenewCardButton() {
  const { pending, run } = useRun();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => { if (confirm("Trocar o cartão? O código antigo deixa de valer no balcão.")) run(() => renewClubCardAction(), "Cartão trocado"); }}><RefreshCw className="size-4" aria-hidden />Trocar cartão</Button>;
}

type Look = { name: string; available: number; vouchers: { valueCents: number; expiresAt: string }[] };
/** Balcão (sem login): ler o cartão, registrar a compra e, se o cliente quiser, usar o vale dele. */
export function CounterDesk({ token, companyName }: { token: string; companyName: string }) {
  const { pending, run } = useRun();
  const [card, setCard] = React.useState("");
  const [look, setLook] = React.useState<Look | null>(null);
  const [f, setF] = React.useState({ valueCents: 0, receipt: "", voucherCode: "", guideCard: "" });
  const [done, setDone] = React.useState<{ name: string; points: number; inReview: boolean; discountCents: number; guideName: string | null; guidePoints: number } | null>(null);
  const reset = () => { setCard(""); setLook(null); setF({ valueCents: 0, receipt: "", voucherCode: "", guideCard: "" }); setDone(null); };
  if (done) return (
    <div role="status" className="ds-card p-4">
      <p className="text-lg font-bold">Compra registrada para {done.name}</p>
      <p className="mt-1">{done.discountCents ? `Vale usado: ${formatBRL(done.discountCents)}. ` : ""}{done.points ? `${done.points.toLocaleString("pt-BR")} pontos${done.inReview ? " (em revisão da NextLevel)" : ""}.` : "Sem pontos nesta compra."}</p>
      {done.guideName ? <p className="mt-1">Guia {done.guideName}: {done.guidePoints.toLocaleString("pt-BR")} pontos.</p> : null}
      <Button className="mt-3" onClick={reset}>Próximo cliente</Button>
    </div>
  );
  return (
    <div className="grid gap-4">
      <form className="ds-card grid gap-2 p-4" aria-label="Ler cartão do Club" onSubmit={(e) => { e.preventDefault(); run(() => counterLookupAction(token, card), null, (r) => setLook(data<Look>(r))); }}>
        <label className="flex flex-col text-sm font-medium" htmlFor="club-card">Código do cartão do cliente</label>
        <div className="flex flex-wrap gap-2">
          <Input id="club-card" required autoComplete="off" autoCapitalize="characters" placeholder="Bipe o QR ou digite os 10 caracteres" value={card} onChange={(e) => { setCard(e.target.value); setLook(null); }} className="min-w-0 flex-1 font-mono uppercase" />
          <Button type="submit" disabled={pending}><ScanLine className="size-4" aria-hidden />Ler cartão</Button>
        </div>
      </form>
      {look ? (
        <form className="ds-card grid gap-3 p-4" aria-label="Registrar compra" onSubmit={(e) => { e.preventDefault(); run(() => registerPurchaseAction(token, { card, valueCents: f.valueCents, receipt: f.receipt || undefined, voucherCode: f.voucherCode || undefined, guideCard: f.guideCard || undefined }), null, (r) => setDone(data(r))); }}>
          <p className="text-lg font-bold">{look.name}</p>
          <p className="text-sm">Saldo: <b className="tabular-nums">{look.available.toLocaleString("pt-BR")} pontos</b>{look.vouchers.length ? ` · ${look.vouchers.length} vale(s) ativo(s): ${look.vouchers.map((v) => formatBRL(v.valueCents)).join(", ")}` : ""}</p>
          <MoneyField id="club-value" label={`Valor da compra na ${companyName}`} valueCents={f.valueCents} onChange={(v) => setF({ ...f, valueCents: v })} />
          <label className="flex flex-col text-sm font-medium">Número do cupom ou da nota (opcional)<Input maxLength={60} value={f.receipt} onChange={(e) => setF({ ...f, receipt: e.target.value })} className="mt-1" /></label>
          {look.vouchers.length ? <label className="flex flex-col text-sm font-medium">Código do vale que o cliente mostrou (opcional)<Input maxLength={20} autoCapitalize="characters" placeholder="VALE-XXXXXX" value={f.voucherCode} onChange={(e) => setF({ ...f, voucherCode: e.target.value })} className="mt-1 font-mono uppercase" /></label> : null}
          <label className="flex flex-col text-sm font-medium">Cartão do guia de excursão (opcional)<Input maxLength={40} autoCapitalize="characters" placeholder="Se o cliente veio com um guia" value={f.guideCard} onChange={(e) => setF({ ...f, guideCard: e.target.value })} className="mt-1 font-mono uppercase" /></label>
          <Button type="submit" disabled={pending || f.valueCents < 100}><Check className="size-4" aria-hidden />Registrar compra</Button>
        </form>
      ) : null}
    </div>
  );
}

/** Master: criar o link do balcão de uma empresa do grupo (o link aparece uma vez só). */
export function CounterCreateForm({ companies }: { companies: { key: string; name: string }[] }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ company: companies[1]?.key ?? companies[0]?.key ?? "", name: "" });
  const [link, setLink] = React.useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <form className="grid gap-2 sm:grid-cols-[12rem_1fr_auto] sm:items-end" aria-label="Criar balcão do Club" onSubmit={(e) => { e.preventDefault(); run(() => createCounterAction(f), "Balcão criado", (r) => { setLink(`${window.location.origin}${data<{ path: string }>(r).path}`); setF({ ...f, name: "" }); }); }}>
        <label className="flex flex-col text-sm font-medium">Empresa<Select value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className="mt-1">{companies.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</Select></label>
        <label className="flex flex-col text-sm font-medium">Nome do balcão<Input required minLength={3} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Mega Tron · box 12" className="mt-1" /></label>
        <Button type="submit" disabled={pending}>Criar link</Button>
      </form>
      {link ? <div role="status" className="rounded-lg border border-success/40 bg-success-soft p-3 text-sm"><p className="font-semibold">Link do balcão (aparece só agora):</p><p className="break-all font-mono text-xs">{link}</p><Button size="sm" variant="secondary" className="mt-2" onClick={() => { void navigator.clipboard?.writeText(link); toast.success("Link copiado"); }}><Copy className="size-4" aria-hidden />Copiar</Button></div> : null}
    </div>
  );
}

export function RevokeCounterButton({ id, name }: { id: string; name: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (confirm(`Desligar o balcão "${name}"? O link para de funcionar.`)) run(() => revokeCounterAction(id), "Balcão desligado"); }} aria-label={`Desligar balcão ${name}`}>Desligar</Button>;
}

export function MarkSettledButton({ month, debtor, creditor, label }: { month: string; debtor: string; creditor: string; label: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => { const note = prompt(`Acerto feito: ${label}. Número da nota ou do comprovante (opcional):`) ?? undefined; run(() => markSettledAction(month, debtor, creditor, note), "Acerto registrado"); }} aria-label={`Marcar acertado: ${label}`}>Marcar acertado</Button>;
}
