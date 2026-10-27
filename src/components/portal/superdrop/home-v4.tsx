import { SecaoEquipe } from "@/components/portal/equipe/secao-equipe";
import { statSync } from "node:fs";
import { ImersivaSuperDrop } from "./imersiva";
import { SD } from "@/lib/marcas/superdrop";
import { join } from "node:path";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { ImagemEmCriacao } from "@/components/portal/imagem-em-criacao";
import { HowItWorks } from "@/components/portal/how-it-works";
import { LiveConveyor } from "@/components/portal/live-conveyor";
import { MemberPlans } from "@/components/portal/member-plans";
import { MockWindow } from "@/components/portal/mock-window";
import { SaleCalculator } from "@/components/portal/sale-calculator";
import { MARCAS } from "@/lib/marcas-visuais";
import { CabecalhoSobreHeroi } from "./cabecalho-sobre-heroi";

/**
 * Página inicial do SuperDrop, v4 (docs/prompts/superdrop-home-v4-analise-e-prompt.md): 9 seções que contam uma história só,
 * "Você vende. O fornecedor envia.". O fundo escuro é o azul-marinho retirado das fotos do pacote (#0D1B34), para foto e
 * fundo se emendarem; o verde da marca fica só nos sinais (botão principal, destaques). Textos só com o que existe no sistema.
 */
const NAVY = SD.cores.marinho;
const VERDE = SD.cores.verde;
const VERDE_CLARO = SD.cores.verdeClaro;

/** Foto do pacote da marca (public/marcas/superdrop/imagens), com as versões 800 e 1600 em WebP. */
function FotoMarca({ nome, alt, sizes, posicao = "50% 50%", priority = false, className }: { nome: string; alt: string; sizes: string; posicao?: string; priority?: boolean; className?: string }) {
  const b = `/marcas/superdrop/imagens/${nome}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- WebP estático com srcset próprio
    <img src={`${b}-1600.webp`} srcSet={`${b}-800.webp 800w, ${b}-1600.webp 1600w`} sizes={sizes} alt={alt} width={1600} height={900}
      loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding={priority ? "sync" : "async"}
      className={className ?? "size-full object-cover"} style={{ objectPosition: posicao }} />
  );
}

const btnVerde = "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-bold transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const h2 = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.75rem]";
const eyebrow = "text-xs font-extrabold uppercase tracking-[0.14em]";

const PASSOS = [
  { icone: "catalog", foto: "sd-passo-publica", posicao: "40% 45%", alt: "Lojista conferindo produtos no celular numa bancada com embalagens", titulo: "Você escolhe os produtos", texto: "Ative itens do catálogo dos fornecedores parceiros e defina o seu preço de venda." },
  { icone: "order", foto: "sd-passo-vende", posicao: "50% 40%", alt: "Lojista acompanhando uma venda no notebook e no celular", titulo: "O cliente compra na sua loja", texto: "O pagamento cai na conta Mercado Pago da sua loja e o pedido nasce sozinho." },
  { icone: "shipping", foto: "sd-passo-envia", posicao: "50% 55%", alt: "Mãos colando a etiqueta de envio numa caixa com fita verde", titulo: "O fornecedor separa e envia", texto: "Com a etiqueta do pedido em mãos, a Central separa, embala e despacha no horário de corte." },
  { icone: "automation", foto: "sd-pacote-entregue", posicao: "50% 62%", alt: "Caixa com fita verde entregue na porta de um apartamento", titulo: "Você acompanha até a entrega", texto: "Cada etapa aparece na esteira do seu painel, do pagamento ao envio." },
] as const;

const BASTIDORES = [
  { foto: "sd-hero-fornecedor-separando", posicao: "52% 50%", alt: "Mãos separando peças dobradas dentro de uma caixa de envio", titulo: "Separação na Central", texto: "O fornecedor recebe o pedido pago e separa as peças." },
  { foto: "sd-etiqueta-impressora", posicao: "50% 50%", alt: "Impressora térmica soltando uma etiqueta de envio", titulo: "Etiqueta junto com o pedido", texto: "A Central só separa com a etiqueta em mãos, sem erro de endereço." },
  { foto: "sd-expedicao-esteira", posicao: "50% 55%", alt: "Caixa de envio sobre a esteira de expedição", titulo: "Despacho no horário de corte", texto: "Pedidos separados em ondas e enviados no mesmo dia do corte." },
] as const;

/** Lojas de demonstração fotografadas do próprio sistema (public/portal/superdrop/v4). Sem arquivo, a loja não aparece. */
const LOJAS = [
  { arquivo: "loja-1", nome: "Trama Urbana", segmento: "moda", tema: "Atelier" },
  { arquivo: "loja-2", nome: "Linha de Jogo", segmento: "esporte", tema: "Pódio" },
  { arquivo: "loja-3", nome: "Casa em Ordem", segmento: "casa", tema: "Varanda" },
] as const;
const existe = (rel: string) => { try { return statSync(join(process.cwd(), "public", rel)).size > 0; } catch { return false; } };

export async function SuperDropHomeV4({ faq, solucoes, previa = false }: { faq: { q: string; a: string }[]; solucoes: string; /** Prévia da jornada imersiva (D167) antes das fotos. */ previa?: boolean }) {
  const m = MARCAS.superdrop;
  const lojas = LOJAS.filter((l) => existe(`portal/superdrop/v4/${l.arquivo}.webp`));
  return (
    <div className="[--sd-navy:#0D1B34]">
      <CabecalhoSobreHeroi alvo="inicio" />

      {/* 1. Herói: a foto do pacote é o fundo; o texto fica sobre a faixa marinho da própria foto. */}
      <section id="inicio" data-heroi-escuro className="relative isolate overflow-hidden text-white" style={{ background: NAVY }}>
        <div className="relative aspect-[16/10] w-full md:absolute md:inset-0 md:aspect-auto">
          <FotoMarca nome="hero-key-visual" priority sizes="100vw" posicao="72% 45%" alt="Equipe embalando pedidos em caixas com fita verde numa bancada de expedição" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--sd-navy)] via-transparent to-transparent md:bg-[linear-gradient(90deg,var(--sd-navy)_0%,color-mix(in_srgb,var(--sd-navy)_85%,transparent)_42%,transparent_72%)]" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t from-[var(--sd-navy)] to-transparent md:block" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-2 md:pb-14 md:pt-28 lg:pt-32">
          <div className="max-w-xl">
            <p className={`${eyebrow} inline-flex rounded-full border px-3 py-1`} style={{ color: VERDE_CLARO, borderColor: "rgba(98,194,104,0.4)", background: "rgba(98,194,104,0.08)" }}>Loja online sem estoque</p>
            <h1 className="nl-display mt-5 text-white">Você vende.<br /><span style={{ color: VERDE_CLARO }}>O fornecedor envia.</span></h1>
            <p className="mt-5 text-lg leading-relaxed text-white/85">Monte sua loja com produtos de fornecedores parceiros. Cada pedido pago vai direto para quem separa, embala e despacha para o seu cliente.</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/cadastro" className={btnVerde} style={{ background: VERDE, color: NAVY }}>Criar minha loja <ArrowRight className="size-5" aria-hidden /></Link>
              <a href="#como-funciona" className="inline-flex h-12 items-center gap-2 rounded-xl px-1 font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Ver como funciona <ArrowDown className="size-4" aria-hidden /></a>
            </div>
            <p className="mt-6 text-sm text-white/70">O pagamento do cliente cai na sua conta · Sem fidelidade · Tema grátis</p>
          </div>
          <div className="relative mx-auto mt-12 max-w-5xl md:mt-20"><LiveConveyor /></div>
        </div>
      </section>

      <ImersivaSuperDrop previa={previa} />

      {/* 2. Faixa de confiança */}
      <section aria-label="O essencial" className="border-b border-border bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-3 px-4 py-7 sm:grid-cols-3">
          {["Sem estoque e sem galpão em casa", "Pagamento do cliente direto na sua conta", "Sem fidelidade e com tema grátis"].map((t) => (
            <p key={t} className="flex items-center gap-3 font-semibold text-foreground"><span className="grid size-7 shrink-0 place-items-center rounded-full" style={{ background: "rgba(45,158,59,0.14)", color: "#1F7A2B" }}><Check className="size-4" aria-hidden /></span>{t}</p>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 pb-7 text-sm text-muted-foreground">
          <span>Fornecedores parceiros:</span>
          <Link href="/f/alpha-outfit" className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight text-foreground hover:underline">Alpha Outfit</Link>
          <Link href="/f/mantosshop" className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight text-foreground hover:underline">MantosShop</Link>
        </div>
      </section>

      {/* 3. Como funciona: 4 passos com ícone e foto; as telas do sistema ficam num "ver mais". */}
      <section id="como-funciona" className="scroll-mt-20 bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className={`${eyebrow} text-link`}>Como funciona</p>
          <h2 className={`${h2} mt-3 max-w-3xl`}>Do clique do cliente à caixa na porta</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Você escolhe e vende. O fornecedor cuida do galpão.</p>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {PASSOS.map((p, n) => (
              <li key={p.titulo} className="flex flex-col">
                <div className="relative">
                  <ImagemEmCriacao marca="superdrop" nome={p.foto} alt={p.alt} ratio="4 / 3" posicao={p.posicao} />
                  {/* eslint-disable-next-line @next/next/no-img-element -- ícone do pacote (WebP 256 px) */}
                  <img src={`/marcas/superdrop/imagens/icons/${p.icone}-256.webp`} alt="" width={64} height={64} decoding="async" className="absolute -bottom-6 left-4 size-16 rounded-2xl bg-[#FBF8F1] p-2 shadow-lg ring-1 ring-black/5" />
                </div>
                <p className="mt-9 text-sm font-extrabold tabular-nums text-link">Passo {n + 1}</p>
                <h3 className="mt-1 text-xl font-bold">{p.titulo}</h3>
                <p className="mt-2 text-muted-foreground">{p.texto}</p>
              </li>
            ))}
          </ol>
          <details className="group mt-12 rounded-2xl border border-border bg-canvas">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-semibold [&::-webkit-details-marker]:hidden">Ver as telas do sistema, passo a passo<ArrowDown className="size-4 transition group-open:rotate-180" aria-hidden /></summary>
            <div className="border-t border-border p-4 sm:p-6"><HowItWorks /></div>
          </details>
        </div>
      </section>

      {/* 4. Bastidores (marinho): uma foto larga e três momentos do galpão do fornecedor. */}
      <section aria-labelledby="bastidores-t" className="py-20 text-white" style={{ background: NAVY }}>
        <div className="mx-auto max-w-6xl px-4">
          <p className={eyebrow} style={{ color: VERDE_CLARO }}>Bastidores</p>
          <h2 id="bastidores-t" className={`${h2} mt-3 max-w-3xl text-white`}>Quem envia é quem entende de envio</h2>
          <p className="mt-4 max-w-2xl text-lg text-white/80">Horário de corte, separação em ondas e etiqueta junto com o pedido: o galpão fica do lado do fornecedor.</p>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
            <div className="overflow-hidden rounded-3xl" style={{ aspectRatio: "4 / 3" }}>
              <FotoMarca nome="capability-02" sizes="(min-width: 1024px) 55vw, 100vw" posicao="55% 50%" alt="Equipe do fornecedor fechando caixas com fita verde perto da esteira de expedição" />
            </div>
            <ul className="grid gap-6">
              {BASTIDORES.map((b) => (
                <li key={b.titulo} className="grid grid-cols-[7.5rem_1fr] items-center gap-4 sm:grid-cols-[10rem_1fr]">
                  <ImagemEmCriacao marca="superdrop" nome={b.foto} alt={b.alt} ratio="4 / 3" posicao={b.posicao} className="rounded-2xl" />
                  <div><h3 className="text-lg font-bold text-white">{b.titulo}</h3><p className="mt-1 text-sm leading-relaxed text-white/75">{b.texto}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. O dinheiro de cada um (prova) e os papéis. */}
      <section id="papeis" aria-labelledby="dinheiro-t" className="scroll-mt-20 bg-canvas py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-3xl" style={{ aspectRatio: "4 / 3" }}>
            <FotoMarca nome="proof-editorial" sizes="(min-width: 1024px) 50vw, 100vw" posicao="45% 50%" alt="Equipe conferindo pedidos e caixas prontas para envio" />
          </div>
          <div>
            <p className={`${eyebrow} text-link`}>Transparência</p>
            <h2 id="dinheiro-t" className={`${h2} mt-3`}>O dinheiro de cada um, na conta de cada um</h2>
            <ol className="mt-8 space-y-4">
              {m.prova.pontos.map((t, n) => (
                <li key={t} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full font-extrabold tabular-nums" style={{ background: NAVY, color: VERDE_CLARO }}>{n + 1}</span><span className="pt-1.5 text-lg font-medium text-foreground">{t}</span></li>
              ))}
            </ol>
            <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
              {[
                { t: "Lojista", d: "Monta a loja, define o preço e vende. Recebe as vendas na própria conta.", href: "#planos", cta: "Ver planos" },
                { t: "Fornecedor", d: "Cadastra produtos, separa e envia. Recebe as recargas dos lojistas na própria conta.", href: "/seja-fornecedor", cta: "Seja fornecedor" },
                { t: "Parceiro", d: "Indica lojistas e acompanha só as próprias comissões, com extrato.", href: "/parceiros", cta: "Seja parceiro" },
              ].map((x) => (
                <div key={x.t} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-4">
                  <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground"><b className="mr-1 text-base text-foreground">{x.t}.</b>{x.d}</p>
                  <Link href={x.href} className="text-sm font-semibold text-link underline underline-offset-2">{x.cta} →</Link>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">A NextLevel cobra só o que é dela (planos, taxas e serviços), em fatura separada. Precisa de loja montada, migração ou anúncios? Veja as <Link href={solucoes} className="font-semibold text-link underline">Soluções NextLevel</Link>.</p>
          </div>
        </div>
      </section>

      {/* 6. Lojas de verdade, montadas no sistema (sem prévia vazia). */}
      {lojas.length ? (
        <section aria-labelledby="lojas-t" className="bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className={`${eyebrow} text-link`}>Sua loja</p>
            <h2 id="lojas-t" className={`${h2} mt-3 max-w-3xl`}>Sua loja com cara de marca, sem programar</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Comece com o tema grátis e troque quando quiser. Estas lojas de demonstração foram montadas no próprio sistema.</p>
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {lojas.map((l) => (
                <li key={l.arquivo}>
                  <MockWindow title={`Loja de demonstração · tema ${l.tema}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- captura estática da loja */}
                    <img src={`/portal/superdrop/v4/${l.arquivo}.webp`} alt={`Página inicial da loja de demonstração ${l.nome}`} width={1200} height={662} loading="lazy" decoding="async" className="block aspect-[16/10] w-full object-cover object-top" />
                  </MockWindow>
                  <p className="mt-3 font-semibold">{l.nome} <span className="font-normal text-muted-foreground">· {l.segmento}, tema {l.tema}</span></p>
                </li>
              ))}
            </ul>
            <p className="mt-8"><Link href="/temas" className="font-semibold text-link underline underline-offset-2">Ver todos os temas →</Link></p>
          </div>
        </section>
      ) : null}

      {/* 7. Faça a conta + Planos */}
      <section aria-labelledby="conta-t" className="bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className={`${eyebrow} text-link`}>Quanto sobra</p>
          <h2 id="conta-t" className={`${h2} mt-3 max-w-3xl`}>Faça a conta antes de começar</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Você define o preço. A taxa da plataforma aparece na hora, sobre o valor dos produtos.</p>
          <div className="mt-10"><SaleCalculator /></div>
          <div id="planos" className="mt-20 grid scroll-mt-20 items-end gap-8 md:grid-cols-[1fr_minmax(0,16rem)]">
            <div>
              <h2 className={`${h2} max-w-2xl`}>Escolha o plano e abra a loja hoje</h2>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Pague por Pix e o acesso é liberado na confirmação. Tem o cupom de teste do seu fornecedor? Use no cadastro.</p>
            </div>
            <ImagemEmCriacao marca="superdrop" nome="sd-pix-pagamento" alt="Celular na mão ao lado de uma maquininha e de um comprovante sobre o balcão" ratio="4 / 3" posicao="50% 55%" className="hidden md:block" />
          </div>
          <div className="mt-10"><MemberPlans /></div>
          <ol className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="rounded-xl bg-surface p-4"><b className="text-foreground">1. Escolha o plano</b><br />E o fornecedor que vai abastecer a sua loja.</li>
            <li className="rounded-xl bg-surface p-4"><b className="text-foreground">2. Pague por Pix</b><br />QR code na tela, confirmação automática.</li>
            <li className="rounded-xl bg-surface p-4"><b className="text-foreground">3. Acesso liberado</b><br />Painel e loja prontos para configurar.</li>
          </ol>
        </div>
      </section>

      {/* 7b. Quem está por trás (D179): equipe real na sede. */}
      <SecaoEquipe code="SUPERDROP" nomeDaMarca="SuperDrop" className="bg-surface text-foreground">
        <Link className="text-link underline underline-offset-4" href={solucoes}>Conheça o Grupo NextLevel</Link>
      </SecaoEquipe>

      {/* 8. Perguntas frequentes */}
      <section aria-labelledby="faq-t" className="bg-canvas py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq-t" className={h2}>Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">{faq.map((f) => <details key={f.q} className="group rounded-xl border border-border bg-canvas p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-muted-foreground">{f.a}</p></details>)}</div>
          <p className="mt-6 text-sm"><Link href="/faq" className="font-semibold text-link underline">Ver todas as perguntas</Link></p>
        </div>
      </section>

      {/* 9. Chamada final sobre a foto "momento" do pacote (faixa marinho para o texto, como no herói). */}
      <section aria-labelledby="final-t" className="relative isolate overflow-hidden text-white" style={{ background: NAVY }}>
        <div aria-hidden className="absolute inset-0 -z-10">
          <FotoMarca nome="cta-moment" sizes="100vw" posicao="78% 50%" alt="" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--sd-navy)_0%,color-mix(in_srgb,var(--sd-navy)_80%,transparent)_40%,transparent_75%)]" />
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--sd-navy)_55%,transparent)] md:hidden" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="max-w-lg">
            <h2 id="final-t" className={`${h2} text-white`}>Sua primeira venda começa com a loja no ar.</h2>
            <p className="mt-4 text-lg text-white/80">{m.cta.texto}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/cadastro" className={btnVerde} style={{ background: VERDE, color: NAVY }}>Criar minha loja <ArrowRight className="size-5" aria-hidden /></Link>
              <Link href="/login" className="font-semibold text-white underline underline-offset-4">Já tenho conta</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
