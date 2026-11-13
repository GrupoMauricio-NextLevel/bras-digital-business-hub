import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle } from "lucide-react";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { BotaoVisitar, CartaoTema, Foto } from "@/components/portal/commerce/temas-nuvemshop";
import { casesPublicos, TEMAS_MELHORES, type CaseLoja } from "@/lib/portal/cases-temas";
import "./commerce.css";

/**
 * Nossos clientes (D283): as marcas que a equipe NextLevel atende, 100% NextLevel (nenhuma outra plataforma citada).
 * Honestidade (decisão do dono): as lojas são da equipe NextLevel, mas hoje não rodam na NextLevel Commerce; a página
 * nunca diz que rodam. O selo "Na NextLevel Commerce" só aparece quando `naPlataforma` for verdade.
 */
const APRENDIZADOS: [string, string][] = [
  ["Varejo e atacado na mesma vitrine, com mínimo por mix", "Atacado da loja: preço de atacado por produto e regras de mix."],
  ["Tamanho certo para não ter troca", "Grades de tamanho prontas e grade personalizada."],
  ["Ver o produto sem sair da vitrine", "Vista rápida no cartão do produto."],
  ["Atendimento a um toque", "Botão e seções de WhatsApp na loja."],
  ["Parcela à vista no produto caro", "Parcelamento mostrado na hora da compra."],
  ["Uma identidade para cada marca", "Temas com editor visual: cores, fontes, banners e vitrines."],
];
const SEGMENTOS: { titulo: string; texto: string; marcas: string; tema: string; temaNome: string }[] = [
  { titulo: "Atacado e revenda", texto: "Mínimo por mix, preço de atacado e compra rápida para quem revende.", marcas: "Capistrano, Luis Fornecedor e Futcollection", tema: "porto", temaNome: "Porto" },
  { titulo: "Produto de alto valor", texto: "Confiança antes da compra: garantias, parcela e atendimento à vista.", marcas: "iRest", tema: "signature", temaNome: "Signature" },
  { titulo: "Moda e esporte", texto: "Coleções, tamanhos e vitrines por tema, do jeito que o cliente procura.", marcas: "Capistrano e Futcollection", tema: "podio", temaNome: "Pódio" },
  { titulo: "Serviço sob medida", texto: "Um caminho claro até o pedido de orçamento, sem carrinho.", marcas: "CCV Vidros", tema: "atelier", temaNome: "Atelier" },
];

function Marca({ c, n }: { c: CaseLoja; n: number }) {
  return (
    <article aria-labelledby={`cli-${c.chave}`} className="grid gap-8 border-t border-white/10 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
      <div>
        <p className="ec-mono text-sm" style={{ color: c.cor }}>{String(n).padStart(2, "0")}{c.cidade ? ` · ${c.cidade}` : ""}</p>
        <h3 id={`cli-${c.chave}`} className="mt-2 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-none tracking-tight text-white">{c.nome}</h3>
        {c.naPlataforma ? <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#21d97a]/15 px-3 py-1 text-sm font-semibold text-[#7ff5bd]"><BadgeCheck className="size-4" aria-hidden />Na NextLevel Commerce</p> : null}
        <p className="mt-4 text-lg leading-relaxed text-[#e6edff]">{c.negocio}</p>
        <div className="mt-5 rounded-2xl border-l-4 bg-white/[0.06] p-5" style={{ borderColor: c.cor }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: c.cor }}>Como o nosso trabalho ajuda</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#cdd8f3]">{c.ajuda}</p>
        </div>
        <ul className="mt-5 grid gap-2">{c.pontos.slice(0, 3).map((p) => <li key={p.titulo} className="flex gap-2 text-sm text-[#b9c6e4]"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: c.cor }} /><span><b className="text-white">{p.titulo}.</b> {p.texto}</span></li>)}</ul>
        <div className="mt-7"><BotaoVisitar c={c} grande /></div>
      </div>
      {c.computador ? (
        <div className="relative pb-6">
          <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0b1328] shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)]"><div aria-hidden className="flex gap-1.5 border-b border-white/10 px-3 py-2"><span className="size-2.5 rounded-full bg-white/25" /><span className="size-2.5 rounded-full bg-white/25" /><span className="size-2.5 rounded-full bg-white/25" /></div><Foto i={c.computador} className="block h-auto w-full" /></div>
          {c.celular ? <div className="absolute -bottom-2 right-3 hidden w-[24%] overflow-hidden rounded-[22px] border-4 border-[#111a33] shadow-[0_20px_40px_-12px_rgba(0,0,0,.8)] sm:block"><Foto i={c.celular} className="block h-auto w-full" sizes="200px" /></div> : null}
        </div>
      ) : null}
    </article>
  );
}

export function ClientesEc({ cadastro, comecar, lojaPronta, whatsapp }: { cadastro: string; comecar: string; lojaPronta: string; whatsapp: string | null }) {
  const marcas = casesPublicos();
  const zap = whatsapp ? whatsapp.replace(/text=.*$/, `text=${encodeURIComponent("Olá! Vi as marcas que a NextLevel atende e quero a minha loja.")}`) : null;
  return (
    <div className="im-tema-ecommerce contents">
      <CabecalhoTech rotulo="Clientes" titulo={<>Marcas que a NextLevel <em>atende.</em></>}
        texto="Lojas criadas e acompanhadas pela equipe que construiu a NextLevel Commerce. O que aprendemos com elas está na plataforma que você usa para abrir a sua."
        dados={[{ rotulo: "Marcas", valor: String(marcas.length) }, { rotulo: "Segmentos", valor: String(SEGMENTOS.length) }, { rotulo: "Vendem para", valor: "O Brasil todo" }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={cadastro} className="inline-flex h-14 items-center gap-2 rounded-full bg-[#21d97a] px-7 text-base font-extrabold text-[#05210f] hover:bg-[#3ae88c]">{comecar} <ArrowRight className="size-5" aria-hidden /></Link>
          <a href="#marcas" className="inline-flex h-14 items-center rounded-full border border-white/30 px-7 text-base font-bold text-white hover:bg-white/10">Ver as marcas</a>
        </div>
      </CabecalhoTech>

      <section id="marcas" aria-labelledby="marcas-t" className="scroll-mt-16 bg-[#060c1d] px-4 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="ec-mono text-[#7dd3fc]"><span aria-hidden className="mr-2 opacity-60">{"//"}</span>Quem a NextLevel atende</p>
          <h2 id="marcas-t" className="mt-3 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-tight text-white">Negócios reais, do Brás para o Brasil.</h2>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Marcas atendidas">{marcas.map((c) => <li key={c.chave}><a href={`#cli-${c.chave}`} className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">{c.nome}</a></li>)}</ul>
          <div className="mt-6">{marcas.map((c, i) => <Marca key={c.chave} c={c} n={i + 1} />)}</div>
        </div>
      </section>

      <section aria-labelledby="aprend-t" className="bg-canvas px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Da loja do cliente para a sua</p>
          <h2 id="aprend-t" className="mt-3 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-foreground">O que aprendemos com elas, você já tem na NextLevel Commerce.</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {APRENDIZADOS.map(([a, r]) => <li key={a} className="rounded-2xl border border-border bg-surface p-6"><p className="text-sm text-muted-foreground">{a}</p><p className="mt-2 flex gap-2 font-semibold leading-snug"><BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />{r}</p></li>)}
          </ul>
        </div>
      </section>

      <section aria-labelledby="seg-t" className="bg-surface px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Para o seu tipo de negócio</p>
          <h2 id="seg-t" className="mt-3 text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-foreground">Quatro jeitos de vender, um tema para cada.</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {SEGMENTOS.map((s) => <li key={s.titulo} className="rounded-2xl border border-border p-6"><p className="text-lg font-bold">{s.titulo}</p><p className="mt-1 text-muted-foreground">{s.texto}</p><p className="mt-3 text-sm">Como fazemos em: <b>{s.marcas}</b>.</p><Link href={`/demo/${s.tema}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-link underline underline-offset-4">Tema indicado: {s.temaNome}, ver demonstração <ArrowRight className="size-4" aria-hidden /></Link></li>)}
          </ul>
        </div>
      </section>

      <section aria-labelledby="tpl-t" className="bg-canvas px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Nossos melhores templates</p>
          <h2 id="tpl-t" className="mt-3 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-foreground">O mesmo cuidado, pronto para a sua loja.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Abra a demonstração e navegue como cliente. Todos os temas estão na <Link href="/temas" className="font-semibold text-link underline">página de temas</Link>.</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{TEMAS_MELHORES.map((k) => <CartaoTema key={k} k={k} />)}</ul>
        </div>
      </section>

      <section aria-labelledby="final-t" className="bg-[#060c1d] px-4 py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 id="final-t" className="text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight">A mesma equipe, a sua loja.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#b9c6e4]">Abra a sua loja na NextLevel Commerce, ou deixe a nossa equipe montar para você.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={cadastro} className="inline-flex h-14 items-center gap-2 rounded-full bg-[#21d97a] px-7 text-base font-extrabold text-[#05210f] hover:bg-[#3ae88c]">{comecar} <ArrowRight className="size-5" aria-hidden /></Link>
            <Link href={lojaPronta} className="inline-flex h-14 items-center rounded-full border border-white/30 px-7 text-base font-bold hover:bg-white/10">Quero a loja montada pela equipe</Link>
            {zap ? <a href={zap} target="_blank" rel="noopener" className="inline-flex h-14 items-center gap-2 rounded-full border border-white/30 px-7 text-base font-bold hover:bg-white/10"><MessageCircle className="size-5" aria-hidden />WhatsApp</a> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
