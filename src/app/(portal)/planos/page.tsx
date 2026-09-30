import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { MEMBER_FEES, SUPPLIER_PLANS } from "../content";

export const metadata: Metadata = { title: "Planos", description: "Taxas por pedido, modelos para fornecedores e formas de pagamento." };

export default function Planos() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Planos</h1>
      <p className="mt-3 max-w-2xl text-lg text-neutral-600">Comece pelo teste de 7 dias, sem cartão. Planos aceitam Pix e cartão; carteira e vendas da loja, somente Pix.</p>

      <h2 className="mt-12 text-2xl font-bold">Para quem vende</h2>
      <p className="mt-1 text-neutral-600">A mensalidade do membro é informada ao iniciar o teste. A taxa por pedido depende do tipo de loja:</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">{MEMBER_FEES.map((f) => <li key={f.name} className="rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-extrabold tabular-nums">{f.fee}</p><h3 className="font-semibold">{f.name}</h3><p className="text-sm text-neutral-600">{f.text}</p></li>)}</ul>

      <h2 className="mt-14 text-2xl font-bold">Para quem fornece</h2>
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {SUPPLIER_PLANS.map((p) => (
          <li key={p.key} className="rounded-2xl border border-neutral-200 p-6">
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="mt-3 text-4xl font-extrabold tabular-nums">{p.monthly}<span className="text-base font-medium text-neutral-600">/mês</span></p>
            <p className="text-sm text-neutral-600">+ setup de {p.setup} · + {p.fee} por pedido</p>
            <ul className="mt-4 space-y-2 text-sm">{p.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#12a150]" aria-hidden />{i}</li>)}</ul>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-neutral-600">Semestral e anual têm o mesmo valor mensal, pagos adiantados. Descontos de 15% e 25% valem para os serviços da Loja NextLevel.</p>
      <Link href="/login" className="mt-8 inline-flex h-12 items-center rounded-lg bg-[#0f1c16] px-6 font-semibold text-white hover:bg-[#1c2e25]">Entrar</Link>
    </div>
  );
}
