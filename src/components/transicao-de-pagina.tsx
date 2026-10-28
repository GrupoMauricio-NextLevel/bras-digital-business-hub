"use client";
import * as React from "react";
import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Transição entre páginas (D193): a página que sai desfoca e some rápido; a nova sobe e ganha nitidez. Usa a View
 * Transitions API do navegador pelo <ViewTransition> do React (sem biblioteca). A chave é o endereço: só a troca de
 * página anima; atualizar a mesma página (salvar um formulário) não. Sem suporte ou com movimento reduzido, nada anima.
 */
export function TransicaoDePagina({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  return <ViewTransition key={caminho} enter="pagina-entra" exit="pagina-sai" default="none">{children}</ViewTransition>;
}

/**
 * Linha de progresso no topo: aparece no clique de um link interno e completa quando a página nova chega. Dá a
 * resposta imediata ao clique, mesmo quando o servidor demora.
 */
export function BarraDeNavegacao() {
  const caminho = usePathname();
  const [estado, setEstado] = React.useState<"parada" | "indo" | "chegou">("parada");
  const anterior = React.useRef(caminho);
  React.useEffect(() => {
    const clique = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      setEstado("indo");
    };
    document.addEventListener("click", clique, true);
    return () => document.removeEventListener("click", clique, true);
  }, []);
  React.useEffect(() => {
    if (anterior.current === caminho) return;
    anterior.current = caminho;
    const t1 = setTimeout(() => setEstado("chegou"), 0);
    const t2 = setTimeout(() => setEstado("parada"), 450);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [caminho]);
  return <div aria-hidden className="nl-barra-nav" data-estado={estado} />;
}
