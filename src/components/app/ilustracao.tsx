"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Ilustrações planas dos painéis (`public/ilustracoes/v1/`, lista e uso no MANIFESTO.md da pasta). */
export type IlustracaoNome =
  | "ui-vazio-pedidos" | "ui-vazio-produtos" | "ui-vazio-campanhas" | "ui-vazio-expedicao" | "ui-vazio-indicados" | "ui-vazio-descobertas"
  | "ui-boas-vindas-loja"
  | "ui-fase-fundacao" | "ui-fase-lancamento" | "ui-fase-aquisicao" | "ui-fase-otimizacao" | "ui-fase-escala";

/**
 * Ilustração decorativa (alt vazio: o texto ao lado já explica). WebP com transparência e o PNG original como reserva.
 * Se o arquivo faltar ou não carregar, mostra `fallback` (o ícone de antes) ou nada: a tela nunca fica com imagem quebrada.
 */
export function Ilustracao({ nome, className, fallback = null, priority = false }: { nome: IlustracaoNome; className?: string; fallback?: React.ReactNode; priority?: boolean }) {
  const [falhou, setFalhou] = React.useState(false);
  // A imagem pode falhar antes de o React ligar o onError (página vinda do servidor): confere ao montar.
  const conferir = React.useCallback((img: HTMLImageElement | null) => { if (img?.complete && img.naturalWidth === 0) setFalhou(true); }, []);
  if (falhou) return <>{fallback}</>;
  return (
    <picture className={cn("block shrink-0", className)} data-ilustracao={nome}>
      <source srcSet={`/ilustracoes/v1/${nome}.webp`} type="image/webp" />
      <img ref={conferir} src={`/ilustracoes/v1/${nome}.png`} alt="" width={1024} height={1024} loading={priority ? "eager" : "lazy"} decoding="async" onError={() => setFalhou(true)} className="size-full object-contain" />
    </picture>
  );
}
