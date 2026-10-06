import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { getDb } from "@/db/client";
import { getNlOrderByToken, NL_STATUS_LABEL } from "@/lib/domain/nl-sales";
import { PayPanel } from "@/components/nextlevel-shop/pay-panel";
import { supportContacts } from "@/lib/support";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import type { NlOrderStatus } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false, follow: false } };

const STEPS: { status: NlOrderStatus; label: string }[] = [
  { status: "AWAITING_PAYMENT", label: "Pedido criado" },
  { status: "PAID", label: "Pagamento confirmado" },
  { status: "CONTACTED", label: "Equipe em contato" },
  { status: "IN_PROGRESS", label: "Em execução" },
  { status: "DELIVERED", label: "Entregue" },
];

export default async function PedidoNextLevel({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getNlOrderByToken(await getDb(), token);
  if (!found) notFound();
  const { order: o, deliverable } = found;
  const idx = STEPS.findIndex((s) => s.status === o.status);
  const c = supportContacts();
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <p className="text-sm font-semibold text-link">Pedido #{o.number}</p>
      <h1 className="mt-1 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">{o.productName}</h1>
      <p className="mt-2 text-muted-foreground">{o.buyerName} · {formatBRL(o.chargedCents)} · {o.method === "PIX" ? "Pix" : "cartão"} · {formatDateTime(o.createdAt)}</p>

      {o.status === "CANCELED" ? <p className="mt-8 rounded-xl border border-border bg-surface-muted p-5">Este pedido foi cancelado. Se foi engano, faça uma nova compra na <Link href="/loja-nextlevel" className="font-semibold underline">Loja NextLevel</Link>.</p> : (
        <>
          <ol className="mt-8 space-y-3" aria-label="Andamento do pedido">
            {STEPS.map((s, n) => (
              <li key={s.status} className={`flex items-center gap-3 ${n <= idx ? "text-foreground" : "text-muted-foreground"}`}>
                {n <= idx ? <CheckCircle2 className="size-5 text-link" aria-hidden /> : <Circle className="size-5" aria-hidden />}
                <span className={n === idx ? "font-semibold" : ""}>{s.label}</span>
                {n === idx ? <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-link">agora</span> : null}
              </li>
            ))}
          </ol>
          {o.status === "AWAITING_PAYMENT" ? (
            <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-lg font-bold">Falta o pagamento</h2>
              <PayPanel pay={{ token: o.token, method: o.method, chargedCents: o.chargedCents, pixCode: o.pixCode ?? undefined, pixQrBase64: o.pixQrBase64 ?? undefined, checkoutUrl: o.checkoutUrl ?? undefined, demo: !!o.mpPaymentId?.startsWith("demo_") }} />
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-primary/30 bg-success-soft p-6">
              <h2 className="text-lg font-bold">{o.status === "DELIVERED" ? "Pedido entregue" : "Pagamento recebido. Obrigado!"}</h2>
              <p className="mt-2 text-sm text-body">{deliverable}</p>
              <p className="mt-2 text-xs text-muted-foreground">Situação atual: {NL_STATUS_LABEL[o.status]}.</p>
            </div>
          )}
        </>
      )}
      {c.whatsappUrl ? <p className="mt-8 text-sm text-muted-foreground">Dúvidas? <a className="font-semibold text-link underline" href={c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Sobre o meu pedido #${o.number} da Loja NextLevel.`)}`)} target="_blank" rel="noreferrer">Fale com a equipe no WhatsApp</a>.</p> : c.email ? <p className="mt-8 text-sm text-muted-foreground">Dúvidas? Escreva para <a className="font-semibold underline" href={`mailto:${c.email}`}>{c.email}</a>.</p> : null}
    </div>
  );
}
