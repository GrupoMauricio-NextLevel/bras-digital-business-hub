"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarBeneficiosAction } from "@/app/actions/commerce-admin";

type Linha = { produtos: number | null; pessoas: number; temaPago: boolean; suporte: string; migracao: string };
type Tabela = Record<"COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE", Linha>;
const PLANOS = [["COMMERCE_START", "Start"], ["COMMERCE_PRO", "Pro"], ["COMMERCE_SCALE", "Scale"]] as const;

/** Editor da tabela única de benefícios (D247). Produtos vazio = sem limite. Usos de IA ficam em Master → IA (cotas). */
export function BeneficiosEditor({ inicial, ia }: { inicial: Tabela; ia: Record<string, number> }) {
  const [t, setT] = React.useState(inicial);
  const [pending, start] = React.useTransition();
  const set = (k: keyof Tabela, patch: Partial<Linha>) => setT((x) => ({ ...x, [k]: { ...x[k], ...patch } }));
  const salvar = () => start(async () => { const r = await salvarBeneficiosAction(t); if (r.ok) toast.success("Benefícios salvos: valem na hora em /planos, checkout, placar e nas travas"); else toast.error(r.error); });
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[44rem] text-sm">
        <thead><tr className="border-b border-border text-left"><th scope="col" className="p-3">Benefício</th>{PLANOS.map(([k, n]) => <th key={k} scope="col" className="p-3">{n}</th>)}</tr></thead>
        <tbody>
          <tr className="border-b border-border"><th scope="row" className="p-3 text-left font-medium">Produtos (vazio = sem limite)</th>{PLANOS.map(([k]) => <td key={k} className="p-3"><Input inputMode="numeric" aria-label={`Produtos ${k}`} value={t[k].produtos ?? ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); set(k, { produtos: v ? Number(v) : null }); }} /></td>)}</tr>
          <tr className="border-b border-border"><th scope="row" className="p-3 text-left font-medium">Pessoas no painel (com o dono)</th>{PLANOS.map(([k]) => <td key={k} className="p-3"><Input inputMode="numeric" aria-label={`Pessoas ${k}`} value={t[k].pessoas} onChange={(e) => set(k, { pessoas: Number(e.target.value.replace(/\D/g, "")) || 1 })} /></td>)}</tr>
          <tr className="border-b border-border"><th scope="row" className="p-3 text-left font-medium">Tema pago incluso</th>{PLANOS.map(([k]) => <td key={k} className="p-3"><input type="checkbox" aria-label={`Tema pago ${k}`} checked={t[k].temaPago} onChange={(e) => set(k, { temaPago: e.target.checked })} className="size-4" /></td>)}</tr>
          <tr className="border-b border-border"><th scope="row" className="p-3 text-left font-medium">Suporte</th>{PLANOS.map(([k]) => <td key={k} className="p-3"><Input aria-label={`Suporte ${k}`} value={t[k].suporte} onChange={(e) => set(k, { suporte: e.target.value })} /></td>)}</tr>
          <tr className="border-b border-border"><th scope="row" className="p-3 text-left font-medium">Migração</th>{PLANOS.map(([k]) => <td key={k} className="p-3"><Input aria-label={`Migração ${k}`} value={t[k].migracao} onChange={(e) => set(k, { migracao: e.target.value })} /></td>)}</tr>
          <tr><th scope="row" className="p-3 text-left font-medium text-muted-foreground">IA (usos/mês, editar em Master → IA)</th>{PLANOS.map(([k]) => <td key={k} className="p-3 tabular-nums text-muted-foreground">{(ia[k] ?? 0).toLocaleString("pt-BR")}</td>)}</tr>
        </tbody>
      </table>
      <div className="flex justify-end border-t border-border p-3"><Button onClick={salvar} loading={pending}>Salvar benefícios</Button></div>
    </div>
  );
}
