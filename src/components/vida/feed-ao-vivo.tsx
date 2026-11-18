import Link from "next/link";
import { AoVivo } from "@/components/master/ao-vivo";
import { haQuanto } from "@/lib/agencias/painel-vivo";

const CORES = ["var(--vida-dinheiro)", "var(--vida-pedidos)", "var(--vida-clientes)", "var(--vida-visitas)", "var(--vida-crescimento)", "var(--vida-festa)"];
const corDe = (nome: string) => CORES[[...nome].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES.length];
const iniciais = (nome: string) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

/** Feed ao vivo genérico (D335): quem, o quê e há quanto tempo; a tela se atualiza sozinha. */
export function FeedAoVivo({ titulo, rotulo, itens, agora, vazio, i = 5 }: {
  titulo: string; rotulo: string; vazio: string; agora: Date; i?: number;
  itens: { id: string; quem: string; texto: string; detalhe?: string; quando: string; href?: string }[];
}) {
  return (
    <section className="ds-card ds-enter flex flex-col p-5 sm:p-6" style={{ "--i": i } as React.CSSProperties} aria-labelledby={`feed-${rotulo}`}>
      <div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{rotulo}</p><h2 id={`feed-${rotulo}`} className="mt-1 text-base font-semibold tracking-[-.01em]">{titulo}</h2></div><AoVivo segundos={30} /></div>
      {itens.length ? (
        <ol className="mt-3 space-y-1" aria-live="polite">
          {itens.map((m, n) => {
            const corpo = <><span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: corDe(m.quem) }}>{iniciais(m.quem)}</span>
              <span className="min-w-0 flex-1 text-sm"><span className="font-medium">{m.quem}</span> <span className="text-muted-foreground">{m.texto}</span><span className="block truncate text-xs text-muted-foreground">{m.detalhe ? `${m.detalhe} · ` : ""}{haQuanto(m.quando, agora)}</span></span></>;
            return <li key={m.id} className="vida-chega" style={{ animationDelay: `${n * 70}ms` }}>{m.href ? <Link href={m.href} className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover">{corpo}</Link> : <div className="flex items-start gap-3 px-2 py-2">{corpo}</div>}</li>;
          })}
        </ol>
      ) : <p className="mt-3 text-sm text-muted-foreground">{vazio}</p>}
    </section>
  );
}
