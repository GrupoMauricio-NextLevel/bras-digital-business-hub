"use client";
import * as React from "react";
import Link from "next/link";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { useCart } from "@/components/storefront/cart-context";
import { ProductArt } from "@/components/app/product-art";
import { formatBRL } from "@/lib/money";

const input = "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900";

/**
 * Checkout SIMULADO das lojas de demonstração de temas. Tudo acontece só no navegador: nenhuma chamada ao servidor,
 * nenhum pedido, pagamento, gateway, webhook, estoque, e-mail ou lançamento financeiro. Aviso de demonstração sempre visível.
 */
export function DemoCheckout({ slug, themeKey, themeName }: { slug: string; themeKey: string; themeName: string }) {
  const cart = useCart();
  const [name, setName] = React.useState(""); const [zip, setZip] = React.useState(""); const [pay, setPay] = React.useState<"pix" | "card">("pix");
  const [done, setDone] = React.useState<{ code: string; total: number; lines: { name: string; label: string; quantity: number }[] } | null>(null);
  const base = `/store/${slug}`;
  const banner = <p role="note" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden /><span><b>Compra de demonstração.</b> Nada é cobrado nem enviado: não existe pedido, pagamento, estoque ou e-mail. Serve para ver como o fechamento funciona no tema {themeName}.</span></p>;
  if (!cart.ready) return <div className="mx-auto min-h-[60vh] max-w-2xl px-4 py-16 text-center text-sm text-neutral-500" aria-busy="true"><h1 className="sr-only">Finalizar compra (demonstração)</h1>Carregando…</div>;
  if (done) return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {banner}
      <div className="rounded-2xl border border-neutral-200 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <h1 className="mt-3 text-2xl font-semibold">Pedido de demonstração {done.code}</h1>
        <p className="mt-2 text-neutral-600">É assim que o cliente vê a confirmação. Nesta loja de exemplo nada foi registrado.</p>
        <ul className="mt-5 divide-y divide-neutral-200 text-left text-sm">{done.lines.map((l, i) => <li key={i} className="flex justify-between py-2"><span>{l.quantity}× {l.name} <span className="text-neutral-500">{l.label}</span></span></li>)}</ul>
        <p className="mt-3 text-right text-base font-semibold tabular-nums">Total sem frete: {formatBRL(done.total)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href={base} className="inline-flex h-11 items-center rounded-lg border border-neutral-300 px-5 text-sm font-medium">Voltar à loja</Link><a href={`/temas/${themeKey}`} target="_top" className="inline-flex h-11 items-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white">Ver o tema {themeName}</a></div>
      </div>
    </div>
  );
  if (cart.lines.length === 0) return <div className="mx-auto max-w-2xl px-4 py-16 text-center">{banner}<h1 className="text-xl font-semibold">Seu carrinho está vazio</h1><Link href={`${base}/catalog`} className="mt-4 inline-flex h-11 items-center rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white">Ver catálogo</Link></div>;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    setDone({ code, total: cart.subtotal, lines: cart.lines.map((l) => ({ name: l.name, label: l.label, quantity: l.quantity })) });
    cart.clear();
  };
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {banner}
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Finalizar compra <span className="text-base font-normal text-neutral-500">(demonstração)</span></h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <label className="block text-sm font-medium">Nome<input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="Nome de exemplo" /></label>
          <label className="block text-sm font-medium">CEP<input className={`${input} mt-1`} value={zip} onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 9))} inputMode="numeric" placeholder="00000-000" /></label>
          <p className="text-xs text-neutral-500">Na loja real, o frete é cotado pelo CEP e o pagamento é conferido no Mercado Pago antes de o pedido seguir.</p>
          <fieldset><legend className="text-sm font-medium">Pagamento</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["pix", "card"] as const).map((p) => <label key={p} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm ${pay === p ? "border-neutral-900 font-semibold" : "border-neutral-300"}`}><input type="radio" name="pay" className="sr-only" checked={pay === p} onChange={() => setPay(p)} />{p === "pix" ? "Pix" : "Cartão"}</label>)}</div></fieldset>
        </div>
        <aside className="h-fit rounded-2xl border border-neutral-200 p-5">
          <h2 className="text-base font-semibold">Resumo</h2>
          <ul className="mt-3 space-y-3">{cart.lines.map((l) => <li key={l.key} className="flex gap-3 text-sm"><ProductArt images={l.images} size="sm" className="size-12 shrink-0 rounded-md bg-neutral-100" /><span className="min-w-0 flex-1"><span className="block truncate">{l.name}</span><span className="text-xs text-neutral-500">{l.label} · {l.quantity}×</span></span><span className="tabular-nums">{formatBRL(l.unitPriceCents * l.quantity)}</span></li>)}</ul>
          <p className="mt-4 flex justify-between border-t border-neutral-200 pt-3 font-semibold"><span>Total sem frete</span><span className="tabular-nums">{formatBRL(cart.subtotal)}</span></p>
          <button type="submit" className="mt-5 h-12 w-full rounded-lg bg-neutral-900 text-sm font-semibold text-white">Simular pedido</button>
        </aside>
      </form>
    </div>
  );
}
