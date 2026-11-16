"use client";
import * as React from "react";
import { submitLeadAction } from "@/app/actions/leads";
import { conversaoAnuncio } from "@/components/portal/tags-anuncio";

const field = "mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

type Caminho = "site" | "loja" | "indeciso";
const OPCOES: { v: Caminho; t: string; d: string }[] = [
  { v: "site", t: "Site para minha empresa", d: "Páginas da empresa, serviços e pedidos de orçamento" },
  { v: "loja", t: "Loja virtual", d: "Vender online com catálogo, carrinho, Pix e cartão" },
  { v: "indeciso", t: "Ainda não sei", d: "A equipe ajuda você a escolher" },
];

/**
 * Formulário "Quero minha loja" (D218). Com o NextLevel Business ligado (NB1, D304), pergunta primeiro o caminho:
 * site para a empresa ou loja virtual. `caminhoInicial` vem do endereço (`?para=site|loja` ou `/quero-meu-site`).
 */
export function LeadForm({ brandName, accent, perguntarCaminho = false, caminhoInicial }: { brandName: string; accent: string; perguntarCaminho?: boolean; caminhoInicial?: Caminho }) {
  const [caminho, setCaminho] = React.useState<Caminho | undefined>(caminhoInicial);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  if (done) return <div role="status" className="mt-8 rounded-xl border border-border bg-surface-muted p-6"><h2 className="text-lg font-bold">Recebemos o seu contato!</h2><p className="mt-2 text-sm text-body">A equipe da {brandName} fala com você pelo WhatsApp em até 1 dia útil. Enviamos também uma confirmação por e-mail.</p></div>;
  return (
    <form className="mt-8 space-y-4" onSubmit={(e) => {
      e.preventDefault(); setError(null); const f = new FormData(e.currentTarget);
      start(async () => { const r = await submitLeadAction({ name: String(f.get("name")), email: String(f.get("email")), phone: String(f.get("phone")), storeName: String(f.get("storeName") ?? "") || undefined, segment: String(f.get("segment") ?? "") || undefined, message: String(f.get("message") ?? "") || undefined, caminho: perguntarCaminho ? caminho : undefined }); if (r.ok) { conversaoAnuncio("Lead", r.data.eventoId); setDone(true); } else setError(r.error); });
    }}>
      {perguntarCaminho ? (
        <fieldset>
          <legend className="text-sm font-medium">O que você quer?</legend>
          <div className="mt-2 grid gap-2">
            {OPCOES.map((o) => (
              <label key={o.v} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${caminho === o.v ? "border-[var(--ds-link)] bg-[var(--ds-link)]/5" : "border-border"}`}>
                <input type="radio" name="caminho" value={o.v} checked={caminho === o.v} onChange={() => setCaminho(o.v)} required className="mt-1 size-4 accent-[var(--ds-link)]" />
                <span><b className="block font-semibold">{o.t}</b><span className="text-xs text-muted-foreground">{o.d}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <label className="block text-sm font-medium">Seu nome<input name="name" required minLength={3} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-medium">E-mail<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="block text-sm font-medium">WhatsApp com DDD<input name="phone" type="tel" required autoComplete="tel" className={field} /></label>
      <label className="block text-sm font-medium">{caminho === "site" ? "Nome da empresa (opcional)" : "Nome da loja ou marca (opcional)"}<input name="storeName" className={field} /></label>
      <label className="block text-sm font-medium">{caminho === "site" ? "O que a sua empresa faz? (opcional)" : "O que você vende? (opcional)"}<input name="segment" placeholder={caminho === "site" ? "Ex.: vidraçaria, academia, clínica…" : "Ex.: moda feminina, atacado de camisas…"} className={field} /></label>
      <label className="block text-sm font-medium">Quer contar mais alguma coisa? (opcional)<textarea name="message" rows={3} maxLength={600} className={`${field} h-auto py-2`} /></label>
      {error ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-lg px-5 text-base font-semibold text-band-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" style={{ background: accent }}>{pending ? "Enviando…" : "Enviar"}</button>
      <p className="text-xs text-muted-foreground">Usamos seus dados só para falar sobre o seu {caminho === "site" ? "site" : "negócio"}. Você pode pedir a exclusão a qualquer momento.</p>
    </form>
  );
}
