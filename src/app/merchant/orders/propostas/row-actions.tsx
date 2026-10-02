"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelProposalAction } from "@/app/actions/proposals";

export function ProposalRowActions({ id, token, slug, canCancel }: { id: string; token: string; slug: string; canCancel: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/store/${slug}/proposta/${token}`); toast.success("Link copiado"); }}>Copiar link</Button>
      {canCancel ? <Button variant="ghost" loading={pending} onClick={() => start(async () => { const r = await cancelProposalAction(id); if (r.ok) { toast.success("Proposta cancelada"); router.refresh(); } else toast.error(r.error); })}>Cancelar</Button> : null}
    </div>
  );
}
