"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelProposalAction } from "@/app/actions/proposals";

export function ProposalRowActions({ id, token, slug, canCancel, whatsapp, cliente, loja }: { id: string; token: string; slug: string; canCancel: boolean; whatsapp?: string | null; cliente?: string; loja?: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/store/${slug}/proposta/${token}`); toast.success("Link copiado"); }}>Copiar link</Button>
      {whatsapp && canCancel ? <Button variant="secondary" onClick={() => {
        const link = `${window.location.origin}/store/${slug}/proposta/${token}`;
        const fone = whatsapp.replace(/\D/g, "");
        const texto = `Olá, ${(cliente ?? "").split(" ")[0]}! Segue o link para conferir e pagar o seu pedido na ${loja ?? "loja"}: ${link}`;
        window.open(`https://wa.me/${fone.length <= 11 ? `55${fone}` : fone}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
      }}>Enviar no WhatsApp</Button> : null}
      {canCancel ? <Button variant="ghost" loading={pending} onClick={() => start(async () => { const r = await cancelProposalAction(id); if (r.ok) { toast.success("Proposta cancelada"); router.refresh(); } else toast.error(r.error); })}>Cancelar</Button> : null}
    </div>
  );
}
