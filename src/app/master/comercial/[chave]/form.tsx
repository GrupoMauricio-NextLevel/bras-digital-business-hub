"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { salvarAcompanhamentoAction, vincularCodigoVisitaAction } from "@/app/actions/comercial";
import { MoneyInput } from "@/components/ui/money-input";

const campo = "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2";

/** Próxima ação, prazo, notas, "assumir" (D202), e "Fechou"/"Perdeu" com valor e motivo (TR3, D293). */
export function FormAcompanhamento(p: { chave: string; proximaAcao: string; prazo: string; notas: string; perdido: boolean; temResponsavel: boolean; motivos: readonly string[]; motivoPerda: string | null; fechou: { valorCents: number; descricao: string | null } | null }) {
  const router = useRouter();
  const [proximaAcao, setProx] = React.useState(p.proximaAcao);
  const [prazo, setPrazo] = React.useState(p.prazo);
  const [notas, setNotas] = React.useState(p.notas);
  const [modo, setModo] = React.useState<"" | "fechou" | "perdeu">("");
  const [valor, setValor] = React.useState(p.fechou?.valorCents ?? 0);
  const [oque, setOque] = React.useState(p.fechou?.descricao ?? "");
  const [motivo, setMotivo] = React.useState(p.motivoPerda?.split(": ")[0] ?? "");
  const [motivoTexto, setMotivoTexto] = React.useState(p.motivoPerda?.split(": ").slice(1).join(": ") ?? "");
  const [pending, start] = React.useTransition();
  const salvar = (extra: Parameters<typeof salvarAcompanhamentoAction>[1] = {}, ok = "Salvo") => start(async () => {
    const r = await salvarAcompanhamentoAction(p.chave, { proximaAcao, prazo: prazo || null, notas, ...extra });
    if (!r.ok) toast.error(r.error); else { toast.success(ok); setModo(""); router.refresh(); }
  });
  return (
    <section className="ds-card text-sm" aria-labelledby="acomp-t">
      <h2 id="acomp-t" className="mb-3 text-lg font-bold">Acompanhamento</h2>
      {p.fechou ? <p className="mb-3 rounded-xl bg-[var(--ds-soft)] px-3 py-2"><b>Negócio fechado:</b> {(p.fechou.valorCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{p.fechou.descricao ? ` · ${p.fechou.descricao}` : ""}</p> : null}
      {p.perdido ? <p className="mb-3 rounded-xl bg-surface-muted px-3 py-2"><b>Perdido</b>{p.motivoPerda ? `: ${p.motivoPerda}` : ""}</p> : null}
      <label className="block font-semibold" htmlFor="prox">Próxima ação</label>
      <input id="prox" value={proximaAcao} onChange={(e) => setProx(e.target.value)} placeholder="Ex.: ligar para ajudar no Mercado Pago" className={campo} />
      <label className="mt-3 block font-semibold" htmlFor="prazo">Até quando</label>
      <input id="prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={campo} />
      <label className="mt-3 block font-semibold" htmlFor="notas">Notas da equipe</label>
      <textarea id="notas" rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="O que combinaram, objeções, detalhes do negócio…" className={campo} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => salvar()} className="ds-btn ds-btn--sm">Salvar</button>
        {!p.temResponsavel ? <button type="button" disabled={pending} onClick={() => salvar({ assumir: true }, "Agora este cliente é seu")} className="ds-btn ds-btn--sm ds-btn--secondary">Assumir este cliente</button> : null}
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <p className="font-semibold">Resultado</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-expanded={modo === "fechou"} disabled={pending} onClick={() => setModo(modo === "fechou" ? "" : "fechou")} className="ds-btn ds-btn--sm ds-btn--secondary">{p.fechou ? "Mudar o fechamento" : "Fechou negócio"}</button>
          {p.perdido
            ? <button type="button" disabled={pending} onClick={() => salvar({ perdido: false }, "Voltou ao funil")} className="ds-btn ds-btn--sm ds-btn--quiet">Voltar ao funil</button>
            : <button type="button" aria-expanded={modo === "perdeu"} disabled={pending} onClick={() => setModo(modo === "perdeu" ? "" : "perdeu")} className="ds-btn ds-btn--sm ds-btn--quiet">Perdeu</button>}
          {p.fechou ? <button type="button" disabled={pending} onClick={() => salvar({ fechou: null }, "Fechamento desfeito")} className="ds-btn ds-btn--sm ds-btn--quiet">Desfazer fechamento</button> : null}
        </div>
        {modo === "fechou" ? (
          <div className="mt-3 grid gap-3 rounded-xl border border-border p-3">
            <MoneyInput label="Valor fechado" valueCents={valor} onChange={setValor} id="fechou-valor" hint="Total combinado (plano, serviço ou contrato)." />
            <div>
              <label className="block font-semibold" htmlFor="fechou-oque">O que foi vendido</label>
              <input id="fechou-oque" value={oque} onChange={(e) => setOque(e.target.value)} placeholder="Ex.: Loja Pronta + plano Pro anual" className={campo} />
            </div>
            <button type="button" disabled={pending || valor <= 0} onClick={() => salvar({ fechou: { valorCents: valor, descricao: oque } }, "Negócio fechado")} className="ds-btn ds-btn--sm">Confirmar fechamento</button>
          </div>
        ) : null}
        {modo === "perdeu" ? (
          <div className="mt-3 grid gap-3 rounded-xl border border-border p-3">
            <div>
              <label className="block font-semibold" htmlFor="perdeu-motivo">Por que perdeu</label>
              <select id="perdeu-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo}>
                <option value="">Escolha…</option>
                {p.motivos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold" htmlFor="perdeu-texto">Detalhe (opcional)</label>
              <input id="perdeu-texto" value={motivoTexto} onChange={(e) => setMotivoTexto(e.target.value)} placeholder="Ex.: foi para a Nuvemshop pelo plano grátis" className={campo} />
            </div>
            <button type="button" disabled={pending || !motivo} onClick={() => salvar({ perdido: true, motivoPerda: motivoTexto.trim() ? `${motivo}: ${motivoTexto.trim()}` : motivo }, "Marcado como perdido")} className="ds-btn ds-btn--sm">Confirmar perda</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Código da visita que veio na mensagem do WhatsApp (TR3, D293). */
export function VincularCodigo({ chave }: { chave: string }) {
  const router = useRouter();
  const [codigo, setCodigo] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form className="mt-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await vincularCodigoVisitaAction(chave, codigo); if (!r.ok) toast.error(r.error); else { toast.success("Origem da visita ligada a este cliente"); setCodigo(""); router.refresh(); } }); }}>
      <label className="block font-semibold" htmlFor="cod-visita">Código da visita (veio na mensagem do WhatsApp)</label>
      <div className="mt-1 flex gap-2">
        <input id="cod-visita" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} maxLength={7} placeholder="K7Q2X" autoComplete="off" className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 font-mono uppercase" />
        <button type="submit" disabled={pending || codigo.trim().length < 5} className="ds-btn ds-btn--sm shrink-0">Ligar</button>
      </div>
    </form>
  );
}
