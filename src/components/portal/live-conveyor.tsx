"use client";
import * as React from "react";
import { Clock, Wallet } from "lucide-react";
import { MockWindow } from "./mock-window";
import { cn } from "@/lib/utils";

const STAGES = ["Aguardando etiqueta", "Pronto para separar", "Em separação", "Enviado"] as const;
const COST = 8000;
type Order = { id: number; name: string; stage: number };
const NAMES = ["Camisa Tailandesa 01 · M", "Camisa Tailandesa 02 · G", "Camisa Tailandesa 03 · P", "Camisa Tailandesa 04 · GG", "Camisa Tailandesa 05 · M", "Camisa Tailandesa 06 · G"];
const SEED: Order[] = [{ id: 1041, name: NAMES[0]!, stage: 3 }, { id: 1042, name: NAMES[1]!, stage: 2 }, { id: 1043, name: NAMES[2]!, stage: 1 }, { id: 1044, name: NAMES[3]!, stage: 0 }];
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Esteira de demonstração com dados simulados: pedidos entram, o saldo é debitado, a expedição avança. */
export function LiveConveyor({ className }: { className?: string }) {
  const [orders, setOrders] = React.useState<Order[]>(SEED);
  const [balance, setBalance] = React.useState(124000);
  const [seconds, setSeconds] = React.useState(6120);
  const [paused, setPaused] = React.useState(false);
  const next = React.useRef(1045);
  const pausedRef = React.useRef(false);
  React.useEffect(() => { pausedRef.current = paused; }, [paused]);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (document.hidden || pausedRef.current) return;
      setSeconds((s) => (s > 0 ? s - 2 : 6120));
      setOrders((list) => {
        // Avança o pedido mais adiantado que ainda não foi enviado; senão cria um novo.
        const movable = [...list].filter((o) => o.stage < 3).sort((a, b) => b.stage - a.stage)[0];
        const shouldAdd = list.filter((o) => o.stage === 0).length === 0 || Math.random() < 0.28;
        if (shouldAdd || !movable) {
          const id = next.current++;
          return [...list.filter((o) => o.stage < 3 || list.length < 8), { id, name: NAMES[id % NAMES.length]!, stage: 0 }].slice(-9);
        }
        if (movable.stage === 0) setBalance((b) => Math.max(20000, b - COST));
        return list.map((o) => (o.id === movable.id ? { ...o, stage: o.stage + 1 } : o));
      });
    }, 1700);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => { if (balance <= 20000) { const t = setTimeout(() => setBalance(124000), 3000); return () => clearTimeout(t); } }, [balance]);

  const mm = String(Math.floor(seconds / 3600)).padStart(2, "0"), ss = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  return (
    <div className={className} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} data-paused={paused || undefined}>
      <MockWindow title="app.superdrop.com.br/supplier" panel="supplier">
        <div className="bg-background p-3 sm:p-4" aria-hidden>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 font-semibold text-success"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span> Ao vivo</span>
            <span className="flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 font-semibold text-info"><Clock className="size-3.5" /> Corte 15:00 · faltam {mm}:{ss}</span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-semibold text-foreground"><Wallet className="size-3.5" /> Saldo do membro <span className="tabular-nums">{brl(balance)}</span></span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAGES.map((label, s) => {
              const col = orders.filter((o) => o.stage === s);
              return (
                <div key={label} className="min-h-40 rounded-lg bg-surface-muted/70 p-2">
                  <p className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">{label}<span className="rounded-full bg-surface px-1.5 tabular-nums">{col.length}</span></p>
                  <ul className="space-y-1.5">
                    {col.slice(-3).map((o) => (
                      <li key={o.id} className={cn("rounded-md border border-border bg-surface p-2 text-[11px] shadow-sm animate-fade-in", s === 3 && "bg-surface-muted")}>
                        <p className="font-semibold tabular-nums">#{o.id}</p><p className="truncate text-muted-foreground">{o.name}</p>
                        {s === 1 ? <p className="mt-1 font-medium text-success">Saldo debitado</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </MockWindow>
      <p className="sr-only">Demonstração: a esteira de pedidos de um fornecedor com quatro etapas (aguardando etiqueta, pronto para separar, em separação e enviado), horário de corte e saldo do membro sendo debitado a cada pedido. Dados simulados.</p>
    </div>
  );
}
