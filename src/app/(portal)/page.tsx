import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, FileText, Globe, Palette, Store, Wallet } from "lucide-react";
import { getSession, homeFor } from "@/lib/auth";
import { brandHas, isClosedCommerceBrand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { CargasHome } from "@/components/portal/cargas/cargas-home";
import { getBrasAnalysisSettings } from "@/lib/domain/bras/descobertas";
import { BrasHome } from "@/components/portal/bras/bras-home";
import { getBrand } from "@/lib/brand-server";
import { robotsForBrandPortal } from "@/lib/bras/visibility";
import { CommerceHome } from "@/components/portal/commerce-home";
import { SoonHome } from "@/components/portal/soon-home";
import { Logo } from "@/components/brand/logo";
import { HowItWorks } from "@/components/portal/how-it-works";
import { JsonLd } from "@/components/portal/json-ld";
import { LiveConveyor } from "@/components/portal/live-conveyor";
import { MemberPlans } from "@/components/portal/member-plans";
import { Reveal } from "@/components/portal/reveal";
import { SaleCalculator } from "@/components/portal/sale-calculator";
import { ThemeShowcase } from "@/components/portal/theme-showcase";
import { isReleased, THEME_BY_KEY } from "@/lib/themes/catalog";
import { formatBRL } from "@/lib/money";
import { MosaicoEditorial } from "@/components/portal/mosaico-editorial";
import { ImagemEmCriacao, TexturaDeFundo } from "@/components/portal/imagem-em-criacao";
import { FAQ } from "./content";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  // Brás: prévia de link própria quando a imagem existir (D105; redes não leem AVIF, por isso PNG/JPG/WebP).
  const og = isClosedCommerceBrand(brand) ? (["jpg", "png", "webp"] as const).find((e) => existsSync(join(process.cwd(), "public", "portal", "bras", "v3", `bd-og-portal.${e}`))) : undefined;
  return { title: { absolute: `${brand.name} · ${brand.tagline}` }, description: brand.description, alternates: { canonical: "/" }, ...(robotsForBrandPortal(brand) ? { robots: robotsForBrandPortal(brand) } : {}), ...(og ? { openGraph: { title: brand.name, description: brand.description, images: [{ url: `/portal/bras/v3/bd-og-portal.${og}`, width: 1200, height: 630 }] } } : {}) };
}

const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";
const sectionTitle = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl";

const PROBLEMS = [
  { t: "Vender sem estoque e sem dor de cabeça", d: "Você escolhe os produtos, define o seu preço e vende. O fornecedor separa e envia direto ao seu cliente.", img: { nome: "sd-expedicao-esteira", alt: "Estoque de fornecedor com caixas padronizadas em prateleiras e uma esteira de expedição", posicao: "50% 55%" } },
  { t: "Loja profissional sem programar", d: "Tema pronto, editor visual e checkout por Pix. Sua loja no ar no mesmo dia, do celular ou do computador.", img: { nome: "sd-lojista-home-office", alt: "Lojista de costas trabalhando no notebook numa sala clara, com caixas de produto ao lado", posicao: "62% 50%" } },
  { t: "Dinheiro sob controle", d: "Recarga por Pix, custo debitado a cada pedido e extrato claro. Sem cartão de crédito e sem cobrança surpresa.", img: { nome: "sd-pix-pagamento", alt: "Celular na mão ao lado de uma maquininha e de um comprovante sobre o balcão", posicao: "50% 55%" } },
];
const BENEFITS = [
  { i: Store, t: "Loja virtual completa", d: "Catálogo, carrinho e checkout por Pix, no seu subdomínio ou no seu próprio domínio." },
  { i: Palette, t: "Temas e editor visual", d: "Comece com o tema grátis. Quando quiser mais, instale um tema premium com 1 clique." },
  { i: Wallet, t: "Carteira por Pix", d: "Recarregue quando quiser. O custo de cada pedido é debitado sozinho e você vê o extrato." },
  { i: BarChart3, t: "Análise de vendas e margem", d: "Saiba quanto vendeu, quanto sobrou e quais produtos puxam o seu resultado." },
  { i: FileText, t: "Pós-venda no painel", d: "Acompanhe cada pedido em andamento e registre o atendimento sem sair do sistema." },
  { i: Globe, t: "Domínio e marca próprios", d: "No plano Loja própria: seu domínio, sua logo e nenhum selo SuperDrop." },
];

export default async function Portal() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const brand = await getBrand();
  // Marca com página inicial própria (NextLevel Cargas, D108).
  if (brand.landing === "cargas") return <CargasHome brand={brand} />;
  // Produto ainda sem sistema (Brás Digital, Hub Creators, China Hub): página "em breve" com lista de espera.
  if (brand.soon) return <SoonHome brand={brand} />;
  // Operação fechada já aberta (Brás Digital, D92): apresentação, vídeos de análise e cadastro; nunca preço.
  if (isClosedCommerceBrand(brand)) { const db = await getDb(); return <BrasHome brand={brand} videos={await listPublicBrasVideos(db)} analysis={await getBrasAnalysisSettings(db)} />; }
  // Marcas sem dropshipping (NextLevel Commerce) têm portal próprio.
  if (!brandHas(brand, "dropship")) return <CommerceHome brand={brand} />;
  const faq = FAQ.slice(0, 5);
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "SuperDrop", url: "https://superdrop.com.br", logo: "https://superdrop.com.br/brand/v2/superdrop/claro/assinatura-completa-640.png", parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda" } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "SuperDrop", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Loja online sem estoque para quem vende, com fornecedores que separam e enviam." },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />

      {/* 1. Herói com demonstração viva */}
      <section className="relative overflow-hidden bg-band text-band-foreground">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden style={{ background: "radial-gradient(60rem 30rem at 85% -10%, rgba(34,197,94,0.20), transparent 60%), radial-gradient(40rem 24rem at 0% 110%, rgba(34,197,94,0.08), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-16 md:pt-24">
          <Logo variant="mark" tone="on-dark" className="pointer-events-none absolute right-4 top-16 hidden h-56 drop-shadow-[0_0_48px_rgba(98,194,104,0.25)] xl:block" alt="" />
          <span className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-reflection">Pix na hora · ou teste 7 dias com o cupom do seu fornecedor</span>
          <h1 className="nl-display mt-5 max-w-4xl">Sua loja online sem estoque, pronta para vender hoje.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-band-muted">Escolha os produtos de fornecedores parceiros, monte a sua loja em minutos e venda. O fornecedor separa e envia; você fica com a margem. Assine por Pix e o acesso é liberado na hora.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro" className={`${btn} bg-primary text-primary-foreground hover:bg-primary focus-visible:outline-band-foreground`}>Criar minha loja <ArrowRight className="size-5" aria-hidden /></Link>
            <Link href="/login" className={`${btn} border border-band-foreground/30 hover:bg-band-foreground/10 focus-visible:outline-band-foreground`}>Área de membros</Link>
            <a href="#planos" className={`${btn} text-band-foreground/90 hover:bg-band-foreground/10 focus-visible:outline-band-foreground`}>Ver planos</a>
          </div>
          <p className="mt-4 text-sm text-band-muted">Pagamento por Pix · sem fidelidade · seus dados só para separar e enviar o pedido</p>
          <Reveal className="relative mx-auto mt-14 max-w-5xl translate-y-0"><LiveConveyor /></Reveal>
        </div>
        <div className="h-16 bg-gradient-to-b from-transparent to-canvas" aria-hidden />
      </section>

      {/* 2. Fornecedores do lançamento */}
      <section className="bg-canvas pb-4 pt-6" aria-label="Fornecedores do lançamento">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm text-muted-foreground">
          <span className="font-medium">Fornecedores parceiros</span>
          <Link href="/f/alpha-outfit" className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight text-foreground hover:underline">Alpha Outfit</Link>
          <Link href="/f/mantosshop" className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight text-foreground hover:underline">MantosShop</Link>
        </div>
      </section>

      {/* 3. Problema e promessa */}
      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Tudo para começar a vender sem complicação</h2></Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">{PROBLEMS.map((p, n) => <Reveal as="li" key={p.t} delay={n * 90} className="overflow-hidden rounded-2xl border border-border bg-surface"><ImagemEmCriacao marca="superdrop" nome={p.img.nome} alt={p.img.alt} ratio="16 / 10" posicao={p.img.posicao} className="rounded-none" /><div className="p-6"><h3 className="text-lg font-bold">{p.t}</h3><p className="mt-2 text-muted-foreground">{p.d}</p></div></Reveal>)}</ul>
        </div>
      </section>

      {/* 3b. Bastidores: do fornecedor à casa do cliente (fotografia de direção de arte) */}
      <section className="bg-surface py-20" aria-label="Bastidores da operação">
        <MosaicoEditorial marca="superdrop" eyebrow="Bastidores" titulo="Você vende. O fornecedor separa, etiqueta e envia." texto="Cada pedido pago da sua loja vai para a Central do fornecedor, que separa, embala e despacha."
          pecas={[
            { nome: "sd-hero-fornecedor-separando", alt: "Mãos separando peças em caixas numa bancada de expedição", ratio: "4 / 5", posicao: "52% 50%", titulo: "Separação na Central", texto: "O fornecedor recebe o pedido pago e separa as peças." },
            { nome: "sd-etiqueta-impressora", alt: "Impressora térmica soltando uma etiqueta de envio", ratio: "4 / 3", titulo: "Etiqueta junto com o pedido", texto: "A Central só separa com a etiqueta em mãos, sem erro de endereço." },
            { nome: "sd-pacote-entregue", alt: "Caixa fechada com fita verde na porta de um apartamento", ratio: "4 / 3", posicao: "50% 62%", titulo: "Entregue na casa do cliente", texto: "Você acompanha cada etapa do pedido no painel." },
          ]} />
      </section>

      {/* 4. Como funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Do catálogo à caixa entregue, em cinco passos</h2><p className="mt-3 max-w-2xl text-lg text-muted-foreground">Clique em cada passo para ver a tela do sistema.</p></Reveal>
          <div className="mt-10"><HowItWorks /></div>
        </div>
      </section>

      {/* 6. Loja e temas */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-3xl`}>Uma loja bonita, que você monta sem programar</h2><p className="mt-3 max-w-2xl text-lg text-muted-foreground">Comece com o tema grátis. Quando quiser mais, compre um tema pronto na Loja NextLevel e instale com 1 clique.</p></Reveal>
          <div className="mt-10"><ThemeShowcase prices={Object.fromEntries((["starter", "arena", "editorial", "signature"] as const).flatMap((k) => { const t = THEME_BY_KEY[k]; return t && isReleased(t) ? [[k, t.priceCents === 0 ? "Grátis" : formatBRL(t.priceCents)]] : []; }))} /></div>
        </div>
      </section>

      {/* 7. Benefícios */}
      <section className="bg-band py-20 text-band-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Tudo o que a sua loja precisa, em um só lugar</h2></Reveal>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-band-foreground/10 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((o, n) => { const Icon = o.i; return (
              <Reveal as="li" key={o.t} delay={n * 60} className="bg-band p-6"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-reflection"><Icon className="size-5" aria-hidden /></span><h3 className="mt-4 font-bold">{o.t}</h3><p className="mt-1.5 text-sm leading-relaxed text-band-muted">{o.d}</p></Reveal>
            ); })}
          </ul>
        </div>
      </section>

      {/* 8. Preço com calculadora */}
      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Quanto sobra em uma venda?</h2><p className="mt-3 max-w-2xl text-lg text-muted-foreground">Simule uma camisa. Você define o preço; a plataforma cobra uma taxa por pedido sobre o valor dos produtos.</p></Reveal>
          <Reveal className="mt-10"><SaleCalculator /></Reveal>
          <div className="mt-6 grid items-center gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <ImagemEmCriacao marca="superdrop" nome="sd-fornecedor-parceiro" alt="Aperto de mãos sobre uma bancada de estoque com peças dobradas" ratio="3 / 2" posicao="62% 40%" />
            <p className="text-sm text-muted-foreground">Mensalidades, setup e condições em <a href="#planos" className="font-semibold text-link underline">Planos</a>. É fornecedor? <Link href="/seja-fornecedor" className="font-semibold text-link underline">Veja a página para fornecedores</Link>.</p>
          </div>
        </div>
      </section>

      {/* 9. Planos e checkout */}
      <section id="planos" className="scroll-mt-20 bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_minmax(0,15rem)]">
            <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Escolha o plano e comece hoje</h2><p className="mt-3 max-w-2xl text-lg text-muted-foreground">Pague por Pix e o acesso ao plano é liberado na hora. Tem o cupom de teste do seu fornecedor? Use no cadastro e teste 7 dias sem cartão.</p></Reveal>
            <Reveal delay={120} className="mx-auto w-full max-w-[15rem] md:mx-0"><ImagemEmCriacao marca="superdrop" nome="sd-hero-celular-venda" alt="Mão segurando o celular sobre a mesa, ao lado de um café e de uma sacola de envio" ratio="4 / 5" posicao="50% 45%" /></Reveal>
          </div>
          <div className="mt-10"><MemberPlans /></div>
          <ol className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3"><li className="rounded-xl bg-canvas p-4"><b className="text-foreground">1. Escolha o plano</b><br />E o fornecedor que vai abastecer a sua loja.</li><li className="rounded-xl bg-canvas p-4"><b className="text-foreground">2. Pague por Pix</b><br />QR code na tela, confirmação automática.</li><li className="rounded-xl bg-canvas p-4"><b className="text-foreground">3. Acesso liberado</b><br />Painel e loja prontos assim que o pagamento cai.</li></ol>
          <p className="mt-8 text-muted-foreground">Já tem conta? <Link href="/login" className="font-semibold text-link underline">Entrar na área de membros</Link></p>
        </div>
      </section>

      {/* 9b. Papéis e dinheiro de cada um (D90) */}
      <section id="papeis" className="scroll-mt-20 bg-canvas py-20" aria-labelledby="papeis-t">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="papeis-t" className={sectionTitle}>Cada um com o seu papel e o seu dinheiro.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { t: "Fornecedor", d: "Cadastra os produtos, separa e envia. Recebe 100% das recargas dos lojistas direto na própria conta Mercado Pago e acompanha tudo no painel dele.", href: "/seja-fornecedor", cta: "Seja fornecedor" },
              { t: "Membro (lojista)", d: "Monta a loja, define o preço e vende. Recebe 100% das vendas na própria conta; o custo do produto é debitado do saldo que ele recarrega.", href: "/cadastro", cta: "Criar minha loja" },
              { t: "Parceiro", d: "Indica lojistas e soluções da NextLevel e acompanha só as próprias comissões, com carência e extrato claros.", href: "/parceiros", cta: "Seja parceiro" },
            ].map((x) => <div key={x.t} className="rounded-2xl border border-border bg-surface p-6"><h3 className="text-lg font-bold">{x.t}</h3><p className="mt-2 text-sm text-muted-foreground">{x.d}</p><Link href={x.href} className="mt-4 inline-flex text-sm font-semibold text-link underline">{x.cta} →</Link></div>)}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">A NextLevel cobra só o que é dela (planos, taxas e serviços), em fatura separada. Precisa de loja montada, migração, temas ou anúncios? Veja as <Link href="/solucoes" className="font-semibold text-link underline">Soluções NextLevel</Link> ou peça um <Link href="/solucoes#diagnostico" className="font-semibold text-link underline">diagnóstico gratuito</Link>.</p>
        </div>
      </section>

      {/* 10. Perguntas frequentes */}
      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className={sectionTitle}>Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">{faq.map((f) => <details key={f.q} className="group rounded-xl border border-border bg-surface p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-muted-foreground">{f.a}</p></details>)}</div>
          <p className="mt-6 text-sm"><Link href="/faq" className="font-semibold text-link underline">Ver todas as perguntas</Link></p>
        </div>
      </section>

      {/* 11. Chamada final */}
      <section className="relative overflow-hidden bg-band py-20 text-band-foreground">
        <TexturaDeFundo marca="superdrop" nome="sd-textura-fundo" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div><Logo tone="on-dark" className="mb-5 h-10" /><h2 className={`${sectionTitle} max-w-xl`}>Pronto para abrir a sua loja?</h2></div>
          <div className="flex flex-wrap gap-3"><Link href="/cadastro" className={`${btn} bg-primary text-primary-foreground hover:bg-primary focus-visible:outline-band-foreground`}>Criar minha loja</Link><Link href="/login" className={`${btn} border border-band-foreground/30 hover:bg-band-foreground/10 focus-visible:outline-band-foreground`}>Área de membros</Link></div>
        </div>
      </section>
    </>
  );
}
