"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSignature, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aceitarTermosAction } from "@/app/actions/contratos";

/** Aceite obrigatório dos termos de uso (D279): sem ele o painel não abre. */
export function AceiteTermos({ hash, nomeSugerido, logout }: { hash: string; nomeSugerido: string; logout: () => Promise<void> }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [li, setLi] = React.useState(false);
  const [nome, setNome] = React.useState(nomeSugerido);
  const idCheck = React.useId(), idNome = React.useId();
  return (
    <div className="grid gap-3">
      <form className="ds-card grid gap-3 border-2 border-[#294cdc] p-5" aria-label="Aceitar os termos de uso" onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await aceitarTermosAction({ concordo: li, hashVisto: hash, nome });
        if (r.ok) { toast.success("Termos aceitos. Bem-vindo à NextLevel Commerce!"); router.refresh(); } else toast.error(r.error ?? "Não foi possível registrar o aceite.");
      }); }}>
        <h2 className="text-base font-semibold">Aceite dos termos de uso</h2>
        <label htmlFor={idNome} className="grid gap-1 text-sm font-medium">Seu nome completo<Input id={idNome} value={nome} onChange={(e) => setNome(e.target.value)} required minLength={3} autoComplete="name" /></label>
        <label htmlFor={idCheck} className="flex items-start gap-3 text-sm">
          <input id={idCheck} type="checkbox" className="mt-1 size-5 accent-[#294cdc]" checked={li} onChange={(e) => setLi(e.target.checked)} />
          <span>Li e concordo com os termos de uso da plataforma NextLevel Commerce.</span>
        </label>
        <p className="text-xs text-muted-foreground">Registramos a data, a hora, o endereço de rede, o aparelho e a impressão digital do texto. A confirmação vai para o seu e-mail, e os termos ficam sempre em /termos.</p>
        <div><Button type="submit" size="lg" loading={pending} disabled={!li || nome.trim().length < 3}><FileSignature /> Aceitar e continuar</Button></div>
      </form>
      <form action={logout}><Button type="submit" variant="ghost" size="sm"><LogOut /> Agora não, sair</Button></form>
    </div>
  );
}
