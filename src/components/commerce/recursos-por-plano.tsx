"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { salvarRecursosPorPlanoAction } from "@/app/actions/commerce-admin";

type Plano = { key: string; nome: string };
type Recurso = { key: string; nome: string };

/** Tabela editável "o que cada plano libera" (D172). Recursos do SuperDrop (saldo, etiqueta da Central) nem aparecem. */
export function RecursosPorPlano({ planos, recursos, inicial, podeEditar }: { planos: Plano[]; recursos: Recurso[]; inicial: Record<string, string[]>; podeEditar: boolean }) {
  const router = useRouter();
  const [tabela, setTabela] = React.useState(() => Object.fromEntries(planos.map((p) => [p.key, new Set(inicial[p.key] ?? [])])));
  const [pending, start] = React.useTransition();
  const alternar = (plano: string, recurso: string) => setTabela((t) => {
    const s = new Set(t[plano]); if (s.has(recurso)) s.delete(recurso); else s.add(recurso);
    return { ...t, [plano]: s };
  });
  const salvar = () => start(async () => {
    const r = await salvarRecursosPorPlanoAction(Object.fromEntries(Object.entries(tabela).map(([k, s]) => [k, [...s]])));
    if (!r.ok) toast.error(r.error ?? "Não foi possível salvar."); else { toast.success("Tabela salva. As lojas já veem a mudança."); router.refresh(); }
  });
  return (
    <div>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Recursos liberados em cada plano da NextLevel Commerce</caption>
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th scope="col" className="p-3 font-medium">Recurso</th>{planos.map((p) => <th key={p.key} scope="col" className="p-3 text-center font-medium">{p.nome}</th>)}</tr></thead>
          <tbody>
            {recursos.map((r) => (
              <tr key={r.key} className="border-b border-border last:border-0">
                <th scope="row" className="p-3 text-left font-normal">{r.nome}</th>
                {planos.map((p) => (
                  <td key={p.key} className="p-3 text-center">
                    <input type="checkbox" className="size-4 accent-[var(--product-accent)]" checked={!!tabela[p.key]?.has(r.key)} disabled={!podeEditar || pending}
                      onChange={() => alternar(p.key, r.key)} aria-label={`${r.nome} no plano ${p.nome}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {podeEditar ? <button type="button" onClick={salvar} disabled={pending} className="ds-btn ds-btn--primary mt-4">{pending ? "Salvando…" : "Salvar tabela"}</button>
        : <p className="mt-3 text-xs text-muted-foreground">Só a equipe financeira do Master altera esta tabela.</p>}
    </div>
  );
}
