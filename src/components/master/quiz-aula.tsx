"use client";
import { useState, useTransition } from "react";
import { Check, CircleCheck, X } from "lucide-react";
import { responderAulaAction } from "@/app/actions/aprender";

/** Perguntas da aula (BC2, D267). A resposta certa não vem para o navegador: quem corrige é o servidor. */
export function QuizAula({ aulaId, perguntas, concluida, responder = responderAulaAction }: { aulaId: string; perguntas: { pergunta: string; opcoes: string[] }[]; concluida: boolean; /** Ação que corrige (Painel da Agência usa a dela, D317). */ responder?: typeof responderAulaAction }) {
  const [respostas, setRespostas] = useState<(number | undefined)[]>(() => perguntas.map(() => undefined));
  const [resultado, setResultado] = useState<{ acertos: number; total: number; certas: boolean[]; concluida: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const completas = respostas.every((r) => r !== undefined);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!completas) return;
    setErro(null);
    start(async () => {
      const r = await responder({ aulaId, respostas: respostas as number[] });
      if (r.ok) setResultado(r.data); else setErro(r.error);
    });
  }

  return (
    <section aria-labelledby="quiz-t" className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="quiz-t" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Para fixar</h3>
        {concluida || resultado?.concluida ? <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"><CircleCheck className="size-3.5" aria-hidden />Aula concluída</span> : null}
      </div>
      <form onSubmit={enviar} className="mt-3 space-y-5">
        {perguntas.map((p, i) => {
          const certa = resultado?.certas[i];
          return (
            <fieldset key={p.pergunta} className="space-y-2">
              <legend className="flex items-start gap-2 text-sm font-semibold">
                <span className="font-mono text-muted-foreground">{i + 1}.</span>
                <span>{p.pergunta}</span>
                {certa === true ? <Check className="size-4 shrink-0 text-success" aria-label="Certa" /> : certa === false ? <X className="size-4 shrink-0 text-danger" aria-label="Errada" /> : null}
              </legend>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {p.opcoes.map((o, j) => (
                  <label key={o} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${respostas[i] === j ? "border-foreground bg-surface-muted font-medium" : "border-border hover:border-foreground/40"}`}>
                    <input type="radio" name={`p${i}`} value={j} checked={respostas[i] === j} onChange={() => { setRespostas((r) => r.map((x, k) => (k === i ? j : x))); setResultado(null); }} className="accent-current" />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={!completas || pending} className="inline-flex min-h-10 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-surface disabled:opacity-50">{pending ? "Corrigindo…" : "Conferir respostas"}</button>
          <p role="status" aria-live="polite" className="text-sm">
            {erro ? <span className="text-danger">{erro}</span>
              : resultado ? (resultado.concluida ? <span className="font-semibold text-success">Acertou as {resultado.total}. Aula concluída!</span> : <span>Acertou {resultado.acertos} de {resultado.total}. Releia a aula e tente de novo.</span>)
              : !completas ? <span className="text-muted-foreground">Responda as {perguntas.length} para conferir.</span> : null}
          </p>
        </div>
      </form>
    </section>
  );
}
