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
export function BarraDeNavegacao({ logo = true }: { logo?: boolean }) {
  const caminho = usePathname();
  const [estado, setEstado] = React.useState<"parada" | "indo" | "chegou">("parada");
  // Ícone da marca do endereço (o mesmo da aba do navegador), lido uma vez.
  const [icone, setIcone] = React.useState<string | null>(null);
  const anterior = React.useRef(caminho);
  const inicio = React.useRef(0);
  React.useEffect(() => {
    const clique = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      inicio.current = performance.now();
      setEstado("indo");
      if (logo && !icone) setIcone((document.querySelector("link[rel~='icon'][type='image/png'], link[rel~='icon']") as HTMLLinkElement | null)?.href ?? null);
    };
    document.addEventListener("click", clique, true);
    return () => document.removeEventListener("click", clique, true);
  }, [logo, icone]);
  React.useEffect(() => {
    if (anterior.current === caminho) return;
    anterior.current = caminho;
    // Pedido do dono: o efeito aparece mesmo na troca rápida. Ele fica no mínimo 0,42 s e some enquanto a página sobe.
    const falta = inicio.current ? Math.max(0, 420 - (performance.now() - inicio.current)) : 0;
    const t1 = setTimeout(() => setEstado("chegou"), falta);
    const t2 = setTimeout(() => setEstado("parada"), falta + 480);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [caminho]);
  // Toda troca de página: o logo da marca aparece no centro com o arco girando e some quando a página nova sobe.
  return (
    <>
      <div aria-hidden className="nl-barra-nav" data-estado={estado} />
      <div aria-hidden className="nl-carga" data-estado={estado}>
        <span className="nl-carga-anel">{/* eslint-disable-next-line @next/next/no-img-element -- ícone da aba, já em cache */}
          {logo && icone ? <img src={icone} alt="" width={44} height={44} /> : <span className="nl-degraus"><i /><i /><i /></span>}</span>
      </div>
    </>
  );
}
