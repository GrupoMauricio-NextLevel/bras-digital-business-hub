import * as React from "react";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { ProductArt } from "@/components/app/product-art";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";
import { FormularioOrcamento } from "@/components/storefront/formulario-orcamento";

/**
 * Seções do site da empresa (NextLevel Business, NB2, D307): Serviços, Contato e Trabalhos realizados.
 * O pedido de orçamento vai pelo WhatsApp do negócio até a NB3 trazer o formulário com origem.
 */
const str = (v: unknown) => (typeof v === "string" ? v : "");
const COLS: Record<string, string> = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" };
const whatsappLink = (numero: string | null | undefined, texto: string) => (numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null);

export function ServicesGrid({ id, settings, ctx }: SectionProps) {
  const lista = ctx.servicos ?? [];
  const titulo = str(settings.heading) || "Nossos serviços";
  const tituloId = `${id}-titulo`;
  if (!lista.length) {
    // Na prévia do editor, o dono vê o que falta; o visitante não vê um bloco vazio.
    return ctx.editing ? <section aria-labelledby={tituloId} className="mt-12 rounded-2xl border border-dashed border-neutral-300 p-8 text-center"><h2 id={tituloId} className="text-xl font-semibold">{titulo}</h2><p className="mt-2 text-sm text-neutral-600">Cadastre os serviços em Site → Serviços no painel. Eles aparecem aqui sozinhos.</p></section> : null;
  }
  return (
    <section aria-labelledby={tituloId} className="mt-12">
      <h2 id={tituloId} className="text-2xl font-semibold tracking-tight">{titulo}</h2>
      {str(settings.text) ? <p className="mt-2 max-w-2xl text-neutral-600">{str(settings.text)}</p> : null}
      <ul className={cn("mt-6 grid gap-4", COLS[str(settings.columns)] ?? COLS["3"])}>
        {lista.map((s) => {
          // WhatsApp da empresa; sem ele, o formulário da página Contato já com o serviço escolhido (NB3).
          const contato = ctx.menuSite?.find((m) => m.href.endsWith("/contato"));
          const pedir = whatsappLink(ctx.store.whatsapp, `Olá! Vim pelo site e quero um orçamento de: ${s.nome}.`) ?? (contato ? `${contato.href}?servico=${s.id}#orcamento` : null);
          return (
            <li key={s.id} className="flex flex-col overflow-hidden rounded-[var(--sf-radius,16px)] border border-neutral-200 bg-white">
              {s.imagemUrl ? <ProductArt images={[s.imagemUrl]} size="md" alt="" className="aspect-[4/3] w-full bg-neutral-100" /> : null}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold">{s.nome}</h3>
                {s.resumo ? <p className="mt-1 text-sm text-neutral-600">{s.resumo}</p> : null}
                {settings.showPrice !== false && s.precoAPartirCents ? <p className="mt-3 text-sm">A partir de <b>{formatBRL(s.precoAPartirCents)}</b></p> : <p className="mt-3 text-sm text-neutral-600">Sob orçamento</p>}
                {pedir ? <a href={pedir} target={pedir.startsWith("https://wa.me") ? "_blank" : undefined} rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sf-radius,10px)] px-4 text-sm font-semibold" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}><MessageCircle className="size-4" aria-hidden />{str(settings.ctaLabel) || "Pedir orçamento"}<span className="sr-only">: {s.nome}</span></a> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ContactInfo({ id, settings, ctx }: SectionProps) {
  const s = ctx.store; const tituloId = `${id}-titulo`;
  const wa = whatsappLink(s.whatsapp, "Olá! Vim pelo site e gostaria de falar com vocês.");
  const horas = str(settings.hours).split("\n").map((l) => l.trim()).filter(Boolean);
  const mapa = s.address && settings.showMapLink !== false ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` : null;
  return (
    <section aria-labelledby={tituloId} className="mt-12 grid gap-6 rounded-2xl border border-neutral-200 p-6 md:grid-cols-2">
      <div>
        <h2 id={tituloId} className="text-xl font-semibold tracking-tight">{str(settings.heading) || "Fale com a gente"}</h2>
        {str(settings.text) ? <p className="mt-2 text-neutral-600">{str(settings.text)}</p> : null}
        <ul className="mt-4 space-y-3 text-sm">
          {wa ? <li><a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"><MessageCircle className="size-4" aria-hidden />WhatsApp +{s.whatsapp}</a></li> : null}
          {s.contactEmail ? <li><a href={`mailto:${s.contactEmail}`} className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"><Mail className="size-4" aria-hidden />{s.contactEmail}</a></li> : null}
          {s.address ? <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{s.address}{mapa ? <> · <a href={mapa} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">Como chegar</a></> : null}</span></li> : null}
          {str(settings.area) ? <li className="text-neutral-600">Atendemos: {str(settings.area)}</li> : null}
        </ul>
        {!wa && !s.contactEmail && !s.address && ctx.editing ? <p className="mt-3 text-sm text-neutral-600">Preencha WhatsApp, e-mail e endereço em Ajustes → Empresa para aparecerem aqui.</p> : null}
      </div>
      {horas.length ? (
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold"><Clock className="size-4" aria-hidden />Horário de atendimento</h3>
          <ul className="mt-3 space-y-1 text-sm text-neutral-700">{horas.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}

export function WorkGallery({ id, settings, blocks, ctx }: SectionProps) {
  const fotos = blocks.filter((b) => str(b.settings.image) || ctx.editing);
  if (!fotos.length) return null;
  const tituloId = `${id}-titulo`;
  return (
    <section aria-labelledby={tituloId} className="mt-12">
      <h2 id={tituloId} className="text-2xl font-semibold tracking-tight">{str(settings.heading) || "Trabalhos realizados"}</h2>
      <ul className={cn("mt-6 grid gap-4", COLS[str(settings.columns)] ?? COLS["3"])}>
        {fotos.map((b) => (
          <li key={b.id}>
            <figure>
              {str(b.settings.image) ? <ProductArt images={[str(b.settings.image)]} size="md" alt={str(b.settings.caption)} className="aspect-square w-full rounded-[var(--sf-radius,16px)] bg-neutral-100" /> : <div className="grid aspect-square w-full place-items-center rounded-[var(--sf-radius,16px)] border border-dashed border-neutral-300 text-sm text-neutral-500">Escolha uma foto</div>}
              {str(b.settings.caption) ? <figcaption className="mt-2 text-sm text-neutral-600">{str(b.settings.caption)}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Formulário de orçamento (NB3, D309): o pedido chega em Contatos e orçamentos, com a origem. */
export function LeadForm({ id, settings, ctx }: SectionProps) {
  return <FormularioOrcamento slug={ctx.slug} id={id} titulo={str(settings.heading) || "Peça seu orçamento"} texto={str(settings.text)} botao={str(settings.buttonLabel) || "Enviar pedido"}
    servicos={(ctx.servicos ?? []).map((s) => ({ id: s.id, nome: s.nome }))} pedirServico={settings.askService !== false} pedirEmail={settings.askEmail !== false} editando={ctx.editing} />;
}
