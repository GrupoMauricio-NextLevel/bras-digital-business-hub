"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ajusteNoPortalAction, aprovarNoPortalAction, entrarPortalAction, pedirCodigoPortalAction, sairPortalAction, solicitacaoNoPortalAction } from "@/app/actions/portal-agencia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";

/** Entrada sem senha (D320, mesmo mecanismo da D240): e-mail → código de 6 dígitos. */
export function EntrarPortal({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState(""); const [codigo, setCodigo] = React.useState(""); const [enviado, setEnviado] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (!enviado) return (
    <form className="mt-4 grid gap-3" aria-label="Receber código" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await pedirCodigoPortalAction(slug, email); if (r.ok) setEnviado(true); else toast.error(r.error); }); }}>
      <label className="text-sm font-medium">Seu e-mail<Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" /></label>
      <Button type="submit" loading={pending}>Receber código</Button>
    </form>
  );
  return (
    <form className="mt-4 grid gap-3" aria-label="Entrar com o código" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await entrarPortalAction(slug, email, codigo); if (r.ok) router.refresh(); else toast.error(r.error); }); }}>
      <p className="text-sm text-muted-foreground">Se <b>{email}</b> estiver cadastrado, chegou um código de 6 dígitos. Ele vale por 10 minutos.</p>
      <label className="text-sm font-medium">Código<Input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} className="mt-1 text-center font-mono text-lg tracking-[0.4em]" /></label>
      <Button type="submit" loading={pending} disabled={codigo.length !== 6}>Entrar</Button>
      <button type="button" className="min-h-11 text-sm text-muted-foreground underline" onClick={() => setEnviado(false)}>Usar outro e-mail</button>
    </form>
  );
}

export function SairPortal({ slug }: { slug: string }) {
  const router = useRouter();
  return <button type="button" className="min-h-11 text-sm font-semibold text-link underline underline-offset-4" onClick={async () => { await sairPortalAction(slug); router.refresh(); }}>Sair</button>;
}

export function AprovarConteudo({ slug, clienteId, pecaId }: { slug: string; clienteId: string; pecaId: string }) {
  const router = useRouter();
  const [ajuste, setAjuste] = React.useState(false); const [texto, setTexto] = React.useState("");
  const [pending, start] = React.useTransition();
  const rodar = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button loading={pending} onClick={() => rodar(() => aprovarNoPortalAction(slug, clienteId, pecaId), "Aprovado! A agência já recebeu.")}>Aprovar</Button>
        <Button variant="secondary" onClick={() => setAjuste(!ajuste)}>Pedir ajuste</Button>
      </div>
      {ajuste ? (
        <div>
          <label className="text-sm font-medium">O que precisa mudar<textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={2000} className={`${campo} h-auto py-2`} /></label>
          <Button className="mt-2" variant="secondary" disabled={texto.trim().length < 3} loading={pending} onClick={() => rodar(() => ajusteNoPortalAction(slug, clienteId, pecaId, texto), "Pedido de ajuste enviado à agência.")}>Enviar pedido de ajuste</Button>
        </div>
      ) : null}
    </div>
  );
}

export function NovaSolicitacao({ slug, clienteId }: { slug: string; clienteId: string }) {
  const router = useRouter();
  const [tipo, setTipo] = React.useState<"PEDIDO" | "IDEIA" | "DUVIDA">("PEDIDO"); const [texto, setTexto] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form className="grid gap-2" aria-label="Falar com a agência" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await solicitacaoNoPortalAction(slug, clienteId, { tipo, texto }); if (r.ok) { toast.success("Enviado para a agência."); setTexto(""); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="text-sm font-medium">Tipo<select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={campo}><option value="PEDIDO">Pedido</option><option value="IDEIA">Ideia</option><option value="DUVIDA">Dúvida</option></select></label>
      <label className="text-sm font-medium">Mensagem<textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={2000} required className={`${campo} h-auto py-2`} /></label>
      <div><Button type="submit" loading={pending} disabled={texto.trim().length < 3}>Enviar</Button></div>
    </form>
  );
}
