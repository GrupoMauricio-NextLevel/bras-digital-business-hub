"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { acceptProposalAction } from "@/app/actions/proposals";

export function AcceptButton({ token, slug }: { token: string; slug: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="mt-6">
      <button type="button" disabled={pending} className="h-12 w-full rounded-full px-6 font-semibold text-white disabled:opacity-60" style={{ background: "var(--sf-accent, #111)" }}
        onClick={() => start(async () => { setError(null); const r = await acceptProposalAction(token); if (r.ok) router.push(`/store/${slug}/order/${r.data.orderId}`); else setError(r.error); })}>
        {pending ? "Aceitando…" : "Aceitar proposta e reservar"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
