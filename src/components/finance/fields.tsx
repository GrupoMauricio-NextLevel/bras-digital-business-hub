"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const fmtBRL = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const parseBRL = (s: string) => { const n = Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? Math.round(n * 100) : 0; };
const fmtPct = (bps: number) => String(bps / 100).replace(".", ",");
const parsePct = (s: string) => { const n = Number(s.replace(",", ".").replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? Math.round(n * 100) : 0; };

type Common = { label: string; hint?: string; className?: string; id?: string; disabled?: boolean };

/** Campo em reais. Digitação livre; mude a `key` do componente para redefinir o valor de fora. */
export function MoneyField({ label, hint, valueCents, onChange, className, id, disabled }: Common & { valueCents: number; onChange: (cents: number) => void }) {
  const [text, setText] = React.useState(fmtBRL(valueCents));
  const fid = id ?? `m-${label}`;
  return (
    <Field label={label} hint={hint} id={fid} className={className}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        <Input id={fid} disabled={disabled} inputMode="decimal" className="pl-9 tabular-nums" value={text} onChange={(e) => { setText(e.target.value); onChange(parseBRL(e.target.value)); }} onBlur={() => setText(fmtBRL(parseBRL(text)))} />
      </div>
    </Field>
  );
}

/** Campo em percentual, armazenado em pontos-base. */
export function PercentField({ label, hint, bps, onChange, className, id, disabled }: Common & { bps: number; onChange: (bps: number) => void }) {
  const [text, setText] = React.useState(fmtPct(bps));
  const fid = id ?? `p-${label}`;
  return (
    <Field label={label} hint={hint} id={fid} className={className}>
      <div className="relative">
        <Input id={fid} disabled={disabled} inputMode="decimal" className="pr-8 tabular-nums" value={text} onChange={(e) => { setText(e.target.value); onChange(parsePct(e.target.value)); }} onBlur={() => setText(fmtPct(parsePct(text)))} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </Field>
  );
}

export function IntField({ label, hint, value, onChange, className, id, min = 0, suffix, disabled }: Common & { value: number; onChange: (v: number) => void; min?: number; suffix?: string }) {
  const fid = id ?? `i-${label}`;
  return (
    <Field label={label} hint={hint} id={fid} className={className}>
      <div className="relative">
        <Input id={fid} disabled={disabled} type="number" min={min} className={cn("tabular-nums", suffix && (suffix.length <= 2 ? "pr-8 pl-2" : "pr-14"))} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Math.max(min, Math.round(Number(e.target.value) || 0)))} />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </Field>
  );
}

function Field({ label, hint, id, className, children }: { label: string; hint?: string; id: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-subtle-foreground">{hint}</p> : null}
    </div>
  );
}
