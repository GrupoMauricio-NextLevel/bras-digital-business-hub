import Link from "next/link";
import { AlarmClock, CornerDownRight } from "lucide-react";
import type { PecaEtapa } from "@/db/schema";
import { ETAPA_ROTULO, TIPO_ROTULO, situacaoRotulo, type ContagemDoCiclo } from "@/lib/agencias/fluxo";
import type { PecaNaLista } from "@/lib/agencias/producao";

/** Peças da produção da agência (D314) com os tokens da NextLevel Commerce (ds-card, accent-soft, cores de situação). */
const TOM: Record<PecaEtapa, string> = {
  PLANEJAMENTO: "bg-surface-muted text-muted-foreground", ROTEIRO: "bg-accent-soft text-[var(--ds-link)]", CAPTACAO: "bg-accent-soft text-[var(--ds-link)]",
  EDICAO: "bg-warning-soft text-warning", REVISAO: "bg-warning-soft text-warning", APROVACAO: "bg-info-soft text-info",
  AGENDAMENTO: "bg-accent-soft text-[var(--ds-link)]", PUBLICADO: "bg-success-soft text-success", CONCLUIDO: "bg-success-soft text-success",
};
export const ddmm = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "sem prazo");

export function EtapaChip({ etapa, className = "" }: { etapa: PecaEtapa; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TOM[etapa]} ${className}`}>{ETAPA_ROTULO[etapa]}</span>;
}

export function PrazoTexto({ prazo, atrasada }: { prazo: string | null; atrasada: boolean }) {
  return <span className={`inline-flex items-center gap-1 tabular-nums ${atrasada ? "font-semibold text-danger" : "text-muted-foreground"}`}>{atrasada ? <AlarmClock className="size-3.5" aria-hidden /> : null}{atrasada ? `atrasada · ${ddmm(prazo)}` : ddmm(prazo)}</span>;
}

/** Cartão da peça no quadro e na fila. */
export function PecaCartao({ p, mostrarCliente = true }: { p: Pick<PecaNaLista, "id" | "titulo" | "tipo" | "etapa" | "situacao" | "prazo" | "prioridade" | "clienteNome" | "atrasada"> & { responsavelNome?: string | null; herdada?: boolean; mes?: string }; mostrarCliente?: boolean }) {
  return (
    <Link href={`/agencia/producao/${p.id}`} className={`ds-card ds-lift block !p-3.5 text-sm ${p.atrasada ? "border-danger/50" : ""}`}>
      <span className="flex items-start justify-between gap-2">
        <b className="min-w-0 font-semibold leading-snug">{p.titulo}</b>
        {p.prioridade !== "NORMAL" ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.prioridade === "URGENTE" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>{p.prioridade === "URGENTE" ? "Urgente" : "Alta"}</span> : null}
      </span>
      {mostrarCliente ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{p.clienteNome} · {TIPO_ROTULO[p.tipo]}</span> : <span className="mt-0.5 block text-xs text-muted-foreground">{TIPO_ROTULO[p.tipo]}</span>}
      <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="rounded-full bg-surface-muted px-2 py-0.5">{situacaoRotulo(p.etapa, p.situacao)}</span>
        <PrazoTexto prazo={p.prazo} atrasada={p.atrasada} />
      </span>
      <span className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{p.responsavelNome ? `com ${p.responsavelNome.split(" ")[0]}` : "sem responsável"}</span>
        {p.herdada ? <span className="inline-flex items-center gap-1 text-warning"><CornerDownRight className="size-3" aria-hidden />mês anterior</span> : null}
      </span>
    </Link>
  );
}

export function Barra({ pct, label }: { pct: number; label: string }) {
  return <div className="h-2 rounded-full bg-accent-soft" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} /></div>;
}

/** O cartão do cliente no formato do briefing: contratados, publicados, em edição, aguardando aprovação e gravação, % publicado. */
export function CartaoClienteMes({ id, nome, segmento, c }: { id: string; nome: string; segmento?: string | null; c: ContagemDoCiclo }) {
  const linhas: [string, number][] = [["Publicados", c.publicadas], ["Em edição", c.emEdicao], ["Aguardando aprovação", c.aguardandoAprovacao], ["Aguardando gravação", c.emCaptacao], ["Em roteiro", c.emRoteiro]];
  return (
    <Link href={`/agencia/producao?cliente=${id}`} className="ds-card ds-lift block !p-4 text-sm">
      <span className="flex items-baseline justify-between gap-2"><b className="truncate font-semibold">{nome}</b><span className="shrink-0 tabular-nums text-xs font-semibold">{c.percentualPublicado}%</span></span>
      <span className="block text-xs text-muted-foreground">{segmento ? `${segmento} · ` : ""}{c.contratado} contratado{c.contratado === 1 ? "" : "s"}{c.extras ? ` · ${c.extras} extra${c.extras > 1 ? "s" : ""}` : ""}</span>
      <div className="my-2.5"><Barra pct={c.percentualPublicado} label={`${nome}: ${c.percentualPublicado}% publicado`} /></div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        {linhas.filter(([, n]) => n).map(([l, n]) => <li key={l}><span className="font-semibold tabular-nums text-foreground">{n}</span> {l.toLowerCase()}</li>)}
        {c.atrasadas ? <li className="font-semibold text-danger">{c.atrasadas} atrasada{c.atrasadas > 1 ? "s" : ""}</li> : null}
        {c.faltaPlanejar ? <li className="text-warning">{c.faltaPlanejar} a planejar</li> : null}
        {c.herdadas ? <li className="text-warning">{c.herdadas} do mês anterior</li> : null}
      </ul>
    </Link>
  );
}
