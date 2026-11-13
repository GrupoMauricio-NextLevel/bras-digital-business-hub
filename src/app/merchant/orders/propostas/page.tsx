import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listProposals } from "@/lib/domain/proposals";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { ProposalRowActions } from "./row-actions";
import { FileText } from "lucide-react";
import Link from "next/link";
import { perfilAtual } from "@/lib/perfil-loja-server";

export const dynamic = "force-dynamic";

const LABEL = { OPEN: "Aberta", CONVERTED: "Aceita (virou pedido)", CANCELED: "Cancelada" } as const;

export default async function ProposalsPage() {
  const session = await requireRole("STORE_OWNER");
  const rows = await listProposals(await getDb(), session.store!.id);
  // Commerce (D184): a proposta vira "link de pagamento" quando a loja tem o Mercado Pago conectado.
  const commerce = (await perfilAtual(session.store!.id)).ecommerce;
  const comMp = !!session.store!.mpAccessTokenEnc;
  return (
    <>
      <PageHeader backHref="/merchant/orders" title={commerce ? "Links de pagamento" : "Propostas"} description={commerce ? "Monte o pedido, mande o link e o cliente paga com Pix ou cartão pelo Mercado Pago da loja. O estoque fica reservado." : "Propostas enviadas por link. Quando o cliente aceita, vira um pedido com o estoque reservado."} />
      {commerce && !comMp ? <p role="status" className="mb-4 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm">Para o cliente pagar pelo link, conecte o Mercado Pago da loja. Sem ele, o link vira um pedido para combinar o pagamento. <Link href="/merchant/settings#payments" className="font-semibold underline underline-offset-2">Conectar o Mercado Pago</Link></p> : null}
      {rows.length === 0 ? <EmptyState icon={FileText} title={commerce ? "Nenhum link de pagamento ainda" : "Nenhuma proposta ainda"} description="Em Novo pedido, monte os itens e use “Gerar proposta” para enviar um link ao cliente." /> : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div><div className="font-medium">{p.customerName}</div><div className="text-xs text-muted-foreground">{formatDateTime(p.createdAt)} · válida até {formatDateTime(p.expiresAt)}</div></div>
                <div className="tabular-nums">{formatBRL(p.subtotalCents)}</div>
                <div className="text-xs">{p.expired ? "Expirada" : LABEL[p.status]}</div>
                <ProposalRowActions id={p.id} token={p.token} slug={session.store!.slug} canCancel={p.status === "OPEN" && !p.expired} whatsapp={p.customerPhone} cliente={p.customerName} loja={session.store!.name} />
              </li>
          ))}
        </ul>
      )}
    </>
  );
}
