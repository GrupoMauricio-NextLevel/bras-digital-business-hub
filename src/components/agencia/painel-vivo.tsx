import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { mesRotulo } from "@/lib/agencias/fluxo";
import { haQuanto, type esteiraDoMes } from "@/lib/agencias/painel-vivo";
import { AoVivo } from "@/components/master/ao-vivo";

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Esteira da produção do mês (D334): uma barra com os 6 trechos coloridos, crescendo da esquerda, e a legenda com números. */
export function EsteiraProducao({ esteira, mes, i = 3, entrega = "peça", entregas = "Peças" }: { esteira: ReturnType<typeof esteiraDoMes>; mes: string; i?: number; /** Nomes da empresa (D341). */ entrega?: string; entregas?: string }) {
  if (!esteira.total) return null;
  return (
    <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(i)} aria-labelledby="ag-esteira">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Esteira de {mesRotulo(mes)}</p><h2 id="ag-esteira" className="mt-1 text-base font-semibold tracking-[-.01em]">Onde está cada {entrega.toLowerCase()} do mês</h2></div>
      </div>
      <div className="mt-4 flex h-5 w-full overflow-hidden rounded-full bg-surface-muted" role="img" aria-label={`${entregas} do mês por etapa: ${esteira.trechos.filter((t) => t.n).map((t) => `${t.rotulo} ${t.n}`).join(", ")}`}>
        {esteira.trechos.filter((t) => t.n).map((t, n) => <span key={t.chave} className="vida-trecho h-full" style={{ width: `${t.pct}%`, background: t.cor, animationDelay: `${n * 110}ms` }} />)}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
        {esteira.trechos.map((t) => <li key={t.chave} className="flex items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: t.cor }} /><span className="min-w-0 flex-1 truncate text-muted-foreground">{t.rotulo}</span><b className="tabular-nums">{t.n}</b></li>)}
      </ul>
    </section>
  );
}

/** Receita dos últimos 6 meses (D334): colunas da receita recorrente e o ponto do que foi recebido no mês. */
export function ReceitaMeses({ serie, titulo, i = 4 }: { serie: { mes: string; recorrenteCents: number; recebidoCents: number; ativos: number }[]; titulo: string; i?: number }) {
  const max = Math.max(1, ...serie.flatMap((s) => [s.recorrenteCents, s.recebidoCents]));
  const w = 560, h = 190, base = 160, topo = 14, larg = w / serie.length;
  const y = (v: number) => base - (v / max) * (base - topo);
  return (
    <section className="ds-card ds-enter flex flex-col p-5 sm:p-6" style={stagger(i)} aria-labelledby="ag-receita">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Últimos 6 meses</p>
      <h2 id="ag-receita" className="mt-1 text-base font-semibold leading-snug tracking-[-.01em]">{titulo}</h2>
      <figure className="mt-auto pt-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label={`${titulo} ${serie.map((s) => `${mesRotulo(s.mes)}: ${formatBRL(s.recorrenteCents)} contratado, ${formatBRL(s.recebidoCents)} recebido`).join("; ")}.`}>
          <defs><linearGradient id="ag-col" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--vida-dinheiro)" /><stop offset="100%" stopColor="var(--vida-dinheiro)" stopOpacity=".35" /></linearGradient></defs>
          <line x1="0" x2={w} y1={base} y2={base} stroke="currentColor" strokeOpacity=".15" />
          {serie.map((s, n) => { const x = n * larg + larg * 0.22, cw = larg * 0.56, yy = y(s.recorrenteCents); return <g key={s.mes}>
            <rect className="vida-coluna" style={{ animationDelay: `${n * 90}ms` }} x={x} y={yy} width={cw} height={Math.max(0, base - yy)} rx="8" fill="url(#ag-col)" />
            {s.recebidoCents ? <circle className="vida-area" cx={x + cw / 2} cy={y(s.recebidoCents)} r="6" fill="var(--vida-crescimento)" stroke="var(--ds-surface)" strokeWidth="2.5" /> : null}
            <text x={x + cw / 2} y={h - 8} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".6">{mesRotulo(s.mes).slice(0, 3)}</text>
            {s.recorrenteCents ? <text x={x + cw / 2} y={yy - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" opacity=".8">{formatCompactBRL(s.recorrenteCents).replace("R$ ", "")}</text> : null}
          </g>; })}
        </svg>
        <figcaption className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-sm bg-[var(--vida-dinheiro)]" />receita contratada</span><span className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-full bg-[var(--vida-crescimento)]" />recebido no mês</span></figcaption>
      </figure>
      <Link href="/agencia/crescimento" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ds-link)]">Ver crescimento <ArrowRight className="size-4" aria-hidden /></Link>
    </section>
  );
}

const CORES = ["var(--vida-dinheiro)", "var(--vida-pedidos)", "var(--vida-clientes)", "var(--vida-visitas)", "var(--vida-crescimento)", "var(--vida-festa)"];
const corDe = (nome: string) => CORES[[...nome].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES.length];
const iniciais = (nome: string) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

/** Movimento ao vivo (D334): quem mexeu em qual peça, há quanto tempo. A tela se atualiza sozinha a cada 30 s. */
export function MovimentoAoVivo({ itens, agora, i = 5 }: { itens: { id: string; tipo: string; mensagem: string; autor: string | null; createdAt: string; titulo: string; pecaId: string }[]; agora: Date; i?: number }) {
  return (
    <section className="ds-card ds-enter flex flex-col p-5 sm:p-6" style={stagger(i)} aria-labelledby="ag-mov">
      <div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Equipe trabalhando</p><h2 id="ag-mov" className="mt-1 text-base font-semibold tracking-[-.01em]">Movimento agora</h2></div><AoVivo segundos={30} /></div>
      {itens.length ? (
        <ol className="mt-3 space-y-1" aria-live="polite">
          {itens.map((m, n) => { const autor = m.autor ?? "Sistema"; return <li key={m.id} className="vida-chega" style={{ animationDelay: `${n * 70}ms` }}>
            <Link href={`/agencia/producao/${m.pecaId}`} className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover">
              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: corDe(autor) }}>{iniciais(autor)}</span>
              <span className="min-w-0 flex-1 text-sm"><span className="font-medium">{autor}</span> <span className="text-muted-foreground">{m.mensagem.charAt(0).toLowerCase() + m.mensagem.slice(1)}</span><span className="block truncate text-xs text-muted-foreground">{m.titulo} · {haQuanto(m.createdAt, agora)}</span></span>
            </Link></li>; })}
        </ol>
      ) : <p className="mt-3 text-sm text-muted-foreground">Quando a equipe avançar uma peça, pedir ajuste ou publicar, aparece aqui na hora.</p>}
    </section>
  );
}
