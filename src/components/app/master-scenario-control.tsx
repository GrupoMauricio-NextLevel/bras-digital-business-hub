"use client";

import { useState, useTransition } from "react";
import { Database, RotateCcw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { activateMasterScenarioAction, clearMasterScenarioAction } from "@/app/actions/master-scenario";
import type { MasterScenarioSummary, ScenarioLevel, ScenarioScope } from "@/lib/master-scenario";
import { Button } from "@/components/ui/button";

const LEVELS: { value: ScenarioLevel; label: string; hint: string }[] = [
  { value: "LIGHT", label: "Leve", hint: "Poucos dados para conferir telas e navegação." },
  { value: "ACTIVE", label: "Operação", hint: "Volume realista para avaliar o sistema no dia a dia." },
  { value: "SCALE", label: "Escala", hint: "Muita movimentação para testar densidade, filas e indicadores." },
];

const SCOPES: { value: ScenarioScope; label: string }[] = [
  { value: "ALL", label: "Ecossistema completo" },
  { value: "SUPERDROP", label: "Somente SuperDrop" },
  { value: "COMMERCE", label: "Somente Commerce" },
];

export function MasterScenarioControl({ initial }: { initial: MasterScenarioSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(initial);
  const [level, setLevel] = useState<ScenarioLevel>(initial.level ?? "ACTIVE");
  const [scope, setScope] = useState<ScenarioScope>(initial.scope ?? "ALL");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const activate = () => startTransition(async () => {
    setMessage("");
    const result = await activateMasterScenarioAction({ level, scope });
    if (!result.ok) return setMessage(result.error);
    setSummary(result.data);
    setMessage(summary.active ? "Cenário substituído com segurança." : "Cenário carregado.");
    router.refresh();
  });

  const clear = () => {
    if (!window.confirm("Remover somente os dados fictícios do cenário? Dados reais não serão alterados.")) return;
    startTransition(async () => {
      setMessage("");
      const result = await clearMasterScenarioAction();
      if (!result.ok) return setMessage(result.error);
      setSummary(result.data);
      setMessage("Dados fictícios removidos. Os dados reais foram preservados.");
      router.refresh();
    });
  };

  const selected = LEVELS.find((x) => x.value === level)!;
  const sameConfiguration = summary.active && summary.level === level && summary.scope === scope;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-40 md:bottom-4 md:right-4">
      {open ? (
        <div className="mb-2 w-[min(24rem,calc(100vw-1.5rem))] border border-border bg-background p-4 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">NextLevel OS</p>
              <h2 className="mt-1 text-sm font-semibold">Gerador de cenários</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Fechar">
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Preenche Master, SuperDrop e NextLevel Commerce com operações fictícias. O Master sempre mostra a visão consolidada do que estiver ativo.
          </p>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs">
              <span className="font-medium">Onde preencher</span>
              <select value={scope} onChange={(e) => setScope(e.target.value as ScenarioScope)} className="h-9 border border-border bg-background px-2 text-sm">
                {SCOPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs">
              <span className="font-medium">Densidade de dados</span>
              <select value={level} onChange={(e) => setLevel(e.target.value as ScenarioLevel)} className="h-9 border border-border bg-background px-2 text-sm">
                {LEVELS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
              <span className="text-[11px] leading-4 text-muted-foreground">{selected.hint}</span>
            </label>
          </div>

          {summary.active ? (
            <div className="mt-4 border-y border-border py-3 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <span><b className="block text-base text-foreground">{summary.superdropStores}</b>SuperDrop</span>
                <span><b className="block text-base text-foreground">{summary.commerceStores}</b>Commerce</span>
                <span><b className="block text-base text-foreground">{summary.products}</b>produtos</span>
                <span><b className="block text-base text-foreground">{summary.orders}</b>pedidos</span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-[var(--product-accent)]">
                CENÁRIO ATIVO · {LEVELS.find((x) => x.value === summary.level)?.label ?? summary.level}
              </p>
            </div>
          ) : (
            <p className="mt-4 border-y border-border py-3 text-xs text-muted-foreground">Nenhum dado fictício ativo.</p>
          )}

          {message ? <p className="mt-3 text-xs text-muted-foreground" role="status">{message}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" loading={pending} disabled={sameConfiguration} onClick={activate}>
              {summary.active ? <RotateCcw /> : <Database />}
              {summary.active ? "Aplicar cenário" : "Carregar cenário"}
            </Button>
            {summary.active ? (
              <Button type="button" size="sm" variant="danger" loading={pending} onClick={clear}>
                <Trash2 /> Zerar fictícios
              </Button>
            ) : null}
          </div>

          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
            Trocar nível ou área primeiro remove o manifesto fictício anterior e recria somente o novo cenário. Não há truncate nem reset geral do banco.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-2 border border-border bg-background px-2.5 text-[11px] font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
        aria-expanded={open}
      >
        <span className={summary.active ? "size-1.5 rounded-full bg-[var(--product-accent)]" : "size-1.5 rounded-full bg-muted-foreground/40"} />
        Cenário
      </button>
    </div>
  );
}
