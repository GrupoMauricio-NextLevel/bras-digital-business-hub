"use client";
import * as React from "react";
import Link from "next/link";
import { Copy } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Faixa da Black na vitrine do lojista (D242): preto, cupom real para copiar e contagem até a data que o lojista escolheu.
 * Quando o prazo acaba, some sozinha (a página volta sem a faixa no próximo carregamento).
 */
export function FaixaBlackLoja({ fim, restanteMs, codigo, percentual, catalogo }: { fim: string; restanteMs: number; codigo: string; percentual: number; catalogo: string }) {
  const alvo = Date.parse(fim);
  const [falta, setFalta] = React.useState(restanteMs);
  const [copiado, setCopiado] = React.useState(false);
  React.useEffect(() => { const t = setInterval(() => setFalta(Math.max(0, alvo - Date.now())), 1000); return () => clearInterval(t); }, [alvo]);
  if (falta <= 0) return null;
  const d = Math.floor(falta / 86_400_000), h = Math.floor((falta % 86_400_000) / 3_600_000), m = Math.floor((falta % 3_600_000) / 60_000), s = Math.floor((falta % 60_000) / 1000);
  const copiar = () => { void navigator.clipboard?.writeText(codigo).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1800); }); };
  return (
    <div className="bg-neutral-950 px-3 py-2 text-white" data-black-loja>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm">
        <Link href={catalogo} className="font-bold tracking-wide"><span className="text-[#22e08a]">BLACK FRIDAY</span> · {percentual}% OFF</Link>
        <button type="button" onClick={copiar} className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-2 py-0.5 font-mono text-xs" aria-label={`Copiar o cupom ${codigo}`}>
          {copiado ? "Copiado!" : <>cupom <b>{codigo}</b><Copy className="size-3" aria-hidden /></>}
        </button>
        <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums" role="timer" aria-label={`Termina em ${d} dias, ${h} horas e ${m} minutos`}>
          termina em {d > 0 ? <b>{d}d</b> : null}<b>{pad(h)}h</b><b>{pad(m)}m</b><b>{pad(s)}s</b>
        </span>
      </div>
    </div>
  );
}
