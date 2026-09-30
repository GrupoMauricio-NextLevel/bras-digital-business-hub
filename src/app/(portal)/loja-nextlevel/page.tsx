import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarCheck, CreditCard, GraduationCap, Headphones, Palette, QrCode, Rocket, ShieldCheck, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { getDb } from "@/db/client";
import { listDigitalProducts } from "@/lib/domain/nl-sales";
import { BuyButton } from "@/components/nextlevel-shop/buy-button";
import { Reveal } from "@/components/portal/reveal";
import { supportContacts } from "@/lib/support";
import { formatBRL } from "@/lib/money";
import type { DigitalCategory } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Loja NextLevel · Assessoria, criativos e cursos para vender mais" },
  description: "Serviços e produtos digitais da NextLevel para quem vende online: assessoria de lançamento, configuração profissional, criativos e treinamento. Compra em 1 clique, Pix com desconto ou cartão em até 6x.",
  alternates: { canonical: "/loja-nextlevel" },
};

const ICONS: Record<DigitalCategory, LucideIcon> = { ASSESSORIA: Rocket, CURSO: GraduationCap, TEMA: Palette, SERVICO: Wrench, PLANO: Sparkles };
const CAT_LABEL: Record<DigitalCategory, string> = { ASSESSORIA: "Assessoria", CURSO: "Curso", TEMA: "Tema", SERVICO: "Serviço", PLANO: "Plano" };
const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";

const STEPS = [
  { i: CalendarCheck, t: "Escolha a oferta", d: "Veja o que cada uma entrega e o prazo. Sem letras miúdas." },
  { i: QrCode, t: "Pague em 1 clique", d: "Nome, e-mail e WhatsApp. Pix com desconto ou cartão em até 6x." },
  { i: Headphones, t: "A equipe fala com você", d: "Assim que o pagamento cai, a NextLevel chama no WhatsApp e começa." },
];

export default async function LojaNextLevel({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const db = await getDb();
  const products = await listDigitalProducts(db);
  const featured = products.find((p) => p.featured) ?? products[0];
  const rest = products.filter((p) => p.id !== featured?.id);
  const c = supportContacts();
  const talk = c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent("Olá! Tenho uma dúvida sobre a Loja NextLevel.")}`) : c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Loja NextLevel")}` : null;
  return (
    <>
      <section className="relative overflow-hidden bg-[#08120c] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden style={{ background: "radial-gradient(60rem 30rem at 15% -10%, rgba(34,197,94,0.22), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 md:pt-24">
          <span className="inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold text-[#86efac]">Loja NextLevel</span>
          <h1 className="nl-display mt-5 max-w-4xl">O time da NextLevel trabalhando para a sua loja vender mais.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#c3d3ca]">Assessoria, configuração, criativos e treinamento feitos por quem opera a plataforma SuperDrop. Você escolhe, paga em 1 clique e a equipe começa.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#ofertas" className={`${btn} bg-[#22c55e] text-[#052e14] hover:bg-[#4ade80] focus-visible:outline-white`}>Ver as ofertas</a>
            {talk ? <a href={talk} target={c.whatsappUrl ? "_blank" : undefined} rel="noreferrer" className={`${btn} border border-white/30 hover:bg-white/10 focus-visible:outline-white`}>Falar com a equipe</a> : null}
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#b4c6bb]">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#86efac]" aria-hidden /> Pagamento seguro pelo Mercado Pago</li>
            <li className="flex items-center gap-2"><QrCode className="size-4 text-[#86efac]" aria-hidden /> Pix com desconto</li>
            <li className="flex items-center gap-2"><CreditCard className="size-4 text-[#86efac]" aria-hidden /> Cartão em até 6x</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#86efac]" aria-hidden /> Atendimento humano no WhatsApp</li>
          </ul>
        </div>
      </section>

      {featured ? (
        <section className="bg-[#f4f6f5] py-16" aria-labelledby="destaque">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex rounded-full bg-[#0f1c16] px-3 py-1 text-xs font-semibold text-white">{featured.badge ?? "Destaque"}</span>
              <h2 id="destaque" className="mt-4 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{featured.name}</h2>
              <p className="mt-3 text-lg text-neutral-700">{featured.tagline}</p>
              <p className="mt-3 text-neutral-600">{featured.description}</p>
            </Reveal>
            <Reveal className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <ul className="space-y-2 text-sm">{featured.highlights.map((h) => <li key={h} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-[#0b6b34]" aria-hidden /> {h}</li>)}</ul>
              <div className="mt-5 border-t border-neutral-200 pt-5">
                <p className="text-4xl font-extrabold tabular-nums">{formatBRL(featured.quote.pixCents)} <span className="text-base font-semibold text-[#0b6b34]">no Pix</span></p>
                <p className="mt-1 text-sm text-neutral-600">ou {formatBRL(featured.quote.listCents)} no cartão em até {featured.quote.installments}x de {formatBRL(featured.quote.installmentCents)}</p>
                <div className="mt-4"><BuyButton slug={featured.slug} name={featured.name} quote={featured.quote} affiliateRef={ref} label={`Comprar ${featured.name}`} /></div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section id="ofertas" className="bg-white py-16" aria-labelledby="ofertas-t">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="ofertas-t" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">{rest.length ? "Mais ofertas" : "Ofertas"}</h2>
          <p className="mt-2 max-w-2xl text-neutral-600">Cada oferta mostra o que você recebe. O valor cheio é o do cartão; no Pix você paga menos.</p>
          {rest.length === 0 ? <p className="mt-8 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-600">Novas ofertas em breve. Fale com a equipe para um projeto sob medida.</p> : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => { const Icon = ICONS[p.category]; return (
                <li key={p.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#0b6b34]"><Icon className="size-5" aria-hidden /></span><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{p.badge ?? CAT_LABEL[p.category]}</span></div>
                  <h3 className="mt-4 text-lg font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{p.tagline}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-neutral-700">{p.highlights.slice(0, 3).map((h) => <li key={h} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-[#0b6b34]" aria-hidden /> {h}</li>)}</ul>
                  <div className="mt-auto pt-5">
                    <p className="text-2xl font-extrabold tabular-nums">{formatBRL(p.quote.pixCents)} <span className="text-sm font-semibold text-[#0b6b34]">no Pix</span></p>
                    <p className="mb-4 text-xs text-neutral-600">ou {formatBRL(p.quote.listCents)} em até {p.quote.installments}x de {formatBRL(p.quote.installmentCents)}</p>
                    <BuyButton slug={p.slug} name={p.name} quote={p.quote} affiliateRef={ref} />
                  </div>
                </li>
              ); })}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-[#f4f6f5] py-16" aria-labelledby="como">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="como" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Como funciona</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, n) => (
              <li key={s.t} className="rounded-2xl border border-neutral-200 bg-white p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#0f1c16] text-sm font-bold text-white">{n + 1}</span>
                <h3 className="mt-4 flex items-center gap-2 text-lg font-bold"><s.i className="size-5 text-[#0b6b34]" aria-hidden /> {s.t}</h3>
                <p className="mt-1 text-sm text-neutral-600">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#0f1c16] p-6 text-white">
            <div><p className="text-lg font-bold">Ainda não tem a sua loja?</p><p className="text-sm text-[#c3d3ca]">Crie a sua loja SuperDrop e teste 7 dias com o cupom do seu fornecedor.</p></div>
            <Link href="/cadastro" className={`${btn} bg-[#22c55e] text-[#052e14] hover:bg-[#4ade80] focus-visible:outline-white`}>Criar minha loja</Link>
          </div>
        </div>
      </section>
    </>
  );
}
