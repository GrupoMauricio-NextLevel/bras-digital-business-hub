"use client";
import { podeConsultar } from "@/lib/atividade-cliente";
import * as React from "react";
import { useRouter } from "next/navigation";

/** Atualiza a tela do servidor sozinha (sem recarregar a página) enquanto a aba está visível e alguém está mexendo nela. */
export function AoVivo({ segundos = 15 }: { segundos?: number }) {
  const router = useRouter();
  React.useEffect(() => {
    const t = setInterval(() => { if (podeConsultar()) router.refresh(); }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span aria-hidden className="cm-live-dot size-2 rounded-full bg-[var(--ds-success)]" />ao vivo</span>;
}
