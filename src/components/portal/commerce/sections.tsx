import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { Phone, Tablet } from "./device";
import { OrdersPanel, PayScreen, SalesPanel } from "./panel-ui";
import { ImagemEmCriacao } from "@/components/portal/imagem-em-criacao";

export const H2 = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl";
export const CTA = "inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-bold text-primary-foreground transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ForWhom({ cta }: { cta: string }) {
  const rows = [
    { who: "Vende pelo Instagram e pelo WhatsApp", text: "Reúna produtos, preços e pagamento numa loja com endereço próprio, em vez de combinar tudo por mensagem." },
    { who: "Tem loja física e quer vender também online", text: "Cadastre os produtos por planilha e receba os pedidos da internet no mesmo painel." },
    { who: "Já tem loja em outra plataforma", text: "Traga o seu catálogo por planilha e monte um tema com a sua identidade. Clientes e pedidos antigos não são importados." },
  ];
  return (
    <ul className="divide-y divide-border border-y border-border">
      {rows.map((r) => (
        <li key={r.who} className="grid gap-2 py-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] md:items-center md:gap-10">
          <h3 className="font-[family-name:var(--nl-font-display)] text-xl font-extrabold leading-snug text-foreground">{r.who}</h3>
          <p className="text-[17px] leading-relaxed text-body">{r.text}</p>
          <Link href={cta} className="text-base font-semibold text-link underline underline-offset-4 hover:no-underline">Quero começar assim</Link>
        </li>
      ))}
    </ul>
  );
}

export function Operation() {
  const rows = [
    { id: "pedidos", title: "Veja cada pedido chegar", situation: "Vendeu pelo Instagram e perdeu a conta de quem já pagou?", text: "Todos os pedidos ficam em uma lista, com o canal e a situação de cada um: aguardando pagamento, pago ou enviado. O cliente acompanha o dele por um link.", foto: { nome: "cm-equipe-atendimento", alt: "Duas pessoas de costas conferindo pedidos num tablet, com estoque ao fundo", posicao: "45% 45%" }, visual: <Tablet><OrdersPanel side={false} /></Tablet> },
    { id: "vendas", title: "Descubra o que vende e para onde", situation: "Não sabe quais produtos dão lucro nem em que horário o cliente compra?", text: "O painel mostra vendas por estado, margem por produto, recompra e os horários de maior movimento.", foto: { nome: "cm-dono-gestao", alt: "Pessoa de costas analisando o monitor num escritório pequeno e organizado", posicao: "60% 45%" }, visual: <Tablet><SalesPanel /></Tablet> },
    { id: "pagamento", title: "Receba por Pix e cartão", situation: "Cansou de conferir comprovante um a um?", text: "O cliente paga na loja por Pix ou cartão em até 6x. Você conecta a sua conta do Mercado Pago, e o pagamento é conferido automaticamente antes de liberar o pedido.", foto: { nome: "cm-checkout-cartao", alt: "Mãos segurando um cartão ao lado do notebook, com uma xícara azul", posicao: "45% 50%" }, visual: <div className="mx-auto w-[16rem]"><Phone><PayScreen /></Phone></div> },
  ];
  return (
    <div className="space-y-20 md:space-y-28">
      {rows.map((r, n) => (
        <article key={r.id} className="cm-reveal grid items-center gap-8 md:grid-cols-2 md:gap-16">
          <div className={n % 2 ? "md:order-2" : ""}>
            <p className="text-sm font-semibold text-highlight">{r.situation}</p>
            <h3 className="mt-2 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight text-band-foreground sm:text-4xl">{r.title}</h3>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-band-muted">{r.text}</p>
          </div>
          {/* Foto da situação real ao fundo e a tela de demonstração do painel por cima, deslocada para baixo. */}
          <div className={n % 2 ? "md:order-1" : ""}>
            <ImagemEmCriacao marca="commerce" nome={r.foto.nome} alt={r.foto.alt} ratio="4 / 3" posicao={r.foto.posicao} className={`w-full sm:w-[86%] ${n % 2 ? "sm:ml-auto" : ""}`} />
            <div className={`relative -mt-12 w-full sm:-mt-28 sm:w-[92%] ${n % 2 ? "" : "sm:ml-auto"}`}>{r.visual}</div>
          </div>
        </article>
      ))}
      <p className="text-xs text-band-foreground/60">Painel de demonstração, com nomes, valores e canais fictícios.</p>
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
          <li key={s.t} className="border-t-2 border-foreground pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-link">{n + 1} · {s.phase}</p>
            <h3 className="mt-2 font-[family-name:var(--nl-font-display)] text-xl font-extrabold leading-snug text-foreground">{s.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-body">{s.d}</p>
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
        <h2 className={`${H2} text-foreground`}>Comece com um tema grátis. Troque quando quiser.</h2>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-body">O tema Starter já vem com a sua loja. Os temas pagos são instalados com um clique e mantêm o seu conteúdo.</p>
        <p className="mt-4 max-w-md text-[15px] text-body">O plano da sua loja (mensalidade, domínio próprio e módulos) é combinado na conversa com a equipe, de acordo com o tamanho da operação.</p>
        <Link href="/planos" className="mt-6 inline-block text-base font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-[6px] hover:decoration-[#14213d]">Ver como os planos funcionam</Link>
      </div>
      <div>
        <ul className="divide-y divide-border border-y border-border">
          {themes.map((t) => (
            <li key={t.key} className="flex items-baseline justify-between gap-4 py-4">
              <div><p className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold text-foreground">{t.name}</p><p className="text-[15px] text-body">{t.tagline}</p></div>
              <p className="shrink-0 text-lg font-bold tabular-nums text-foreground">{t.priceCents === 0 ? "Grátis" : formatBRL(t.priceCents)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">Valores do catálogo de temas de hoje; podem mudar. Compra pela Loja NextLevel.</p>
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
    <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
      {FAQ.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold text-foreground marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            {f.q}<span aria-hidden className="text-2xl font-normal leading-none transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="pb-4 pr-8 text-[17px] leading-relaxed text-body">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function ClosingCta({ cta, signupOpen }: { cta: string; signupOpen: boolean }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4">
      <div>
        <h2 className={`${H2} max-w-xl text-band-foreground`}>Veja a sua marca numa loja assim.</h2>
        <p className="mt-3 max-w-lg text-lg text-band-foreground/85">{signupOpen ? "Crie a sua conta e comece a montar." : "Deixe seu contato e a equipe da NextLevel responde com os próximos passos."}</p>
      </div>
      <Link href={cta} className={CTA}>Quero minha loja</Link>
    </div>
  );
}
