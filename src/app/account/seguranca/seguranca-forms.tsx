"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmarDuasEtapasAction, desligarDuasEtapasAction, iniciarDuasEtapasAction, sairDosOutrosAparelhosAction } from "@/app/actions/seguranca";

export function SairDosOutros() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <section aria-labelledby="sair-outros" className="rounded-lg border border-border p-4 text-sm">
      <h2 id="sair-outros" className="font-semibold">Sair dos outros aparelhos</h2>
      <p className="mt-1 text-body">Encerra a sua conta em todos os outros celulares e computadores. Este aparelho continua conectado.</p>
      <Button className="mt-3" variant="secondary" loading={pending} onClick={() => { if (window.confirm("Sair de todos os outros aparelhos?")) start(async () => { const r = await sairDosOutrosAparelhosAction(); if (r.ok) { toast.success("Pronto: os outros aparelhos foram desconectados."); router.refresh(); } else toast.error(r.error); }); }}>Sair dos outros aparelhos</Button>
    </section>
  );
}

export function DuasEtapas({ ligada, desde, restantes }: { ligada: boolean; desde: string | null; restantes: number }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [qr, setQr] = React.useState<{ segredo: string; qr: string } | null>(null);
  const [codigo, setCodigo] = React.useState("");
  const [codigos, setCodigos] = React.useState<string[] | null>(null);
  return (
    <section aria-labelledby="duas-etapas" className="rounded-lg border border-border p-4 text-sm">
      <h2 id="duas-etapas" className="font-semibold">Verificação em duas etapas</h2>
      {codigos ? (
        <div className="mt-2 space-y-2">
          <p className="text-body"><strong>Ligada.</strong> Guarde estes códigos de recuperação num lugar seguro. Cada um vale uma vez, se você ficar sem o celular. Eles não aparecem de novo.</p>
          <ul className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-3 font-mono">{codigos.map((c) => <li key={c}>{c}</li>)}</ul>
          <Button variant="secondary" onClick={() => { setCodigos(null); router.refresh(); }}>Já guardei</Button>
        </div>
      ) : ligada ? (
        <div className="mt-1 space-y-3">
          <p className="text-body">Ligada desde {desde}. Ao entrar, além da senha, pedimos o código do aplicativo. Códigos de recuperação restantes: {restantes}.</p>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (window.confirm("Desligar a verificação em duas etapas? A conta fica menos protegida.")) start(async () => { const r = await desligarDuasEtapasAction(codigo); if (r.ok) { toast.success("Verificação em duas etapas desligada."); setCodigo(""); router.refresh(); } else toast.error(r.error); }); }}>
            <label className="text-sm font-medium">Código atual<Input className="mt-1 w-40" inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></label>
            <Button type="submit" variant="ghost" loading={pending} disabled={codigo.length < 6}>Desligar</Button>
          </form>
        </div>
      ) : qr ? (
        <div className="mt-2 space-y-3">
          <p className="text-body">1. No celular, abra um aplicativo autenticador (Google Authenticator, Microsoft Authenticator ou outro) e leia o QR.</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no servidor como data URL */}
          <img src={qr.qr} width={220} height={220} alt="QR para o aplicativo autenticador" className="rounded-lg border border-border bg-white" />
          <p className="text-xs text-muted-foreground">Sem câmera? Digite esta chave no aplicativo: <span className="break-all font-mono">{qr.segredo}</span></p>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await confirmarDuasEtapasAction(codigo); if (r.ok) { setCodigos(r.data.codigos); setQr(null); setCodigo(""); } else toast.error(r.error); }); }}>
            <label className="text-sm font-medium">2. Digite o código que aparece<Input className="mt-1 w-40" inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></label>
            <Button type="submit" loading={pending} disabled={codigo.length < 6}>Ligar</Button>
          </form>
        </div>
      ) : (
        <div className="mt-1 space-y-3">
          <p className="text-body">Protege a conta mesmo se alguém descobrir a sua senha: para entrar, também é preciso o código que muda a cada 30 segundos no seu celular.</p>
          <Button loading={pending} onClick={() => start(async () => { const r = await iniciarDuasEtapasAction(); if (r.ok) setQr(r.data); else toast.error(r.error); })}>Ligar a verificação em duas etapas</Button>
        </div>
      )}
    </section>
  );
}
