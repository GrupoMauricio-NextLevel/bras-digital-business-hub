"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, Check, ClipboardList, Footprints, Link2, MessageCircle, MonitorSmartphone, Receipt, Trophy } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { RESULTADOS_DA_VISITA, type ResultadoDaVisita } from "@/lib/finance/executivo-regras";
import type { PainelDoExecutivo } from "@/lib/domain/executivos";
import { concluirRetornoAction, registrarVisitaAction } from "@/app/actions/executivos";

/**
 * Painel do executivo na rua (CX4 + BG3, D274): uma mão, letra grande, tudo a no máximo 2 toques.
 * Topo com meta da semana, comissão do mês e nível; 4 botões grandes; agenda de retornos; ranking de esforço;
 * argumentos de bolso. A venda e o dinheiro com o executivo seguem no bloco "Venda na rua" logo abaixo.
 */
export function PainelDaRua({ d, saudacao, link, argumentos }: { d: PainelDoExecutivo; saudacao: string; link: string; argumentos: { titulo: string; texto: string }[] }) {
  const [visita, setVisita] = React.useState(false);
  const botao = "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-border bg-surface p-3 text-center text-base font-bold active:scale-[.98]";
  const compartilhar = async () => {
    const texto = `Monte sua loja virtual com a NextLevel. Cadastre por aqui: ${link}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Minha loja NextLevel", text: texto, url: link }); return; }
      await navigator.clipboard.writeText(link); toast.success("Link copiado");
    } catch { /* o executivo cancelou o compartilhamento */ }
  };
  const m = d.meta;
  return (
    <section className="mb-6 grid gap-4" aria-label="Painel do executivo" data-painel-da-rua>
      <header className="rounded-2xl bg-foreground p-5 text-surface">
        <p className="text-2xl font-bold">{saudacao}, {d.executivo.primeiroNome}</p>
        <div className="mt-3 flex items-baseline justify-between gap-2"><span className="text-sm opacity-80">Meta da semana</span><b className="text-lg tabular-nums">{m.feitas} de {m.meta} lojas</b></div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Meta da semana" aria-valuemin={0} aria-valuemax={m.meta} aria-valuenow={m.feitas}><div className="h-full rounded-full bg-emerald-400" style={{ width: `${m.pct}%` }} /></div>
        <p className="mt-1 text-sm opacity-80">{m.batida ? "Meta batida. Cada loja a mais soma no ranking e nos bônus." : `Faltam ${m.falta} ${m.falta === 1 ? "loja" : "lojas"} para a meta.`}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/10 p-3"><dt className="opacity-80">Comissão do mês</dt><dd className="text-xl font-bold tabular-nums">{formatBRL(d.comissaoMesCents)}</dd></div>
          <div className="rounded-xl bg-white/10 p-3"><dt className="opacity-80">Nível {d.nivel.atual}</dt><dd className="font-semibold">{d.nivel.proximo ? `Faltam ${d.nivel.proximo.falta} ${d.nivel.proximo.falta === 1 ? "cliente ativo" : "clientes ativos"} para o ${d.nivel.proximo.nome}` : "Nível máximo"}</dd></div>
        </dl>
      </header>

      <nav className="grid grid-cols-2 gap-3" aria-label="Ações rápidas">
        <a href="#venda-na-rua" className={botao}><Receipt className="size-6 text-[var(--ds-primary)]" aria-hidden />Nova venda</a>
        <button type="button" className={`${botao} ${visita ? "border-foreground" : ""}`} aria-expanded={visita} onClick={() => setVisita(!visita)}><Footprints className="size-6 text-[var(--ds-primary)]" aria-hidden />Registrar visita</button>
        <button type="button" className={botao} onClick={compartilhar}><Link2 className="size-6 text-[var(--ds-primary)]" aria-hidden />Meu link</button>
        <a href="/temas" target="_blank" rel="noreferrer" className={botao}><MonitorSmartphone className="size-6 text-[var(--ds-primary)]" aria-hidden />Mostrar a demonstração</a>
      </nav>

      {visita ? <NovaVisita lojas={d.lojas} onFeito={() => setVisita(false)} /> : null}

      <article className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="agenda-t">
        <h2 id="agenda-t" className="flex items-center gap-2 text-lg font-bold"><CalendarCheck className="size-5 text-[var(--ds-primary)]" aria-hidden />Minha agenda</h2>
        {d.agenda.length ? <ul className="mt-3 grid gap-2">{d.agenda.map((a, i) => <ItemAgenda key={a.visitaId ?? `${a.tipo}-${i}`} a={a} />)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nada marcado para os próximos 7 dias. Quem pedir para pensar entra aqui com o dia da volta.</p>}
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="esforco-t">
          <h2 id="esforco-t" className="flex items-center gap-2 text-lg font-bold"><Trophy className="size-5 text-amber-500" aria-hidden />Visitas da semana</h2>
          <p className="text-sm text-muted-foreground">Você registrou <b className="text-foreground">{d.visitasSemana}</b> {d.visitasSemana === 1 ? "visita" : "visitas"}. Reconhecimento da equipe, sem prêmio em dinheiro.</p>
          <ol className="mt-3 grid gap-1">{d.esforco.map((x) => <li key={`${x.posicao}-${x.nome}`} className={`flex justify-between rounded-lg px-3 py-2 text-sm ${x.voce ? "bg-surface-muted font-bold" : ""}`}><span>{x.posicao}º {x.nome}</span><span className="tabular-nums">{x.visitas}</span></li>)}</ol>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="bolso-t">
          <h2 id="bolso-t" className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="size-5 text-[var(--ds-primary)]" aria-hidden />Argumentos de bolso</h2>
          <div className="mt-2 grid gap-2">{argumentos.map((a) => (
            <details key={a.titulo} className="group rounded-xl border border-border px-3 py-2"><summary className="cursor-pointer list-none py-1 font-semibold marker:hidden">{a.titulo}</summary><p className="pb-1 text-sm text-body">{a.texto}</p></details>
          ))}</div>
        </article>
      </div>
    </section>
  );
}

function ItemAgenda({ a }: { a: PainelDoExecutivo["agenda"][number] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const dia = a.quando.split("-").reverse().slice(0, 2).join("/");
  return (
    <li className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${a.atrasado ? "border-red-300 bg-red-50 dark:bg-red-950/30" : "border-border"}`}>
      <span className="min-w-0"><b>{a.titulo}</b><span className="block text-sm text-muted-foreground">{a.atrasado ? `era ${dia}` : dia} · {a.detalhe}</span></span>
      <span className="flex gap-2">
        {a.whatsapp ? <a href={`https://wa.me/55${a.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex size-11 items-center justify-center rounded-full border border-border" aria-label={`WhatsApp de ${a.titulo.replace(/^Voltar em /, "")}`}><MessageCircle className="size-5" aria-hidden /></a> : null}
        {a.visitaId ? <button type="button" disabled={pending} className="inline-flex size-11 items-center justify-center rounded-full border border-border disabled:opacity-50" aria-label="Marcar retorno como feito" onClick={() => start(async () => { const r = await concluirRetornoAction(a.visitaId!); if (r.ok) { toast.success("Retorno feito"); router.refresh(); } else toast.error(r.error); })}><Check className="size-5" aria-hidden /></button> : null}
      </span>
    </li>
  );
}

function NovaVisita({ lojas, onFeito }: { lojas: PainelDoExecutivo["lojas"]; onFeito: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [v, setV] = React.useState({ loja: "", storeId: "", contato: "", whatsapp: "", tipo: "VISITA" as "VISITA" | "DEMONSTRACAO", resultado: "INTERESSADO" as ResultadoDaVisita, retornoEm: "", observacao: "" });
  const campo = "h-12 w-full rounded-xl border border-border bg-surface px-3 text-base";
  const salvar = () => start(async () => {
    const r = await registrarVisitaAction({ ...v, storeId: v.storeId || undefined });
    if (r.ok) { toast.success(v.tipo === "DEMONSTRACAO" ? "Demonstração registrada" : "Visita registrada"); onFeito(); router.refresh(); } else toast.error(r.error);
  });
  return (
    <form className="grid gap-3 rounded-2xl border-2 border-foreground bg-surface p-5" aria-label="Registrar visita" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
      <fieldset><legend className="mb-1 text-sm font-medium">O que você fez</legend>
        <div className="grid grid-cols-2 gap-2">{([["VISITA", "Visitei"], ["DEMONSTRACAO", "Mostrei a demonstração"]] as const).map(([k, rot]) => (
          <label key={k} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 px-2 text-center text-sm font-bold ${v.tipo === k ? "border-foreground bg-surface-muted" : "border-border"}`}><input type="radio" name="tipo" className="sr-only" checked={v.tipo === k} onChange={() => setV({ ...v, tipo: k })} />{rot}</label>
        ))}</div>
      </fieldset>
      <label className="grid gap-1 text-sm font-medium">Loja<input className={campo} list="lojas-do-executivo" value={v.loja} required minLength={2} onChange={(e) => { const l = lojas.find((x) => x.nome === e.target.value); setV({ ...v, loja: e.target.value, storeId: l?.id ?? "" }); }} placeholder="Nome da loja ou do box" /></label>
      <datalist id="lojas-do-executivo">{lojas.map((l) => <option key={l.id} value={l.nome} />)}</datalist>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium">Com quem falou<input className={campo} value={v.contato} onChange={(e) => setV({ ...v, contato: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-medium">WhatsApp<input className={campo} inputMode="tel" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Como foi<select className={campo} value={v.resultado} onChange={(e) => setV({ ...v, resultado: e.target.value as ResultadoDaVisita })}>{Object.entries(RESULTADOS_DA_VISITA).map(([k, rot]) => <option key={k} value={k}>{rot}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Voltar no dia{v.resultado === "PENSAR" ? " (obrigatório)" : " (opcional)"}<input type="date" className={campo} value={v.retornoEm} required={v.resultado === "PENSAR"} onChange={(e) => setV({ ...v, retornoEm: e.target.value })} /></label>
      <button disabled={pending} className="min-h-14 rounded-2xl bg-foreground text-lg font-bold text-surface disabled:opacity-50">{pending ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}
