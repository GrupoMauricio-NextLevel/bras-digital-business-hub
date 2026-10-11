"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Gift, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { IntField } from "@/components/finance/fields";
import { formatBRL } from "@/lib/money";
import { activateReferralAction, cancelVoucherAction, redeemVoucherAction, reviewPointsAction, saveClubRulesAction, applyVoucherAction } from "@/app/actions/club";

/** Formulários do Brás Digital Club (D115). */
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends { ok: boolean; error?: string }>(fn: () => Promise<T>, msg: string | ((r: T) => string), after?: (r: T) => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(typeof msg === "string" ? msg : msg(r)); after?.(r); router.refresh(); } else toast.error(r.error); }) };
}

/** Link de convite com copiar e WhatsApp. */
export function InviteLink({ url, message }: { url: string; message: string }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="break-all rounded-lg border border-border bg-surface-muted p-2 font-mono text-xs">{url}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard?.writeText(url); toast.success("Link copiado"); }}><Copy className="size-4" aria-hidden />Copiar link</Button>
        <a className="ds-btn ds-btn--sm inline-flex items-center gap-2" href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden />Mandar no WhatsApp</a>
      </div>
    </div>
  );
}

/** Gerar vale: pontos → desconto com código. */
export function RedeemForm({ available, minRedeem, pointsPerReal }: { available: number; minRedeem: number; pointsPerReal: number }) {
  const { pending, run } = useRun();
  const [points, setPoints] = React.useState(Math.min(available, Math.max(minRedeem, 0)));
  const [code, setCode] = React.useState<string | null>(null);
  if (available < minRedeem) return <p className="text-sm text-muted-foreground">Junte {minRedeem} pontos para gerar o primeiro vale ({formatBRL(Math.floor((minRedeem * 100) / pointsPerReal))} de desconto).</p>;
  return (
    <form className="flex flex-wrap items-end gap-2" aria-label="Gerar vale" onSubmit={(e) => { e.preventDefault(); run(() => redeemVoucherAction(points), (r) => `Vale ${(r as unknown as { data: { code: string } }).data.code} gerado`, (r) => setCode((r as unknown as { data: { code: string } }).data.code)); }}>
      <IntField id="redeem-pts" label="Pontos" min={minRedeem} value={points} onChange={(v) => setPoints(Math.min(available, v))} className="w-36" />
      <span className="pb-2 text-sm">= <b>{formatBRL(Math.floor((points * 100) / pointsPerReal))}</b> de desconto</span>
      <Button type="submit" loading={pending}><Gift className="size-4" aria-hidden />Gerar vale</Button>
      {code ? <p role="status" className="w-full text-sm">Mostre o código <b className="font-mono">{code}</b> no balcão da Mega Tron ou para o seu ônibus da Starline.</p> : null}
    </form>
  );
}

export function CancelVoucherButton({ id }: { id: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Cancelar o vale e devolver os pontos?")) run(() => cancelVoucherAction(id), "Vale cancelado, pontos devolvidos"); }}>Cancelar</Button>;
}

/** Master: baixar o vale usado no balcão de uma empresa do grupo. */
export function UseVoucherForm({ companies }: { companies: { key: string; name: string }[] }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ code: "", company: companies[0]?.key ?? "", note: "" });
  return (
    <form className="grid gap-2 sm:grid-cols-4" aria-label="Baixar vale" onSubmit={(e) => { e.preventDefault(); run(() => applyVoucherAction(f.code, f.company, f.note), (r) => `Vale baixado: ${formatBRL((r as unknown as { data: { valueCents: number } }).data.valueCents)} de desconto`, () => setF({ ...f, code: "", note: "" })); }}>
      <label className="flex flex-col text-sm font-medium">Código do vale<Input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="VALE-XXXXXX" className="mt-1 font-mono" /></label>
      <label className="flex flex-col text-sm font-medium">Usado em<Select value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className="mt-1">{companies.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</Select></label>
      <label className="flex flex-col text-sm font-medium">Observação<Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Ex.: pedido 123" className="mt-1" /></label>
      <Button type="submit" loading={pending} className="self-end">Baixar vale</Button>
    </form>
  );
}

export function ReviewButtons({ id }: { id: string }) {
  const { pending, run } = useRun();
  return <div className="flex gap-2"><Button size="sm" disabled={pending} onClick={() => run(() => reviewPointsAction(id, true), "Pontos liberados")}>Liberar</Button><Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => reviewPointsAction(id, false), "Pontos recusados")}>Recusar</Button></div>;
}

export function ActivateReferralButton({ id }: { id: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => { if (window.confirm("Confirmar que essa indicação ativou (primeira venda ou entrega real)? Os pontos vão para quem indicou.")) run(() => activateReferralAction(id), "Indicação ativada e pontos creditados"); }}>Marcar como ativada</Button>;
}

type Rules = { pointsPerReal: number; referral: Record<"CLIENTE" | "IMPORTADORA" | "TRANSPORTADORA" | "ONIBUS" | "LOJA" | "GUIA", number>; monthlyCap: number; expiryMonths: number; minRedeem: number; purchase: { pointsPerReal: number; companies: string[]; reviewAboveCents: number; maxDiscountPct: number }; cross: { parcelDeliveredPoints: number; guidePct: number } };
const REF_LABEL = { CLIENTE: "Cliente", IMPORTADORA: "Importadora", TRANSPORTADORA: "Transportadora", ONIBUS: "Ônibus de excursão", LOJA: "Loja (Nota Fácil)", GUIA: "Guia de excursão" } as const;
export function ClubRulesEditor({ rules }: { rules: Rules }) {
  const { pending, run } = useRun();
  const [r, setR] = React.useState(rules);
  return (
    <form className="space-y-4" aria-label="Regras dos pontos" onSubmit={(e) => { e.preventDefault(); run(() => saveClubRulesAction(r), "Regras do Club gravadas"); }}>
      <div className="grid gap-3 sm:grid-cols-4">
        <IntField id="cl-ppr" label="Pontos por R$ 1,00" min={1} value={r.pointsPerReal} onChange={(v) => setR({ ...r, pointsPerReal: v })} />
        <IntField id="cl-cap" label="Teto de indicação por mês" value={r.monthlyCap} onChange={(v) => setR({ ...r, monthlyCap: v })} />
        <IntField id="cl-exp" label="Validade" suffix="meses" min={1} value={r.expiryMonths} onChange={(v) => setR({ ...r, expiryMonths: v })} />
        <IntField id="cl-min" label="Vale mínimo" suffix="pts" value={r.minRedeem} onChange={(v) => setR({ ...r, minRedeem: v })} />
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold">Pontos por indicação ativada</legend>
        {(Object.keys(REF_LABEL) as (keyof typeof REF_LABEL)[]).map((k) => <IntField key={k} id={`cl-ref-${k}`} label={REF_LABEL[k]} value={r.referral[k]} onChange={(v) => setR({ ...r, referral: { ...r.referral, [k]: v } })} />)}
      </fieldset>
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold">Compra no balcão (pontos pagos pela empresa da compra)</legend>
        <IntField id="cl-pur-ppr" label="Pontos por R$ 1,00 gasto" value={r.purchase.pointsPerReal} onChange={(v) => setR({ ...r, purchase: { ...r.purchase, pointsPerReal: v } })} />
        <IntField id="cl-pur-rev" label="Revisão acima de" suffix="R$" value={Math.round(r.purchase.reviewAboveCents / 100)} onChange={(v) => setR({ ...r, purchase: { ...r.purchase, reviewAboveCents: v * 100 } })} />
        <IntField id="cl-pur-max" label="Vale cobre até" suffix="% da compra" min={1} value={r.purchase.maxDiscountPct} onChange={(v) => setR({ ...r, purchase: { ...r.purchase, maxDiscountPct: Math.min(100, v) } })} />
      </fieldset>
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold">Benefícios cruzados do grupo</legend>
        <IntField id="cl-x-fardo" label="Pontos por fardo entregue (ônibus do grupo)" value={r.cross.parcelDeliveredPoints} onChange={(v) => setR({ ...r, cross: { ...r.cross, parcelDeliveredPoints: v } })} />
        <IntField id="cl-x-guia" label="Guia de excursão" suffix="% da compra" value={r.cross.guidePct} onChange={(v) => setR({ ...r, cross: { ...r.cross, guidePct: Math.min(20, v) } })} />
      </fieldset>
      <Button type="submit" loading={pending}>Gravar regras</Button>
    </form>
  );
}
