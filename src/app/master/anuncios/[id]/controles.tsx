"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { assumirAnuncioAction, criarPropostaAnuncioAction, lancarResultadoAction, mudarEtapaAction, novaPendenciaAction } from "@/app/actions/anuncios";
import { MoneyInput } from "@/components/ui/money-input";
import type { AnuncioStatus } from "@/db/schema";

const campo = "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2";
type Res = { ok: true } | { ok: false; error: string };

/** Controles da equipe na mesa de anúncios (D299). */
export function Controles({ id, status, etapas, temProposta, propostaEnviada, temResponsavel }: { id: string; status: AnuncioStatus; etapas: { status: AnuncioStatus; rotulo: string }[]; temProposta: boolean; propostaEnviada: boolean; temResponsavel: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const rodar = (f: () => Promise<Res>, ok: string, depois?: () => void) => start(async () => { const r = await f(); if (r.ok) { toast.success(ok); depois?.(); router.refresh(); } else toast.error(r.error); });
  const [nova, setNova] = React.useState<AnuncioStatus>(status);
  const [recado, setRecado] = React.useState("");
  const hoje = new Date().toISOString().slice(0, 10);
  const [r, setR] = React.useState({ de: hoje, ate: hoje, gastoCents: 0, alcance: "", cliques: "", conversas: "", comentario: "" });
  const [p, setP] = React.useState({ rotulo: "", dica: "", quem: "LOJISTA" as "LOJISTA" | "EQUIPE" });
  const n = (v: string) => Math.max(0, Math.round(Number(v.replace(/\./g, "").replace(",", ".")) || 0));
  return (
    <div className="grid gap-4 text-sm">
      <section className="ds-card" aria-labelledby="etapa-t">
        <h2 id="etapa-t" className="text-lg font-bold">Etapa</h2>
        <label className="mt-2 block font-semibold" htmlFor="nova-etapa">Mover para</label>
        <select id="nova-etapa" className={campo} value={nova} onChange={(e) => setNova(e.target.value as AnuncioStatus)}>
          {etapas.map((e) => <option key={e.status} value={e.status}>{e.rotulo}</option>)}
        </select>
        <label className="mt-3 block font-semibold" htmlFor="recado">Recado para o lojista (opcional)</label>
        <textarea id="recado" rows={2} className={campo} value={recado} onChange={(e) => setRecado(e.target.value)} placeholder="Sem recado, ele vê a explicação padrão da etapa." />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={pending || nova === status} className="ds-btn ds-btn--sm" onClick={() => rodar(() => mudarEtapaAction(id, nova, recado), "Etapa atualizada; o lojista recebe por e-mail", () => setRecado(""))}>Atualizar etapa</button>
          {!temResponsavel ? <button type="button" disabled={pending} className="ds-btn ds-btn--sm ds-btn--secondary" onClick={() => rodar(() => assumirAnuncioAction(id), "Agora esta campanha é sua")}>Assumir</button> : null}
        </div>
      </section>

      <section className="ds-card" aria-labelledby="prop-eq-t">
        <h2 id="prop-eq-t" className="text-lg font-bold">Proposta</h2>
        {!temProposta ? (
          <>
            <p className="mt-1 text-muted-foreground">Cria a proposta do serviço &ldquo;Gestão de Meta Ads&rdquo; com o diagnóstico como briefing.</p>
            <button type="button" disabled={pending} className="ds-btn ds-btn--sm mt-3" onClick={() => rodar(() => criarPropostaAnuncioAction(id), "Proposta criada: preencha os itens e envie em Propostas")}>Criar proposta</button>
          </>
        ) : (
          <>
            <p className="mt-1 text-muted-foreground">{propostaEnviada ? "Proposta enviada. Mova a campanha para \"Proposta\" para o lojista ver o botão de aceite." : "Preencha os itens e o valor e aperte Enviar na tela de propostas."}</p>
            <Link href="/master/financeiro/propostas" className="ds-btn ds-btn--sm ds-btn--secondary mt-3">Abrir propostas</Link>
          </>
        )}
      </section>

      <form className="ds-card" aria-labelledby="res-t" onSubmit={(e) => { e.preventDefault(); rodar(() => lancarResultadoAction(id, { de: r.de, ate: r.ate, gastoCents: r.gastoCents, alcance: n(r.alcance), cliques: n(r.cliques), conversas: n(r.conversas), comentario: r.comentario }), "Números lançados; o lojista recebe por e-mail", () => setR({ ...r, gastoCents: 0, alcance: "", cliques: "", conversas: "", comentario: "" })); }}>
        <h2 id="res-t" className="text-lg font-bold">Lançar números</h2>
        <p className="mt-1 text-muted-foreground">Copie do Gerenciador de Anúncios (período, valor gasto, alcance, cliques no link, conversas iniciadas).</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><label className="block font-semibold" htmlFor="r-de">De</label><input id="r-de" type="date" className={campo} value={r.de} onChange={(e) => setR({ ...r, de: e.target.value })} /></div>
          <div><label className="block font-semibold" htmlFor="r-ate">Até</label><input id="r-ate" type="date" className={campo} value={r.ate} onChange={(e) => setR({ ...r, ate: e.target.value })} /></div>
        </div>
        <MoneyInput label="Valor gasto na Meta" id="r-gasto" valueCents={r.gastoCents} onChange={(c) => setR({ ...r, gastoCents: c })} className="mt-3" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {([["alcance", "Alcance"], ["cliques", "Cliques"], ["conversas", "Conversas"]] as const).map(([k, t]) => <div key={k}><label className="block font-semibold" htmlFor={`r-${k}`}>{t}</label><input id={`r-${k}`} inputMode="numeric" className={campo} value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })} /></div>)}
        </div>
        <label className="mt-3 block font-semibold" htmlFor="r-com">Comentário para o lojista (opcional)</label>
        <textarea id="r-com" rows={2} className={campo} value={r.comentario} onChange={(e) => setR({ ...r, comentario: e.target.value })} placeholder="O que funcionou, o que vamos testar" />
        <button type="submit" disabled={pending} className="ds-btn ds-btn--sm mt-3">Lançar</button>
      </form>

      <form className="ds-card" aria-labelledby="pend-eq-t" onSubmit={(e) => { e.preventDefault(); rodar(() => novaPendenciaAction(id, p), "Passo incluído", () => setP({ rotulo: "", dica: "", quem: p.quem })); }}>
        <h2 id="pend-eq-t" className="text-lg font-bold">Novo passo</h2>
        <label className="mt-2 block font-semibold" htmlFor="p-rot">O que precisa ser feito</label>
        <input id="p-rot" className={campo} value={p.rotulo} onChange={(e) => setP({ ...p, rotulo: e.target.value })} placeholder="Ex.: Mandar o vídeo do provador" />
        <label className="mt-3 block font-semibold" htmlFor="p-dica">Como fazer (opcional)</label>
        <input id="p-dica" className={campo} value={p.dica} onChange={(e) => setP({ ...p, dica: e.target.value })} />
        <label className="mt-3 block font-semibold" htmlFor="p-quem">Quem faz</label>
        <select id="p-quem" className={campo} value={p.quem} onChange={(e) => setP({ ...p, quem: e.target.value as "LOJISTA" | "EQUIPE" })}><option value="LOJISTA">O lojista</option><option value="EQUIPE">A equipe</option></select>
        <button type="submit" disabled={pending || p.rotulo.trim().length < 3} className="ds-btn ds-btn--sm mt-3">Incluir</button>
      </form>
    </div>
  );
}
