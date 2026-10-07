"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Copy, X } from "lucide-react";
import { claimWelcomeCouponAction } from "@/app/actions/storefront";
import { cn } from "@/lib/utils";

type Props = {
  slug: string; storeId: string; preview: boolean; delay: number;
  image: string; imageAvif: string; alt: string; eyebrow: string; title: string; subtitle: string; ctaLabel: string; note: string;
  offer: { label: string; minText: string | null };
};

const seenKey = (storeId: string) => `nl-welcome:${storeId}`;
const emph = (t: string) => t.split(/\*([^*]+)\*/g).map((p, k) => (k % 2 ? <em key={k} className="italic" style={{ color: "color-mix(in srgb, var(--sf-accent) 80%, currentColor)" }}>{p}</em> : <React.Fragment key={k}>{p}</React.Fragment>));

/**
 * Janela do cupom de boas-vindas: aparece uma vez por visitante (lembrada no navegador), depois de alguns segundos ou
 * quando o mouse sai da janela. Fechar também conta como visto. No editor, é um cartão fixo na página.
 */
/** Variáveis do tema que a janela precisa (ela abre fora da página, então copia as cores da loja). */
const THEME_VARS = ["--sf-primary", "--sf-on-primary", "--sf-accent", "--sf-on-accent", "--sf-radius", "--sf-font-heading", "--sf-font-body"];

export function WelcomeCouponDialog(p: Props) {
  const [open, setOpen] = React.useState(false);
  const anchor = React.useRef<HTMLSpanElement>(null);
  const [vars, setVars] = React.useState<React.CSSProperties>({});
  React.useEffect(() => {
    if (!open || !anchor.current) return;
    const cs = getComputedStyle(anchor.current);
    setVars(Object.fromEntries(THEME_VARS.map((v) => [v, cs.getPropertyValue(v)]).filter(([, x]) => x)) as React.CSSProperties);
  }, [open]);
  React.useEffect(() => {
    if (p.preview) return;
    try { if (localStorage.getItem(seenKey(p.storeId))) return; } catch { /* sem armazenamento: mostra mesmo assim */ }
    const show = () => setOpen(true);
    const t = window.setTimeout(show, p.delay * 1000);
    const out = (e: MouseEvent) => { if (!e.relatedTarget && e.clientY <= 0) show(); };
    document.addEventListener("mouseout", out);
    return () => { window.clearTimeout(t); document.removeEventListener("mouseout", out); };
  }, [p.preview, p.storeId, p.delay]);
  const change = (o: boolean) => { setOpen(o); if (!o) { try { localStorage.setItem(seenKey(p.storeId), "1"); } catch { /* ignora */ } } };

  if (p.preview) {
    return (
      <section aria-label="Cupom de boas-vindas (prévia)" className="mt-10 rounded-[var(--sf-radius,16px)] border border-dashed border-neutral-300 p-3" data-welcome-preview>
        <p className="mb-3 text-xs text-neutral-500">Prévia da janela de boas-vindas: na loja, ela abre uma vez para cada visitante.</p>
        <Card {...p} />
      </section>
    );
  }
  return (
    <>
      <span ref={anchor} hidden />
      <DialogPrimitive.Root open={open} onOpenChange={change}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50 motion-safe:animate-fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[61] max-h-[92svh] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto focus:outline-none [font-family:var(--sf-font-body)]" style={vars} data-welcome-dialog>
            <Card {...p} onClose={() => change(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

function Card(p: Props & { onClose?: () => void }) {
  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [code, setCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const Title = p.onClose ? DialogPrimitive.Title : "h2";
  const Desc = p.onClose ? DialogPrimitive.Description : "p";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (p.preview) return;
    setBusy(true); setError("");
    const r = await claimWelcomeCouponAction(p.slug, { email, consent });
    setBusy(false);
    if (r.ok) setCode(r.data.code); else setError(r.error);
  };
  return (
    <div className="relative grid overflow-hidden rounded-[var(--sf-radius,16px)] bg-white text-neutral-950 shadow-2xl sm:grid-cols-[0.9fr_1.1fr]">
      {p.image ? (
        <picture className="relative hidden aspect-square sm:block sm:aspect-auto">
          {p.imageAvif ? <source type="image/avif" srcSet={p.imageAvif} /> : null}
          <img src={p.image} alt={p.alt} className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" />
        </picture>
      ) : <div aria-hidden className="hidden min-h-full sm:block" style={{ background: "linear-gradient(135deg, var(--sf-primary, #1f2937), color-mix(in srgb, var(--sf-accent, #b45309) 70%, var(--sf-primary, #1f2937)))" }} />}
      <div className="flex flex-col gap-3 p-6 sm:p-8">
        {p.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--sf-primary)" }}>{p.eyebrow}</p> : null}
        <Title className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{emph(p.title || "Sua primeira compra com desconto")}</Title>
        <Desc className="text-sm text-neutral-600">{p.subtitle} <strong className="font-semibold text-neutral-900">{p.offer.label}.</strong> {p.offer.minText}</Desc>
        {code ? (
          <div className="mt-2 flex flex-col gap-3" role="status">
            <p className="text-sm">Seu cupom é:</p>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border-2 border-dashed px-4 py-2 font-mono text-lg font-semibold tracking-wider" style={{ borderColor: "var(--sf-accent)" }} data-welcome-code>{code}</span>
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); } catch { /* sem área de transferência */ } }} className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-sm">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copiado" : "Copiar"}</button>
            </div>
            <p className="text-xs text-neutral-500">Use no carrinho, no campo “Cupom de desconto”.</p>
            {p.onClose ? <button type="button" onClick={p.onClose} className="sf-btn mt-1 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>Começar a comprar</button> : null}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-1 flex flex-col gap-3" noValidate>
            <label className="flex flex-col gap-1 text-sm font-medium">E-mail
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="h-11 rounded-lg border border-neutral-300 px-3 text-base font-normal outline-none focus:border-neutral-900" />
            </label>
            <label className="flex items-start gap-2 text-xs text-neutral-600">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0" />
              Aceito receber ofertas desta loja por e-mail. Posso cancelar quando quiser.
            </label>
            {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
            <button type="submit" disabled={busy || p.preview} className={cn("sf-btn inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium transition hover:brightness-95 disabled:opacity-60")} style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{busy ? "Enviando…" : p.ctaLabel}</button>
            {p.note ? <p className="text-xs text-neutral-500">{p.note}</p> : null}
          </form>
        )}
      </div>
      {p.onClose ? <button type="button" onClick={p.onClose} aria-label="Fechar" className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full bg-white/90 text-neutral-700 hover:bg-white"><X className="size-5" /></button> : null}
    </div>
  );
}
