import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock, FileText, Layers, Printer, Users, Wallet } from "lucide-react";
import { getSession, homeFor } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { HowItWorks } from "@/components/portal/how-it-works";
import { JsonLd } from "@/components/portal/json-ld";
import { LiveConveyor } from "@/components/portal/live-conveyor";
import { PanelsShowcase } from "@/components/portal/panels-showcase";
import { Reveal } from "@/components/portal/reveal";
import { SaleCalculator } from "@/components/portal/sale-calculator";
import { ThemeShowcase } from "@/components/portal/theme-showcase";
import { FAQ } from "./content";

export const metadata: Metadata = {
  title: { absolute: "SuperDrop · Venda sem estoque, com operação de verdade" },
  description: "Loja online para quem vende e esteira de expedição ao vivo para quem fornece. Recarga por Pix, etiqueta em PDF e teste de 7 dias sem cartão.",
  alternates: { canonical: "/" },
};

const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";
const sectionTitle = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl";

const PROBLEMS = [
  { t: "Vender dá trabalho, separar dá mais", d: "Quem vende perde tempo com estoque, planilha e mensagem de etiqueta. Aqui o fornecedor cuida do produto e você cuida da venda." },
  { t: "Expedição no improviso", d: "Sem esteira, o pedido some entre o WhatsApp e a caixa. Com corte, ondas e etiqueta em lote, cada pedido tem lugar e hora." },
  { t: "Dinheiro sem controle", d: "Recarga por Pix, custo debitado a cada pedido e extrato claro. Sem cartão e sem cobrança surpresa." },
];
const OPS = [
  { i: Clock, t: "Horário de corte", d: "Cada fornecedor define o corte por dia da semana, com fuso e feriados. O pedido sabe se sai hoje ou amanhã." },
  { i: Layers, t: "Ondas de separação", d: "Agrupe pedidos prontos e imprima uma lista por produto e tamanho, com todas as etiquetas em um só PDF." },
  { i: Printer, t: "Etiqueta em PDF", d: "O membro gera na transportadora e anexa. A expedição imprime em lote, sem retrabalho." },
  { i: Wallet, t: "Recarga por Pix", d: "Saldo por membro, confirmação automática e pedidos em espera liberados na ordem de chegada." },
  { i: Users, t: "Equipe de expedição", d: "Um funcionário por pedido e uma tela sem valores, com botões grandes para tablet." },
  { i: FileText, t: "Pós-venda no painel", d: "Acompanhe cada pedido em andamento e registre o atendimento sem sair do sistema." },
];

export default async function Portal() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const faq = FAQ.slice(0, 5);
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "SuperDrop", url: "https://superdrop.com.br", logo: "https://superdrop.com.br/brand/superdrop-logo-light.png", parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda" } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "SuperDrop", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Plataforma de e-commerce para quem vende e para quem fornece, com esteira de expedição ao vivo." },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />

      {/* 1. Herói com demonstração viva */}
      <section className="relative overflow-hidden bg-[#08120c] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden style={{ background: "radial-gradient(60rem 30rem at 85% -10%, rgba(34,197,94,0.20), transparent 60%), radial-gradient(40rem 24rem at 0% 110%, rgba(34,197,94,0.08), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-16 md:pt-24">
          <Logo variant="mark" tone="on-dark" className="pointer-events-none absolute right-4 top-16 hidden h-56 drop-shadow-[0_0_48px_rgba(57,255,20,0.25)] xl:block" alt="" />
          <span className="inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold text-[#86efac]">Teste grátis por 7 dias · sem cartão</span>
          <h1 className="nl-display mt-5 max-w-4xl">Venda sem estoque. Fornecedor com operação de verdade.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#c3d3ca]">Quem vende monta a loja e acompanha os pedidos. Quem fornece separa e envia numa esteira ao vivo, com horário de corte, recarga por Pix e etiqueta em PDF.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#comecar" className={`${btn} bg-[#22c55e] text-[#052e14] hover:bg-[#4ade80] focus-visible:outline-white`}>Começar o teste de 7 dias <ArrowRight className="size-5" aria-hidden /></a>
            <a href="#como-funciona" className={`${btn} border border-white/30 hover:bg-white/10 focus-visible:outline-white`}>Ver como funciona</a>
          </div>
          <p className="mt-4 text-sm text-[#b4c6bb]">Pix como forma de pagamento · sem fidelidade no teste · seus dados só para separar e enviar</p>
          <Reveal className="relative mx-auto mt-14 max-w-5xl translate-y-0"><LiveConveyor /></Reveal>
        </div>
        <div className="h-16 bg-gradient-to-b from-transparent to-[#f4f6f5]" aria-hidden />
      </section>

      {/* 2. Fornecedores do lançamento */}
      <section className="bg-[#f4f6f5] pb-4 pt-6" aria-label="Fornecedores do lançamento">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm text-neutral-600">
          <span className="font-medium">Fornecedores no lançamento</span>
          <span className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight text-neutral-800">Alpha Outfit</span>
          <span className="font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight text-neutral-800">MantosShop</span>
        </div>
      </section>

      {/* 3. Problema e promessa */}
      <section className="bg-[#f4f6f5] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Menos improviso, mais pedido saindo no dia certo</h2></Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">{PROBLEMS.map((p, n) => <Reveal as="li" key={p.t} delay={n * 90} className="rounded-2xl border border-neutral-200 bg-white p-6"><h3 className="text-lg font-bold">{p.t}</h3><p className="mt-2 text-neutral-600">{p.d}</p></Reveal>)}</ul>
        </div>
      </section>

      {/* 4. Como funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Do catálogo à caixa enviada, em cinco passos</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Clique em cada passo para ver a tela do sistema.</p></Reveal>
          <div className="mt-10"><HowItWorks /></div>
        </div>
      </section>

      {/* 5. Painéis por papel */}
      <section className="bg-[#f4f6f5] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Uma tela para cada pessoa da operação</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Quem gerencia, quem separa e quem vende veem só o que precisam para trabalhar.</p></Reveal>
          <div className="mt-10"><PanelsShowcase /></div>
        </div>
      </section>

      {/* 6. Loja e temas */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-3xl`}>Uma loja bonita, que você monta sem programar</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Comece com o tema grátis. Quando quiser mais, compre um tema pronto na Loja NextLevel e instale com 1 clique.</p></Reveal>
          <div className="mt-10"><ThemeShowcase /></div>
        </div>
      </section>

      {/* 7. Operação */}
      <section className="bg-[#08120c] py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Feito para a rotina de quem expede</h2></Reveal>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {OPS.map((o, n) => { const Icon = o.i; return (
              <Reveal as="li" key={o.t} delay={n * 60} className="bg-[#0d1c14] p-6"><span className="flex size-10 items-center justify-center rounded-lg bg-[#22c55e]/15 text-[#22c55e]"><Icon className="size-5" aria-hidden /></span><h3 className="mt-4 font-bold">{o.t}</h3><p className="mt-1.5 text-sm leading-relaxed text-[#b4c6bb]">{o.d}</p></Reveal>
            ); })}
          </ul>
        </div>
      </section>

      {/* 8. Preço com calculadora */}
      <section className="bg-[#f4f6f5] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Quanto sobra em uma venda?</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Simule uma camisa. Você define o preço; a plataforma cobra uma taxa por pedido sobre o valor dos produtos.</p></Reveal>
          <Reveal className="mt-10"><SaleCalculator /></Reveal>
          <p className="mt-6 text-sm text-neutral-600">Mensalidades, setup e condições de cada plano em <Link href="/planos" className="font-semibold text-[#0b6b34] underline">Planos</Link>.</p>
        </div>
      </section>

      {/* 9. Como começar */}
      <section id="comecar" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal><h2 className={`${sectionTitle} max-w-2xl`}>Comece o teste de 7 dias</h2><p className="mt-3 max-w-2xl text-lg text-neutral-600">Sem cartão de crédito. O teste vem com o cupom do fornecedor que te indicou.</p></Reveal>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[["Escolha o fornecedor", "Peça o cupom ao fornecedor que te indicou e abra a página dele."], ["Ative o teste", "Use o cupom e explore o painel, o catálogo e a loja por 7 dias."], ["Decida com calma", "Gostou? Escolha o plano e pague por Pix. Se não, nada é cobrado."]].map(([t, d], n) => <Reveal as="li" key={t} delay={n * 90} className="rounded-2xl border border-neutral-200 p-6"><span className="flex size-9 items-center justify-center rounded-full bg-[#0f1c16] font-bold text-[#22c55e]">{n + 1}</span><h3 className="mt-4 text-lg font-bold">{t}</h3><p className="mt-1.5 text-neutral-600">{d}</p></Reveal>)}
          </ol>
          <p className="mt-8 text-neutral-600">Já tem conta? <Link href="/login" className="font-semibold text-[#0b6b34] underline">Entrar no painel</Link></p>
        </div>
      </section>

      {/* 10. Perguntas frequentes */}
      <section className="bg-[#f4f6f5] py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className={sectionTitle}>Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">{faq.map((f) => <details key={f.q} className="group rounded-xl border border-neutral-200 bg-white p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-neutral-600">{f.a}</p></details>)}</div>
          <p className="mt-6 text-sm"><Link href="/faq" className="font-semibold text-[#0b6b34] underline">Ver todas as perguntas</Link></p>
        </div>
      </section>

      {/* 11. Chamada final */}
      <section className="bg-[#08120c] py-20 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div><Logo tone="on-dark" className="mb-5 h-10" /><h2 className={`${sectionTitle} max-w-xl`}>Pronto para ver o seu pedido saindo no dia certo?</h2></div>
          <div className="flex flex-wrap gap-3"><a href="#comecar" className={`${btn} bg-[#22c55e] text-[#052e14] hover:bg-[#4ade80] focus-visible:outline-white`}>Começar o teste</a><Link href="/login" className={`${btn} border border-white/30 hover:bg-white/10 focus-visible:outline-white`}>Entrar</Link></div>
        </div>
      </section>
    </>
  );
}
