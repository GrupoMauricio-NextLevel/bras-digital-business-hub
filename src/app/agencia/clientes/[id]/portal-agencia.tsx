"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { responderSolicitacaoAction } from "@/app/actions/agencias";
import { Button } from "@/components/ui/button";

/** Link do portal do cliente (D320) para mandar pelo WhatsApp. */
export function CopiarLinkPortal({ url }: { url: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="max-w-full truncate rounded bg-surface-muted px-2 py-1 text-xs">{url}</code>
      <Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(url); toast.success("Link copiado."); } catch { toast.error("Não deu para copiar; selecione o link."); } }}>Copiar link</Button>
    </div>
  );
}

/** Resposta da agência a um pedido do portal: o cliente vê a resposta lá. */
export function ResponderSolicitacao({ id, situacao }: { id: string; situacao: "ABERTA" | "EM_ANDAMENTO" | "RESPONDIDA" }) {
  const router = useRouter();
  const [texto, setTexto] = React.useState("");
  const [pending, start] = React.useTransition();
  const enviar = (s: "EM_ANDAMENTO" | "RESPONDIDA") => start(async () => { const r = await responderSolicitacaoAction(id, { situacao: s, resposta: texto.trim() || undefined }); if (r.ok) { toast.success(s === "RESPONDIDA" ? "Resposta enviada ao portal." : "Marcado como em andamento."); setTexto(""); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="mt-2 space-y-2">
      <label className="block text-xs font-medium">Resposta para o cliente<textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" /></label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={pending} disabled={texto.trim().length < 2} onClick={() => enviar("RESPONDIDA")}>Responder</Button>
        {situacao === "ABERTA" ? <Button size="sm" variant="secondary" loading={pending} onClick={() => enviar("EM_ANDAMENTO")}>Em andamento</Button> : null}
      </div>
    </div>
  );
}
