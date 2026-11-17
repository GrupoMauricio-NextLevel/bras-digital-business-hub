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

/** Loja do lojista: sem View Transition (nada aparece por cima do carregamento sólido); a página nova sobe por CSS. */
export function EntradaDaLoja({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  return <div key={caminho} className="nl-pagina-sobe">{children}</div>;
}

/** Endereço sem a âncora (#): é o que muda quando a página nova chega, inclusive filtros e pastas (?pasta=...). */
export function chaveDoEndereco(href: string): string {
  const u = new URL(href, "http://x");
  return u.pathname + u.search;
}

/** Tempo máximo do carregamento na tela: se a navegação foi cancelada ou caiu no mesmo endereço, ele some sozinho. */
export const LIMITE_CARGA_MS = 8000;

/**
 * Linha de progresso no topo: aparece no clique de um link interno e completa quando a página nova chega. Dá a
 * resposta imediata ao clique, mesmo quando o servidor demora. A chegada é o endereço mudar (caminho OU parâmetros,
 * D327: antes só o caminho, e o logo ficava girando para sempre em pastas e filtros); há ainda um limite de tempo e
 * a volta pelo histórico, para nunca ficar preso.
 */
export function BarraDeNavegacao({ logo = true }: { logo?: boolean }) {
  const caminho = usePathname();
  const [estado, setEstado] = React.useState<"parada" | "indo" | "chegou">("parada");
  // Ícone da marca do endereço (o mesmo da aba do navegador), lido uma vez.
  const [icone, setIcone] = React.useState<string | null>(null);
  const inicio = React.useRef(0);
  const saida = React.useRef("");
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const limpar = React.useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  // Página nova chegou: fica no mínimo 0,42 s (pedido do dono, o efeito aparece mesmo na troca rápida) e some subindo.
  const chegou = React.useCallback(() => {
    limpar();
    const falta = inicio.current ? Math.max(0, 420 - (performance.now() - inicio.current)) : 0;
    inicio.current = 0;
    timers.current.push(setTimeout(() => setEstado("chegou"), falta), setTimeout(() => setEstado("parada"), falta + 480));
  }, [limpar]);

  React.useEffect(() => {
    const clique = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || chaveDoEndereco(url.href) === chaveDoEndereco(location.href)) return;
      limpar();
      inicio.current = performance.now();
      saida.current = chaveDoEndereco(location.href);
      setEstado("indo");
      if (logo && !icone) setIcone((document.querySelector("link[rel~='icon'][type='image/png'], link[rel~='icon']") as HTMLLinkElement | null)?.href ?? null);
      // Confere o endereço até a página nova chegar; desiste no limite (navegação cancelada ou redirecionada para cá).
      const confere = setInterval(() => {
        if (!inicio.current) return clearInterval(confere);
        if (chaveDoEndereco(location.href) !== saida.current) { clearInterval(confere); chegou(); }
        else if (performance.now() - inicio.current > LIMITE_CARGA_MS) { clearInterval(confere); chegou(); }
      }, 120);
    };
    // Voltar/avançar no navegador ou página restaurada do cache: nada de carregamento preso.
    const desfaz = () => { if (inicio.current) chegou(); };
    document.addEventListener("click", clique, true);
    window.addEventListener("popstate", desfaz);
    window.addEventListener("pageshow", desfaz);
    return () => { document.removeEventListener("click", clique, true); window.removeEventListener("popstate", desfaz); window.removeEventListener("pageshow", desfaz); };
  }, [logo, icone, chegou, limpar]);
  // Mudança de caminho percebida pelo React (chega antes da conferência do endereço).
  const anterior = React.useRef(caminho);
  React.useEffect(() => {
    if (anterior.current === caminho) return;
    anterior.current = caminho;
    if (inicio.current) chegou();
  }, [caminho, chegou]);
  React.useEffect(() => limpar, [limpar]);
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
