"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { criarAgenciaAction, marcarAgenciaInternaAction, mudarSituacaoDaAgenciaAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NovaAgencia() {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (!aberto) return <Button onClick={() => setAberto(true)}><Plus aria-hidden />Nova agência</Button>;
  return (
    <form aria-label="Nova agência" className="ds-card grid w-full gap-3 sm:w-[28rem]" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      start(async () => {
        const r = await criarAgenciaAction({ nome: String(f.get("nome")), fundadora: f.get("fundadora") === "on", responsavel: { nome: String(f.get("rnome")), email: String(f.get("remail")), senha: String(f.get("rsenha")) } });
        if (r.ok) { toast.success("Agência criada. Passe o e-mail e a senha provisória ao administrador."); setAberto(false); router.refresh(); } else toast.error(r.error);
      });
    }}>
      <label className="text-sm font-medium">Nome da agência<Input name="nome" required minLength={2} maxLength={120} className="mt-1" /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="fundadora" className="size-4" />Agência Fundadora</label>
      <fieldset className="grid gap-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-semibold">Administrador da agência</legend>
        <label className="text-sm font-medium">Nome<Input name="rnome" required minLength={2} maxLength={120} className="mt-1" /></label>
        <label className="text-sm font-medium">E-mail<Input name="remail" type="email" required maxLength={160} className="mt-1" /></label>
        <label className="text-sm font-medium">Senha provisória<Input name="rsenha" type="text" required minLength={8} maxLength={200} autoComplete="off" className="mt-1" /></label>
      </fieldset>
      <div className="flex gap-2"><Button type="submit" loading={pending}>Criar agência</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

export function SituacaoDaAgencia({ id, situacao }: { id: string; situacao: "PILOTO" | "ATIVA" | "PAUSADA" }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const opcoes = [["PILOTO", "Piloto"], ["ATIVA", "Ativa"], ["PAUSADA", "Pausar acesso"]] as const;
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.filter(([v]) => v !== situacao).map(([v, l]) => (
        <Button key={v} size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { const r = await mudarSituacaoDaAgenciaAction(id, v); if (r.ok) { toast.success("Situação atualizada."); router.refresh(); } else toast.error(r.error); })}>{l}</Button>
      ))}
    </div>
  );
}

/** Agência interna (D342): a própria NextLevel Marketing Ltda. Usa os dados e o Pix da empresa e traz contratos do Master. */
export function AgenciaInterna({ id, interna, nome }: { id: string; interna: boolean; nome: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant={interna ? "ghost" : "secondary"} loading={pending} onClick={() => { if (!interna && !confirm(`Marcar ${nome} como a agência interna da NextLevel? Os contratos dela saem com os dados e o Pix da NextLevel Marketing Ltda e ela pode trazer contratos de serviço do Master.`)) return; start(async () => { const r = await marcarAgenciaInternaAction(id, !interna); if (r.ok) { toast.success(interna ? "Deixou de ser a agência interna." : "Agência interna marcada."); router.refresh(); } else toast.error(r.error); }); }}>{interna ? "Desmarcar interna" : "Marcar como agência interna"}</Button>;
}
