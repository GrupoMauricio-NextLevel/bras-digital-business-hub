"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { convidarMembroAction, desligarMembroAction, mudarFuncaoAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgenciaFuncao } from "@/db/schema";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
type Funcoes = { v: AgenciaFuncao; l: string }[];

/** O administrador cria o acesso com senha provisória (a pessoa troca no primeiro login). Nada é enviado por e-mail. */
export function ConvidarMembro({ funcoes }: { funcoes: Funcoes }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button onClick={() => setAberto(true)}><UserPlus aria-hidden />Adicionar pessoa</Button>;
  return (
    <form aria-label="Adicionar pessoa" className="ds-card grid w-full gap-3 sm:w-[28rem]" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      start(async () => {
        const r = await convidarMembroAction({ nome: String(f.get("nome")), email: String(f.get("email")), senha: String(f.get("senha")), funcao: String(f.get("funcao")) as AgenciaFuncao, todosClientes: f.get("todos") === "on" });
        if (r.ok) { toast.success("Acesso criado. Passe o e-mail e a senha provisória para a pessoa."); setAberto(false); router.refresh(); } else toast.error(r.error);
      });
    }}>
      <label className="text-sm font-medium">Nome<Input name="nome" required minLength={2} maxLength={120} className="mt-1" /></label>
      <label className="text-sm font-medium">E-mail<Input name="email" type="email" required maxLength={160} className="mt-1" /></label>
      <label className="text-sm font-medium">Função<select name="funcao" defaultValue="EDICAO" className={campo}>{funcoes.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</select></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="todos" className="size-4" />Vê todos os clientes (sem valores)</label>
      <label className="text-sm font-medium">Senha provisória<Input name="senha" type="text" required minLength={8} maxLength={200} autoComplete="off" className="mt-1" /></label>
      <div className="flex gap-2"><Button type="submit" loading={pending}>Criar acesso</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

export function AcoesDoMembro({ userId, nome, funcao, todosClientes, funcoes }: { userId: string; nome: string; funcao: AgenciaFuncao; todosClientes: boolean; funcoes: Funcoes }) {
  const router = useRouter();
  const [f, setF] = React.useState(funcao);
  const [todos, setTodos] = React.useState(todosClientes);
  const [pending, start] = React.useTransition();
  const mudou = f !== funcao || todos !== todosClientes;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`f-${userId}`}>Função de {nome}</label>
      <select id={`f-${userId}`} value={f} onChange={(e) => setF(e.target.value as AgenciaFuncao)} className="h-10 rounded-md border border-border bg-surface px-2 text-sm">{funcoes.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</select>
      <label className="flex min-h-11 items-center gap-1.5 text-xs"><input type="checkbox" className="size-4" checked={todos} onChange={(e) => setTodos(e.target.checked)} />todos os clientes</label>
      {mudou ? <Button size="sm" loading={pending} onClick={() => start(async () => { const r = await mudarFuncaoAction(userId, { funcao: f, todosClientes: todos }); if (r.ok) { toast.success("Função atualizada."); router.refresh(); } else toast.error(r.error); })}>Salvar</Button> : null}
      <Button size="sm" variant="ghost" loading={pending} onClick={() => { if (!confirm(`Encerrar o acesso de ${nome}? A pessoa não entra mais no painel.`)) return; start(async () => { const r = await desligarMembroAction(userId); if (r.ok) { toast.success("Acesso encerrado."); router.refresh(); } else toast.error(r.error); }); }}>Encerrar acesso</Button>
    </div>
  );
}
