import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Boxes, Building2, Check, Clapperboard, Factory, Headset, Lock, MessageCircle, PackageCheck, ShieldCheck, Sparkles, Store, Truck, UserRound } from "lucide-react";
import type { Brand } from "@/lib/brand";
import type { BrasPublicVideo } from "@/lib/domain/bras/videos";
import type { BrasAnalysisSettings } from "@/lib/domain/bras/descobertas";
import { JsonLd } from "@/components/portal/json-ld";
import { ImagemEmCriacao, formatosDisponiveis } from "@/components/portal/imagem-em-criacao";
import { Phone, Tablet } from "@/components/portal/commerce/device";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { BrasVideoCard } from "./video-card";
import { DEMO_DISCOVERY, DiscoveryPanel, FeedPhone, RequestForm, RequestsPanel } from "./bras-ui";
import "./bras.css";
import { CabecalhoSobreHeroi } from "@/components/portal/superdrop/cabecalho-sobre-heroi";
import { BDC, BDC_HEROI } from "@/lib/marcas/bras-digital-club";

/**
 * Página pública da Brás Digital (D92, refeita na D98 com a home da Commerce como referência): apresenta a plataforma com as telas
 * do Meu Brás, as descobertas em vídeo, o acesso por camada e o pedido pelo sistema. Nunca mostra preço (nem em reais nas telas de
 * demonstração), estoque ou importadora. Só anuncia o que existe; fotos do MANIFESTO aparecem só quando o arquivo existir.
 */
/** Dúvidas sobre a análise: a resposta sobre cobrança acompanha a regra atual do Estúdio (D95). */
export const brasAnalysisFaq = (mode: "OPEN" | "PAID") => [
  { q: "O que é a análise de mercado?", a: "Para cada descoberta, a gente analisa por que o produto está em alta, quantos vendem, o preço praticado no Mercado Livre, a margem estimada a partir do preço da caixa, os riscos e como anunciar. São dados e opinião, nunca promessa de ganho." },
  { q: "A análise é paga?", a: mode === "OPEN" ? "Na fase de lançamento, a análise completa está liberada para todos os membros cadastrados. O veredito, o trecho da análise e o preço da caixa são sempre grátis para membros." : "O veredito, o trecho da análise e o preço da caixa são grátis para membros. A análise completa é liberada pela assinatura ou pelas suas compras no período. Comprar nunca é pago." },
];

export const BRAS_FAQ = [
  { q: "O cadastro é pago?", a: "Não. O cadastro é grátis para novos membros. Você informa o CNPJ da empresa, cria a senha e entra na hora." },
  { q: "Preciso ter CNPJ?", a: "Sim. O Brás Digital Club é só para empresas: lojistas, vendedores de marketplace e distribuidores. Um cadastro por CNPJ." },
  { q: "Por que não vejo o preço sem cadastro?", a: "Porque a tabela é de atacado e é só para quem compra para revender. Assim ela não fica aberta para qualquer pessoa na internet." },
  { q: "Qual é o pedido mínimo?", a: "Uma caixa fechada. Não vendemos peça avulsa nem no varejo." },
  { q: "Como as caixas chegam até mim?", a: "A retirada é no Brás, em São Paulo, pela transportadora que você escolher. A plataforma não calcula frete." },
  { q: "A importadora fica com os meus dados?", a: "Não. A importadora recebe só o endereço de envio de cada pedido. Seu CNPJ, telefone e e-mail ficam com o Brás Digital Club." },
  { q: "Com quem eu falo se der algum problema?", a: "Com a equipe do Brás Digital Club. Atendimento, ocorrências e trocas são com a gente, não com a importadora." },
];

const STEPS = [
  { t: "Cadastre a empresa", d: "CNPJ, nome, WhatsApp e senha. É grátis e o acesso de membro sai na hora." },
  { t: "Descubra e analise", d: "Cada descoberta tem análise de mercado. Como membro, você vê o veredito, o preço da caixa e as caixas disponíveis." },
  { t: "Peça as caixas", d: "Escolha quantas caixas quer pelo sistema. A equipe do Brás Digital Club confirma o pedido e o pagamento com você." },
  { t: "Retire no Brás", d: "Sua transportadora retira as caixas na importadora. Ela recebe só o endereço de envio." },
];

const PUBLICO = [
  { icon: Store, t: "Vendedor de Mercado Livre e marketplaces", d: "Compre em caixa o que a análise mostra que está girando, anuncie com o que já foi estudado e reponha sem sair de casa.", img: { nome: "bd-publico-marketplace", alt: "Vendedor embalando pedidos de marketplace em uma bancada com caixas abertas", posicao: "50% 45%" } },
  { icon: Building2, t: "Lojista com loja física ou online", d: "Veja as novidades das importadoras em vídeo antes de vir ao Brás, com a tabela de atacado na mão.", img: { nome: "bd-publico-lojista", alt: "Lojista conferindo o celular entre prateleiras de uma loja de utilidades", posicao: "55% 40%" } },
  { icon: Truck, t: "Distribuidor de outros estados", d: "Compre do Brás de longe: peça pelo sistema, retire com a sua transportadora e acompanhe cada pedido.", img: { nome: "bd-publico-distribuidor", alt: "Caixas de papelão empilhadas em um caminhão baú sendo carregado", posicao: "50% 55%" } },
];

/** Confiança (D158): fatos do sistema hoje. Números, clientes e depoimentos só entram quando forem reais e autorizados. */
const CONFIANCA = ["Cadastro só com CNPJ conferido", "Preço, estoque e análise só para membros", "Termos próprios, com aceite registrado", "Operado pela NextLevel Marketing Ltda."];

const FATOS = ["Só caixa fechada", "A partir de 1 caixa", "Análise de mercado de cada descoberta", "Retirada no Brás com a sua transportadora", "Cadastro grátis com CNPJ", "Importadoras do Brás em um lugar só"];

/** Foto de direção de arte só quando o arquivo existe (sem quadro "em criação" na página da Brás). */
const temFoto = (nome: string) => formatosDisponiveis("bras", nome).length > 0;

export function BrasHome({ brand, videos, analysis }: { brand: Brand; videos: BrasPublicVideo[]; analysis: Pick<BrasAnalysisSettings, "mode" | "volumeThresholdCents" | "monthlyPriceCents"> }) {
  const faq = [...brasAnalysisFaq(analysis.mode), ...BRAS_FAQ];
  const destaque = videos[0];
  const section = "scroll-mt-16 px-4 py-16 md:py-24";
  const whatsImportadora = brasWhatsappUrl("Olá! Sou de uma importadora do Brás e quero conhecer o Brás Digital Club.");
  const analiseComo = analysis.mode === "OPEN"
    ? "Liberada para todos os membros na fase de lançamento."
    : [analysis.monthlyPriceCents !== null ? "Por assinatura mensal" : null, analysis.volumeThresholdCents !== null ? "liberada pelas suas compras no período" : null].filter(Boolean).join(" ou ") + ".";
  return (
    <div className="bd-home">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />

      {/* 1. Herói (D158): navy, slogan oficial como título em HTML, peça 3D do pacote (decorativa). No computador a peça fica à
          direita com véu navy; no celular, recorte quadrado com o símbolo inteiro, abaixo do texto. */}
      <section id="inicio" data-heroi-escuro="bras" className="bd-dark relative isolate overflow-hidden" aria-labelledby="bd-h1">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 md:min-h-[40rem] md:content-center md:pb-24 md:pt-20">
          <div className="relative z-10 max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-[var(--bd-tinta-clara)]"><Boxes className="size-4 text-[var(--bd-pulso)]" aria-hidden />Clube de compras do Brás para empresas com CNPJ</p>
            <h1 id="bd-h1" className="bd-display bd-h1 mt-6 text-white">Conecte seu negócio ao <span className="bd-accent">pulso do Brás.</span></h1>
            <div className="bd-pulso-linha mt-6 w-24" aria-hidden />
            <p className="mt-6 text-lg leading-relaxed text-[var(--bd-tinta-suave)] md:text-xl">Descobertas das importadoras em vídeo, análise de mercado de cada produto e pedido de caixas fechadas pelo sistema. Para quem vende no Mercado Livre, na loja ou para o Brasil todo.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/cadastro" className="bd-btn bd-btn--primario bd-btn--lg">Cadastrar minha empresa grátis <ArrowRight className="size-5" aria-hidden /></Link>
              <Link href="/login" className="bd-btn bd-btn--linha bd-btn--lg"><UserRound className="size-5" aria-hidden />Área do membro</Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--bd-tinta-suave)]">
              {["Cadastro com CNPJ", "Sem mensalidade para comprar", "Preço liberado na hora"].map((t) => <li key={t} className="flex items-center gap-1.5"><BadgeCheck className="size-4 text-[var(--bd-pulso)]" aria-hidden />{t}</li>)}
            </ul>
          </div>
          <picture className="pointer-events-none relative mx-auto block w-full max-w-[22rem] md:absolute md:inset-y-0 md:right-0 md:mx-0 md:w-[58%] md:max-w-none">
            <source media="(min-width: 768px)" srcSet={`${BDC_HEROI.base}-800.webp 800w, ${BDC_HEROI.base}-1600.webp 1600w`} sizes="58vw" />
            <img src={BDC_HEROI.mobile} alt="" width={800} height={800} fetchPriority="high" decoding="async" className="aspect-square w-full rounded-[2rem] object-cover md:aspect-auto md:h-full md:rounded-none" style={{ objectPosition: "30% 50%" }} />
          </picture>
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] bg-[linear-gradient(90deg,var(--bd-navy)_0%,color-mix(in_srgb,var(--bd-navy)_40%,transparent)_30%,transparent_60%)] md:block" />
        </div>
        <CabecalhoSobreHeroi alvo="inicio" />
      </section>

      {/* 2. Faixa com as regras do atacado. */}
      <div className="bd-marquee overflow-hidden border-y border-[var(--bdc-linha-escura)] bg-[var(--bd-navy-2)] py-3 text-[var(--bd-tinta-clara)]" aria-label="Como funciona o atacado do Brás Digital Club">
        <ul className="bd-marquee-track gap-10 text-sm font-bold uppercase tracking-wide">
          {[...FATOS, ...FATOS].map((f, i) => <li key={i} aria-hidden={i >= FATOS.length ? true : undefined} className="flex shrink-0 items-center gap-10 whitespace-nowrap">{f}<span aria-hidden className="text-[var(--bd-pulso)]">✦</span></li>)}
        </ul>
      </div>

      {/* 3. Proposta de valor (pertencimento e transformação) + mosaico com o que existe hoje. */}
      <section id="proposta" aria-labelledby="bd-plat" className={`bd-papel ${section}`}>
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-widest bd-accent">O Club</p>
          <h2 id="bd-plat" className="bd-display bd-h2 mt-3 max-w-4xl">O Brás inteiro no seu celular, <span className="bd-accent">com dado na mão.</span></h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed opacity-85">O {BDC.name} aproxima as importadoras do Brás de quem compra para revender: você vê o que está chegando, entende o mercado de cada produto e pede as caixas sem viajar só para perguntar preço.</p>
          <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-rows-2">
            <a href="#videos" className="group bd-card bd-reveal bd-dark lg:row-span-2 lg:min-h-[40rem]">
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-wider text-[var(--bd-pulso)]">Descobertas em vídeo</p>
                <h3 className="bd-display mt-2 max-w-sm text-3xl text-white sm:text-4xl">Os achados das importadoras, toda semana</h3>
                <p className="mt-3 max-w-sm text-[var(--bd-tinta-suave)]">Vídeo curto com o produto, a caixa e o sinal de que tem algo acontecendo com ele.</p>
              </div>
              <div className="mx-auto mt-8 w-[14rem] translate-y-10 transition-transform duration-500 group-hover:translate-y-6 sm:w-[15rem]"><Phone><FeedPhone youtubeId={videos[1]?.youtubeId ?? destaque?.youtubeId} title={videos[1]?.title ?? destaque?.title} trend={videos[1]?.trendSignal ?? destaque?.trendSignal} /></Phone></div>
              <ArrowUpRight aria-hidden className="absolute right-6 top-6 size-7 text-white/70 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            </a>

            <a href="#capacidades" className="group bd-card bd-reveal bg-[var(--bd-acao)] text-white">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider">Análise de mercado</p>
                <h3 className="bd-display mt-2 max-w-xs text-3xl">Veredito e nota antes de comprar a caixa</h3>
              </div>
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 text-[var(--bd-navy)] shadow-lg" aria-hidden>
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--bd-navy)] text-2xl font-extrabold text-[var(--bd-pulso)]">{DEMO_DISCOVERY.score}</span>
                <div className="min-w-0 text-sm"><p className="text-[11px] font-semibold uppercase text-[var(--bd-cinza)]">Veredito</p><p className="font-bold leading-snug">{DEMO_DISCOVERY.verdict}</p><p className="mt-1 text-[var(--bd-cinza)]">Margem bruta estimada: <b>{DEMO_DISCOVERY.marginMin}% a {DEMO_DISCOVERY.marginMax}%</b></p></div>
              </div>
              <ArrowUpRight aria-hidden className="absolute right-6 top-6 size-7 opacity-70" />
            </a>

            <a href="#capacidades" className="group bd-card bd-reveal bd-tile ring-1 ring-black/5">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider bd-accent">Pedido pelo sistema</p>
                <h3 className="bd-display mt-2 max-w-xs text-3xl">Do recebido à retirada, cada pedido em um lugar</h3>
              </div>
              <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs font-semibold" aria-label="Situações do pedido">
                {["Recebido", "Confirmado", "Pago", "Retirado"].map((s, i) => (
                  <li key={s} className="flex flex-col items-center gap-2"><span className={`grid size-9 place-items-center rounded-full ${i < 3 ? "bg-[var(--bd-navy)] text-[var(--bd-pulso)]" : "border-2 border-dashed border-current/30"}`}>{i < 3 ? <Check className="size-4" aria-hidden /> : i + 1}</span>{s}</li>
                ))}
              </ol>
              <ArrowUpRight aria-hidden className="absolute right-6 top-6 size-7 opacity-60" />
            </a>
          </div>

          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: Lock, t: "Preço e estoque fechados", d: "A tabela de atacado só aparece para membros com CNPJ." },
              { i: BadgeCheck, t: "Acesso na hora", d: "Cadastro grátis e preço liberado assim que você entra." },
              { i: PackageCheck, t: "Importadora vê só o envio", d: "Nada de CNPJ, telefone ou e-mail do lojista." },
              { i: Headset, t: "Atendimento da Brás", d: "Pedido, pagamento e ocorrência com a nossa equipe." },
            ].map((x) => (
              <li key={x.t} className="bd-reveal flex gap-4 rounded-[1.25rem] bd-tile p-5 ring-1 ring-black/5">
                <x.i className="mt-0.5 size-6 shrink-0 bd-accent" aria-hidden />
                <div><p className="font-bold">{x.t}</p><p className="mt-1 text-sm opacity-80">{x.d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Descobertas: Shorts público com o convite para a análise (leva ao cadastro). */}
      <section id="videos" aria-labelledby="bd-videos" className={`bd-dark ${section}`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-pulso)]">Descobertas</p>
              <h2 id="bd-videos" className="bd-display bd-h2 mt-3 max-w-3xl text-white">Achados do Brás, <span className="bd-accent">com análise de mercado.</span></h2>
            </div>
            <p className="max-w-sm text-[var(--bd-tinta-suave)]">O vídeo mostra a descoberta. A análise (tendência, concorrência, preço e por que é o produto certo) e o preço da caixa ficam para membros.</p>
          </div>
          {videos.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {videos.map((v) => (
                <li key={v.id} className="bd-reveal"><BrasVideoCard youtubeId={v.youtubeId} title={v.title} summary={v.summary} trendSignal={v.trendSignal} buy={{ href: `/cadastro?video=${v.id}`, label: "Ver análise e preço" }} /></li>
              ))}
            </ul>
          ) : (
            <div className="grid items-center gap-8 rounded-[1.75rem] border border-white/15 bg-white/[0.04] p-6 md:grid-cols-[1fr_auto] md:p-10">
              <div>
                <Clapperboard className="size-10 text-[var(--bd-pulso)]" aria-hidden />
                <p className="bd-display mt-4 text-2xl text-white md:text-3xl">As primeiras descobertas estão sendo gravadas.</p>
                <p className="mt-2 max-w-md text-[var(--bd-tinta-suave)]">Cadastre a empresa agora e veja cada descoberta, com a análise e o preço da caixa, assim que for publicada.</p>
                <Link href="/cadastro" className="bd-btn bd-btn--primario mt-6">Cadastrar grátis <ArrowRight className="size-5" aria-hidden /></Link>
              </div>
              <div className="mx-auto w-[13rem]"><Phone><FeedPhone /></Phone></div>
            </div>
          )}
        </div>
      </section>

      {/* 5. O painel do membro: telas reais do Meu Brás, uma situação por vez. */}
      <section id="capacidades" aria-labelledby="bd-painel" className={`bd-papel ${section}`}>
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-widest bd-accent">Benefícios e capacidades · Meu Brás</p>
          <h2 id="bd-painel" className="bd-display bd-h2 mt-3 max-w-3xl">Do achado ao pedido, <span className="bd-accent">tudo no seu painel.</span></h2>
          <div className="mt-14 space-y-20 md:space-y-28">
            {[
              { k: "analise", sit: "Já comprou caixa de produto que não girou?", t: "Veja o veredito antes de comprar", d: "Cada descoberta vem com veredito e nota de 0 a 10, a tendência, a concorrência, a faixa de preço no Mercado Livre e a margem estimada a partir do preço da caixa. Dados e opinião, nunca promessa de ganho.", visual: <Tablet><DiscoveryPanel side={false} /></Tablet> },
              { k: "pedido", sit: "Cansou de ir ao Brás só para perguntar preço?", t: "Peça as caixas em um minuto", d: "Escolha quantas caixas quer, diga a transportadora e o endereço de envio. A equipe do Brás Digital Club confirma o pedido e o pagamento com você.", visual: <div className="mx-auto w-[16rem]"><Phone><RequestForm /></Phone></div> },
              { k: "acompanhar", sit: "Perdeu a conta do que já pagou e do que já saiu?", t: "Acompanhe cada pedido", d: "Recebido, confirmado, pago, retirado: a situação de cada pedido fica no Meu Brás. O nome da importadora aparece quando o pedido é confirmado.", visual: <Tablet><RequestsPanel side={false} /></Tablet> },
            ].map((r, n) => (
              <article key={r.k} className="bd-reveal grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <div className={n % 2 ? "md:order-2" : ""}>
                  <p className="text-sm font-semibold bd-accent">{r.sit}</p>
                  <h3 className="bd-display mt-2 text-3xl sm:text-4xl">{r.t}</h3>
                  <p className="mt-4 max-w-md text-lg leading-relaxed opacity-85">{r.d}</p>
                </div>
                <div className={n % 2 ? "md:order-1" : ""}>{r.visual}</div>
              </article>
            ))}
          </div>
          <p className="mt-10 text-xs opacity-70">Telas de demonstração do Meu Brás, com produtos, pedidos e números fictícios. Preços aparecem só para membros.</p>
        </div>
      </section>

      {/* 6. Acesso por camada (D95): o que cada um vê. */}
      <section id="acesso" aria-labelledby="bd-acesso" className={`bd-dark ${section}`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="bd-acesso" className="bd-display bd-h2 mx-auto max-w-3xl text-center text-white">Comprar é grátis. <span className="bd-accent">A análise é o seu atalho.</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[var(--bd-tinta-suave)]">Três camadas: a descoberta é pública, o preço é de quem tem CNPJ e a análise completa é de quem quer decidir com dado.</p>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { t: "Descoberta", quem: "Para todo mundo", tag: "Aberto", itens: ["Vídeo curto de cada achado", "Sinal de tendência em palavras", "Título e gancho do produto"], on: false },
              { t: "Membro", quem: "Grátis, com CNPJ", tag: "Grátis", itens: ["Preço da caixa e caixas disponíveis", "Veredito, nota e trecho da análise", "Pedido de caixas pelo sistema", "Acompanhamento de cada pedido"], on: true },
              { t: "Análise completa", quem: analiseComo, tag: analysis.mode === "OPEN" ? "Liberada no lançamento" : "Para membros", itens: ["Vídeo completo da análise", "Tendência e concorrência", "Preço no Mercado Livre e margem estimada", "Riscos e como anunciar"], on: false },
            ].map((c) => (
              <li key={c.t} className={`bd-reveal relative flex flex-col rounded-[1.5rem] p-6 ${c.on ? "bg-white text-[var(--bd-navy)] shadow-[0_0_0_2px_var(--bd-pulso),0_24px_48px_-24px_rgba(0,0,0,0.6)] md:-translate-y-2" : "bg-white/[0.06] text-[var(--bd-tinta-clara)]"}`}>
                {c.on ? <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--bd-pulso)] px-3 py-1 text-xs font-bold text-[var(--bd-navy)] shadow"><Sparkles className="size-3.5" aria-hidden />Comece por aqui</span> : null}
                <p className={`text-sm font-bold ${c.on ? "text-[var(--bd-acao)]" : "text-[var(--bd-pulso)]"}`}>{c.tag}</p>
                <h3 className="bd-display mt-1 text-2xl">{c.t}</h3>
                <p className={`mt-1 min-h-10 text-sm ${c.on ? "text-[var(--bd-cinza)]" : "text-[var(--bd-tinta-suave)]"}`}>{c.quem}</p>
                <ul className="mt-5 space-y-2 text-sm">{c.itens.map((i) => <li key={i} className="flex gap-2"><Check className={`mt-0.5 size-4 shrink-0 ${c.on ? "text-[#17643a]" : "text-[var(--bd-pulso)]"}`} aria-hidden />{i}</li>)}</ul>
                {c.on ? <Link href="/cadastro" className="bd-btn bd-btn--escuro mt-auto w-full translate-y-0 pt-0" style={{ marginTop: "1.75rem" }}>Cadastrar grátis <ArrowRight className="size-5" aria-hidden /></Link> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. Como funciona. */}
      <section id="como-funciona" aria-labelledby="bd-como" className={`bd-papel ${section}`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="bd-como" className="bd-display bd-h2 max-w-3xl">Do vídeo à caixa na sua transportadora, <span className="bd-accent">em quatro passos.</span></h2>
          {temFoto("bd-corredor-caixas") ? <ImagemEmCriacao marca="bras" nome="bd-corredor-caixas" alt="Corredor de importadora no Brás com caixas fechadas empilhadas até o teto" ratio="16 / 9" className="mt-10 w-full" /> : null}
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="bd-reveal rounded-[1.5rem] bd-tile p-6 ring-1 ring-black/5">
                <span className="bd-step-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-xl font-extrabold">{s.t}</h3>
                <p className="mt-2 leading-relaxed opacity-80">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/cadastro" className="bd-btn bd-btn--escuro">Cadastrar minha empresa <ArrowRight className="size-5" aria-hidden /></Link>
            <p className="text-sm opacity-80">Caixa fechada, a partir de uma caixa. Nada de peça avulsa.</p>
          </div>
        </div>
      </section>

      {/* 8. Para quem é. */}
      <section id="para-quem" aria-labelledby="bd-quem" className={`bd-claro ${section} bg-canvas text-foreground`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="bd-quem" className="bd-display bd-h2 max-w-3xl">Feito para quem compra <span className="bd-accent">para revender.</span></h2>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {PUBLICO.map((p) => (
              <li key={p.t} className="bd-reveal flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface">
                {temFoto(p.img.nome) ? <ImagemEmCriacao marca="bras" nome={p.img.nome} alt={p.img.alt} ratio="4 / 3" posicao={p.img.posicao} /> : null}
                <div className="flex flex-1 flex-col p-6">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[var(--bd-navy)] text-[var(--bd-pulso)]"><p.icon className="size-6" aria-hidden /></span>
                  <h3 className="mt-5 text-xl font-extrabold">{p.t}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{p.d}</p>
                  <Link href="/cadastro" className="mt-5 inline-flex items-center gap-1 font-semibold text-link underline underline-offset-4 hover:no-underline">Começar assim <ArrowRight className="size-4" aria-hidden /></Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9. Confiança: só o que o sistema faz hoje (regras, proteção dos dados, quem opera). Sem número, cliente ou depoimento. */}
      <section id="confianca" aria-labelledby="bd-dados" className={`bd-dark ${section}`}>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <ShieldCheck className="size-10 text-[var(--bd-pulso)]" aria-hidden />
            <h2 id="bd-dados" className="bd-display bd-h2 mt-4 text-white">Seus clientes e seus dados <span className="bd-accent">ficam com você.</span></h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--bd-tinta-suave)]">A importadora recebe só o endereço de envio do pedido. Seu CNPJ, telefone e e-mail não saem do Brás Digital Club, e o atendimento é com a nossa equipe.</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {CONFIANCA.map((t) => <li key={t} className="flex gap-3 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10"><Check className="mt-0.5 size-5 shrink-0 text-[var(--bd-pulso)]" aria-hidden /><span>{t}</span></li>)}
            </ul>
            {temFoto("bd-retirada-transportadora") ? <ImagemEmCriacao marca="bras" nome="bd-retirada-transportadora" alt="Motorista de transportadora conferindo caixas na porta de uma importadora no Brás" ratio="4 / 3" className="mt-8 w-full max-w-lg" /> : null}
          </div>
          <div className="rounded-[1.75rem] bg-white/[0.06] p-6 ring-1 ring-white/10 md:p-8">
            {temFoto("bd-importadora-balcao") ? <ImagemEmCriacao marca="bras" nome="bd-importadora-balcao" alt="Balcão de importadora no Brás com caixas organizadas" ratio="4 / 3" className="mb-6 w-full" /> : <Factory className="size-8 text-[var(--bd-pulso)]" aria-hidden />}
            <h3 className="bd-display mt-4 text-2xl text-white md:text-3xl">É importadora no Brás?</h3>
            <p className="mt-3 text-[var(--bd-tinta-suave)]">A equipe do Brás Digital Club grava as descobertas, analisa o mercado e leva compradores com CNPJ de todo o Brasil até as suas caixas. Você recebe o pedido e o endereço de envio, sem precisar atender um a um.</p>
            {whatsImportadora ? <Link href={whatsImportadora} target="_blank" rel="noreferrer" className="bd-btn bd-btn--linha mt-6"><MessageCircle className="size-5" aria-hidden />Falar com a equipe</Link> : null}
          </div>
        </div>
      </section>

      {/* 10. Dúvidas. */}
      <section id="duvidas" aria-labelledby="bd-faq" className={`bd-papel ${section}`}>
        <div className="mx-auto max-w-3xl">
          <h2 id="bd-faq" className="bd-display bd-h2">Dúvidas</h2>
          <div className="mt-8 divide-y divide-current/15 border-y border-current/15">
            {faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-4">{f.q}<span aria-hidden className="text-2xl leading-none transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 leading-relaxed opacity-85">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Chamada final: navy com a linha de pulso (gradiente só neste ponto de energia). */}
      <section aria-labelledby="bd-fim" className="bd-dark relative overflow-hidden px-4 py-16 md:py-24">
        <div aria-hidden className="bd-caixas pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl">
          <div className="bd-pulso-linha w-full max-w-md" aria-hidden />
          <div className="mt-10 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="bd-fim" className="bd-display max-w-2xl text-4xl text-white md:text-6xl">Cadastre a empresa e veja os preços hoje.</h2>
              <p className="mt-4 max-w-xl text-lg text-[var(--bd-tinta-suave)]">Grátis, com CNPJ, acesso na hora. Pedido mínimo de uma caixa.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/cadastro" className="bd-btn bd-btn--primario bd-btn--lg">Cadastrar grátis <ArrowRight className="size-5" aria-hidden /></Link>
              <Link href="/login" className="bd-btn bd-btn--linha bd-btn--lg">Área do membro</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
