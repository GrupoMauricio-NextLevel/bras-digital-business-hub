import { ArrowRight, BadgeCheck, Boxes, ClipboardCheck, Gauge, KeyRound, Link2, MapPinned, Megaphone, Network, Receipt, Route, ShieldCheck, Smartphone, Star, Truck, Warehouse } from "lucide-react";
import type { Brand } from "@/lib/brand";
import { JsonLd } from "@/components/portal/json-ld";
import { CargasInterestForm } from "./cargas-form";
import "./cargas.css";

/**
 * Página pública da NextLevel Cargas (D108). Fala primeiro com o dono da transportadora (o que chamaria a atenção dele,
 * seção 10.2 do prompt v2) e depois com a importadora. Só anuncia o que existe: hoje, o cadastro de interesse e a retirada
 * com código no Balcão da Brás Digital; o painel da transportadora está em preparação e aparece como tal.
 * As telas são demonstração (rotuladas). Sem promessa de faturamento nem de volume de carga.
 */
export const CARGAS_FAQ = [
  { q: "Quanto custa para entrar?", a: "O cadastro é grátis. Haverá um plano grátis para toda transportadora e planos pagos opcionais para quem quer mais volume e destaque. Os valores são publicados antes da abertura." },
  { q: "Como a NextLevel ganha?", a: "Com uma comissão sobre o valor do frete das cargas fechadas pela plataforma, mostrada antes de você aceitar a carga, e com os planos opcionais. Nada escondido." },
  { q: "Preciso de RNTRC e seguro?", a: "Para a primeira rodada, basta declarar. A equipe confere antes de liberar as coletas. Transportar com documentação em dia é responsabilidade da transportadora." },
  { q: "O motorista precisa instalar aplicativo?", a: "Não. Ele recebe um link no celular com as coletas do dia e confirma cada retirada com o código do pedido." },
  { q: "Quem emite CT-e e MDF-e?", a: "A transportadora, no sistema que já usa. A plataforma só registra o número para o acompanhamento." },
  { q: "Já está funcionando?", a: "A retirada com código já funciona no Balcão das importadoras da Brás Digital. O painel da transportadora está em preparação: quem se cadastra agora entra na primeira rodada e é chamado pela equipe." },
];

const FATOS = ["Coletas do Brás por rota", "Consolidação por região", "Código de retirada em cada pedido", "Motorista sem aplicativo", "Extrato com frete e comissão", "Reputação calculada pelo sistema", "Destaque pago sempre rotulado"];

const BENEFICIOS = [
  { i: MapPinned, t: "Carga sem prospectar", d: "As coletas aparecem filtradas pela sua rota: volume, peso, cubagem e destino antes de aceitar." },
  { i: Network, t: "Consolidação no Brás", d: "Várias importadoras, uma rota. O sistema agrupa coletas por região e janela de horário." },
  { i: Gauge, t: "Ocupação do caminhão", d: "Veja quanto do baú já está tomado, em m³ e kg, antes de sair do pátio." },
  { i: KeyRound, t: "Aceite com um toque", d: "Recebe endereço, janela e o código de retirada. Sem código certo, a carga não sai: ninguém retira no seu lugar." },
  { i: Smartphone, t: "Motorista sem aplicativo", d: "Um link no celular com as coletas do dia, a confirmação e o \"entregue\"." },
  { i: Receipt, t: "Recebimento claro", d: "Valor do frete, comissão da plataforma e extrato. Você sabe o que é seu antes de rodar." },
  { i: Star, t: "Reputação que trabalha por você", d: "Pontualidade e cuidado com a carga viram nota, calculada pelo sistema e nunca vendida." },
  { i: Link2, t: "Integração para quem tem sistema", d: "Quem já usa sistema conecta por API com aviso de status; quem não usa, usa o nosso painel." },
];

const PASSOS = [
  { t: "Cadastre-se em 1 minuto", d: "CNPJ ou CPF, WhatsApp, estados que atende e tipos de veículo. Grátis." },
  { t: "Veja as coletas da sua rota", d: "As importadoras chamam transportadora pelo sistema; as coletas da sua região chegam até você." },
  { t: "Aceite e receba o código", d: "Endereço, janela de retirada e o código do pedido, conferido no balcão da importadora." },
  { t: "Motorista confirma pelo link", d: "Retirada e entrega registradas no celular. O extrato fecha o mês." },
];

const PLANOS = [
  { n: "Grátis", d: "Para toda transportadora", itens: ["Perfil e cadastro rápido", "Coletas do mês até o limite do plano", "Link do motorista", "Comissão padrão por carga"] },
  { n: "Pro", d: "Para quem quer volume", itens: ["Coletas sem limite", "Vê as cargas antes do plano grátis", "Consolidação e ocupação do caminhão", "Relatórios e comissão menor"], destaque: true },
  { n: "Premium", d: "Para quem quer ser a escolhida", itens: ["Tudo do Pro", "Selo \"Recomendada\" com critério explicado", "Prioridade nas indicações da sua rota", "API com webhook e gerente de conta"] },
];

/** Painel de demonstração: coletas de uma rota (dados fictícios, rotulados). */
function Quadro() {
  const coletas = [
    { o: "Importadora A · Brás", d: "Curitiba/PR", v: "1,8 m³ · 160 kg", j: "Hoje, 14h–16h" },
    { o: "Importadora B · Brás", d: "Joinville/SC", v: "1,1 m³ · 95 kg", j: "Hoje, 15h–17h" },
    { o: "Importadora C · Pari", d: "Londrina/PR", v: "1,3 m³ · 125 kg", j: "Amanhã, 9h–11h" },
  ];
  return (
    <div className="cg-board relative p-4 pb-14 md:p-5 md:pb-16" role="img" aria-label="Demonstração do painel da transportadora: três coletas da rota São Paulo para o Sul e a ocupação do caminhão em 72%">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Coletas da sua rota · SP → Sul</p>
        <span className="cg-chip bg-[#ecebfd] text-[#3a3dbe]">Demonstração</span>
      </div>
      <ul className="mt-3 space-y-2">
        {coletas.map((c) => (
          <li key={c.o} className="flex items-center justify-between gap-3 rounded-xl border border-[#e8e5dc] px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{c.o} → {c.d}</p>
              <p className="text-xs text-[#4a5168]">{c.v} · {c.j}</p>
            </div>
            <span className="cg-chip shrink-0 bg-[#e7f7ef] text-[#05613f]">Aceitar</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold"><span>Ocupação do caminhão</span><span className="tabular-nums">4,2 de 5,8 m³ · 72%</span></div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-[#ecebf3]"><div className="cg-fill h-full rounded-full bg-[#4b4fd8]" style={{ width: "72%" }} /></div>
      </div>
      <div className="cg-pop absolute -bottom-7 left-4 right-4 flex items-center gap-3 rounded-2xl bg-[#0d1630] px-4 py-3 text-white shadow-xl sm:left-auto sm:right-[-1rem] sm:w-72">
        <KeyRound className="size-5 shrink-0 text-[#f5bc00]" aria-hidden />
        <p className="text-sm"><b>Coleta confirmada</b><br /><span className="text-[#c3c8dc]">Código de retirada: BD-7K2M</span></p>
      </div>
    </div>
  );
}

export function CargasHome({ brand }: { brand: Brand }) {
  const section = "scroll-mt-16 px-4 py-16 md:py-24";
  return (
    <div className="cg-home">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: CARGAS_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />

      {/* 1. Herói: a promessa para o dono da transportadora e o painel de coletas da rota. */}
      <section className="cg-dark relative overflow-hidden" aria-labelledby="cg-h1">
        <div aria-hidden className="pointer-events-none absolute -right-48 -top-48 size-[40rem] rounded-full opacity-35 blur-3xl" style={{ background: "radial-gradient(circle, #4b4fd8, transparent 65%)" }} />
        <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 size-[26rem] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #f5bc00, transparent 65%)" }} />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-sm font-semibold"><Truck className="size-4 text-[var(--cg-placa)]" aria-hidden />Transporte para o atacado do Brás · São Paulo</p>
            <h1 id="cg-h1" className="cg-display cg-h1 mt-6 text-white">
              <span className="cg-word">Carga do Brás</span>{" "}
              <span className="cg-word" style={{ animationDelay: "0.12s" }}>para a sua rota.</span>{" "}
              <span className="cg-word cg-accent" style={{ animationDelay: "0.24s" }}>Sem prospectar.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--cg-tinta-suave)] md:text-xl">As importadoras do Brás chamam transportadora pelo sistema. A NextLevel Cargas junta as coletas por região, mostra a ocupação do caminhão e entrega o código de retirada de cada pedido. Cadastro grátis.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#cadastro" className="cg-btn cg-btn--placa">Cadastrar minha transportadora<ArrowRight className="size-5" aria-hidden /></a>
              <a href="#importadoras" className="cg-btn cg-btn--linha">Sou importadora</a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-[var(--cg-tinta-suave)]"><span className="cg-live" aria-hidden />Primeira rodada de cadastro aberta</p>
          </div>
          <Quadro />
        </div>
        <div className="cg-pista" aria-hidden />
      </section>

      {/* 2. Faixa de fatos (só o que é verdade na plataforma). */}
      <section aria-label="Em poucas palavras" className="cg-marquee overflow-hidden border-b border-[#e3e0d6] bg-white py-4">
        <div className="cg-marquee-track gap-10 pr-10 text-sm font-semibold">
          {[...FATOS, ...FATOS].map((f, i) => <span key={i} aria-hidden={i >= FATOS.length} className="flex items-center gap-2 whitespace-nowrap"><BadgeCheck className="size-4 text-[var(--cg-indigo)]" aria-hidden />{f}</span>)}
        </div>
      </section>

      {/* 3. O que chama a atenção do dono da transportadora. */}
      <section id="beneficios" className={`cg-claro ${section}`} aria-labelledby="cg-ben">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--cg-indigo)]">Para a transportadora</p>
          <h2 id="cg-ben" className="cg-display cg-h2 mt-2 max-w-3xl">Caminhão cheio na <span className="cg-accent">rota que você já faz.</span></h2>
          <p className="mt-4 max-w-2xl text-lg text-[#3b4259]">O Brás despacha caixa para o Brasil inteiro todo dia, em coletas picadas por dezenas de endereços. A plataforma organiza isso em rota.</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFICIOS.map((b) => (
              <li key={b.t} className="cg-card p-5">
                <b.i className="size-7 text-[var(--cg-indigo)]" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">{b.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#4a5168]">{b.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Como funciona. */}
      <section id="como-funciona" className={`cg-dark ${section}`} aria-labelledby="cg-como">
        <div className="mx-auto max-w-6xl">
          <h2 id="cg-como" className="cg-display cg-h2 text-white">Do cadastro à <span className="cg-accent">coleta confirmada.</span></h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {PASSOS.map((p, i) => (
              <li key={p.t} className="cg-card p-5">
                <span className="cg-step-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{p.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--cg-tinta-suave)]">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Para a importadora. */}
      <section id="importadoras" className={`cg-claro ${section}`} aria-labelledby="cg-imp">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--cg-indigo)]">Para a importadora</p>
            <h2 id="cg-imp" className="cg-display cg-h2 mt-2">Chame transportadora <span className="cg-accent">com um toque.</span></h2>
            <p className="mt-4 text-lg text-[#3b4259]">Pedido pago, caixas separadas: escolha a transportadora da rota e pronto. Quem chega para retirar mostra o código do pedido no balcão; sem código certo, a carga não sai.</p>
            <a href="#cadastro" className="cg-btn cg-btn--indigo mt-6">Quero usar na minha importadora<ArrowRight className="size-5" aria-hidden /></a>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { i: Warehouse, t: "Balcão com código", d: "A retirada com código já funciona no Balcão das importadoras da Brás Digital." },
              { i: ClipboardCheck, t: "Histórico de cada retirada", d: "Quem retirou, quando e de qual pedido, no seu painel." },
              { i: Route, t: "Transportadora da rota", d: "As transportadoras cadastradas aparecem por região atendida." },
              { i: ShieldCheck, t: "Dados protegidos", d: "A transportadora recebe só o que precisa para coletar e entregar." },
            ].map((b) => (
              <li key={b.t} className="cg-card p-5"><b.i className="size-6 text-[var(--cg-indigo)]" aria-hidden /><h3 className="mt-2 font-bold">{b.t}</h3><p className="mt-1 text-sm text-[#4a5168]">{b.d}</p></li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Planos (sem preço até o dono publicar no Master). */}
      <section id="planos" className={`border-t border-[#e3e0d6] bg-white ${section}`} aria-labelledby="cg-planos">
        <div className="mx-auto max-w-6xl">
          <h2 id="cg-planos" className="cg-display cg-h2">Entre grátis. <span className="text-[var(--cg-indigo)]">Cresça quando quiser.</span></h2>
          <p className="mt-4 max-w-2xl text-lg text-[#3b4259]">Os valores dos planos pagos são publicados antes da abertura. A comissão por carga aparece antes de você aceitar cada coleta.</p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANOS.map((p) => (
              <li key={p.n} className={`cg-card p-6 ${p.destaque ? "border-2 border-[var(--cg-indigo)]" : ""}`}>
                <p className="text-sm font-semibold text-[#4a5168]">{p.d}</p>
                <h3 className="cg-display mt-1 text-3xl">{p.n}</h3>
                <ul className="mt-4 space-y-2 text-sm">{p.itens.map((x) => <li key={x} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-[var(--cg-indigo)]" aria-hidden />{x}</li>)}</ul>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-start gap-2 text-sm text-[#4a5168]"><Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden />Destaque pago na lista de transportadoras aparece sempre com o rótulo &quot;Patrocinado&quot;. A nota de reputação não se compra.</p>
        </div>
      </section>

      {/* 7. Hoje × em preparação (verdade). */}
      <section className={`cg-claro ${section} pt-0 md:pt-0`} aria-labelledby="cg-hoje">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <div className="cg-card p-6"><h2 id="cg-hoje" className="flex items-center gap-2 text-lg font-bold"><span className="cg-live" aria-hidden />Já funciona</h2><p className="mt-2 text-sm text-[#4a5168]">Cadastro de interesse da transportadora e da importadora. Retirada com código no Balcão das importadoras da Brás Digital.</p></div>
          <div className="cg-card p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Boxes className="size-5 text-[var(--cg-indigo)]" aria-hidden />Em preparação</h2><p className="mt-2 text-sm text-[#4a5168]">Painel da transportadora, coletas por rota, link do motorista, consolidação e extrato. Quem se cadastra agora entra na primeira rodada.</p></div>
        </div>
      </section>

      {/* 8. Cadastro. */}
      <section id="cadastro" className={`cg-dark ${section}`} aria-labelledby="cg-cad">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 id="cg-cad" className="cg-display cg-h2 text-white">Entre na <span className="cg-accent">primeira rodada.</span></h2>
            <p className="mt-4 text-lg text-[var(--cg-tinta-suave)]">Um minuto de cadastro. A equipe da NextLevel Cargas confere os dados e chama você pelo WhatsApp quando as coletas da sua região abrirem.</p>
            <ul className="mt-6 space-y-2 text-[var(--cg-tinta-suave)]">
              <li className="flex gap-2"><BadgeCheck className="size-5 shrink-0 text-[var(--cg-placa)]" aria-hidden />Grátis, sem compromisso</li>
              <li className="flex gap-2"><BadgeCheck className="size-5 shrink-0 text-[var(--cg-placa)]" aria-hidden />CNPJ ou CPF (autônomo)</li>
              <li className="flex gap-2"><BadgeCheck className="size-5 shrink-0 text-[var(--cg-placa)]" aria-hidden />Seus dados não são vendidos nem repassados</li>
            </ul>
          </div>
          <div className="cg-board p-5 md:p-7"><CargasInterestForm /></div>
        </div>
      </section>

      {/* 9. Dúvidas. */}
      <section id="duvidas" className={`cg-claro ${section}`} aria-labelledby="cg-faq">
        <div className="mx-auto max-w-3xl">
          <h2 id="cg-faq" className="cg-display cg-h2">Dúvidas</h2>
          <div className="mt-8 divide-y divide-[#e3e0d6] rounded-2xl border border-[#e3e0d6] bg-white">
            {CARGAS_FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary>
                <p className="mt-2 text-[#4a5168]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
