import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SUPPLIER_PLANS } from "../content";

export const metadata: Metadata = { title: "Para fornecedores", description: "Esteira ao vivo, expedição, etiquetas e página de vendas para quem fornece." };

const FEATURES = ["Esteira ao vivo com horário de corte por dia da semana", "Ondas de separação com lista agrupada e etiquetas em um só PDF", "Painel de expedição em tablet, sem nenhum valor à vista", "Carteira por membro com recarga Pix e prazo de 72 horas", "Página de vendas do fornecedor para captar membros com teste de 7 dias"];

export default function Fornecedores() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Para fornecedores</h1>
      <p className="mt-3 max-w-2xl text-lg text-neutral-600">Transforme o seu catálogo em uma rede de lojas, com a operação organizada do primeiro ao último pedido do dia.</p>
      <ul className="mt-8 grid gap-3 md:grid-cols-2">{FEATURES.map((f) => <li key={f} className="flex gap-3 rounded-xl border border-neutral-200 p-4"><Check className="mt-0.5 size-5 shrink-0 text-[#12a150]" aria-hidden />{f}</li>)}</ul>
      <h2 id="white-label" className="mt-16 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Modelos de operação</h2>
      <p className="mt-2 text-neutral-600">Sem taxa por pedido nos primeiros 15 dias. A taxa incide sobre os produtos, sem o frete.</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {SUPPLIER_PLANS.map((p) => (
          <li key={p.key} className="flex flex-col rounded-2xl border border-neutral-200 p-6">
            <h3 className="text-2xl font-bold">{p.name}</h3><p className="text-neutral-600">{p.tagline}</p>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><dt className="text-neutral-600">Setup</dt><dd className="text-lg font-bold tabular-nums">{p.setup}</dd></div><div><dt className="text-neutral-600">Mensal</dt><dd className="text-lg font-bold tabular-nums">{p.monthly}</dd></div><div><dt className="text-neutral-600">Por pedido</dt><dd className="text-lg font-bold tabular-nums">{p.fee}</dd></div></dl>
            <ul className="mt-4 flex-1 space-y-2 text-sm">{p.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#12a150]" aria-hidden />{i}</li>)}</ul>
          </li>
        ))}
      </ul>
      <Link href="/login" className="mt-8 inline-flex h-12 items-center rounded-lg bg-[#0f1c16] px-6 font-semibold text-white hover:bg-[#1c2e25]">Entrar no painel</Link>
    </div>
  );
}
