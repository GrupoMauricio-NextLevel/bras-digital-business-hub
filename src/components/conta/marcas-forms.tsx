"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkProfileAction, switchProfileAction, unlinkProfileAction } from "@/app/actions/conta-grupo";

/** Ligar outro perfil (D141): e-mail e senha do outro perfil + aceite. */
export function LigarPerfil() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const empty = { email: "", password: "", consent: false };
  const [f, setF] = React.useState(empty);
  return (
    <form aria-label="Ligar outro perfil" className="grid gap-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await linkProfileAction({ email: f.email, password: f.password, consent: f.consent as true }); if (r.ok) { toast.success("Perfil ligado à sua conta do grupo"); setF(empty); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="flex flex-col text-sm font-medium" htmlFor="g-email">E-mail do outro perfil<Input id="g-email" className="mt-1" type="email" autoComplete="off" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label className="flex flex-col text-sm font-medium" htmlFor="g-pass">Senha do outro perfil<Input id="g-pass" className="mt-1" type="password" autoComplete="off" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      <label className="flex items-start gap-2 text-sm" htmlFor="g-ok">
        <input id="g-ok" type="checkbox" className="mt-1 size-4" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
        <span>Os dois perfis são meus. Concordo em ligá-los para trocar de um para o outro sem novo login e entrar com a mesma senha em qualquer marca do grupo. Cada perfil continua com os próprios dados; posso desligar quando quiser.</span>
      </label>
      <div><Button type="submit" loading={pending} disabled={!f.consent || !f.email || !f.password}>Ligar perfil</Button></div>
    </form>
  );
}

export function PerfilAcoes({ id, name, current, brandName }: { id: string; name: string; current: boolean; brandName: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const go = () => start(async () => { const r = await switchProfileAction(id); if (r.ok) window.location.assign(r.data.redirectTo); else toast.error(r.error); });
  const off = () => start(async () => { const r = await unlinkProfileAction(id); if (r.ok) { toast.success("Perfil desligado da conta do grupo"); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="flex flex-wrap gap-2">
      {!current ? <Button size="sm" loading={pending} onClick={go} aria-label={`Entrar no perfil ${name} da ${brandName}`}>Entrar</Button> : null}
      <Button size="sm" variant="ghost" loading={pending} onClick={off} aria-label={`Desligar o perfil ${name} da ${brandName}`}>Desligar</Button>
    </div>
  );
}
