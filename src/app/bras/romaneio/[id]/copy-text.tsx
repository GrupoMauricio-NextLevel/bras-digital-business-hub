"use client";
import { Copy } from "lucide-react";
import { toast } from "sonner";

/** Copia o romaneio em texto para colar no WhatsApp da importadora. */
export function CopyText({ text }: { text: string }) {
  return <button type="button" className="ds-btn ds-btn--secondary" onClick={async () => { try { await navigator.clipboard.writeText(text); toast.success("Romaneio copiado. Cole no WhatsApp da importadora."); } catch { toast.error("Não deu para copiar."); } }}><Copy className="size-4" aria-hidden />Copiar texto para o WhatsApp</button>;
}
