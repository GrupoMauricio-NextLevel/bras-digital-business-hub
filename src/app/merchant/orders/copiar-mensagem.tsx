"use client";
import { Copy } from "lucide-react";
import { toast } from "sonner";

/** Sem WhatsApp do cliente no pedido (D208): copia a mensagem pronta para colar onde o lojista conversa com ele. */
export function CopiarMensagem({ texto }: { texto: string }) {
  const copiar = async () => { try { await navigator.clipboard.writeText(texto); toast.success("Mensagem copiada"); } catch { toast.error("Não foi possível copiar."); } };
  return <button type="button" onClick={copiar} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ds-link)]"><Copy className="size-3.5" aria-hidden />Copiar mensagem</button>;
}
