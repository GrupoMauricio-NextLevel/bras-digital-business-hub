"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Quem pediu menos movimento no aparelho não recebe parallax nem animação por rolagem. */
function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches); on();
    m.addEventListener("change", on); return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Destaque em camadas (N3): escreve variáveis CSS no elemento e as camadas se movem só com `transform`
 * (sem recalcular layout). `--px`/`--py`: posição do mouse de −1 a 1; `--sp`: quanto o destaque já subiu na tela (0 a 1).
 */
export function LayerMotion({ enabled, className, children, ...rest }: { enabled: boolean; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  React.useEffect(() => {
    const el = ref.current; if (!el || !enabled || reduced) return;
    let frame = 0; let px = 0; let py = 0;
    const paint = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const sp = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      el.style.setProperty("--px", px.toFixed(3)); el.style.setProperty("--py", py.toFixed(3)); el.style.setProperty("--sp", sp.toFixed(3));
    };
    const ask = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const move = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; const r = el.getBoundingClientRect(); px = ((e.clientX - r.left) / r.width) * 2 - 1; py = ((e.clientY - r.top) / r.height) * 2 - 1; ask(); };
    const leave = () => { px = 0; py = 0; ask(); };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", ask, { passive: true }); ask();
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); window.removeEventListener("scroll", ask); if (frame) cancelAnimationFrame(frame); };
  }, [enabled, reduced]);
  return <section ref={ref} className={className} data-motion={enabled && !reduced ? "on" : "off"} {...rest}>{children}</section>;
}

/**
 * Destaque imersivo (N4): a seção é mais alta que a tela e o quadro fica preso enquanto o cliente rola; a rolagem
 * escolhe o passo (quadro e texto) e move as camadas. Sem JavaScript ou com menos movimento: um quadro só, parado,
 * mostrando o último texto (o que tem a chamada para comprar).
 */
export function ImmersiveScroll({ steps, className, children, onStep, ...rest }: { steps: number; className?: string; children: React.ReactNode; /** Avisa o passo atual (ex.: a régua da jornada de Soluções). */ onStep?: (step: number, live: boolean) => void } & React.HTMLAttributes<HTMLElement>) {
  const ref = React.useRef<HTMLElement>(null);
  const aviso = React.useRef(onStep);
  React.useEffect(() => { aviso.current = onStep; });
  const reduced = useReducedMotion();
  const [live, setLive] = React.useState(false);
  const [step, setStep] = React.useState(steps - 1);
  React.useEffect(() => {
    const el = ref.current; if (!el || reduced || steps < 1) { setLive(false); setStep(steps - 1); return; }
    setLive(true);
    let frame = 0;
    const paint = () => {
      frame = 0;
      const r = el.getBoundingClientRect(); const run = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / run));
      el.style.setProperty("--p", p.toFixed(3));
      setStep(Math.min(steps - 1, Math.floor(p * steps * 0.999)));
    };
    const ask = () => { if (!frame) frame = requestAnimationFrame(paint); };
    window.addEventListener("scroll", ask, { passive: true }); window.addEventListener("resize", ask); ask();
    return () => { window.removeEventListener("scroll", ask); window.removeEventListener("resize", ask); if (frame) cancelAnimationFrame(frame); };
  }, [reduced, steps]);
  React.useEffect(() => { aviso.current?.(step, live); }, [step, live]);
  return (
    <section ref={ref} className={cn(className)} data-immersive={live ? "on" : "off"} data-step={step} style={{ ["--steps" as string]: steps }} {...rest}>
      {children}
    </section>
  );
}
