"use client";
import { Check } from "lucide-react";
import { faltaParaMix, type ProgressoMix } from "@/lib/finance/atacado-preco";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Barra do mix (AT2, D259): quanto falta para o preço de atacado, pelo mesmo cálculo do pedido (`precoDoCarrinho`).
 * Mostra a regra mais perto de ser atingida (ou a já atingida) para não encher a tela com várias barras.
 */
export function BarraDoMix({ mix, nota, className }: { mix: ProgressoMix[]; nota?: string; className?: string }) {
  if (!mix.length) return null;
  const atingida = mix.find((m) => m.atingida);
  const m = atingida ?? [...mix].sort((a, b) => b.atual / Math.max(1, b.minimo) - a.atual / Math.max(1, a.minimo))[0]!;
  const pct = Math.min(100, Math.round((m.atual / Math.max(1, m.minimo)) * 100));
  const atual = m.regra.kind === "MIX_VALOR" ? `${formatBRL(m.atual)} em produtos` : `${m.atual} peça${m.atual === 1 ? "" : "s"}${m.regra.kind === "MIX_CATEGORIA" ? " desta coleção" : ""}`;
  return (
    <div className={cn("rounded-xl border border-neutral-200 p-4", className)} aria-live="polite" data-barra-mix>
      <p className="flex items-start gap-2 text-sm">
        {atingida ? <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--sf-accent)" }} aria-hidden /> : null}
        <span>{atingida ? <><b>Preço de atacado liberado</b> no que tem atacado.</> : <>Você tem <b className="tabular-nums">{atual}</b>. <b>{faltaParaMix(m, formatBRL)}</b>.</>}</span>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Caminho até o preço de atacado">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: "var(--sf-accent)" }} />
      </div>
      {nota ? <p className="mt-2 text-xs text-neutral-500">{nota}</p> : null}
    </div>
  );
}

/** Regras que importam para um conjunto de coleções: as gerais sempre, as de coleção só se a coleção estiver ali. */
export function mixRelevante(mix: ProgressoMix[], categorias: (string | null | undefined)[]): ProgressoMix[] {
  const set = new Set(categorias.filter(Boolean));
  return mix.filter((m) => m.regra.kind !== "MIX_CATEGORIA" || set.has(m.regra.categoryId));
}
