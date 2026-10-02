import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { BrowserFrame, StoreMock } from "./store-mock";
import { DEMO_STORES } from "./demo-stores";
import { OrdersSnippet, PaymentSnippet, SalesSnippet } from "./operation";
import { Wordmark } from "./header";

export const H2 = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl";
export const CTA = "inline-flex h-12 items-center justify-center rounded-md bg-[#f2b600] px-6 text-base font-bold text-[#14213d] transition-colors hover:bg-[#ffc933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14213d]";

export function Hero({ cta, signupOpen }: { cta: string; signupOpen: boolean }) {
  const moda = DEMO_STORES[0]!;
  return (
    <section className="bg-[#f5f1e8]" aria-labelledby="titulo">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:pb-20 lg:pt-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#1f47c9]">Plataforma de lojas virtuais</p>
          <h1 id="titulo" className="mt-4 font-[family-name:var(--nl-font-display)] text-[2rem] font-extrabold leading-[1.08] tracking-tight text-[#14213d] sm:text-5xl">Crie a loja virtual da sua marca e cuide de tudo em um só painel.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#14213d]/85">A NextLevel Commerce reúne a vitrine da sua loja, o pagamento por Pix e cartão, os pedidos e os clientes. Você escolhe um tema, ajusta ao seu estilo e acompanha cada venda.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={cta} className={`${CTA} w-full sm:w-auto`}>Quero minha loja</Link>
            <a href="#exemplos" className="text-base font-semibold text-[#14213d] underline decoration-[#f2b600] decoration-2 underline-offset-[6px] hover:decoration-[#14213d]">Ver lojas de exemplo</a>
          </div>
          <p className="mt-5 max-w-md text-sm text-[#14213d]/75">{signupOpen ? "Crie sua conta e comece a montar a loja." : "O cadastro está por convite no momento: deixe seu contato e a equipe responde."}</p>
        </div>
        <div>
          <BrowserFrame label={`Loja de demonstração: ${moda.name}. Nomes, produtos e preços fictícios.`}><StoreMock store={moda} eager /></BrowserFrame>
          <p className="mt-4 flex items-start gap-3 rounded-lg border border-[#14213d]/15 bg-white px-4 py-3 text-sm text-neutral-900 lg:ml-auto lg:max-w-md">
            <span aria-hidden className="mt-1 size-2.5 shrink-0 rounded-full bg-emerald-600" />
            <span><b>Pedido #1042 pago por Pix</b> · {formatBRL(18990)}<br /><span className="text-neutral-600">Conferido automaticamente e pronto para envio. Painel da loja, dados de demonstração.</span></span>
          </p>
        </div>
      </div>
    </section>
  );
}

export function Facts({ themeCount, sectionTypes }: { themeCount: number; sectionTypes: number }) {
  const items = [
    [String(themeCount), "temas, com 1 grátis"],
    [String(sectionTypes), "tipos de seção para montar suas páginas"],
    ["6x", "no cartão, e Pix com confirmação automática"],
    ["1", "painel para pedidos, clientes e vendas"],
  ];
  return (
    <section aria-label="O que a loja já traz" className="border-y border-[#14213d]/12 bg-[#ece7dc]">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-4 py-6 md:grid-cols-4">
        {items.map(([n, t]) => <div key={t} className="flex items-baseline gap-3"><dt className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tabular-nums text-[#14213d]">{n}</dt><dd className="text-sm leading-snug text-[#14213d]/85">{t}</dd></div>)}
      </dl>
    </section>
  );
}

export function ForWhom({ cta }: { cta: string }) {
  const rows = [
    { who: "Vende pelo Instagram e pelo WhatsApp", text: "Reúna produtos, preços e pagamento numa loja com endereço próprio, em vez de combinar tudo por mensagem." },
    { who: "Tem loja física e quer vender também online", text: "Cadastre os produtos por planilha e receba os pedidos da internet no mesmo painel." },
    { who: "Já tem loja em outra plataforma", text: "Traga o seu catálogo por planilha e monte um tema com a sua identidade. Clientes e pedidos antigos não são importados." },
  ];
  return (
    <ul className="divide-y divide-[#14213d]/15 border-y border-[#14213d]/15">
      {rows.map((r) => (
        <li key={r.who} className="grid gap-2 py-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] md:items-center md:gap-10">
          <h3 className="font-[family-name:var(--nl-font-display)] text-xl font-extrabold leading-snug text-[#14213d]">{r.who}</h3>
          <p className="text-[17px] leading-relaxed text-[#14213d]/85">{r.text}</p>
          <Link href={cta} className="text-base font-semibold text-[#1f47c9] underline underline-offset-4 hover:no-underline">Quero começar assim</Link>
        </li>
      ))}
    </ul>
  );
}

export function Operation() {
  const rows = [
    { id: "pedidos", title: "Veja cada pedido chegar", situation: "Vendeu pelo Instagram e perdeu a conta de quem já pagou?", text: "Todos os pedidos ficam em uma lista, com a situação de cada um: aguardando pagamento, pago ou enviado. O cliente acompanha o dele por um link.", visual: <OrdersSnippet /> },
    { id: "vendas", title: "Descubra o que vende e para onde", situation: "Não sabe quais produtos dão lucro nem em que horário o cliente compra?", text: "O painel mostra vendas por estado, margem por produto, recompra e os horários de maior movimento.", visual: <SalesSnippet /> },
    { id: "pagamento", title: "Receba por Pix e cartão", situation: "Cansou de conferir comprovante um a um?", text: "O cliente paga na loja por Pix ou cartão em até 6x. Você conecta a sua conta do Mercado Pago, e o pagamento é conferido automaticamente antes de liberar o pedido.", visual: <PaymentSnippet /> },
  ];
  return (
    <div className="space-y-16 md:space-y-20">
      {rows.map((r, n) => (
        <article key={r.id} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className={n % 2 ? "md:order-2" : ""}>
            <p className="text-sm font-semibold text-[#1f47c9]">{r.situation}</p>
            <h3 className="mt-2 font-[family-name:var(--nl-font-display)] text-2xl font-extrabold leading-tight text-[#14213d] sm:text-3xl">{r.title}</h3>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-[#14213d]/85">{r.text}</p>
          </div>
          <div className={n % 2 ? "md:order-1" : ""}>{r.visual}</div>
        </article>
      ))}
    </div>
  );
}

export function Steps({ cta }: { cta: string }) {
  const steps = [
    { phase: "Contato", t: "Deixe seu contato", d: "O cadastro está por convite. Você conta o que vende e como despacha." },
    { phase: "Contato", t: "A equipe responde", d: "A NextLevel combina o plano com você e libera o acesso à sua conta." },
    { phase: "Montagem", t: "Monte a loja", d: "Escolha o tema, envie os produtos por planilha e ajuste cores e textos. Dá para fazer pedidos de teste; enquanto não publica, só você vê." },
    { phase: "Publicação", t: "Conecte o Mercado Pago e publique", d: "Com a conta conectada, a loja passa a receber pagamentos de verdade." },
  ];
  return (
    <div>
      <ol className="grid gap-x-8 gap-y-10 md:grid-cols-4">
        {steps.map((s, n) => (
          <li key={s.t} className="border-t-2 border-[#14213d] pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1f47c9]">{n + 1} · {s.phase}</p>
            <h3 className="mt-2 font-[family-name:var(--nl-font-display)] text-xl font-extrabold leading-snug text-[#14213d]">{s.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#14213d]/85">{s.d}</p>
          </li>
        ))}
      </ol>
      <Link href={cta} className={`${CTA} mt-10`}>Quero minha loja</Link>
    </div>
  );
}

export type ThemeRow = { key: string; name: string; priceCents: number; tagline: string };
export function ThemesAndPrices({ themes }: { themes: ThemeRow[] }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <div>
        <h2 className={`${H2} text-[#14213d]`}>Comece com um tema grátis. Troque quando quiser.</h2>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-[#14213d]/85">O tema Starter já vem com a sua loja. Os temas pagos são instalados com um clique e mantêm o seu conteúdo.</p>
        <p className="mt-4 max-w-md text-[15px] text-[#14213d]/75">O plano da sua loja (mensalidade, domínio próprio e módulos) é combinado na conversa com a equipe, de acordo com o tamanho da operação.</p>
        <Link href="/planos" className="mt-6 inline-block text-base font-semibold text-[#14213d] underline decoration-[#f2b600] decoration-2 underline-offset-[6px] hover:decoration-[#14213d]">Ver como os planos funcionam</Link>
      </div>
      <div>
        <ul className="divide-y divide-[#14213d]/15 border-y border-[#14213d]/15">
          {themes.map((t) => (
            <li key={t.key} className="flex items-baseline justify-between gap-4 py-4">
              <div><p className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold text-[#14213d]">{t.name}</p><p className="text-[15px] text-[#14213d]/80">{t.tagline}</p></div>
              <p className="shrink-0 text-lg font-bold tabular-nums text-[#14213d]">{t.priceCents === 0 ? "Grátis" : formatBRL(t.priceCents)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[#14213d]/70">Valores do catálogo de temas de hoje; podem mudar. Compra pela Loja NextLevel.</p>
      </div>
    </div>
  );
}

const FAQ = [
  { q: "Preciso saber programar?", a: "Não. Tema, cores, fontes, logo, textos e a ordem das seções são ajustados em um editor visual, com prévia antes de publicar." },
  { q: "Posso usar a minha identidade?", a: "Sim: logo, cores, fontes e textos são seus. O domínio próprio (seudominio.com.br) faz parte do plano de loja própria." },
  { q: "Quanto custa?", a: "Os temas custam: Starter grátis, Arena R$ 299, Editorial R$ 699 e Signature R$ 1.499 (valores do catálogo de hoje, que podem mudar). O plano da loja, com mensalidade e taxas, é combinado na conversa com a equipe: ainda não há uma tabela pública de planos." },
  { q: "O que está disponível hoje?", a: "Vitrine, catálogo, carrinho, checkout com Pix e cartão pelo Mercado Pago, pedidos, clientes e análise de vendas. Atacado (preço por quantidade e pedido mínimo) está em construção e ainda não pode ser usado." },
  { q: "Como começo?", a: "Deixe seu contato. O cadastro aberto ao público ainda não foi liberado; a equipe da NextLevel responde e combina os próximos passos." },
];
export function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-[#14213d]/15 border-y border-[#14213d]/15">
      {FAQ.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold text-[#14213d] marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14213d] [&::-webkit-details-marker]:hidden">
            {f.q}<span aria-hidden className="text-2xl font-normal leading-none transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="pb-4 pr-8 text-[17px] leading-relaxed text-[#14213d]/85">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function ClosingCta({ cta, signupOpen }: { cta: string; signupOpen: boolean }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4">
      <div>
        <h2 className={`${H2} max-w-xl text-[#f5f1e8]`}>Veja a sua marca numa loja assim.</h2>
        <p className="mt-3 max-w-lg text-lg text-[#f5f1e8]/85">{signupOpen ? "Crie a sua conta e comece a montar." : "Deixe seu contato e a equipe da NextLevel responde com os próximos passos."}</p>
      </div>
      <Link href={cta} className={CTA}>Quero minha loja</Link>
    </div>
  );
}

export function CommerceFooter({ legal, nav }: { legal: string; nav: { href: string; label: string }[] }) {
  return (
    <footer className="bg-[#0e1626] text-[#f5f1e8]/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div><Wordmark light /><p className="mt-3 max-w-xs">Plataforma de lojas virtuais da NextLevel Marketing.</p></div>
        <ul className="space-y-2">{nav.map((n) => <li key={n.href}><a href={n.href} className="hover:text-white hover:underline">{n.label}</a></li>)}</ul>
        <ul className="space-y-2"><li><Link href="/planos" className="hover:text-white hover:underline">Planos</Link></li><li><Link href="/loja-nextlevel" className="hover:text-white hover:underline">Loja NextLevel</Link></li><li><Link href="/faq" className="hover:text-white hover:underline">Perguntas frequentes</Link></li><li><Link href="/login" className="hover:text-white hover:underline">Entrar</Link></li></ul>
      </div>
      <p className="mx-auto max-w-6xl border-t border-[#f5f1e8]/15 px-4 py-5 text-xs text-[#f5f1e8]/70">{legal} © {new Date().getFullYear()} NextLevel Marketing Ltda.</p>
    </footer>
  );
}
