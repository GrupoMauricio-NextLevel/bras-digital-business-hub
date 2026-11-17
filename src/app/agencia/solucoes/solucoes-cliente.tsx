"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { abrirSolucaoAction, conectarAoBusinessAction } from "@/app/actions/solucoes-agencia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Conectar ao NextLevel Business (D323): escolhe o caminho, confirma o e-mail do perfil e aceita ligar os perfis. */
export function Conectar({ emailSugerido, business }: { emailSugerido: string; business: boolean }) {
  const router = useRouter();
  const [formato, setFormato] = React.useState<"SITE" | "LOJA">(business ? "SITE" : "LOJA");
  const [email, setEmail] = React.useState(emailSugerido); const [aceite, setAceite] = React.useState(false);
  const [pending, start] = React.useTransition();
  return (
    <form className="grid gap-4" aria-label="Conectar ao NextLevel Business" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await conectarAoBusinessAction({ formato, email, aceite: aceite as true }); if (r.ok) { toast.success("Conectado! A conta do negócio da agência está pronta."); router.refresh(); } else toast.error(r.error); }); }}>
      {business ? (
        <fieldset className="grid gap-2 sm:grid-cols-2"><legend className="mb-1 text-sm font-medium">Começar por</legend>
          {([["SITE", "Site da agência", "Páginas institucionais, serviços e formulário de contato, com o modelo pronto publicado."], ["LOJA", "Loja virtual", "Catálogo, carrinho e checkout. O site pode ser ligado depois."]] as const).map(([v, t, d]) => (
            <label key={v} className={`flex min-h-11 cursor-pointer gap-3 rounded-xl border p-3 text-sm ${formato === v ? "border-[var(--ds-link)] bg-[var(--ds-link)]/5" : "border-border"}`}>
              <input type="radio" name="formato" value={v} checked={formato === v} onChange={() => setFormato(v)} className="mt-1 size-4" />
              <span><b className="block">{t}</b><span className="text-muted-foreground">{d}</span></span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <label className="text-sm font-medium">E-mail do perfil do negócio<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" /><span className="mt-1 block text-xs font-normal text-muted-foreground">Cada perfil tem o próprio e-mail. O sugerido chega na mesma caixa do seu (com &quot;+negocio&quot;). Você troca de perfil por aqui, sem senha nova.</span></label>
      <label className="flex min-h-11 items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />Concordo em criar a conta do negócio da agência no NextLevel Business, com o plano e o teste de sempre, e em ligá-la ao meu login (Suas marcas).</label>
      <div><Button type="submit" loading={pending} disabled={!aceite}>Conectar ao NextLevel Business</Button></div>
    </form>
  );
}

/** Abre a tela da solução no painel do negócio, trocando de perfil sem novo login. */
export function Abrir({ destino, children, variant = "secondary" }: { destino: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant={variant} loading={pending} onClick={() => start(async () => { const r = await abrirSolucaoAction(destino); if (r.ok) window.location.assign(r.data.redirectTo); else toast.error(r.error); })}>{children}</Button>;
}
