"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setDistributionAction } from "@/app/actions/supplier";

/** Distribuição do produto do fornecedor entre as lojas da rede. O resto do cadastro vive no `ProductEditor` (D328). */
export function DistributionForm({ productId, distribution, stores, selected }: { productId: string; distribution: "ALL_NETWORK" | "SELECTED_STORES"; stores: { id: string; name: string; status: string }[]; selected: string[] }) {
  const router = useRouter();
  const [mode, setMode] = React.useState(distribution);
  const [ids, setIds] = React.useState<string[]>(selected);
  const [pending, start] = React.useTransition();
  const dirty = mode !== distribution || ids.slice().sort().join() !== selected.slice().sort().join();
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["ALL_NETWORK", "SELECTED_STORES"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-md border px-3 py-2 text-sm ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-surface-muted"}`}>{m === "ALL_NETWORK" ? "Toda a rede" : "Lojas selecionadas"}</button>
        ))}
      </div>
      {mode === "SELECTED_STORES" ? (
        <ul className="space-y-1">
          {stores.map((s) => (
            <li key={s.id}>
              <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted">
                <input type="checkbox" className="accent-[var(--primary)]" checked={ids.includes(s.id)} onChange={(e) => setIds(e.target.checked ? [...ids, s.id] : ids.filter((x) => x !== s.id))} />
                {s.name} {s.status !== "ACTIVE" ? <span className="text-xs text-muted-foreground">({s.status.toLowerCase()})</span> : null}
              </label>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-muted-foreground">Todas as lojas da rede podem ativar e vender este produto.</p>}
      <Button size="sm" className="w-full" disabled={!dirty} loading={pending} onClick={() => start(async () => { const r = await setDistributionAction({ productId, distribution: mode, storeIds: ids }); if (r.ok) { toast.success("Distribuição atualizada"); router.refresh(); } else toast.error(r.error); })}>Salvar distribuição</Button>
    </div>
  );
}
