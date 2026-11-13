import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, CheckCircle2, MessageCircle } from "lucide-react";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { DiagnosticoForm } from "@/app/(portal)/solucoes/diagnostico-form";
import { DIAGNOSTIC_NEEDS } from "@/lib/domain/corporate-sales";
import { THEME_CATALOG, isReleased } from "@/lib/themes/catalog";
import { casesPublicos, TEMAS_SEMIJOIAS, TEMAS_VITRINE, type CaseLoja, type Imagem } from "@/lib/portal/cases-temas";
import "./commerce.css";

/**
 * NextLevel Temas para Nuvemshop (D282): as lojas que a NextLevel criou, com o racional de cada uma, os temas da NextLevel
 * no fim como prova da tecnologia e destaque para semijoias. Serviço da agência (NextLevel Marketing Ltda); hoje no site
 * da Commerce, depois em Soluções. Nenhum case cita plataforma; nenhum número de venda inventado.
 */
const FATOS: { fato: string; fazemos: string }[] = [
  { fato: "A loja de temas da Nuvemshop tem mais de 70 temas grátis, em todos os planos.", fazemos: "Partimos do tema que mais combina com o seu catálogo, em vez de recomeçar do zero." },
  { fato: "Dá para testar outro layout como rascunho, sem mexer no que está no ar.", fazemos: "Montamos e aprovamos o layout novo em rascunho. A sua loja continua vendendo." },
  { fato: "Há layouts com seções (editor visual) e layouts legados, com caminhos de edição diferentes.", fazemos: "Identificamos o tipo do seu layout antes de propor qualquer mudança." },
  { fato: "O CSS personalizado fica no editor, e trocar de layout apaga o CSS adicionado.", fazemos: "Guardamos o seu CSS fora da loja, com versões, para reaplicar quando precisar." },
  { fato: "A edição do código (HTML e CSS) depende do plano e é feita pela linha de comando ou por FTP, conforme o layout.", fazemos: "Dizemos com clareza o que dá para fazer no seu plano antes de orçar." },
  { fato: "A plataforma não guarda cópia do layout personalizado.", fazemos: "Fazemos cópia de segurança antes de qualquer mudança e entregamos os arquivos." },
];
const FONTES = [
  ["Mais de 70 temas", "https://www.nuvemshop.com.br/recursos/layout-loja-virtual"],
  ["Layout em rascunho", "https://atendimento.nuvemshop.com.br/pt_BR/01-layout/como-criar-e-editar-o-layout-da-minha-loja-em-rascunho"],
  ["Editar o código do layout", "https://atendimento.nuvemshop.com.br/pt_BR/personalizacao-avancada-do-layout/como-editar-o-codigo-do-layout-da-minha-loja"],
  ["O que muda por CSS", "https://atendimento.nuvemshop.com.br/pt_BR/codigo-css/o-que-da-para-ser-alterado-por-css-nos-layouts-da-nuvemshop"],
] as const;
const ETAPAS = [
  ["Diagnóstico", "Olhamos a sua loja no celular e no computador: vitrine, busca, produto e carrinho."],
  ["Direção de arte", "Cores, tipografia e fotos com a cara da sua marca, não do tema padrão."],
  ["Protótipo", "Você vê e aprova antes de qualquer mudança na loja."],
  ["Aplicação com segurança", "Cópia de segurança primeiro, depois o layout novo em rascunho."],
  ["Testes", "Celular e computador, página por página, até o carrinho."],
  ["Entrega e treino", "Publicamos com você e ensinamos a trocar banners e vitrines sozinho."],
] as const;
const SEMIJOIAS = [
  "Banho de ouro, prata ou ródio com a foto trocando junto",
  "Garantia do banho escrita no produto, com os cuidados",
  "Guia de medida de anel e de comprimento de corrente",
  "Kits e \"compre o conjunto\" (brinco e colar)",
  "Embalagem para presente e cartão no carrinho",
  "Foto da peça no corpo, para dar a noção de tamanho",
];
const DUVIDAS = [
  ["Preciso sair da Nuvemshop?", "Não. Fazemos o layout na sua loja atual."],
  ["Minha loja sai do ar durante o trabalho?", "Não. Montamos em rascunho e publicamos só depois da sua aprovação."],
  ["E se eu trocar de tema depois?", "Entregamos os arquivos e o CSS guardados fora da loja, para reaplicar."],
  ["Funciona no celular?", "O layout é desenhado primeiro para o celular e conferido página por página."],
  ["Quanto custa?", "Depende do que a sua loja precisa. O diagnóstico é gratuito e o orçamento vem depois dele."],
  ["Vocês só trabalham com Nuvemshop?", "Não. A NextLevel também tem a própria plataforma, a NextLevel Commerce, com os temas que você vê no fim desta página."],
] as const;

const tema = (k: string) => THEME_CATALOG.find((t) => t.key === k && isReleased(t));
export const Foto = ({ i, className, priority, sizes }: { i: Imagem; className?: string; priority?: boolean; sizes?: string }) => <Image src={i.src} width={i.w} height={i.h} alt={i.alt} className={className} priority={priority} sizes={sizes ?? "(max-width: 768px) 100vw, 900px"} />;

export function BotaoVisitar({ c, grande }: { c: CaseLoja; grande?: boolean }) {
  return (
    <a href={c.url} target="_blank" rel="noopener" className={`inline-flex items-center gap-2 rounded-full font-bold text-[#06122b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${grande ? "h-14 px-7 text-base" : "h-12 px-6 text-sm"}`} style={{ background: c.cor }}>
      <span>{c.rotuloBotao}<span className="hidden sm:inline">: {c.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span><span className="sr-only sm:hidden"> {c.nome}</span></span><ArrowUpRight className="size-5" aria-hidden />
    </a>
  );
}

function BlocoCase({ c, n }: { c: CaseLoja; n: number }) {
  return (
    <article aria-labelledby={`case-${c.chave}`} className="border-t border-white/10 py-16 md:py-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="ec-mono text-sm" style={{ color: c.cor }}>{String(n).padStart(2, "0")} · {c.segmento}</p>
          <h3 id={`case-${c.chave}`} className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-none tracking-tight text-white">{c.nome}</h3>
          <div className="mt-6"><BotaoVisitar c={c} grande /></div>
          <div className="mt-8 rounded-2xl border-l-4 bg-white/[0.06] p-5" style={{ borderColor: c.cor }}>
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: c.cor }}>Como o nosso trabalho ajuda</p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#e6edff]">{c.ajuda}</p>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-[#b9c6e4]"><b className="text-white">O desafio:</b> {c.desafio}</p>
        </div>
        <div className="grid gap-6">
          {c.computador || c.celular ? (
            <div className="relative">
              {c.computador ? <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0b1328] shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)]"><div aria-hidden className="flex gap-1.5 border-b border-white/10 px-3 py-2"><span className="size-2.5 rounded-full bg-white/25" /><span className="size-2.5 rounded-full bg-white/25" /><span className="size-2.5 rounded-full bg-white/25" /></div><Foto i={c.computador} className="block h-auto w-full" /></div> : null}
              {c.celular ? <div className={`${c.computador ? "absolute -bottom-6 right-3 hidden w-[24%] sm:block" : "mx-auto w-48"} overflow-hidden rounded-[22px] border-4 border-[#111a33] shadow-[0_20px_40px_-12px_rgba(0,0,0,.8)]`}><Foto i={c.celular} className="block h-auto w-full" sizes="200px" /></div> : null}
            </div>
          ) : null}
          <ol className="mt-4 grid gap-4">
            {c.pontos.map((p, i) => (
              <li key={p.titulo} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="flex items-baseline gap-3 font-bold text-white"><span className="ec-mono text-xs" style={{ color: c.cor }}>{String(i + 1).padStart(2, "0")}</span>{p.titulo}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#b9c6e4]">{p.texto}</p>
                {p.imagem ? <div className="mt-4 overflow-hidden rounded-lg border border-white/10"><Foto i={p.imagem} className="block h-auto w-full" /></div> : null}
              </li>
            ))}
          </ol>
          <div><BotaoVisitar c={c} /></div>
        </div>
      </div>
    </article>
  );
}

export function CartaoTema({ k, destaque }: { k: string; destaque?: boolean }) {
  const t = tema(k);
  if (!t) return null;
  return (
    <li className={`overflow-hidden rounded-2xl border bg-surface ${destaque ? "border-[#c9a46a]" : "border-border"}`}>
      <Image src={`/portal/temas-nuvemshop/tema-${t.key}.webp`} width={800} height={500} alt={`Demonstração do tema ${t.name}`} className="block aspect-[16/10] h-auto w-full object-cover object-top" sizes="(max-width: 768px) 100vw, 400px" />
      <div className="p-5">
        <p className="text-lg font-bold">{t.name}</p>
        <p className="text-sm text-muted-foreground">{t.niche}</p>
        <p className="mt-2 text-sm">{t.tagline}.</p>
        <Link href={`/demo/${t.key}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-link underline underline-offset-4">Ver demonstração <ArrowUpRight className="size-4" aria-hidden /></Link>
      </div>
    </li>
  );
}

export function TemasNuvemshop({ whatsapp }: { whatsapp: string | null }) {
  const cases = casesPublicos();
  const zap = whatsapp ? whatsapp.replace(/text=.*$/, `text=${encodeURIComponent("Olá! Tenho uma loja na Nuvemshop e quero um layout melhor.")}`) : null;
  return (
    <div className="im-tema-ecommerce contents">
      <CabecalhoTech rotulo="Temas para Nuvemshop" titulo={<>NextLevel Temas para Nuvemshop: <em>a sua loja com cara de marca.</em></>}
        texto="Sem trocar de plataforma. Desenhamos e aplicamos o layout pensando em como o seu cliente compra, com cópia de segurança e aprovação antes de publicar."
        dados={[{ rotulo: "Lojas criadas nesta página", valor: String(cases.length) }, { rotulo: "Sua loja durante o trabalho", valor: "No ar" }, { rotulo: "Diagnóstico", valor: "Gratuito" }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#diagnostico" className="inline-flex h-14 items-center rounded-full bg-[#21d97a] px-7 text-base font-extrabold text-[#05210f] hover:bg-[#3ae88c]">Quero um layout melhor</a>
          <a href="#lojas" className="inline-flex h-14 items-center rounded-full border border-white/30 px-7 text-base font-bold text-white hover:bg-white/10">Ver as lojas que criamos</a>
        </div>
      </CabecalhoTech>

      <section aria-labelledby="sabemos-t" className="bg-canvas px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Conhecemos o seu layout por dentro</p>
          <h2 id="sabemos-t" className="text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight mt-3 max-w-3xl text-foreground">A Nuvemshop dá a base. Nós damos a cara da sua marca.</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FATOS.map((f) => (
              <li key={f.fato} className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{f.fato}</p>
                <p className="mt-3 flex gap-2 font-semibold leading-snug"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />{f.fazemos}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">Fontes: central de ajuda e site da Nuvemshop, consultados em 12/11/2026: {FONTES.map(([l, u], i) => <span key={u}>{i ? " · " : ""}<a href={u} target="_blank" rel="noopener" className="underline">{l}</a></span>)}.</p>
        </div>
      </section>

      <section id="lojas" aria-labelledby="lojas-t" className="scroll-mt-16 bg-[#060c1d] px-4 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="ec-mono text-[#7dd3fc]"><span aria-hidden className="mr-2 opacity-60">{"//"}</span>Lojas que criamos</p>
          <h2 id="lojas-t" className="mt-3 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-tight text-white">Cada layout responde a uma pergunta do cliente.</h2>
          <p className="mt-4 max-w-2xl text-lg text-[#b9c6e4]">Não são só prints: em cada loja, o desafio, as decisões e como o nosso trabalho ajuda o negócio. Visite cada uma e veja ao vivo.</p>
          {cases.map((c, i) => <BlocoCase key={c.chave} c={c} n={i + 1} />)}
          <p className="border-t border-white/10 py-10 text-lg text-[#e6edff]"><b className="text-white">O que essas lojas têm em comum:</b> uma base de gestão testada no dia a dia, com uma identidade própria para cada marca. Uma base que já vende, com a cara do seu negócio.</p>
        </div>
      </section>

      <section aria-labelledby="joias-t" className="bg-[#f7f1ea] px-4 py-16 text-[#2b1d14] md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6b3c]">Para lojas de semijoias</p>
          <h2 id="joias-t" className="mt-3 max-w-3xl font-serif text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]">Joia precisa parecer <em className="text-[#9a6b3c]">joia</em> na tela.</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-base leading-relaxed">Fundo claro e neutro, um único destaque dourado, títulos elegantes e fotos com luz suave: a peça inteira, o detalhe do banho e a peça no corpo.</p>
              <ul className="mt-6 grid gap-2.5">{SEMIJOIAS.map((s) => <li key={s} className="flex gap-2.5 text-[15px]"><Check className="mt-0.5 size-5 shrink-0 text-[#9a6b3c]" aria-hidden />{s}</li>)}</ul>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">{TEMAS_SEMIJOIAS.map((k) => <CartaoTema key={k} k={k} destaque />)}</ul>
          </div>
          <p className="mt-6 text-sm text-[#6b5444]">As demonstrações mostram produtos de beleza. No seu projeto, as cenas e as fotos são das suas semijoias.</p>
        </div>
      </section>

      <section aria-labelledby="etapas-t" className="bg-surface px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Como trabalhamos</p>
          <h2 id="etapas-t" className="text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight mt-3 text-foreground">Seis etapas, sem tirar a loja do ar.</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">{ETAPAS.map(([t, x], i) => <li key={t} className="rounded-2xl border border-border p-6"><p className="ec-mono text-sm text-link">{String(i + 1).padStart(2, "0")}</p><p className="mt-2 text-lg font-bold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{x}</p></li>)}</ol>
        </div>
      </section>

      <section aria-labelledby="tec-t" className="bg-canvas px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Nossa tecnologia</p>
          <h2 id="tec-t" className="text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight mt-3 max-w-3xl text-foreground">Também criamos a nossa plataforma: temas NextLevel Commerce.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">O mesmo cuidado de desenho, em temas prontos. Abra a demonstração e navegue como cliente.</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{TEMAS_VITRINE.map((k) => <CartaoTema key={k} k={k} />)}</ul>
        </div>
      </section>

      <section aria-labelledby="duvidas-t" className="bg-surface px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 id="duvidas-t" className="text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-foreground">Dúvidas</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">{DUVIDAS.map(([q, a]) => <details key={q} className="group py-4"><summary className="cursor-pointer list-none text-lg font-semibold marker:hidden">{q}</summary><p className="mt-2 text-muted-foreground">{a}</p></details>)}</div>
        </div>
      </section>

      <section id="diagnostico" aria-labelledby="diag-t" className="scroll-mt-16 bg-[#060c1d] px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="text-white">
            <h2 id="diag-t" className="text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.05] tracking-tight">Quero um layout melhor.</h2>
            <p className="mt-4 text-lg text-[#b9c6e4]">Conte como é a sua loja. O diagnóstico é gratuito, e a equipe da NextLevel responde com o que dá para melhorar e o orçamento.</p>
            {zap ? <a href={zap} target="_blank" rel="noopener" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#21d97a] px-6 font-bold text-[#05210f] hover:bg-[#3ae88c]"><MessageCircle className="size-5" aria-hidden />Falar no WhatsApp</a> : null}
          </div>
          <div className="rounded-2xl bg-surface p-6 text-foreground">
            <DiagnosticoForm needs={Object.entries(DIAGNOSTIC_NEEDS).filter(([k]) => ["TEMA", "CONSULTORIA", "TRAFEGO", "REDES"].includes(k))} inicial={["TEMA"]} mensagemInicial="Tenho uma loja na Nuvemshop e quero um layout melhor." />
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-6xl text-xs text-[#8696bb]">Nuvemshop é marca registrada dos seus titulares. A NextLevel é uma agência independente (NextLevel Marketing Ltda) e não tem vínculo com a Nuvemshop. As lojas desta página aparecem com autorização dos clientes.</p>
      </section>
    </div>
  );
}
