import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, Building2, Clapperboard, Lock, PackageCheck, ShieldCheck, Store, Truck, UserRound } from "lucide-react";
import type { Brand } from "@/lib/brand";
import type { BrasPublicVideo } from "@/lib/domain/bras/videos";
import { JsonLd } from "@/components/portal/json-ld";
import { ImagemEmCriacao } from "@/components/portal/imagem-em-criacao";
import { BrasVideoCard } from "./video-card";
import "./bras.css";

/**
 * Página pública da Brás Digital (D91): apresenta com força, mostra os vídeos de análise com o botão de compra
 * (que leva ao cadastro) e leva à área do cliente. Nunca mostra preço, estoque ou importadora.
 * Só anuncia o que existe: o pedido pelo sistema e o catálogo com preço chegam quando as importadoras forem conectadas.
 * Fotos: public/portal/bras/v3/MANIFESTO.md (sem arquivo, aparece "Imagem em criação").
 */
/** Dúvidas sobre a análise: a resposta sobre cobrança acompanha a regra atual do Estúdio (D94). */
export const brasAnalysisFaq = (mode: "OPEN" | "PAID") => [
  { q: "O que é a análise de mercado?", a: "Para cada descoberta, a gente analisa por que o produto está em alta, quantos vendem, o preço praticado no Mercado Livre, a margem estimada a partir do preço da caixa, os riscos e como anunciar. São dados e opinião, nunca promessa de ganho." },
  { q: "A análise é paga?", a: mode === "OPEN" ? "Na fase de lançamento, a análise completa está liberada para todos os membros cadastrados. O veredito, o trecho da análise e o preço da caixa são sempre grátis para membros." : "O veredito, o trecho da análise e o preço da caixa são grátis para membros. A análise completa é liberada pela assinatura ou pelas suas compras no período. Comprar nunca é pago." },
];

export const BRAS_FAQ = [
  { q: "O cadastro é pago?", a: "Não. O cadastro é grátis para novos membros. Você informa o CNPJ da empresa, cria a senha e entra na hora." },
  { q: "Preciso ter CNPJ?", a: "Sim. A Brás Digital é só para empresas: lojistas, vendedores de marketplace e distribuidores. Um cadastro por CNPJ." },
  { q: "Por que não vejo o preço sem cadastro?", a: "Porque a tabela é de atacado e é só para quem compra para revender. Assim ela não fica aberta para qualquer pessoa na internet." },
  { q: "Qual é o pedido mínimo?", a: "Uma caixa fechada. Não vendemos peça avulsa nem no varejo." },
  { q: "Como as caixas chegam até mim?", a: "A retirada é no Brás, em São Paulo, pela transportadora que você escolher. A plataforma não calcula frete." },
  { q: "A importadora fica com os meus dados?", a: "Não. A importadora recebe só o endereço de envio de cada pedido. Seu CNPJ, telefone e e-mail ficam com a Brás Digital." },
  { q: "Com quem eu falo se der algum problema?", a: "Com a equipe da Brás Digital. Atendimento, ocorrências e trocas são com a gente, não com a importadora." },
];

const STEPS = [
  { t: "Cadastre a empresa", d: "CNPJ, nome, WhatsApp e senha. É grátis e leva um minuto." },
  { t: "Descubra e analise", d: "Cada descoberta tem análise de mercado. Como membro, você vê o veredito, o preço da caixa e as caixas disponíveis." },
  { t: "Feche o pedido", d: "A equipe da Brás Digital confirma o pedido e o pagamento com você." },
  { t: "Retire no Brás", d: "Sua transportadora retira as caixas na importadora. Ela recebe só o endereço de envio." },
];

const PUBLICO = [
  { icon: Store, t: "Vendedor de Mercado Livre e marketplaces", d: "Compre em caixa, anuncie com a análise já vista e reponha sem sair de casa.", img: { nome: "bd-publico-marketplace", alt: "Vendedor embalando pedidos de marketplace em uma bancada com caixas abertas", posicao: "50% 45%" } },
  { icon: Building2, t: "Lojista com loja física ou online", d: "Novidades das importadoras em vídeo antes de vir ao Brás, com a tabela de atacado na mão.", img: { nome: "bd-publico-lojista", alt: "Lojista conferindo o celular entre prateleiras de uma loja de utilidades", posicao: "55% 40%" } },
  { icon: Truck, t: "Distribuidor de outros estados", d: "Compre do Brás de longe: retire com a sua transportadora e acompanhe tudo pelo sistema.", img: { nome: "bd-publico-distribuidor", alt: "Caixas de papelão empilhadas em um caminhão baú sendo carregado", posicao: "50% 55%" } },
];

const FATOS = ["Só caixa fechada", "A partir de 1 caixa", "Análise de mercado de cada descoberta", "Retirada no Brás com a sua transportadora", "Cadastro grátis com CNPJ", "Importadoras do Brás em um lugar só"];

export function BrasHome({ brand, videos, analysisMode = "OPEN" }: { brand: Brand; videos: BrasPublicVideo[]; analysisMode?: "OPEN" | "PAID" }) {
  const faq = [...brasAnalysisFaq(analysisMode), ...BRAS_FAQ];
  const destaque = videos[0];
  const section = "scroll-mt-16 px-4 py-16 md:py-24";
  return (
    <div className="bd-home">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />

      {/* 1. Herói: a promessa, os dois botões e o feed real (vídeo + preço trancado + comprar). */}
      <section className="bd-dark relative overflow-hidden" aria-labelledby="bd-h1">
        <div aria-hidden className="bd-caixas pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #fb8342, transparent 65%)" }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 md:grid-cols-[1.15fr_0.85fr] md:pb-24 md:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-[var(--bd-tinta-clara)]"><Boxes className="size-4 text-[var(--bd-laranja-claro)]" aria-hidden />Atacado em caixa fechada · Brás, São Paulo</p>
            <h1 id="bd-h1" className="bd-display bd-h1 mt-6 text-white">
              <span className="bd-word">O Brás inteiro</span>{" "}
              <span className="bd-word" style={{ animationDelay: "0.12s" }}>no seu celular.</span>{" "}
              <span className="bd-word bd-accent" style={{ animationDelay: "0.24s" }}>Em caixa fechada.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--bd-tinta-suave)]">Descobertas das importadoras do Brás com análise de mercado: tendência, concorrência e por que é o produto certo para revender. Para quem vende no Mercado Livre, na loja ou para o Brasil todo.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className="bd-btn bd-btn--fogo">Cadastrar minha empresa grátis <ArrowRight className="size-5" aria-hidden /></Link>
              <Link href="/login" className="bd-btn bd-btn--linha"><UserRound className="size-5" aria-hidden />Área do cliente</Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--bd-tinta-suave)]">
              {["Cadastro com CNPJ", "Sem taxa", "Preço liberado na hora"].map((t) => <li key={t} className="flex items-center gap-1.5"><BadgeCheck className="size-4 text-[var(--bd-laranja-claro)]" aria-hidden />{t}</li>)}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="bd-phone" role="img" aria-label="Prévia no celular: a descoberta em vídeo, a análise e o preço trancados para quem não é membro e o botão Ver análise e preço">
              <div className="bd-phone-screen">
                {destaque ? (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura do próprio YouTube
                  <img src={`https://i.ytimg.com/vi/${destaque.youtubeId}/hqdefault.jpg`} alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div aria-hidden className="absolute inset-0 grid place-items-center"><Clapperboard className="size-14 text-white/25" /></div>
                )}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85" />
                <div aria-hidden className="absolute left-4 right-4 top-6 flex items-center justify-between text-xs font-semibold text-white">
                  <span className="rounded-full bg-black/40 px-2.5 py-1">{destaque?.trendSignal ?? "Descoberta"}</span>
                  <span className="rounded-full bg-[#fb8342] px-2.5 py-1 text-[#101b34]">Caixa fechada</span>
                </div>
                <div aria-hidden className="absolute bottom-4 left-4 right-4 space-y-2.5 text-white">
                  <p className="text-base font-bold leading-snug">{destaque?.title ?? "A descoberta da semana"}</p>
                  <p className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-sm font-semibold backdrop-blur"><Lock className="size-4" />Análise e preço · só para membros</p>
                  <span className="flex h-11 items-center justify-center rounded-full bg-[#fb8342] text-sm font-bold text-[#101b34]">Ver análise e preço</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Faixa com as regras do atacado. */}
      <div className="bd-marquee overflow-hidden border-y border-black/10 bg-[var(--bd-laranja-claro)] py-3 text-[var(--bd-navy)]" aria-label="Como funciona o atacado da Brás Digital">
        <ul className="bd-marquee-track gap-10 text-sm font-bold uppercase tracking-wide">
          {[...FATOS, ...FATOS].map((f, i) => <li key={i} aria-hidden={i >= FATOS.length ? true : undefined} className="flex shrink-0 items-center gap-10 whitespace-nowrap">{f}<span aria-hidden>✦</span></li>)}
        </ul>
      </div>

      {/* 3. Descobertas: Shorts público com o convite para a análise (leva ao cadastro). */}
      <section id="videos" aria-labelledby="bd-videos" className={`bd-dark ${section}`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-laranja-claro)]">Descobertas</p>
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
            <div className="rounded-[22px] border border-dashed border-white/25 p-8 text-center md:p-12">
              <Clapperboard className="mx-auto size-10 text-[var(--bd-laranja-claro)]" aria-hidden />
              <p className="bd-display mt-4 text-2xl text-white">As primeiras descobertas estão sendo gravadas.</p>
              <p className="mx-auto mt-2 max-w-md text-[var(--bd-tinta-suave)]">Cadastre a empresa agora e veja cada descoberta, com a análise e o preço da caixa, assim que for publicada.</p>
              <Link href="/cadastro" className="bd-btn bd-btn--fogo mt-6">Cadastrar grátis</Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. Como funciona. */}
      <section id="como-funciona" aria-labelledby="bd-como" className={`bd-papel ${section}`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="bd-como" className="bd-display bd-h2 max-w-3xl">Do vídeo à caixa na sua transportadora, <span className="bd-accent">em quatro passos.</span></h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="bd-reveal border-t-2 border-current/15 pt-5">
                <span className="bd-step-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-xl font-extrabold">{s.t}</h3>
                <p className="mt-2 leading-relaxed opacity-80">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 grid items-center gap-8 md:grid-cols-2">
            <ImagemEmCriacao marca="bras" nome="bd-corredor-caixas" alt="Corredor de importadora no Brás com caixas fechadas empilhadas até o teto" ratio="4 / 3" posicao="50% 50%" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest bd-accent">Só atacado</p>
              <p className="bd-display mt-3 text-3xl">Caixa fechada, a partir de uma caixa.</p>
              <p className="mt-3 max-w-md leading-relaxed opacity-80">Nada de peça avulsa. Você compra como as importadoras vendem, com a quantidade de cada caixa mostrada no vídeo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4b. Da descoberta à decisão: as três camadas (D94). */}
      <section aria-labelledby="bd-camadas" className={`bd-dark ${section}`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="bd-camadas" className="bd-display bd-h2 max-w-3xl text-white">Da descoberta <span className="bd-accent">à decisão.</span></h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { t: "Descoberta", quem: "Para todo mundo", d: "O vídeo curto mostra o achado e o sinal de que tem algo acontecendo com ele." },
              { t: "Membro", quem: "Grátis, com CNPJ", d: "O veredito da análise, um trecho do vídeo, o preço da caixa, as caixas disponíveis e o pedido." },
              { t: "Análise completa", quem: analysisMode === "OPEN" ? "Liberada para membros no lançamento" : "Assinatura ou liberada pelas suas compras", d: "Tendência, concorrência, preço no Mercado Livre, margem estimada, riscos e como anunciar." },
            ].map((c, i) => (
              <li key={c.t} className="bd-reveal rounded-2xl bg-white/[0.06] p-6">
                <span className="bd-step-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-xl font-extrabold text-white">{c.t}</h3>
                <p className="mt-1 text-sm font-bold text-[var(--bd-laranja-claro)]">{c.quem}</p>
                <p className="mt-2 leading-relaxed text-[var(--bd-tinta-suave)]">{c.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Para quem é. */}
      <section id="para-quem" aria-labelledby="bd-quem" className={`bd-claro ${section} bg-canvas text-foreground`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="bd-quem" className="bd-display bd-h2 max-w-3xl">Feito para quem compra <span className="bd-accent">para revender.</span></h2>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {PUBLICO.map((p) => (
              <li key={p.t} className="bd-reveal">
                <ImagemEmCriacao marca="bras" nome={p.img.nome} alt={p.img.alt} ratio="4 / 5" posicao={p.img.posicao} />
                <h3 className="mt-5 flex items-start gap-2 text-xl font-extrabold"><span className="bd-accent"><p.icon className="mt-1 size-5 shrink-0" aria-hidden /></span>{p.t}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Proteção dos dados do lojista. */}
      <section aria-labelledby="bd-dados" className={`bd-dark ${section}`}>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <ShieldCheck className="size-10 text-[var(--bd-laranja-claro)]" aria-hidden />
            <h2 id="bd-dados" className="bd-display bd-h2 mt-4 text-white">Seus clientes e seus dados <span className="bd-accent">ficam com você.</span></h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--bd-tinta-suave)]">A importadora recebe só o endereço de envio do pedido. Seu CNPJ, telefone e e-mail não saem da Brás Digital, e o atendimento é com a nossa equipe.</p>
          </div>
          <ul className="grid gap-3">
            {[
              { i: Lock, t: "Preço fechado", d: "A tabela de atacado só aparece para membros com CNPJ." },
              { i: PackageCheck, t: "Importadora vê só o envio", d: "Nada de cadastro, telefone ou e-mail do lojista." },
              { i: UserRound, t: "Atendimento da Brás Digital", d: "Ocorrências, trocas e dúvidas são resolvidas com a gente." },
            ].map((x) => (
              <li key={x.t} className="flex gap-4 rounded-2xl bg-white/[0.06] p-5">
                <x.i className="mt-0.5 size-6 shrink-0 text-[var(--bd-laranja-claro)]" aria-hidden />
                <div><p className="font-bold text-white">{x.t}</p><p className="mt-1 text-sm text-[var(--bd-tinta-suave)]">{x.d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. Dúvidas. */}
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

      {/* 8. Chamada final. */}
      <section aria-labelledby="bd-fim" className="bg-[var(--bd-laranja-claro)] px-4 py-16 text-[var(--bd-navy)] md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <h2 id="bd-fim" className="bd-display max-w-2xl text-4xl md:text-5xl">Cadastre a empresa e veja os preços hoje.</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/cadastro" className="bd-btn bd-btn--escuro">Cadastrar grátis <ArrowRight className="size-5" aria-hidden /></Link>
            <Link href="/login" className="bd-btn border-[1.5px] border-[var(--bd-navy)] focus-visible:outline-[var(--bd-navy)]">Área do cliente</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
