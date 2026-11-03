"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Contagem regressiva da Black NextLevel (D229). O servidor manda o fim real (igual para todos, nunca reinicia);
 * aqui só se conta. Leitor de tela recebe o tempo por minuto (não a cada segundo). Ao zerar, a página recarrega e o
 * servidor já mostra o preço novo.
 */
const partes = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86_400), h: Math.floor((s % 86_400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};
const dois = (n: number) => String(n).padStart(2, "0");

export function ContagemRegressiva({ fim, restanteMs, tamanho = "md", rotulo = "Termina em" }: { fim: string; restanteMs: number; tamanho?: "sm" | "md" | "lg"; rotulo?: string }) {
  const router = useRouter();
  const [ms, setMs] = React.useState(restanteMs);
  React.useEffect(() => {
    const alvo = Date.parse(fim);
    const tick = () => {
      const r = alvo - Date.now();
      setMs(r);
      if (r <= 0) { clearInterval(id); router.refresh(); }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [fim, router]);
  const p = partes(ms);
  if (ms <= 0) return <span className={`bk-contagem bk-contagem--${tamanho}`}>Encerrada</span>;
  const ultima = ms <= 3_600_000;
  return (
    <span className={`bk-contagem bk-contagem--${tamanho}${ultima ? " bk-contagem--ultima" : ""}`} role="timer">
      {rotulo ? <span className="bk-contagem-rotulo">{ultima ? "Últimos minutos" : rotulo}</span> : null}
      <span className="bk-contagem-blocos" aria-hidden>
        {p.d > 0 ? <span className="bk-bloco"><b>{dois(p.d)}</b><i>d</i></span> : null}
        <span className="bk-bloco"><b>{dois(p.h)}</b><i>h</i></span>
        <span className="bk-bloco"><b>{dois(p.m)}</b><i>m</i></span>
        <span className="bk-bloco"><b>{dois(p.s)}</b><i>s</i></span>
      </span>
      <span className="sr-only">{`${rotulo}: ${p.d} dias, ${p.h} horas e ${p.m} minutos`}</span>
    </span>
  );
}
