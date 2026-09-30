import type { Metadata } from "next";
import Link from "next/link";
import { MemberPlans } from "@/components/portal/member-plans";
import { MEMBER_FEES } from "../content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos", description: "Planos para quem vende: assine por Pix, acesso liberado na hora, ou teste 7 dias com cupom." };

export default function Planos() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Planos</h1>
      <p className="mt-3 max-w-2xl text-lg text-neutral-600">Assine por Pix e o acesso ao plano é liberado na hora. Tem o cupom do seu fornecedor? Teste 7 dias sem cartão; depois do teste, o acesso é pausado até o pagamento.</p>
      <div className="mt-10"><MemberPlans /></div>

      <h2 className="mt-14 text-2xl font-bold">Taxa por pedido</h2>
      <p className="mt-1 text-neutral-600">Percentual sobre o valor dos produtos, sem o frete. Estorno devolve a taxa; pedidos de teste não pagam.</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">{MEMBER_FEES.map((f) => <li key={f.name} className="rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-extrabold tabular-nums">{f.fee}</p><h3 className="font-semibold">{f.name}</h3><p className="text-sm text-neutral-600">{f.text}</p></li>)}</ul>
      <p className="mt-6 text-sm text-neutral-600">Carteira e vendas da loja são somente por Pix. Descontos de 15% (semestral) e 25% (anual) valem para os serviços da Loja NextLevel.</p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/cadastro" className="inline-flex h-12 items-center rounded-lg bg-[#0f1c16] px-6 font-semibold text-white hover:bg-[#1c2e25]">Criar minha loja</Link><Link href="/login" className="inline-flex h-12 items-center rounded-lg border border-neutral-300 px-6 font-semibold hover:bg-neutral-50">Área de membros</Link></div>
      <p className="mt-6 text-sm text-neutral-600">É fornecedor? <Link href="/seja-fornecedor" className="font-semibold text-[#0b6b34] underline">Veja a página para fornecedores</Link>.</p>
    </div>
  );
}
