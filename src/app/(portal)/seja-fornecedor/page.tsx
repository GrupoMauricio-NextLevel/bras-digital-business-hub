import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, Check, Clock, Coins, Layers, Network, Printer, ShieldCheck, Store, Users, Wallet } from "lucide-react";
import { PanelsShowcase } from "@/components/portal/panels-showcase";
import { LiveConveyor } from "@/components/portal/live-conveyor";
import { Reveal } from "@/components/portal/reveal";
import { requireBrandFeature } from "@/lib/brand-server";
import { supportContacts } from "@/lib/support";
import { SUPPLIER_PLANS } from "../content";

export const metadata: Metadata = {
  title: { absolute: "Seja fornecedor SuperDrop · Transforme seu catálogo em uma rede de lojas" },
  description: "Uma plataforma completa para fornecedores: rede de lojas com o seu catálogo, esteira de expedição ao vivo, carteira por Pix e receita recorrente.",
  alternates: { canonical: "/seja-fornecedor" },
};

const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";
const title = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl";

const OPPORTUNITY = [
  { i: Network, t: "Uma rede de lojas vendendo o seu produto", d: "Cada membro monta a própria loja com o seu catálogo. Você multiplica os pontos de venda sem abrir uma loja sequer." },
  { i: Coins, t: "Receita que se repete todo mês", d: "Mensalidade da plataforma e taxa sobre cada pedido dos seus membros. Quanto mais a rede vende, mais você fatura." },
  { i: Wallet, t: "Você recebe antes de enviar", d: "O membro recarrega a carteira por Pix e o custo de cada pedido é debitado na hora. Sem calote e sem cobrança de boleto." },
  { i: ShieldCheck, t: "Controle total do seu estoque e preço", d: "Estoque central, preço mínimo protegido e escolha de quais lojas podem vender cada produto." },
];
const OPS = [
  { i: Clock, t: "Horário de corte", d: "Defina o corte por dia da semana, com fuso e feriados. Cada pedido sabe se sai hoje ou amanhã." },
  { i: Layers, t: "Ondas de separação", d: "Agrupe pedidos prontos e imprima uma lista por produto e tamanho, com todas as etiquetas em um só PDF." },
  { i: Printer, t: "Etiqueta em PDF", d: "O membro gera na transportadora e anexa. A expedição imprime em lote, sem retrabalho." },
  { i: Users, t: "Equipe de expedição", d: "Um funcionário por pedido e uma tela sem valores, com botões grandes para tablet." },
  { i: Boxes, t: "Estoque central por tamanho", d: "Reserva ao pedir, baixa ao expedir, entradas e ajustes com histórico de cada movimentação." },
  { i: BarChart3, t: "Torre de controle", d: "Receita, saúde de cada loja, pedidos em atraso e alertas para agir antes do problema virar reclamação." },
];
const STEPS = [
  { t: "Fale com a NextLevel", d: "Conversamos sobre o seu catálogo, a sua operação e o modelo que faz sentido: SuperDrop ou White Label." },
  { t: "Implantação acompanhada", d: "Cadastramos o seu catálogo, a equipe e a página de vendas com a sua marca e o seu WhatsApp." },
  { t: "Convide os primeiros membros", d: "Cada fornecedor tem cupom de teste de 7 dias e link de cadastro próprio para captar a rede." },
];

export default async function SejaFornecedor() {
  await requireBrandFeature("dropship");
  const c = supportContacts();
  const contact = c.whatsappUrl ? { href: c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent("Olá! Quero ser fornecedor SuperDrop.")}`), external: true } : c.email ? { href: `mailto:${c.email}?subject=${encodeURIComponent("Quero ser fornecedor SuperDrop")}`, external: false } : null;
  return (
    <>
      <section className="relative overflow-hidden bg-[#08120c] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden style={{ background: "radial-gradient(60rem 30rem at 85% -10%, rgba(34,197,94,0.20), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 md:pt-24">
          <span className="inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold text-[#86efac]">Para quem produz, importa ou distribui</span>
          <h1 className="nl-display mt-5 max-w-4xl">Transforme o seu catálogo em uma rede de lojas que vende todo dia.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#c3d3ca]">A SuperDrop entrega a plataforma completa para você operar como fornecedor: lojas dos seus membros, expedição organizada, carteira por Pix e receita recorrente sobre cada pedido. Você foca no produto; o sistema cuida do resto.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {contact ? <a href={contact.href} target={contact.external ? "_blank" : undefined} rel="noreferrer" className={`${btn} bg-[#22c55e] text-[#052e14] hover:bg-[#4ade80] focus-visible:outline-white`}>Quero ser fornecedor <ArrowRight className="size-5" aria-hidden /></a> : null}
            <a href="#modelos" className={`${btn} border border-white/30 hover:bg-white/10 focus-visible:outline-white`}>Ver os modelos e valores</a>
          </div>
          <p className="mt-4 text-sm text-[#b4c6bb]">Fornecedores no lançamento: Alpha Outfit e MantosShop · sem taxa por pedido nos primeiros 15 dias</p>
          <Reveal className="relative mx-auto mt-14 max-w-5xl"><LiveConveyor /></Reveal>
        </div>
      </section>

      <section className="bg-[#f4f6f5] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${title} max-w-3xl`}>Uma oportunidade de negócio com um sistema robusto por trás</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Você não precisa construir tecnologia, contratar time de sistemas nem administrar cada loja. Entra com o produto e ganha escala.</p></Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">{OPPORTUNITY.map((o, n) => { const Icon = o.i; return <Reveal as="li" key={o.t} delay={n * 80} className="rounded-2xl border border-neutral-200 bg-white p-6"><span className="flex size-10 items-center justify-center rounded-lg bg-[#22c55e]/15 text-[#12a150]"><Icon className="size-5" aria-hidden /></span><h3 className="mt-4 text-lg font-bold">{o.t}</h3><p className="mt-1.5 text-neutral-600">{o.d}</p></Reveal>; })}</ul>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${title} max-w-2xl`}>Uma tela para cada pessoa da sua operação</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Quem gerencia, quem separa e quem vende veem só o que precisam para trabalhar.</p></Reveal>
          <div className="mt-10"><PanelsShowcase /></div>
        </div>
      </section>

      <section className="bg-[#08120c] py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${title} max-w-2xl`}>Feito para a rotina de quem expede</h2></Reveal>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {OPS.map((o, n) => { const Icon = o.i; return <Reveal as="li" key={o.t} delay={n * 60} className="bg-[#0d1c14] p-6"><span className="flex size-10 items-center justify-center rounded-lg bg-[#22c55e]/15 text-[#22c55e]"><Icon className="size-5" aria-hidden /></span><h3 className="mt-4 font-bold">{o.t}</h3><p className="mt-1.5 text-sm leading-relaxed text-[#b4c6bb]">{o.d}</p></Reveal>; })}
          </ul>
        </div>
      </section>

      <section id="modelos" className="scroll-mt-20 bg-[#f4f6f5] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${title} max-w-2xl`}>Modelos de operação</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Sem taxa por pedido nos primeiros 15 dias. A taxa incide sobre os produtos, sem o frete.</p></Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {SUPPLIER_PLANS.map((p) => (
              <li key={p.key} id={p.key} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6">
                <h3 className="text-2xl font-bold">{p.name}</h3><p className="text-neutral-600">{p.tagline}</p>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><dt className="text-neutral-600">Setup</dt><dd className="text-lg font-bold tabular-nums">{p.setup}</dd></div><div><dt className="text-neutral-600">Mensal</dt><dd className="text-lg font-bold tabular-nums">{p.monthly}</dd></div><div><dt className="text-neutral-600">Por pedido</dt><dd className="text-lg font-bold tabular-nums">{p.fee}</dd></div></dl>
                <ul className="mt-4 flex-1 space-y-2 text-sm">{p.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#12a150]" aria-hidden />{i}</li>)}</ul>
                {contact ? <a href={contact.href} target={contact.external ? "_blank" : undefined} rel="noreferrer" className={`${btn} mt-5 bg-[#0f1c16] text-white hover:bg-[#1c2e25]`}>Quero o modelo {p.name}</a> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${title} max-w-2xl`}>Como se torna fornecedor</h2></Reveal>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">{STEPS.map((s, n) => <Reveal as="li" key={s.t} delay={n * 80} className="rounded-2xl border border-neutral-200 p-6"><span className="flex size-10 items-center justify-center rounded-full bg-[#0f1c16] font-bold text-[#22c55e]">{n + 1}</span><h3 className="mt-4 font-bold">{s.t}</h3><p className="mt-1.5 text-neutral-600">{s.d}</p></Reveal>)}</ol>
        </div>
      </section>

      <section className="bg-[#08120c] py-20 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div><Store className="mb-4 size-9 text-[#22c55e]" aria-hidden /><h2 className={`${title} max-w-xl`}>Pronto para ter uma rede de lojas vendendo o seu produto?</h2></div>
          <div className="flex flex-wrap gap-3">{contact ? <a href={contact.href} target={contact.external ? "_blank" : undefined} rel="noreferrer" className={`${btn} bg-[#22c55e] text-[#052e14] hover:bg-[#4ade80] focus-visible:outline-white`}>Quero ser fornecedor</a> : null}<Link href="/login" className={`${btn} border border-white/30 hover:bg-white/10 focus-visible:outline-white`}>Já sou fornecedor: entrar</Link></div>
        </div>
      </section>
    </>
  );
}
