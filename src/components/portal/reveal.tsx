"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Revela o conteúdo ao entrar na tela (uma vez; 500 ms, sobe 14 px, intervalo limitado a 320 ms: escala D155). Sem JavaScript, ou com "reduzir movimento",
 * o conteúdo já nasce visível (nada fica escondido para leitores ou buscadores).
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "article" }) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [state, setState] = React.useState<"visible" | "hidden" | "shown">("visible");
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    const raf = requestAnimationFrame(() => setState("hidden"));
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setState("shown"); io.disconnect(); } }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);
  return (
    <Tag ref={ref as never} style={{ transitionDelay: state === "shown" ? `${Math.min(delay, 320)}ms` : undefined }} className={cn("transition-[opacity,transform] duration-[var(--ds-dur-enter)] ease-[var(--ds-ease-out)]", state === "hidden" && "translate-y-[var(--ds-rise)] opacity-0", className)}>
      {children}
    </Tag>
  );
}
