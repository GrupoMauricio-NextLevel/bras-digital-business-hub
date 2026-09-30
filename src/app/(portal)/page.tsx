import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getSession, homeFor } from "@/lib/auth";
import { AUDIENCES, FLOW } from "./content";

export const metadata: Metadata = { title: { absolute: "SuperDrop · Venda sem estoque, com operação de verdade" }, description: "Loja online para quem vende e painel de expedição ao vivo para quem fornece. Teste grátis por 7 dias, sem cartão." };

const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition";

export default async function Portal() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  return (
    <>
      <section className="bg-[#0f1c16] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <span className="inline-flex rounded-full bg-[#22c55e] px-3 py-1 text-xs font-semibold text-[#062b14]">Teste grátis por 7 dias · sem cartão</span>
          <h1 className="mt-5 max-w-3xl font-[family-name:var(--nl-font-display)] text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">Venda sem estoque. Fornecedor com operação de verdade.</h1>
          <p className="mt-5 max-w-2xl text-lg text-[#c3d3ca]">Quem vende monta a loja e acompanha os pedidos. Quem fornece separa e envia numa esteira ao vivo, com horário de corte e etiqueta em PDF.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/planos" className={`${btn} bg-[#22c55e] text-[#062b14] hover:bg-[#4ade80]`}>Ver planos <ArrowRight className="size-5" aria-hidden /></Link>
            <Link href="/como-funciona" className={`${btn} border border-white/30 hover:bg-white/10`}>Como funciona</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Uma plataforma, três jeitos de entrar</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <li key={a.key} className="flex flex-col rounded-2xl border border-neutral-200 p-6">
              <h3 className="text-xl font-bold">{a.title}</h3>
              <p className="mt-2 text-neutral-600">{a.text}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">{a.bullets.map((b) => <li key={b} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#12a150]" aria-hidden />{b}</li>)}</ul>
              <Link href={a.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0b6b34] hover:underline">Saiba mais <ArrowRight className="size-4" aria-hidden /></Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Do pedido à entrega</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {FLOW.map((s, i) => <li key={s.title} className="rounded-xl bg-white p-5 shadow-sm"><span className="flex size-8 items-center justify-center rounded-full bg-[#0f1c16] text-sm font-bold text-[#22c55e]">{i + 1}</span><h3 className="mt-3 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-neutral-600">{s.text}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-[#0f1c16] p-8 text-white md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-[family-name:var(--nl-font-display)] text-2xl font-extrabold">Quer ver funcionando?</h2><p className="mt-1 text-[#c3d3ca]">Comece o teste de 7 dias pelo fornecedor que te indicou.</p></div>
          <Link href="/login" className={`${btn} bg-[#22c55e] text-[#062b14] hover:bg-[#4ade80]`}>Entrar</Link>
        </div>
      </section>
    </>
  );
}
