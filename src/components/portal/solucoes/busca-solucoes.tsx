"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { filtrarPorIntencao } from "@/lib/solucoes/intencoes";

type Item = { id: string; rotulo: string; grupo: string; href: string; termos: string[] };

/**
 * Busca por intenção do cardápio (D162), no padrão combobox da busca do tema Pódio: setas, Enter e Esc. Entende o que o
 * visitante escreve ("sair da nuvemshop", "anúncio no instagram"), não só o nome do produto. Sem resultado, sugere contar
 * no diagnóstico. Escolher leva ao cartão da solução no cardápio.
 */
export function BuscaSolucoes({ itens }: { itens: Item[] }) {
  const [q, setQ] = React.useState("");
  const [aberta, setAberta] = React.useState(false);
  const [ativo, setAtivo] = React.useState(-1);
  const achados = React.useMemo(() => filtrarPorIntencao(itens, q), [itens, q]);
  const ir = (href: string) => { setAberta(false); setQ(""); window.location.hash = href.replace(/^#/, ""); };
  const vazio = q.trim().length > 1 && !achados.length;
  return (
    <div className="relative w-full max-w-xl" role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search" value={q} placeholder="O que você precisa? Ex.: sair da Nuvemshop, anúncios no Instagram"
        role="combobox" aria-expanded={aberta && q.trim().length > 1} aria-controls="sol-busca-lista" aria-autocomplete="list" aria-label="Buscar soluções"
        aria-activedescendant={ativo >= 0 ? `sol-busca-${ativo}` : undefined}
        onChange={(e) => { setQ(e.target.value); setAberta(true); setAtivo(-1); }}
        onFocus={() => setAberta(true)} onBlur={() => setTimeout(() => setAberta(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setAtivo((a) => Math.min(achados.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((a) => Math.max(-1, a - 1)); }
          else if (e.key === "Enter") { const i = achados[ativo >= 0 ? ativo : 0]; if (i) { e.preventDefault(); ir(i.href); } else if (vazio) { e.preventDefault(); ir("#diagnostico"); } }
          else if (e.key === "Escape") { setAberta(false); setAtivo(-1); }
        }}
        className="h-14 w-full rounded-full border border-border bg-surface pl-12 pr-5 text-base text-foreground shadow-[var(--ds-shadow-sm)] placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-ring)]"
      />
      {aberta && q.trim().length > 1 ? (
        <ul id="sol-busca-lista" role="listbox" aria-label="Soluções encontradas" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-xl">
          {achados.map((i, k) => (
            <li key={i.id} id={`sol-busca-${k}`} role="option" aria-selected={k === ativo}
              onMouseDown={(e) => { e.preventDefault(); ir(i.href); }}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm ${k === ativo ? "bg-surface-muted" : ""}`}>
              <span className="font-semibold text-foreground">{i.rotulo}</span><span className="text-xs text-muted-foreground">{i.grupo}</span>
            </li>
          ))}
          {vazio ? (
            <li role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); ir("#diagnostico"); }} className="cursor-pointer px-4 py-3 text-sm">
              Não achou? <span className="font-semibold text-link underline underline-offset-2">Conte no diagnóstico gratuito</span>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
