import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getNlOrder, NL_STATUS_LABEL } from "@/lib/domain/nl-sales";
import { NotFoundError } from "@/lib/domain/errors";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { CrmOrderActions } from "../crm-client";

export const dynamic = "force-dynamic";

export default async function CrmOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { id } = await params;
  let data;
  try { data = await getNlOrder(await getDb(), session.actor, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const { order: o, notes } = data;
  const wa = `https://wa.me/${o.buyerPhone.startsWith("55") ? o.buyerPhone : `55${o.buyerPhone}`}?text=${encodeURIComponent(`Olá, ${o.buyerName.split(" ")[0]}! Aqui é da NextLevel, sobre o seu pedido #${o.number} (${o.productName}).`)}`;
  return (
    <>
      <Link href="/master/crm" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> Voltar ao funil</Link>
      <PageHeader title={`Pedido #${o.number} · ${o.productName}`} description={`${NL_STATUS_LABEL[o.status]} · criado em ${formatDateTime(o.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardContent className="space-y-4 pt-4">
            <CrmOrderActions id={o.id} status={o.status} />
          </CardContent></Card>
          <section>
            <SectionTitle title="Histórico" />
            <ul className="space-y-2" data-testid="crm-notes">
              {[...notes].reverse().map((n) => (
                <li key={n.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                  <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{n.kind === "NOTE" ? "Anotação" : n.kind === "STATUS" ? "Etapa" : "Sistema"}</span><span>{formatDateTime(n.createdAt)}</span></div>
                  <p className="mt-1">{n.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="space-y-4">
          <Card><CardContent className="space-y-2 pt-4 text-sm">
            <h3 className="font-semibold">Cliente</h3>
            <p>{o.buyerName}</p>
            <p><a className="text-accent-foreground hover:underline" href={`mailto:${o.buyerEmail}`}>{o.buyerEmail}</a></p>
            <p className="tabular-nums">{o.buyerPhone}</p>
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-success px-3 text-sm font-semibold text-canvas hover:opacity-90"><MessageCircle className="size-4" aria-hidden /> Chamar no WhatsApp</a>
          </CardContent></Card>
          <Card><CardContent className="space-y-1 pt-4 text-sm">
            <h3 className="font-semibold">Pagamento</h3>
            <p>{o.method === "PIX" ? "Pix" : "Cartão em até 6x"} · <b className="tabular-nums">{formatBRL(o.chargedCents)}</b></p>
            {o.chargedCents !== o.listCents ? <p className="text-xs text-muted-foreground">Preço cheio {formatBRL(o.listCents)} · desconto Pix aplicado</p> : null}
            <p className="text-xs text-muted-foreground">{o.paidAt ? `Pago em ${formatDateTime(o.paidAt)}` : "Ainda sem pagamento"}</p>
            {o.affiliateRef ? <p className="text-xs text-muted-foreground">Indicação: {o.affiliateRef}</p> : null}
          </CardContent></Card>
        </aside>
      </div>
    </>
  );
}
