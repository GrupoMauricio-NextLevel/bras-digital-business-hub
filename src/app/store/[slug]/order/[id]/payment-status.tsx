"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2 } from "lucide-react";
import { refreshOrderPaymentAction } from "@/app/actions/storefront";

/** Enquanto o pagamento está pendente, consulta o Mercado Pago a cada 5s (máx. 10 min) e atualiza a página. */
export function PaymentWatcher({ slug, orderId, checkoutUrl, expiresAt }: { slug: string; orderId: string; checkoutUrl: string | null; expiresAt: string | null }) {
  const router = useRouter();
  React.useEffect(() => {
    let tries = 0;
    const id = setInterval(async () => {
      tries++;
      const r = await refreshOrderPaymentAction(slug, orderId);
      if ((r.ok && r.data.paid) || tries > 120) { clearInterval(id); router.refresh(); }
    }, 5000);
    return () => clearInterval(id);
  }, [slug, orderId, router]);
  return (
    <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
      <div className="flex items-center gap-2 font-semibold"><Clock className="size-4" /> Aguardando a confirmação do pagamento</div>
      <p className="mt-1 text-amber-900/80">Assim que o Mercado Pago aprovar, esta página atualiza sozinha.{expiresAt ? ` Reserva garantida até ${new Date(expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : ""}</p>
      {checkoutUrl ? <a href={checkoutUrl} className="mt-3 inline-flex h-10 items-center rounded-lg bg-amber-900 px-4 font-medium text-white">Pagar agora</a> : null}
    </div>
  );
}

export function PaidBanner() {
  return <div className="mt-6 flex items-center gap-2 rounded-2xl border border-green-300 bg-green-50 p-4 text-sm font-medium text-green-900"><CheckCircle2 className="size-4" /> Pagamento aprovado</div>;
}
