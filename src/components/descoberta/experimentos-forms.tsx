"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { IntField } from "@/components/finance/fields";
import { createExperimentAction, endExperimentAction, startExperimentAction } from "@/app/actions/experimentos";

function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends { ok: boolean; error?: string }>(fn: () => Promise<T>, msg: string, after?: () => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(msg); after?.(); router.refresh(); } else toast.error(r.error); }) };
}
const lab = "flex flex-col text-sm font-medium";

/** Novo experimento: tudo combinado antes (métricas, tamanho mínimo e data de leitura). */
export function NovoExperimento() {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ piece: "PORTA_SUPERDROP", name: "", treatmentPct: 50, primaryMetric: "ATIVACAO_30", guardMetric: "RECEITA_POR_CLIENTE", minPerGroup: 100, readAt: "" });
  return (
    <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Novo experimento" onSubmit={(e) => { e.preventDefault(); run(() => createExperimentAction(f as never), "Experimento criado (em rascunho)", () => setF({ ...f, name: "" })); }}>
      <label className={lab}>Peça<Select className="mt-1" value={f.piece} onChange={(e) => setF({ ...f, piece: e.target.value })}><option value="PORTA_SUPERDROP">Porta de entrada do SuperDrop</option><option value="PORTA_COMMERCE">Porta de entrada da Commerce</option><option value="BENEFICIOS">Benefícios nos painéis</option></Select></label>
      <label className={`${lab} lg:col-span-3`}>Nome<Input className="mt-1" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: teste reverso de 14 dias × hoje" /></label>
      <IntField id="ex-pct" label="% no grupo novo" suffix="%" min={5} value={f.treatmentPct} onChange={(v) => setF({ ...f, treatmentPct: v })} />
      <label className={lab}>Métrica principal<Select className="mt-1" value={f.primaryMetric} onChange={(e) => setF({ ...f, primaryMetric: e.target.value })}><option value="ATIVACAO_30">1ª venda em 30 dias</option><option value="PAGANTE_30">Pagou em 30 dias</option></Select></label>
      <label className={lab}>Métrica de guarda<Select className="mt-1" value={f.guardMetric} onChange={(e) => setF({ ...f, guardMetric: e.target.value })}><option value="RECEITA_POR_CLIENTE">Receita por cliente</option><option value="SAIDA_30">Saída em 30 dias</option></Select></label>
      <IntField id="ex-min" label="Mínimo por grupo" suffix="lojas" min={10} value={f.minPerGroup} onChange={(v) => setF({ ...f, minPerGroup: v })} />
      <label className={lab}>Data de leitura<Input className="mt-1" type="date" required value={f.readAt} onChange={(e) => setF({ ...f, readAt: e.target.value })} /></label>
      <div className="flex items-end"><Button type="submit" loading={pending}>Criar em rascunho</Button></div>
    </form>
  );
}

export function IniciarExperimento({ id }: { id: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" loading={pending} onClick={() => run(() => startExperimentAction(id), "Experimento começou: clientes novos já são sorteados")}>Começar</Button>;
}

export function EncerrarExperimento({ id }: { id: string }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ reading: "", decision: "" });
  return (
    <form className="mt-3 grid gap-2" aria-label="Encerrar experimento" onSubmit={(e) => { e.preventDefault(); run(() => endExperimentAction(id, f.reading, f.decision), "Experimento encerrado com a leitura registrada"); }}>
      <label className={lab}>Leitura (o que os números mostram)<Textarea className="mt-1" value={f.reading} onChange={(e) => setF({ ...f, reading: e.target.value })} /></label>
      <label className={lab}>Decisão<Input className="mt-1" value={f.decision} onChange={(e) => setF({ ...f, decision: e.target.value })} placeholder="Ex.: vira padrão para todos / volta como estava" /></label>
      <Button type="submit" size="sm" variant="secondary" loading={pending} className="justify-self-start">Encerrar com leitura</Button>
    </form>
  );
}
