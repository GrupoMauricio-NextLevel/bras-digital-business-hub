"use client";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

/** Compartilhar a descoberta: menu do celular quando existe; senão copia o link. */
export function ShareButton({ path, title }: { path: string; title: string }) {
  return (
    <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-semibold text-[var(--bd-tinta-clara)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--bd-pulso)]" onClick={async () => {
      const url = `${location.origin}${path}`;
      try {
        if (navigator.share) await navigator.share({ title, url });
        else { await navigator.clipboard.writeText(url); toast.success("Link copiado."); }
      } catch { /* o visitante fechou o menu de compartilhar */ }
    }}><Share2 className="size-4" aria-hidden />Compartilhar esta descoberta</button>
  );
}
