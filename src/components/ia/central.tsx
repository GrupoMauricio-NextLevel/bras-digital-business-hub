import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import type { MauricioDaLoja } from "@/lib/domain/ia";
import { GRUPOS_IA, type GrupoIa } from "@/lib/ia/ferramentas";
import { SeloIa } from "./mauricio";

/** Central do Maurício em cartões (IA0, D194): cada ferramenta com o estado do plano e o exemplo gravado. */
export function CentralIa({ m, upgrade }: { m: MauricioDaLoja; upgrade: string }) {
  const grupos = Object.keys(GRUPOS_IA) as GrupoIa[];
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-5">
        <span className="ia-simbolo ia-simbolo--grande" aria-hidden><Sparkles className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground">O Maurício escreve, analisa e prepara; você confere e confirma.</p>
          <p className="text-sm text-body">Seu plano: <b>{m.plano}</b>{m.emTeste ? " (em teste)" : ""}. Ferramentas de texto a partir do {m.minimoTexto}; análise e ações no {m.minimoAvancado}. Abra a qualquer momento com <kbd className="rounded border border-border px-1 text-xs">Ctrl</kbd> + <kbd className="rounded border border-border px-1 text-xs">J</kbd>.</p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">Beta · chega em breve</span>
      </div>
      {grupos.map((g) => (
        <section key={g} aria-labelledby={`ia-${g}`}>
          <h2 id={`ia-${g}`} className="text-lg font-bold text-foreground">{GRUPOS_IA[g].titulo}</h2>
          <p className="text-sm text-muted-foreground">{GRUPOS_IA[g].frase}</p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {m.ferramentas.filter((f) => f.grupo === g).map((f) => (
              <li key={f.key} className="nl-chega flex flex-col rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="ia-simbolo" aria-hidden>{f.estado === "BLOQUEADA" ? <Lock className="size-3.5" /> : <Sparkles className="size-3.5" />}</span>
                  <SeloIa estado={f.estado} minimo={g === "TEXTO" ? m.minimoTexto : m.minimoAvancado} />
                </div>
                <h3 className="mt-3 font-bold text-foreground">{f.nome}</h3>
                <p className="mt-1 text-sm text-body">{f.frase}</p>
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-link">Ver exemplo</summary>
                  <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-foreground">{f.exemplo.pedido}</p>
                  <p className="mt-2 whitespace-pre-line text-body">{f.exemplo.resposta}</p>
                </details>
                <p className="mt-auto pt-4 text-xs text-muted-foreground">Onde aparece: {f.onde}</p>
                {f.estado === "BLOQUEADA" ? <Link href={upgrade} className="ds-btn ds-btn--secondary ds-btn--sm mt-3 self-start">Ver plano {g === "TEXTO" ? m.minimoTexto : m.minimoAvancado}</Link> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
