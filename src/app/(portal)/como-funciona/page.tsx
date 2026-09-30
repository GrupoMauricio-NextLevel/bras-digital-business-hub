import type { Metadata } from "next";
import { requireBrandFeature } from "@/lib/brand-server";
import { FLOW, MEMBER_FEES } from "../content";

export const metadata: Metadata = { title: "Como funciona", description: "Do pedido do cliente à entrega: o que cada papel faz na SuperDrop." };

export default async function ComoFunciona() {
  await requireBrandFeature("dropship");
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Como funciona</h1>
      <p className="mt-3 text-lg text-neutral-600">Cada pessoa vê só o que precisa para fazer o seu trabalho.</p>
      <ol className="mt-10 space-y-4">
        {FLOW.map((s, i) => <li key={s.title} className="flex gap-4 rounded-xl border border-neutral-200 p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0f1c16] font-bold text-[#22c55e]">{i + 1}</span><div><h2 className="font-semibold">{s.title}</h2><p className="text-neutral-600">{s.text}</p></div></li>)}
      </ol>
      <h2 className="mt-14 font-[family-name:var(--nl-font-display)] text-2xl font-extrabold">Taxa por pedido do membro</h2>
      <p className="mt-2 text-neutral-600">Percentual sobre o valor dos produtos, sem o frete. Estorno devolve a taxa; pedidos de teste não pagam.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">{MEMBER_FEES.map((f) => <li key={f.name} className="rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-extrabold tabular-nums">{f.fee}</p><h3 className="mt-1 font-semibold">{f.name}</h3><p className="text-sm text-neutral-600">{f.text}</p></li>)}</ul>
    </div>
  );
}
