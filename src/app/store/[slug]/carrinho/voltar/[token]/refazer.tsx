"use client";
import * as React from "react";
import Link from "next/link";
import type { LinhaDoCarrinho } from "@/lib/domain/carrinho-abandonado";

/** Grava o carrinho no navegador (mesma chave do carrinho da loja) e segue para o checkout. */
export function RefazerCarrinho({ slug, linhas }: { slug: string; linhas: LinhaDoCarrinho[] }) {
  const vazio = linhas.length === 0;
  React.useEffect(() => {
    if (!linhas.length) return;
    try { localStorage.setItem(`nl-cart:${slug}`, JSON.stringify(linhas)); } catch { /* sem armazenamento: o checkout fica vazio */ }
    window.location.replace(`/store/${slug}/checkout`);
  }, [slug, linhas]);
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {vazio ? (
        <>
          <h1 className="text-xl font-semibold">Os itens acabaram</h1>
          <p className="mt-2 text-sm text-neutral-600">Os produtos do seu carrinho não estão mais disponíveis. Veja o que a loja tem agora.</p>
          <Link href={`/store/${slug}`} className="mt-6 inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white">Ver a loja</Link>
        </>
      ) : <p role="status" className="text-sm text-neutral-600">Refazendo o seu carrinho…</p>}
    </div>
  );
}
