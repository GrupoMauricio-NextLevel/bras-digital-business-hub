"use client";
import * as React from "react";

/** Palavra do título que alterna a cada poucos segundos. Com movimento reduzido fica fixa na primeira. Leitores de tela leem a lista inteira uma vez. */
export function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden className="inline-block min-w-[6ch] text-highlight"><span key={i} className={i > 0 ? "cm-word" : undefined}>{words[i]}</span></span>
    </>
  );
}
