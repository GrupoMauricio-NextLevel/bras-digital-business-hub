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
export const LIMITE_CARGA_MS = 6000;
/** Depois deste tempo, qualquer clique ou tecla da pessoa tira o carregamento (ela já seguiu em frente). */
export const INTERACAO_LIBERA_MS = 700;

/**
 * Decide se o clique num link abre o carregamento: só link interno que leva a OUTRO endereço (caminho ou parâmetros),
 * na mesma aba, sem tecla de atalho e sem download. Âncora (#) na mesma página não carrega nada.
 */
export function cliqueAbreCarga(alvo: string, atual: string, op: { botao: number; atalho: boolean; novaAba: boolean; download: boolean }): boolean {
  if (op.botao !== 0 || op.atalho || op.novaAba || op.download) return false;
  let url: URL, aqui: URL;
  try { aqui = new URL(atual); url = new URL(alvo, aqui); } catch { return false; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  return url.origin === aqui.origin && chaveDoEndereco(url.href) !== chaveDoEndereco(aqui.href);
}

type NavegacaoDoNavegador = EventTarget & { addEventListener: EventTarget["addEventListener"] };

/**
 * Linha de progresso no topo e logo da marca no centro: aparecem no clique de um link interno e somem quando a página
 * nova chega. D330: o carregamento NUNCA pode ficar preso. Ele some no primeiro destes sinais, cada um independente:
 * (1) o endereço muda (caminho ou parâmetros: pastas, filtros, abas); (2) o navegador avisa que a navegação terminou
 * ou falhou (Navigation API); (3) voltar/avançar, página restaurada do cache ou aba escondida; (4) a pessoa clica ou
 * digita de novo (ela já seguiu em frente); (5) limite de 6 segundos. Ele não bloqueia cliques (pointer-events: none).
 */
export function BarraDeNavegacao({ logo = true }: { logo?: boolean }) {
  const [estado, setEstado] = React.useState<"parada" | "indo" | "chegou">("parada");
  // Ícone da marca do endereço (o mesmo da aba do navegador), lido uma vez.
  const [icone, setIcone] = React.useState<string | null>(null);
  const inicio = React.useRef(0);
  const saida = React.useRef("");

  // Começo: clique num link interno para outro endereço.
  React.useEffect(() => {
    const clique = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const abre = cliqueAbreCarga(a.href, location.href, { botao: e.button, atalho: e.metaKey || e.ctrlKey || e.shiftKey || e.altKey, novaAba: !!a.target && a.target !== "_self", download: a.hasAttribute("download") });
      if (!abre) return;
      inicio.current = performance.now();
      saida.current = chaveDoEndereco(location.href);
      setEstado("indo");
      if (logo) setIcone((atual) => atual ?? (document.querySelector("link[rel~='icon'][type='image/png'], link[rel~='icon']") as HTMLLinkElement | null)?.href ?? null);
    };
    document.addEventListener("click", clique, true);
    return () => document.removeEventListener("click", clique, true);
  }, [logo]);

  // Fim: enquanto "indo", qualquer um dos sinais encerra. Tudo é desligado quando o estado muda (nada fica pendurado).
  React.useEffect(() => {
    if (estado !== "indo") return;
    let feito = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const encerra = () => {
      if (feito) return;
      feito = true;
      // Pedido do dono: o efeito aparece mesmo na troca rápida, no mínimo 0,42 s, e some enquanto a página sobe.
      const falta = Math.max(0, 420 - (performance.now() - inicio.current));
      timers.push(setTimeout(() => setEstado("chegou"), falta));
    };
    const confere = setInterval(() => { if (chaveDoEndereco(location.href) !== saida.current) encerra(); }, 100);
    timers.push(setTimeout(encerra, LIMITE_CARGA_MS));
    const interacao = () => { if (performance.now() - inicio.current > INTERACAO_LIBERA_MS) encerra(); };
    const escondida = () => { if (document.visibilityState === "hidden") encerra(); };
    const nav = (globalThis as { navigation?: NavegacaoDoNavegador }).navigation;
    window.addEventListener("popstate", encerra);
    window.addEventListener("pageshow", encerra);
    document.addEventListener("visibilitychange", escondida);
    document.addEventListener("pointerdown", interacao, true);
    document.addEventListener("keydown", interacao, true);
    nav?.addEventListener("navigatesuccess", encerra);
    nav?.addEventListener("navigateerror", encerra);
    return () => {
      clearInterval(confere);
      timers.forEach(clearTimeout);
      window.removeEventListener("popstate", encerra);
      window.removeEventListener("pageshow", encerra);
      document.removeEventListener("visibilitychange", escondida);
      document.removeEventListener("pointerdown", interacao, true);
      document.removeEventListener("keydown", interacao, true);
      nav?.removeEventListener("navigatesuccess", encerra);
      nav?.removeEventListener("navigateerror", encerra);
    };
  }, [estado]);
  // Saída: depois da animação de chegada, volta a ficar parado.
  React.useEffect(() => {
    if (estado !== "chegou") return;
    const t = setTimeout(() => setEstado("parada"), 480);
    return () => clearTimeout(t);
  }, [estado]);
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
