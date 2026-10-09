import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { BRAS_REQUEST_LABEL, listMyBrasRequests, type BrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TONE: Record<BrasRequestStatus, "info" | "warning" | "success" | "neutral" | "danger"> = { NEW: "info", CONFIRMED: "warning", PAID: "success", PICKED_UP: "neutral", CANCELED: "danger" };
const NEXT_STEP: Record<BrasRequestStatus, string> = {
  NEW: "A equipe vai confirmar as caixas e o pagamento com você pelo WhatsApp.",
  CONFIRMED: "Confirmado. Faça o pagamento combinado com a equipe.",
  PAID: "Pago. Envie a sua transportadora para retirar no Brás.",
  PICKED_UP: "Retirado pela transportadora.",
  CANCELED: "Pedido cancelado.",
};

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ enviado?: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const rows = await listMyBrasRequests(await getDb(), session.actor);
  const enviado = (await searchParams).enviado === "1";
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Meus pedidos" description="Acompanhe cada pedido. Dúvida, troca ou problema na retirada: fale com a equipe da Brás Digital." />
      {enviado ? <p role="status" className="mb-6 rounded-lg bg-success-soft px-4 py-3 text-sm text-success">Pedido enviado. A equipe da Brás Digital vai falar com você pelo WhatsApp para confirmar.</p> : null}
      {rows.length === 0 ? <EmptyState icon={ReceiptText} title="Nenhum pedido ainda" description="Escolha um produto pelo vídeo e toque em Quero comprar." action={<Link href="/meu-bras/videos" className="ds-btn">Ver produtos</Link>} /> : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const wa = brasWhatsappUrl(`Olá! Sobre o meu pedido ${r.number} na Brás Digital (${r.boxes} caixa(s) de ${r.productTitle}).`);
            return (
              <li key={r.id} className="ds-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 font-semibold"><span className="tabular-nums">Pedido {r.number}</span><Badge tone={TONE[r.status]}>{BRAS_REQUEST_LABEL[r.status]}</Badge></p>
                  <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                </div>
                <p className="mt-1">{r.boxes} caixa(s) de <b>{r.productTitle}</b></p>
                <p className="tabular-nums text-sm text-muted-foreground">{formatBRL(r.priceBoxCents)} a caixa · total {formatBRL(r.totalCents)} · retirada por {r.carrier}</p>
                <p className="text-sm">{r.importerName ? <>Retirar na importadora: <b>{r.importerName}</b></> : "Importadora parceira: o nome aparece quando o pedido for confirmado."}</p>
                <p className="mt-2 text-sm">{NEXT_STEP[r.status]}</p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {r.status === "CONFIRMED" || r.status === "PAID" || r.status === "PICKED_UP" ? <Link href={`/meu-bras/pedidos/${r.id}/retirada`} className="font-semibold text-link underline">Comprovante de retirada{r.pickupCode ? ` (${r.pickupCode})` : ""}</Link> : null}
                  {wa && r.status !== "CANCELED" && r.status !== "PICKED_UP" ? <a href={wa} target="_blank" rel="noreferrer" className="font-semibold text-link underline">Falar com a equipe sobre este pedido</a> : null}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
