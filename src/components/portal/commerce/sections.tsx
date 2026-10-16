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
          <Link href={cta} className="text-base font-semibold text-link underline underline-offset-4 hover:no-underline">Começar assim</Link>
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
            <p className="text-sm font-semibold text-[#71AAFF]">{r.situation}</p>
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

export type EntryOffer = { trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number } | null;

/** Começar sozinho, sem esperar contato: criar a conta, montar e publicar. */
export function Steps({ cta, signupOpen, offer }: { cta: string; signupOpen: boolean; offer: EntryOffer }) {
  const steps = [
    { n: "1", t: "Crie a conta", d: offer ? `Você escolhe o plano e começa com ${offer.trialDays} dias grátis para montar com calma.` : "Leva 1 minuto. Você escolhe o plano e já entra no painel." },
    { n: "2", t: "Monte a loja", d: "Escolha um tema, ajuste cores, logo e textos no editor e cadastre os produtos, um a um ou por planilha. Enquanto não publica, só você vê." },
    { n: "3", t: "Conecte o Mercado Pago e publique", d: "Com a sua conta conectada, a loja recebe Pix e cartão e o dinheiro das vendas cai direto para você." },
  ];
  return (
    <div>
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.t} className="relative overflow-hidden rounded-[1.5rem] border border-border bg-surface p-6">
            <span aria-hidden className="font-[family-name:var(--nl-font-display)] text-6xl font-extrabold leading-none text-link/15">{s.n}</span>
            <h3 className="mt-3 font-[family-name:var(--nl-font-display)] text-xl font-extrabold leading-snug text-foreground">{s.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-body">{s.d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href={cta} className={CTA}>{signupOpen ? "Criar minha loja agora" : "Quero minha loja"}</Link>
        {offer && signupOpen ? <p className="text-sm text-body">{offer.trialDays} dias grátis{offer.firstPeriodCents !== null ? ` · 1º mês por ${formatBRL(offer.firstPeriodCents)}` : ""}</p> : null}
      </div>
    </div>
  );
}

export type PlanFaq = { name: string; monthlyCents: number | null; feeBps: number | null; quote: boolean };
export function Faq({ plans, offer, themes }: { plans: PlanFaq[]; offer: EntryOffer; themes: { name: string; priceCents: number }[] }) {
  const pagos = plans.filter((p) => !p.quote && p.monthlyCents);
  const faixa = pagos.length ? `de ${formatBRL(Math.min(...pagos.map((p) => p.monthlyCents!)))} a ${formatBRL(Math.max(...pagos.map((p) => p.monthlyCents!)))} por mês, mais uma taxa de ${pagos.map((p) => `${((p.feeBps ?? 0) / 100).toString().replace(".", ",")}%`).join(", ")} sobre as vendas pagas, conforme o plano` : "de acordo com o plano escolhido";
  const gratis = themes.filter((t) => t.priceCents === 0).length;
  const pagosTemas = themes.filter((t) => t.priceCents > 0).map((t) => t.priceCents);
  const items = [
    { q: "Como começo?", a: `Crie a conta direto pelo site: escolha o plano e já entre no painel.${offer ? ` Clientes novos têm ${offer.trialDays} dias grátis${offer.firstPeriodCents !== null ? `, o 1º mês do plano mensal por ${formatBRL(offer.firstPeriodCents)}` : ""} e taxa zero nos primeiros ${offer.feeHolidayMonths} meses (uma vez por CPF/CNPJ).` : ""}` },
    { q: "Quanto custa?", a: `Os planos vão ${faixa}. No anual há desconto. Operações maiores têm o Enterprise, por proposta.` },
    { q: "Como recebo pelas vendas?", a: "Pela sua própria conta Mercado Pago: 100% das vendas caem direto para você, com Pix e cartão. A NextLevel cobra o plano e a taxa em fatura separada." },
    { q: "Preciso saber programar?", a: "Não. Tema, cores, fontes, logo, textos e a ordem das seções são ajustados em um editor visual, com prévia antes de publicar." },
    { q: "Os temas são pagos?", a: `Há ${gratis} temas grátis para começar.${pagosTemas.length ? ` Os temas pagos custam de ${formatBRL(Math.min(...pagosTemas))} a ${formatBRL(Math.max(...pagosTemas))}, em pagamento único, e são instalados com um clique mantendo o seu conteúdo.` : ""}` },
    { q: "Posso usar o meu domínio e a minha marca?", a: "Sim: logo, cores, fontes e textos são seus, e o domínio próprio (seudominio.com.br) faz parte dos planos." },
    { q: "O que está disponível hoje?", a: "Vitrine, catálogo, carrinho, checkout com Pix e cartão pelo Mercado Pago, pedidos, clientes, cupons, campanhas e análise de vendas. Recuperação de carrinho, marketplace, ERP e API ainda não fazem parte da plataforma." },
  ];
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
      {items.map((f) => (
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

export function ClosingCta({ cta, signupOpen, offer }: { cta: string; signupOpen: boolean; offer: EntryOffer }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4">
      <div>
        <h2 className={`${H2} max-w-xl text-white`}>Sua marca merece uma loja à altura.</h2>
        <p className="mt-3 max-w-lg text-lg text-white/85">{signupOpen ? (offer ? `Teste ${offer.trialDays} dias grátis. Você escolhe o plano no cadastro.` : "Crie a sua conta e comece a montar.") : "Deixe seu contato e a equipe da NextLevel responde com os próximos passos."}</p>
      </div>
      <Link href={cta} className="inline-flex h-14 items-center justify-center rounded-full bg-[#2F81F4] px-8 text-[1.1875rem] font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{signupOpen ? (offer ? `Começar ${offer.trialDays} dias grátis` : "Criar minha loja") : "Quero minha loja"}</Link>
    </div>
  );
}
