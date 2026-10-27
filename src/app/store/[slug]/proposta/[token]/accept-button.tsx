"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { acceptProposalAction } from "@/app/actions/proposals";

export function AcceptButton({ token, slug, pagar = false }: { token: string; slug: string; pagar?: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="mt-6">
      <button type="button" disabled={pending} className="h-12 w-full rounded-full px-6 font-semibold text-white disabled:opacity-60" style={{ background: "var(--sf-accent, #111)" }}
        onClick={() => start(async () => { setError(null); const r = await acceptProposalAction(token); if (!r.ok) setError(r.error); else if (r.data.checkoutUrl) window.location.href = r.data.checkoutUrl; else router.push(`/store/${slug}/order/${r.data.orderId}`); })}>
        {pending ? (pagar ? "Abrindo o pagamento…" : "Aceitando…") : pagar ? "Aceitar e pagar" : "Aceitar proposta e reservar"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
