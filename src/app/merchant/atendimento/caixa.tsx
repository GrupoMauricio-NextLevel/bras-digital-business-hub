"use client";
import * as React from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { abrirAtendimentoDaLojaAction, listarAtendimentoDaLojaAction, resolverAtendimentoDaLojaAction, responderComoLojaAction } from "@/app/actions/atendimento-loja";
import type { abrirAtendimentoDaLoja, listarAtendimentoDaLoja } from "@/lib/domain/atendimento-loja";

type Lista = Awaited<ReturnType<typeof listarAtendimentoDaLoja>>;
type Aberta = Awaited<ReturnType<typeof abrirAtendimentoDaLoja>>;
const ha = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 1 ? "agora" : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };

/** Caixa de atendimento do lojista (D206): lista ao vivo (5 s), conversa aberta (3 s), responder e resolver. */
export function CaixaDaLoja({ inicial }: { inicial: Lista }) {
  const [filtro, setFiltro] = React.useState<"ABERTAS" | "RESOLVIDAS">("ABERTAS");
  const [dados, setDados] = React.useState(inicial);
  const [sel, setSel] = React.useState<string | null>(inicial.lista[0]?.id ?? null);
  const [aberta, setAberta] = React.useState<Aberta | null>(null);
  const [resposta, setResposta] = React.useState("");
  const [pending, start] = React.useTransition();
  const lista = React.useCallback(async () => { const r = await listarAtendimentoDaLojaAction(filtro); if (r.ok) setDados(r.data); }, [filtro]);
  const abrir = React.useCallback(async (id: string) => { const r = await abrirAtendimentoDaLojaAction(id); if (r.ok) setAberta(r.data); }, []);
  React.useEffect(() => { void lista(); const t = setInterval(lista, 5000); return () => clearInterval(t); }, [lista]); // eslint-disable-line react-hooks/set-state-in-effect
  React.useEffect(() => { if (!sel) return; void abrir(sel); const t = setInterval(() => abrir(sel), 3000); return () => clearInterval(t); }, [sel, abrir]); // eslint-disable-line react-hooks/set-state-in-effect
  const c = aberta?.conversa;
  const whats = c?.whatsapp ? `https://wa.me/${c.whatsapp.startsWith("55") ? c.whatsapp : `55${c.whatsapp}`}` : null;
  return (
    <div className="crm-grade">
      <section aria-label="Conversas" className="crm-col">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border p-3">
          {(["ABERTAS", "RESOLVIDAS"] as const).map((f) => <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtro === f ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{f === "ABERTAS" ? `Abertas${dados.esperando ? ` (${dados.esperando} sem resposta)` : ""}` : "Resolvidas"}</button>)}
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><span className="vh-online" aria-hidden /> ao vivo</span>
        </div>
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {dados.lista.length ? dados.lista.map((x) => (
            <li key={x.id}><button type="button" onClick={() => setSel(x.id)} aria-current={sel === x.id ? "true" : undefined} className={`flex w-full flex-col gap-1 px-4 py-3 text-left ${sel === x.id ? "bg-[color-mix(in_srgb,var(--ds-primary)_8%,transparent)]" : "hover:bg-surface-muted"}`}>
              <span className="flex items-center gap-2"><b className="truncate text-sm">{x.nome ?? "Cliente"}</b>{x.naoLidas > 0 && sel !== x.id ? <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{x.naoLidas}</span> : null}<span className="ml-auto text-xs text-muted-foreground">{ha(x.ultimaEm)}</span></span>
              {x.ultimaMensagem ? <span className="truncate text-xs">{x.ultimaMensagem}</span> : null}
            </button></li>
          )) : <li className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa {filtro === "ABERTAS" ? "aberta" : "resolvida"}. Quando um cliente tocar em “Dúvidas?” na sua loja e mandar a pergunta, aparece aqui na hora.</li>}
        </ul>
      </section>
      <section aria-label="Conversa" className="crm-col">
        {c ? (
          <>
            <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{c.nome ?? "Cliente"}</p><p className="text-xs text-muted-foreground">{c.pagina ? `Perguntou em ${c.pagina}` : "Cliente da loja"}</p></div>
              {whats ? <a href={whats} target="_blank" rel="noreferrer" className="ds-btn ds-btn--secondary ds-btn--sm"><MessageCircle className="size-4" aria-hidden />WhatsApp</a> : null}
              {c.status !== "GANHA" && c.status !== "PERDIDA" ? <button type="button" disabled={pending} onClick={() => start(async () => { const r = await resolverAtendimentoDaLojaAction(c.id); if (r.ok) { toast.success("Conversa resolvida"); void lista(); } else toast.error(r.error); })} className="ds-btn ds-btn--sm"><CheckCircle2 className="size-4" aria-hidden />Resolvida</button> : null}
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-surface-muted/40 px-4 py-4">
              {aberta!.mensagens.map((m) => m.autor === "SISTEMA" ? <p key={m.id} className="text-center text-xs text-muted-foreground">{m.texto}</p> : (
                <div key={m.id} className={m.autor === "CLIENTE" ? "flex justify-start" : "flex justify-end"}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.autor === "CLIENTE" ? "bg-surface shadow-sm" : "bg-primary text-primary-foreground"}`}><p className="mb-0.5 text-[11px] font-semibold opacity-80">{m.autor === "CLIENTE" ? (c.nome ?? "Cliente") : "Você (loja)"} · {ha(m.createdAt)}</p><p className="whitespace-pre-line">{m.texto}</p></div>
                </div>
              ))}
            </div>
            <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); const t = resposta.trim(); if (!t) return; setResposta(""); start(async () => { const r = await responderComoLojaAction(c.id, t); if (!r.ok) toast.error(r.error); else await abrir(c.id); }); }}>
              <label htmlFor="loja-resposta" className="sr-only">Responder o cliente</label>
              <textarea id="loja-resposta" rows={2} value={resposta} onChange={(e) => setResposta(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Escreva a resposta para o cliente…" className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
              <button type="submit" disabled={pending || !resposta.trim()} className="ds-btn" aria-label="Enviar resposta"><Send className="size-4" aria-hidden /></button>
            </form>
          </>
        ) : <p className="m-auto p-8 text-center text-sm text-muted-foreground">Escolha uma conversa.</p>}
      </section>
    </div>
  );
}
