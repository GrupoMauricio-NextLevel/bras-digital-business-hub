"use client";
import * as React from "react";
import Link from "next/link";
import { sairDosLembretesAction } from "@/app/actions/storefront";

export function SairDosLembretes({ slug, token }: { slug: string; token: string }) {
  const [feito, setFeito] = React.useState(false);
  const [pending, start] = React.useTransition();
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{feito ? "Pronto, sem mais lembretes" : "Parar os lembretes do carrinho?"}</h1>
      <p className="mt-2 text-sm text-neutral-600">{feito ? "Você não vai mais receber e-mails sobre este carrinho." : "Você não vai mais receber e-mails sobre os itens que deixou no carrinho desta loja."}</p>
      {feito ? <Link href={`/store/${slug}`} className="mt-6 inline-flex h-11 items-center rounded-full border border-neutral-300 px-6 text-sm font-semibold">Voltar à loja</Link>
        : <button type="button" disabled={pending} onClick={() => start(async () => { await sairDosLembretesAction(token); setFeito(true); })} className="mt-6 inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white disabled:opacity-60">Parar os lembretes</button>}
    </div>
  );
}
