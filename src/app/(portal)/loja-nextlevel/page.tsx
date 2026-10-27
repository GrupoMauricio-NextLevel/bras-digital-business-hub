import { BlocoEquipe } from "@/components/portal/equipe/blocos";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarCheck, CreditCard, GraduationCap, Headphones, Palette, QrCode, Rocket, ShieldCheck, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { listDigitalProducts } from "@/lib/domain/nl-sales";
import { BuyButton } from "@/components/nextlevel-shop/buy-button";
import { Reveal } from "@/components/portal/reveal";
import { supportContacts } from "@/lib/support";
import { formatBRL } from "@/lib/money";
import { publicThemes } from "@/lib/themes/gallery";
import type { DigitalCategory } from "@/db/schema";
import { AberturaMarca } from "@/components/portal/marca-institucional";
import { themeShot } from "@/lib/themes/shots";

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
  const brand = await getBrand();
  const db = await getDb();
  const products = await listDigitalProducts(db);
  const paidThemes = (await publicThemes(db)).filter((t) => t.priceCents > 0);
  const featured = products.find((p) => p.featured) ?? products[0];
  const rest = products.filter((p) => p.id !== featured?.id);
  const c = supportContacts();
  const talk = c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent("Olá! Tenho uma dúvida sobre a Loja NextLevel.")}`) : c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Loja NextLevel")}` : null;
  return (
    <>
      <AberturaMarca
        slug="loja-nextlevel"
        eyebrow="Serviços e produtos digitais da NextLevel"
        titulo={<>O time da NextLevel trabalhando para a sua loja <span className="text-[#F5BC00]">vender mais.</span></>}
        texto={`Assessoria, configuração, criativos, temas e treinamento feitos por quem opera a plataforma ${brand.name}. Você escolhe, paga em 1 clique e a equipe começa.`}
        foto={{ nome: "capability-01", posicao: "50% 45%", alt: "Equipe da NextLevel planejando uma loja em volta de uma mesa com caixas e amostras de produto" }}
        ctas={[{ href: "#ofertas", label: "Ver as ofertas", primary: true }, ...(talk ? [{ href: talk, label: "Falar com a equipe", externo: !!c.whatsappUrl }] : [])]}
      >
        <ul className="mt-7 grid gap-x-6 gap-y-2 text-sm text-[#F4F1E9]/80 sm:grid-cols-2">
          <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#F5BC00]" aria-hidden /> Pagamento seguro pelo Mercado Pago</li>
          <li className="flex items-center gap-2"><QrCode className="size-4 text-[#F5BC00]" aria-hidden /> Pix com desconto</li>
          <li className="flex items-center gap-2"><CreditCard className="size-4 text-[#F5BC00]" aria-hidden /> Cartão em até 6x</li>
          <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#F5BC00]" aria-hidden /> Atendimento humano no WhatsApp</li>
        </ul>
      </AberturaMarca>

      {paidThemes.length ? (
        <section className="bg-surface py-14" aria-labelledby="temas-loja">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="temas-loja" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">Temas para a sua loja</h2>
            <p className="mt-2 max-w-2xl text-body">Veja cada tema em uma loja de exemplo, antes de comprar. Compra única, instalação em 1 clique.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {paidThemes.map((t) => (
                <li key={t.key}><Link href={`/temas/${t.key}`} className="ds-pub-card block overflow-hidden rounded-xl border border-border bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element -- captura estática da loja de demonstração */}
                  <img src={themeShot(t.key, "desktop")} alt="" width={640} height={400} loading="lazy" decoding="async" className="aspect-[16/10] w-full border-b border-border object-cover object-top" />
                  <span className="block p-4"><span className="block text-lg font-bold">{t.name}</span><span className="block text-sm text-body">{t.niche}</span><span className="mt-2 block font-extrabold tabular-nums">{t.quote ? `${formatBRL(t.quote.pixCents)} no Pix` : formatBRL(t.priceCents)}</span></span>
                </Link></li>
              ))}
            </ul>
            <Link href="/temas" className="mt-5 inline-flex font-semibold text-link underline">Ver todos os temas</Link>
          </div>
        </section>
      ) : null}

      {featured ? (
        <section className="bg-canvas py-16" aria-labelledby="destaque">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex rounded-full bg-band px-3 py-1 text-xs font-semibold text-band-foreground">{featured.badge ?? "Destaque"}</span>
              <h2 id="destaque" className="mt-4 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{featured.name}</h2>
              <p className="mt-3 text-lg text-body">{featured.tagline}</p>
              <p className="mt-3 text-muted-foreground">{featured.description}</p>
            </Reveal>
            <Reveal className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <ul className="space-y-2 text-sm">{featured.highlights.map((h) => <li key={h} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-link" aria-hidden /> {h}</li>)}</ul>
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-4xl font-extrabold tabular-nums">{formatBRL(featured.quote.pixCents)} <span className="text-base font-semibold text-link">no Pix</span></p>
                <p className="mt-1 text-sm text-muted-foreground">ou {formatBRL(featured.quote.listCents)} no cartão em até {featured.quote.installments}x de {formatBRL(featured.quote.installmentCents)}</p>
                <div className="mt-4"><BuyButton slug={featured.slug} name={featured.name} quote={featured.quote} affiliateRef={ref} label={`Comprar ${featured.name}`} /></div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section id="ofertas" className="bg-surface py-16" aria-labelledby="ofertas-t">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="ofertas-t" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">{rest.length ? "Mais ofertas" : "Ofertas"}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Cada oferta mostra o que você recebe. O valor cheio é o do cartão; no Pix você paga menos.</p>
          {rest.length === 0 ? <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Novas ofertas em breve. Fale com a equipe para um projeto sob medida.</p> : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => { const Icon = ICONS[p.category]; return (
                <li key={p.id} className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-lg bg-highlight-soft text-foreground"><Icon className="size-5" aria-hidden /></span><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-body">{p.badge ?? CAT_LABEL[p.category]}</span></div>
                  <h3 className="mt-4 text-lg font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-body">{p.highlights.slice(0, 3).map((h) => <li key={h} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-link" aria-hidden /> {h}</li>)}</ul>
                  <div className="mt-auto pt-5">
                    <p className="text-2xl font-extrabold tabular-nums">{formatBRL(p.quote.pixCents)} <span className="text-sm font-semibold text-link">no Pix</span></p>
                    <p className="mb-4 text-xs text-muted-foreground">ou {formatBRL(p.quote.listCents)} em até {p.quote.installments}x de {formatBRL(p.quote.installmentCents)}</p>
                    <BuyButton slug={p.slug} name={p.name} quote={p.quote} affiliateRef={ref} />
                  </div>
                </li>
              ); })}
            </ul>
          )}
        </div>
      </section>

      <BlocoEquipe lugar="loja-nextlevel" className="bg-surface" />

      <section className="bg-canvas py-16" aria-labelledby="como">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="como" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Como funciona</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, n) => (
              <li key={s.t} className="rounded-2xl border border-border bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-band text-sm font-bold text-band-foreground">{n + 1}</span>
                <h3 className="mt-4 flex items-center gap-2 text-lg font-bold"><s.i className="size-5 text-link" aria-hidden /> {s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-band p-6 text-band-foreground">
            <div><p className="text-lg font-bold">Ainda não tem a sua loja?</p><p className="text-sm text-band-muted">{brand.signupOpen ? `Crie a sua loja ${brand.name} e teste 7 dias com o cupom do seu fornecedor.` : "Deixe seus dados e a equipe ajuda você a abrir a sua loja."}</p></div>
            <Link href={brand.signupOpen ? "/cadastro" : "/quero-minha-loja"} className={`${btn} bg-primary text-primary-foreground hover:bg-primary focus-visible:outline-band-foreground`}>{brand.signupOpen ? "Criar minha loja" : "Quero minha loja"}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
