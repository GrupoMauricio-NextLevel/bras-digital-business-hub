"use client";
import * as React from "react";

/**
 * Enquanto o herói escuro está sob o cabeçalho, o cabeçalho público fica na mesma cor do herói (sem o "topo em duas
 * cores"). O estado inicial vem só do CSS (`:has([data-heroi-escuro])`), sem piscar; este observador só marca
 * `data-heroi-passou` no <html> quando o herói sai de baixo do cabeçalho, e limpa ao sair da página.
 */
export function CabecalhoSobreHeroi({ alvo }: { alvo: string }) {
  React.useEffect(() => {
    const el = document.getElementById(alvo);
    const root = document.documentElement;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) delete root.dataset.heroiPassou;
      else root.dataset.heroiPassou = "";
    }, { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
    io.observe(el);
    return () => { io.disconnect(); delete root.dataset.heroiPassou; };
  }, [alvo]);
  return null;
}
