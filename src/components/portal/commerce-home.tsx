import Link from "next/link";
import { BadgeCheck, BarChart3, CreditCard, Globe, Layers, Mail, MessagesSquare, Palette, ShoppingBag, Sparkles, Store } from "lucide-react";
import type { Brand } from "@/lib/brand";
import { JsonLd } from "@/components/portal/json-ld";
import { Reveal } from "@/components/portal/reveal";
import { ThemeShowcase } from "@/components/portal/theme-showcase";
import { supportContacts } from "@/lib/support";

const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";
const sectionTitle = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl";

/** O que a plataforma entrega hoje (tudo isto já funciona). */
const TODAY = [
  { i: Store, t: "Loja virtual completa", d: "Catálogo, produto, carrinho e checkout, com o acompanhamento do pedido pelo seu cliente." },
  { i: Palette, t: "Temas e editor visual", d: "Comece com o tema grátis e instale um tema premium com 1 clique. Logo, cores e seções sem programar." },
  { i: CreditCard, t: "Pix e cartão em até 6x", d: "Pagamento pelo Mercado Pago, com Pix como padrão e confirmação automática." },
  { i: BarChart3, t: "Painel de vendas", d: "Pedidos, clientes, margem, mapa de horários de compra e vendas por estado." },
  { i: Mail, t: "E-mails do pedido", d: "O cliente recebe o pagamento confirmado e o envio com o código de rastreio." },
  { i: Globe, t: "Domínio e marca próprios", d: "Sua logo, suas cores e o seu endereço, no plano de loja própria." },
];

/** O que vem por aí: sempre marcado como "em breve", nunca como pronto. */
const SOON = [
  { i: Layers, t: "Atacado de verdade", d: "Preço por faixa de quantidade, pedido mínimo, grade por cor e tamanho e cadastro de cliente atacadista com aprovação." },
    { i: Sparkles, t: "Temas de nível internacional", d: "Novas seções, animações sóbrias, desempenho medido e temas de designers parceiros." },
];

const STEPS = [
  { t: "Conversa rápida", d: "Você conta o que vende, quantos produtos tem e como despacha. A equipe indica o melhor caminho." },
  { t: "Implantação acompanhada", d: "Importamos os seus produtos por planilha, escolhemos o tema e conectamos Pix, cartão e frete." },
  { t: "Loja no ar", d: "Você revisa, publica e recebe o primeiro pedido com a equipe por perto." },
];

/** Portal da NextLevel Commerce (lojas virtuais). Honesto sobre o que existe hoje e o que está por vir. */
export function CommerceHome({ brand }: { brand: Brand }) {
  const c = supportContacts();
  const talk = c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Quero abrir a minha loja na ${brand.name}.`)}`) : null;
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: brand.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: brand.description },
      ]} />
      <section className="relative overflow-hidden text-white" style={{ background: brand.primaryColor }}>
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden style={{ background: `radial-gradient(60rem 30rem at 85% -10%, ${brand.accentColor}44, transparent 60%), radial-gradient(40rem 24rem at 0% 110%, ${brand.accentColor}1f, transparent 60%)` }} />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">Lojas virtuais para quem vende moda no Brasil</span>
          <h1 className="nl-display mt-5 max-w-4xl">A loja virtual que o seu negócio merece, no ar sem complicação.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-blue-100/90">Tema bonito, Pix e cartão, pedidos organizados e uma equipe que ajuda você a colocar tudo no ar. Do Brás para o Brasil inteiro.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={cta} className={`${btn} text-white hover:opacity-90 focus-visible:outline-white`} style={{ background: brand.accentColor }}>{brand.signupOpen ? "Criar minha loja" : "Quero minha loja"}</Link>
            <a href="#temas" className={`${btn} border border-white/30 hover:bg-white/10 focus-visible:outline-white`}>Ver os temas</a>
            {talk ? <a href={talk} target="_blank" rel="noreferrer" className={`${btn} border border-white/30 hover:bg-white/10 focus-visible:outline-white`}>Falar no WhatsApp</a> : null}
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100/90">
            <li className="flex items-center gap-2"><BadgeCheck className="size-4" aria-hidden /> Pix com confirmação automática</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-4" aria-hidden /> Cartão em até 6x</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-4" aria-hidden /> Implantação acompanhada</li>
          </ul>
        </div>
      </section>

      <section className="bg-[#f4f6f5] py-20" aria-labelledby="hoje">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 id="hoje" className={`${sectionTitle} max-w-2xl`}>Tudo o que já funciona hoje</h2></Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{TODAY.map((b) => (
            <li key={b.t} className="rounded-2xl border border-neutral-200 bg-white p-6"><span className="flex size-10 items-center justify-center rounded-lg" style={{ background: `${brand.accentColor}1f`, color: brand.primaryColor }}><b.i className="size-5" aria-hidden /></span><h3 className="mt-4 text-lg font-bold">{b.t}</h3><p className="mt-1 text-sm text-neutral-600">{b.d}</p></li>
          ))}</ul>
        </div>
      </section>

      <section id="temas" className="scroll-mt-20 bg-white py-20" aria-labelledby="temas-t">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 id="temas-t" className={`${sectionTitle} max-w-3xl`}>Uma loja bonita, que você monta sem programar</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Comece com o tema grátis. Quando quiser mais, instale um tema premium, com pagamento no cartão em até 6x ou no Pix com desconto.</p></Reveal>
          <div className="mt-8"><ThemeShowcase /></div>
        </div>
      </section>

      <section className="bg-[#f4f6f5] py-20" aria-labelledby="breve">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 id="breve" className={`${sectionTitle} max-w-3xl`}>O que vem por aí</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Estamos construindo, em etapas, o que as plataformas tradicionais entregam mal para o comércio de moda e atacado.</p></Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">{SOON.map((b) => (
            <li key={b.t} className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6"><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700"><b.i className="size-5" aria-hidden /></span><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Em breve</span></div><h3 className="mt-4 text-lg font-bold">{b.t}</h3><p className="mt-1 text-sm text-neutral-600">{b.d}</p></li>
          ))}</ul>
        </div>
      </section>

      <section className="bg-white py-20" aria-labelledby="como">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 id="como" className={`${sectionTitle} max-w-2xl`}>Como abrir a sua loja</h2></Reveal>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">{STEPS.map((s, n) => (
            <li key={s.t} className="rounded-2xl border border-neutral-200 p-6"><span className="flex size-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: brand.primaryColor }}>{n + 1}</span><h3 className="mt-4 text-lg font-bold">{s.t}</h3><p className="mt-1 text-sm text-neutral-600">{s.d}</p></li>
          ))}</ol>
        </div>
      </section>

      <section className="py-20 text-white" style={{ background: brand.primaryColor }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4">
          <div><ShoppingBag className="mb-3 size-8 text-blue-200" aria-hidden /><h2 className={`${sectionTitle} max-w-xl`}>Pronto para abrir a sua loja?</h2><p className="mt-3 max-w-lg text-blue-100/90">Deixe seus dados e a equipe fala com você pelo WhatsApp.</p></div>
          <div className="flex flex-wrap gap-3"><Link href={cta} className={`${btn} text-white hover:opacity-90 focus-visible:outline-white`} style={{ background: brand.accentColor }}><MessagesSquare className="size-5" aria-hidden /> {brand.signupOpen ? "Criar minha loja" : "Quero minha loja"}</Link></div>
        </div>
      </section>
    </>
  );
}
