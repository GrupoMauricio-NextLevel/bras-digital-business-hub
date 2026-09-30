import Link from "next/link";
import { Check } from "lucide-react";
import { getDb } from "@/db/client";
import { getPriceBook } from "@/lib/domain/finance";
import { OFFER_KEYS } from "@/lib/finance/price-book";
import { formatBRL } from "@/lib/money";

const BULLETS: Record<(typeof OFFER_KEYS)[number], string[]> = {
  DROP_MANUAL: ["Pedidos manuais (WhatsApp e Instagram)", "Estoque central do fornecedor", "Financeiro e carteira por Pix", "Taxa de 5% por pedido"],
  STORE_SUBDOMAIN: ["Loja virtual no subdomínio SuperDrop", "Tema grátis e editor de tema", "Checkout por Pix", "Taxa de 5% por pedido"],
  STORE_OWN: ["Marca e domínio próprios, sem selo SuperDrop", "Todas as funções do editor de tema", "Análise de vendas e equipe", "Taxa de 3% por pedido"],
};

/** Planos de quem vende, com preço vindo da tabela de preços. Assinar leva ao checkout por Pix; o acesso é liberado sozinho. */
export async function MemberPlans({ supplier }: { supplier?: string }) {
  const book = await getPriceBook(await getDb());
  const q = supplier ? `&fornecedor=${supplier}` : "";
  return (
    <ul className="grid gap-4 md:grid-cols-3" aria-label="Planos para quem vende">
      {OFFER_KEYS.map((k) => {
        const o = book.offers[k];
        return (
          <li key={k} className={`flex flex-col rounded-2xl border bg-white p-6 ${k === "STORE_SUBDOMAIN" ? "border-[#22c55e] shadow-lg" : "border-neutral-200"}`}>
            {k === "STORE_SUBDOMAIN" ? <span className="mb-2 w-fit rounded-full bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold text-[#0b6b34]">Mais escolhido</span> : null}
            <h3 className="text-xl font-bold">{o.name}</h3>
            <p className="mt-1 text-sm text-neutral-600">{o.description}</p>
            <p className="mt-4 text-4xl font-extrabold tabular-nums">{formatBRL(o.monthlyCents)}<span className="text-base font-medium text-neutral-600">/mês</span></p>
            <p className="text-sm text-neutral-600">{o.setupCents > 0 ? `+ setup de ${formatBRL(o.setupCents)}` : "Sem setup"}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">{BULLETS[k].map((b) => <li key={b} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#12a150]" aria-hidden />{b}</li>)}</ul>
            <Link href={`/cadastro?plano=${k}${q}`} className="mt-5 inline-flex h-12 items-center justify-center rounded-lg bg-[#0f1c16] px-6 font-semibold text-white hover:bg-[#1c2e25]">Assinar por Pix</Link>
            <Link href={`/cadastro?plano=${k}${q}`} className="mt-2 text-center text-sm font-semibold text-[#0b6b34] underline">Tenho um cupom de teste de 7 dias</Link>
          </li>
        );
      })}
    </ul>
  );
}
