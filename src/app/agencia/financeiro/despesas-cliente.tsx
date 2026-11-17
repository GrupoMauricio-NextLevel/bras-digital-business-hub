"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CopyPlus, Plus, Trash2 } from "lucide-react";
import { copiarRecorrentesAction, excluirDespesaAction, lancarDespesaAction, marcarDespesaPagaAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
const CATS = [["FREELANCER", "Freelancer"], ["FIXO", "Custo fixo"], ["VARIAVEL", "Custo variável"], ["FERRAMENTA", "Ferramenta"], ["IMPOSTO", "Imposto"], ["OUTRO", "Outro"]] as const;
function useRodar() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const rodar = <T,>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, ok: (d: T) => string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok(r.data)); router.refresh(); } else toast.error(r.error); });
  return { pending, rodar };
}

export function NovaDespesa({ mes, clientes }: { mes: string; clientes: { id: string; nome: string }[] }) {
  const { pending, rodar } = useRodar();
  const [aberto, setAberto] = React.useState(false);
  const [valor, setValor] = React.useState(0);
  if (!aberto) return <Button variant="secondary" size="sm" onClick={() => setAberto(true)}><Plus aria-hidden />Lançar despesa</Button>;
  return (
    <form aria-label="Lançar despesa" className="ds-card grid w-full gap-3 sm:w-[30rem]" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); rodar(() => lancarDespesaAction({ competencia: mes, descricao: String(f.get("descricao")), categoria: String(f.get("categoria")) as (typeof CATS)[number][0], valorCents: valor, clienteId: String(f.get("cliente") ?? "") || null, favorecido: String(f.get("favorecido") ?? ""), pago: f.get("pago") === "on", recorrente: f.get("recorrente") === "on" }), () => "Despesa lançada."); setAberto(false); setValor(0); }}>
      <label className="text-sm font-medium">O que é<Input name="descricao" required minLength={2} maxLength={160} placeholder="Ex.: captação do Felipe" className="mt-1" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Tipo<select name="categoria" className={campo}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <MoneyInput label="Valor" valueCents={valor} onChange={setValor} />
        <label className="text-sm font-medium">Cliente (se o custo for de um cliente)<select name="cliente" className={campo}><option value="">Custo geral da agência</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <label className="text-sm font-medium">Quem recebe<Input name="favorecido" maxLength={120} placeholder="Ex.: Felipe (freelancer)" className="mt-1" /></label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm"><label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="pago" className="size-4" />Já paga</label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="recorrente" className="size-4" />Repete todo mês</label></div>
      <div className="flex gap-2"><Button type="submit" loading={pending} disabled={!valor}>Lançar</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

export function CopiarRecorrentes({ mes }: { mes: string }) {
  const { pending, rodar } = useRodar();
  return <Button variant="ghost" size="sm" loading={pending} onClick={() => rodar(() => copiarRecorrentesAction(mes), (d) => (d.copiadas ? `${d.copiadas} despesa(s) fixa(s) trazida(s).` : "Nada novo para trazer do mês anterior."))}><CopyPlus aria-hidden />Trazer fixas do mês anterior</Button>;
}

export function AcoesDaDespesa({ id, pago }: { id: string; pago: boolean }) {
  const { pending, rodar } = useRodar();
  return (
    <span className="flex items-center gap-1">
      <label className="flex min-h-11 items-center gap-1.5 text-xs"><input type="checkbox" className="size-4" checked={pago} disabled={pending} onChange={(e) => rodar(() => marcarDespesaPagaAction(id, e.target.checked), () => (e.target.checked ? "Marcada como paga." : "Desmarcada."))} />paga</label>
      {!pago ? <Button size="sm" variant="ghost" aria-label="Apagar despesa" loading={pending} onClick={() => { if (confirm("Apagar esta despesa?")) rodar(() => excluirDespesaAction(id), () => "Despesa apagada."); }}><Trash2 aria-hidden /></Button> : null}
    </span>
  );
}
