"use client";

import * as React from "react";

/**
 * Foto neutra das páginas "não encontrada" e "algo deu errado" (todas as marcas): uma caixa vazia, calma
 * (`public/portal/nextlevel/v3/erro-caixa-vazia`). Decorativa (o texto ao lado explica). É cliente porque a página de erro
 * também é; se o arquivo faltar ou não carregar, some sem deixar imagem quebrada.
 */
export function FotoErro() {
  const [falhou, setFalhou] = React.useState(false);
  const conferir = React.useCallback((img: HTMLImageElement | null) => { if (img?.complete && img.naturalWidth === 0) setFalhou(true); }, []);
  if (falhou) return null;
  const base = "/portal/nextlevel/v3/erro-caixa-vazia";
  return (
    <picture className="mx-auto mb-6 block aspect-[4/3] w-full max-w-xs overflow-hidden rounded-2xl" data-img="erro-caixa-vazia">
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img ref={conferir} src={`${base}.png`} alt="" width={1448} height={1086} decoding="async" onError={() => setFalhou(true)} className="size-full object-cover" />
    </picture>
  );
}
