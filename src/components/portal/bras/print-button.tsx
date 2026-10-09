"use client";
import { Printer } from "lucide-react";

/** Imprimir a página (o CSS de impressão esconde menu e botões). */
export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return <button type="button" className="ds-btn" onClick={() => window.print()}><Printer className="size-4" aria-hidden />{label}</button>;
}
