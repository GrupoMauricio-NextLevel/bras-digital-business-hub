import * as React from "react";
import { BadgeCheck, Headset, Lock, MessageCircle, QrCode, RefreshCw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { renderMarkdownLite } from "@/lib/ds/text";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const SEALS: Record<string, { icon: LucideIcon; title: string; text: string }> = {
  ssl: { icon: Lock, title: "Site seguro", text: "Conexão criptografada do início ao fim" },
  pix: { icon: QrCode, title: "Pagamento por Pix", text: "Aprovação na hora, direto no app do seu banco" },
  gateway: { icon: ShieldCheck, title: "Pagamento protegido", text: "Processado pelo Mercado Pago" },
  tracking: { icon: Truck, title: "Envio rastreado", text: "Acompanhe o pedido até a sua casa" },
  exchange: { icon: RefreshCw, title: "Troca e devolução", text: "Você tem 7 dias para trocar ou devolver" },
  support: { icon: Headset, title: "Atendimento humano", text: "Fale com a loja se tiver qualquer dúvida" },
  original: { icon: BadgeCheck, title: "Produto conferido", text: "Cada peça é conferida antes do envio" },
};

/** Selos de segurança. O selo do Mercado Pago só aparece quando a loja realmente recebe por ele. */
export function SecuritySeals({ settings, blocks, ctx }: SectionProps) {
  const items = blocks.filter((b) => b.type === "seal" && (str(b.settings.kind) !== "gateway" || ctx.store.paymentStatus === "CONNECTED"));
  if (!items.length) return null;
  const cards = settings.style === "cards";
  return (
    <section className="mt-10" aria-label="Segurança da compra">
      {str(settings.heading) ? <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">{str(settings.heading)}</h2> : null}
      <ul className={cn("grid gap-3", cards ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-4")}>
        {items.map((b) => {
          const d = SEALS[str(b.settings.kind)] ?? SEALS.ssl!; const Icon = d.icon;
          return (
            <li key={b.id} className={cn("flex items-start gap-3", cards ? "rounded-xl border border-neutral-200 bg-white p-4" : "px-1 py-2")}>
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--sf-accent) 14%, white)", color: "var(--sf-accent)" }}><Icon className="size-[18px]" aria-hidden /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold text-neutral-900">{str(b.settings.title) || d.title}</span><span className="block text-xs leading-snug text-neutral-500">{str(b.settings.text) || d.text}</span></span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const cnpjMask = (d: string) => (d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d.length === 11 ? d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : d);

/** Quem está por trás da loja: texto e dados da empresa (só mostra o que o lojista preencheu). */
export function StoreAbout({ settings, ctx }: SectionProps) {
  const s = ctx.store; const rows: [string, string][] = [];
  if (s.legalName) rows.push(["Razão social", s.legalName]);
  if (s.cnpj) rows.push([s.cnpj.length === 11 ? "CPF" : "CNPJ", cnpjMask(s.cnpj)]);
  if (s.address) rows.push(["Endereço", s.address]);
  if (s.contactEmail) rows.push(["E-mail", s.contactEmail]);
  if (s.whatsapp) rows.push(["WhatsApp", `+${s.whatsapp}`]);
  if (s.instagram) rows.push(["Instagram", `@${s.instagram.replace("@", "")}`]);
  const showContact = settings.showContact !== false && rows.length > 0;
  return (
    <section className={cn("mt-12 grid gap-6 rounded-2xl border border-neutral-200 p-6", showContact && "md:grid-cols-2")}>
      <div><h2 className="mb-3 text-xl font-semibold tracking-tight">{str(settings.heading) || "Quem somos"}</h2><div className="space-y-3 text-neutral-600 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(str(settings.body)) }} /></div>
      {showContact ? <dl className="grid content-start gap-2 text-sm">{rows.map(([k, v]) => <div key={k} className="flex gap-3"><dt className="w-28 shrink-0 text-neutral-500">{k}</dt><dd className="min-w-0 break-words font-medium text-neutral-900">{v}</dd></div>)}</dl> : null}
    </section>
  );
}

/** Botão fixo do WhatsApp no canto da tela. */
export function WhatsappFloat({ settings, ctx }: SectionProps) {
  const wa = ctx.store.whatsapp; if (!wa) return null;
  const left = settings.position === "left";
  return (
    <a href={`https://wa.me/${wa}?text=${encodeURIComponent(str(settings.message) || "Olá!")}`} target="_blank" rel="noreferrer" aria-label={`Falar com ${ctx.store.name} no WhatsApp`}
      className={cn("fixed bottom-5 z-40 flex size-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2", left ? "left-5" : "right-5")} style={{ background: "#25D366", color: "#052e14" }}>
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}
