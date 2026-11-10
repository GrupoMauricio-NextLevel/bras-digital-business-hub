"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aceitarContratoAction } from "@/app/actions/contratos";

/** Aceite do contrato (D276): "Li e concordo", o nome completo e um clique. */
export function AceiteContrato({ id, hash, nomeSugerido }: { id: string; hash: string; nomeSugerido: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [li, setLi] = React.useState(false);
  const [nome, setNome] = React.useState(nomeSugerido);
  const idCheck = React.useId(), idNome = React.useId();
  return (
    <form className="ds-card grid gap-3 border-2 border-[#294cdc] p-5" aria-label="Aceitar contrato" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await aceitarContratoAction(id, { concordo: li, hashVisto: hash, nome });
      if (r.ok) { toast.success("Contrato aceito! A cópia assinada foi para o seu e-mail."); router.refresh(); } else toast.error(r.error ?? "Não foi possível aceitar.");
    }); }}>
      <h2 className="text-base font-semibold">Aceite do contrato</h2>
      <label htmlFor={idNome} className="grid gap-1 text-sm font-medium">Seu nome completo<Input id={idNome} value={nome} onChange={(e) => setNome(e.target.value)} required minLength={3} autoComplete="name" /></label>
      <label htmlFor={idCheck} className="flex items-start gap-3 text-sm">
        <input id={idCheck} type="checkbox" className="mt-1 size-5 accent-[#294cdc]" checked={li} onChange={(e) => setLi(e.target.checked)} />
        <span>Li e concordo com todas as cláusulas deste contrato.</span>
      </label>
      <p className="text-xs text-muted-foreground">Ao aceitar, registramos a data, a hora, o endereço de rede, o aparelho e a impressão digital do texto. A cópia assinada pelas duas partes vai para o seu e-mail e fica aqui em Contratos.</p>
      <div><Button type="submit" size="lg" loading={pending} disabled={!li || nome.trim().length < 3}><FileSignature /> Aceitar contrato</Button></div>
    </form>
  );
}
