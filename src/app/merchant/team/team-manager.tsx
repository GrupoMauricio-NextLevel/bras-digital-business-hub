"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteStaffAction, removeStaffAction } from "@/app/actions/team";

type Row = { id: string; name: string; email: string; owner: boolean; disabled: boolean; ultimoAcesso: string | null };

export function TeamManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({ name: "", email: "", password: "" });
  return (
    <div className="max-w-2xl space-y-6">
      <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">Crie um acesso para cada pessoa e nunca compartilhe a sua senha. Assim você sabe quem fez o quê e pode encerrar um acesso sem trocar o seu. <Link href="/account/seguranca" className="font-medium underline underline-offset-2">Segurança da sua conta</Link></p>
      <form className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await inviteStaffAction(f); if (r.ok) { toast.success("Acesso criado. Passe o e-mail e a senha provisória para a pessoa."); setF({ name: "", email: "", password: "" }); router.refresh(); } else toast.error(r.error); }); }}>
        <label className="text-sm font-medium">Nome<Input className="mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="text-sm font-medium">E-mail<Input className="mt-1" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="text-sm font-medium">Senha provisória<Input className="mt-1" type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="mínimo 8 caracteres" /></label>
        <div className="sm:col-span-3"><Button type="submit" loading={pending} disabled={!f.name || !f.email || f.password.length < 8}>Dar acesso</Button><span className="ml-3 text-xs text-muted-foreground">A pessoa troca a senha no primeiro acesso. Nenhum e-mail é enviado.</span></div>
      </form>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div><div className="font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.email}</div><div className="text-xs text-muted-foreground">Última entrada: {m.ultimoAcesso ?? "ainda não entrou"}</div></div>
            <span className="text-xs">{m.owner ? "Dono" : m.disabled ? "Acesso encerrado" : "Equipe"}</span>
            {!m.owner && !m.disabled ? <Button variant="ghost" loading={pending} onClick={() => { if (window.confirm(`Encerrar o acesso de ${m.name}?`)) start(async () => { const r = await removeStaffAction(m.id); if (r.ok) { toast.success("Acesso encerrado"); router.refresh(); } else toast.error(r.error); }); }}>Encerrar acesso</Button> : <span />}
          </li>
        ))}
      </ul>
    </div>
  );
}
