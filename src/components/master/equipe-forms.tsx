"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { MASTER_FUNCTIONS, MASTER_FUNCTION_LABEL, type MasterFunction } from "@/lib/master-equipe";
import { createMasterMemberAction, updateMasterMemberAction } from "@/app/actions/equipe-master";

function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends { ok: boolean; error?: string }>(fn: () => Promise<T>, msg: string, after?: () => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(msg); after?.(); router.refresh(); } else toast.error(r.error); }) };
}
const lab = "flex flex-col text-sm font-medium";

/** Cadastro de pessoa da equipe do Master (D138). */
export function NovaPessoa() {
  const { pending, run } = useRun();
  const empty = { name: "", email: "", password: "", masterFunction: "COMERCIAL" as MasterFunction };
  const [f, setF] = React.useState(empty);
  return (
    <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Cadastrar pessoa na equipe" onSubmit={(e) => { e.preventDefault(); run(() => createMasterMemberAction(f), "Pessoa cadastrada: ela troca a senha no primeiro acesso", () => setF(empty)); }}>
      <label className={lab}>Nome<Input className="mt-1" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className={lab}>E-mail<Input className="mt-1" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label className={lab}>Senha provisória<Input className="mt-1" type="text" required minLength={10} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      <label className={lab}>Função<Select className="mt-1" value={f.masterFunction} onChange={(e) => setF({ ...f, masterFunction: e.target.value as MasterFunction })}>{MASTER_FUNCTIONS.map((k) => <option key={k} value={k}>{MASTER_FUNCTION_LABEL[k]}</option>)}</Select></label>
      <div className="flex items-end"><Button type="submit" loading={pending}>Cadastrar</Button></div>
    </form>
  );
}

export function PessoaAcoes({ id, fn, disabled, name }: { id: string; fn: MasterFunction; disabled: boolean; name: string }) {
  const { pending, run } = useRun();
  const [v, setV] = React.useState(fn);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select aria-label={`Função de ${name}`} className="h-9 w-44" value={v} onChange={(e) => setV(e.target.value as MasterFunction)}>{MASTER_FUNCTIONS.map((k) => <option key={k} value={k}>{MASTER_FUNCTION_LABEL[k]}</option>)}</Select>
      <Button size="sm" variant="secondary" disabled={v === fn} loading={pending} onClick={() => run(() => updateMasterMemberAction(id, { masterFunction: v }), "Função atualizada")}>Gravar</Button>
      <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => updateMasterMemberAction(id, { disabled: !disabled }), disabled ? "Acesso devolvido" : "Acesso encerrado")}>{disabled ? "Devolver acesso" : "Encerrar acesso"}</Button>
    </div>
  );
}
