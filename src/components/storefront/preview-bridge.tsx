"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

type Box = { top: number; left: number; width: number; height: number };
const sel = (id: string) => `[data-section-id="${CSS.escape(id)}"]`;

/** Soma das áreas dos filhos: o contêiner da seção usa `display: contents` e não tem caixa própria. */
function boxOf(id: string): Box | null {
  const host = document.querySelector(sel(id)); if (!host || !host.children.length) return null;
  let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity;
  for (const c of Array.from(host.children)) { const q = c.getBoundingClientRect(); if (!q.width && !q.height) continue; t = Math.min(t, q.top); l = Math.min(l, q.left); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
  return Number.isFinite(t) ? { top: t, left: l, width: r - l, height: b - t } : null;
}

/**
 * Ponte entre a loja em prévia e o editor (quando a loja está dentro de um iframe do mesmo site):
 * atualiza sem recarregar, seleciona a seção ao clicar e destaca a seção escolhida ou sob o mouse.
 */
export function PreviewBridge() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [hover, setHover] = React.useState<string | null>(null);
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  const [framed, setFramed] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setFramed(window.parent !== window)); return () => cancelAnimationFrame(id); }, []);

  React.useEffect(() => {
    if (window.parent === window) return;
    const post = (m: object) => window.parent.postMessage({ source: "nl-preview", ...m }, window.location.origin);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent || e.data?.source !== "nl-editor") return;
      if (e.data.type === "refresh") router.refresh();
      if (e.data.type === "select") { setSelected(e.data.id ?? null); if (e.data.id && e.data.scroll) document.querySelector(sel(e.data.id))?.firstElementChild?.scrollIntoView({ behavior: "smooth", block: "center" }); }
      if (e.data.type === "hover") setHover(e.data.id ?? null);
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-section-id]"); if (!el) return;
      e.preventDefault(); e.stopPropagation(); post({ type: "select", id: el.getAttribute("data-section-id") });
    };
    const onOver = (e: MouseEvent) => { const el = (e.target as Element | null)?.closest?.("[data-section-id]"); setHover(el?.getAttribute("data-section-id") ?? null); };
    const raf = () => tick();
    window.addEventListener("message", onMessage); document.addEventListener("click", onClick, true); document.addEventListener("mouseover", onOver);
    window.addEventListener("scroll", raf, { passive: true }); window.addEventListener("resize", raf);
    const iv = setInterval(raf, 400);
    post({ type: "ready" });
    return () => { window.removeEventListener("message", onMessage); document.removeEventListener("click", onClick, true); document.removeEventListener("mouseover", onOver); window.removeEventListener("scroll", raf); window.removeEventListener("resize", raf); clearInterval(iv); };
  }, [router]);

  if (!framed) return null;
  const boxes: { id: string; b: Box; kind: "selected" | "hover" }[] = [];
  if (hover && hover !== selected) { const b = boxOf(hover); if (b) boxes.push({ id: hover, b, kind: "hover" }); }
  if (selected) { const b = boxOf(selected); if (b) boxes.push({ id: selected, b, kind: "selected" }); }
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" data-preview-overlay>
      {boxes.map(({ id, b, kind }) => <div key={`${kind}-${id}`} style={{ top: b.top, left: b.left, width: b.width, height: b.height }} className={kind === "selected" ? "absolute rounded-sm outline outline-2 outline-offset-[-2px] outline-[#4338ca] bg-[#4338ca]/5" : "absolute rounded-sm outline outline-1 outline-offset-[-1px] outline-[#4338ca]/60"} />)}
    </div>
  );
}
