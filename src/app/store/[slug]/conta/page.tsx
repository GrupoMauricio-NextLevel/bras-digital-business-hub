import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Package, RotateCcw, Search, Truck } from "lucide-react";
import { getDb } from "@/db/client";
import { getStorefront } from "@/lib/queries/storefront";
import { COOKIE_CLIENTE, lerSessao, pedidosDoCliente } from "@/lib/domain/conta-cliente";
import { formatBRL } from "@/lib/money";
import { EntrarConta, SairConta } from "./entrar";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Minha conta do cliente final (D240): pedidos com etapa e rastreio, comprar de novo e ajuda; entrada por código no e-mail. */
export default async function ContaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug); if (!sf) notFound();
  const base = `/store/${slug}`;
  const email = lerSessao((await cookies()).get(`${COOKIE_CLIENTE}-${slug}`)?.value, sf.store.id);
  if (!email) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
        <p className="mt-1 text-sm text-neutral-500">Veja seus pedidos, o rastreio e compre de novo. Sem senha: mandamos um código para o seu e-mail.</p>
        <EntrarConta slug={slug} />
        <p className="mt-6 text-sm text-neutral-500">Só quer ver um pedido? <Link href={`${base}/acompanhar`} className="font-medium underline">Acompanhar pelo número</Link></p>
      </div>
    );
  }
  const pedidos = await pedidosDoCliente(await getDb(), sf.store.id, email);
  const emAndamento = pedidos.filter((p) => !p.canceled && p.etapa !== "Entregue").length;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1><p className="mt-1 text-sm text-neutral-500">{email}</p></div>
        <SairConta slug={slug} />
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo">
        <li className="rounded-2xl border border-neutral-200 p-4"><Package className="size-5 text-neutral-500" aria-hidden /><b className="mt-2 block text-2xl tabular-nums">{pedidos.length}</b><span className="text-sm text-neutral-500">pedidos</span></li>
        <li className="rounded-2xl border border-neutral-200 p-4"><Truck className="size-5 text-neutral-500" aria-hidden /><b className="mt-2 block text-2xl tabular-nums">{emAndamento}</b><span className="text-sm text-neutral-500">a caminho ou em preparo</span></li>
        <li className="rounded-2xl border border-neutral-200 p-4"><RotateCcw className="size-5 text-neutral-500" aria-hidden /><b className="mt-2 block text-sm">Troca ou devolução?</b><span className="text-sm text-neutral-500">Use o chat da loja: a resposta volta aqui.</span></li>
      </ul>
      <h2 className="mt-10 text-lg font-semibold">Meus pedidos</h2>
      {pedidos.length ? (
        <ul className="mt-3 grid gap-3">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-2xl border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>Pedido #{p.number}</b>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.canceled ? "bg-neutral-100 text-neutral-600" : "bg-emerald-50 text-emerald-700"}`}>{p.etapa}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">{new Date(p.createdAt).toLocaleDateString("pt-BR")} · {formatBRL(p.totalCents)} · {p.items.reduce((n, i) => n + i.quantity, 0)} item(ns)</p>
              <p className="mt-1 line-clamp-1 text-sm">{p.items.map((i) => i.name).join(", ")}</p>
              {p.trackingCode ? <p className="mt-1 text-xs">Rastreio: <b className="select-all font-mono">{p.trackingCode}</b></p> : null}
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link href={`${base}/order/${p.id}`} className="rounded-full border border-neutral-300 px-3 py-1.5 font-medium">Ver pedido</Link>
                <Link href={`${base}/catalog`} className="rounded-full px-3 py-1.5 font-medium" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>Comprar de novo</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500"><Search className="mx-auto mb-2 size-6" aria-hidden />Nenhum pedido com este e-mail nesta loja. <Link href={`${base}/catalog`} className="font-medium underline">Ver produtos</Link></div>
      )}
    </div>
  );
}
