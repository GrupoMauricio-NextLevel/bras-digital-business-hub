import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getPublicProposal } from "@/lib/domain/proposals";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { AcceptButton } from "./accept-button";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ProposalPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const data = await getPublicProposal(await getDb(), token);
  if (!data || data.storeSlug !== slug) notFound();
  const { proposal: p, state } = data;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Proposta de {data.storeName}</h1>
      <p className="mt-1 text-sm text-neutral-500">Para {p.customerName} · válida até {formatDateTime(p.expiresAt)}</p>
      <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
        <ul className="divide-y divide-neutral-200 text-sm">
          {p.items.map((it, i) => <li key={i} className="flex justify-between gap-3 py-2.5"><span>{it.quantity}× {it.label}</span><span className="tabular-nums">{formatBRL(it.unitPriceCents * it.quantity)}</span></li>)}
        </ul>
        <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold"><span>Produtos</span><span className="tabular-nums">{formatBRL(p.subtotalCents)}</span></div>
        <p className="mt-2 text-xs text-neutral-500">Frete e forma de pagamento são combinados com a loja depois do aceite.</p>
      </div>
      {state === "OPEN" ? <AcceptButton token={token} slug={slug} /> : null}
      {state === "EXPIRED" ? <p className="mt-6 rounded-2xl bg-neutral-100 p-4 text-sm">Esta proposta expirou. Peça uma nova à loja.</p> : null}
      {state === "CANCELED" ? <p className="mt-6 rounded-2xl bg-neutral-100 p-4 text-sm">Esta proposta foi cancelada pela loja.</p> : null}
      {state === "CONVERTED" ? <p className="mt-6 rounded-2xl bg-neutral-100 p-4 text-sm">Proposta aceita. A loja entrará em contato para combinar pagamento e entrega.</p> : null}
    </div>
  );
}
