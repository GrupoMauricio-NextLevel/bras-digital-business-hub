"use client";
import * as React from "react";
import { toast } from "sonner";
import { Bot, CheckCircle2, MessageCircle, Send, Sparkles, UserRound, XCircle } from "lucide-react";
import { abrirConversaAction, assumirConversaAction, atualizarConversaAction, devolverConversaAction, listarConversasAction, responderConversaAction } from "@/app/actions/vendedor";
import type { abrirConversa, listarConversas } from "@/lib/domain/ia-conversas";

/**
 * CRM ao vivo do Maurício no Master (D197): lista atualiza a cada 5 s, conversa aberta a cada 3 s. A equipe assume, responde
 * no próprio chat do site, devolve ao Maurício, anota e marca ganha ou perdida. WhatsApp a um clique.
 */
type Lista = Awaited<ReturnType<typeof listarConversas>>;
type Aberta = Awaited<ReturnType<typeof abrirConversa>>;
type Filtro = "ABERTAS" | "HUMANO" | "GANHA" | "PERDIDA" | undefined;
const STATUS: Record<string, { rotulo: string; cls: string }> = {
  NOVA: { rotulo: "Nova", cls: "bg-sky-100 text-sky-900" }, IA: { rotulo: "Com o Maurício", cls: "bg-violet-100 text-violet-900" },
  HUMANO: { rotulo: "Com a equipe", cls: "bg-amber-100 text-amber-900" }, GANHA: { rotulo: "Ganha", cls: "bg-emerald-100 text-emerald-900" }, PERDIDA: { rotulo: "Perdida", cls: "bg-neutral-200 text-neutral-800" },
};
const ha = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 1 ? "agora" : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };
const codigo = (id: string) => id.slice(-6).toUpperCase();

export function CrmAoVivo({ inicial, abrir }: { inicial: Lista; abrir?: string }) {
  const [filtro, setFiltro] = React.useState<Filtro>("ABERTAS");
  const [canal, setCanal] = React.useState<"HOME" | "PAINEL" | undefined>(undefined);
  const [dados, setDados] = React.useState<Lista>(inicial);
  const [sel, setSel] = React.useState<string | null>(abrir ?? inicial.lista[0]?.id ?? null);
  const [aberta, setAberta] = React.useState<Aberta | null>(null);
  const [resposta, setResposta] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [pending, start] = React.useTransition();
  const fim = React.useRef<HTMLDivElement>(null);

  const carregarLista = React.useCallback(async () => { const r = await listarConversasAction({ status: filtro, canal }); if (r.ok) setDados(r.data); }, [filtro, canal]);
  const carregarAberta = React.useCallback(async (id: string, primeira = false) => {
    const r = await abrirConversaAction(id);
    if (r.ok) { setAberta(r.data); if (primeira) setNotas(r.data.conversa.notas ?? ""); }
  }, []);
  React.useEffect(() => { void carregarLista(); const t = setInterval(carregarLista, 5000); return () => clearInterval(t); }, [carregarLista]); // eslint-disable-line react-hooks/set-state-in-effect -- busca assíncrona, o estado muda depois da resposta
  React.useEffect(() => { if (!sel) return; void carregarAberta(sel, true); const t = setInterval(() => carregarAberta(sel), 3000); return () => clearInterval(t); }, [sel, carregarAberta]); // eslint-disable-line react-hooks/set-state-in-effect -- idem
  React.useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [aberta?.mensagens.length]);

  const agir = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) => start(async () => { const r = await fn(); if (!r.ok) toast.error(r.error); else { if (ok) toast.success(ok); if (sel) await carregarAberta(sel); await carregarLista(); } });
  const c = aberta?.conversa;
  const kpis = [
    ["Abertas agora", (dados.contagem.NOVA ?? 0) + (dados.contagem.IA ?? 0) + (dados.contagem.HUMANO ?? 0)],
    ["Com a equipe", dados.contagem.HUMANO ?? 0], ["Conversas hoje", dados.hoje.conversas], ["Contatos hoje", dados.hoje.contatos], ["Ganhas", dados.contagem.GANHA ?? 0],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map(([r, n]) => <div key={r} className="rounded-2xl border border-border bg-surface px-4 py-3"><p className="text-xs font-semibold text-muted-foreground">{r}</p><p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{n}</p></div>)}
      </div>
      <div className="crm-grade">
        <section aria-label="Conversas" className="crm-col">
          <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
            {([["ABERTAS", "Abertas"], ["HUMANO", "Com a equipe"], ["GANHA", "Ganhas"], ["PERDIDA", "Perdidas"], [undefined, "Todas"]] as const).map(([f, r]) => (
              <button key={r} type="button" onClick={() => setFiltro(f)} aria-pressed={filtro === f} className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtro === f ? "border-transparent bg-primary text-primary-foreground" : "border-border text-body"}`}>{r}</button>
            ))}
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><span className="vh-online" aria-hidden /> ao vivo</span>
            <span className="flex w-full gap-1.5" role="group" aria-label="Quem está falando">
              {([[undefined, "Todos"], ["HOME", "Visitantes do site"], ["PAINEL", "Lojistas (Ajuda)"]] as const).map(([v, r]) => (
                <button key={r} type="button" onClick={() => setCanal(v)} aria-pressed={canal === v} className={`rounded-full border px-3 py-1 text-xs font-semibold ${canal === v ? "border-transparent bg-[var(--ds-ink)] text-[var(--ds-surface)]" : "border-border text-muted-foreground hover:text-foreground"}`}>{r}</button>
              ))}
            </span>
          </div>
          <ul className="flex-1 divide-y divide-border overflow-y-auto">
            {dados.lista.length ? dados.lista.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => setSel(x.id)} aria-current={sel === x.id ? "true" : undefined} className={`flex w-full flex-col gap-1 px-4 py-3 text-left ${sel === x.id ? "bg-[color-mix(in_srgb,var(--ds-primary)_8%,transparent)]" : "hover:bg-surface-muted"}`}>
                  <span className="flex items-center gap-2">{x.canal === "PAINEL" ? <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold uppercase text-amber-900">Lojista</span> : null}<b className="truncate text-sm text-foreground">{x.nome ?? `Visitante ${codigo(x.id)}`}</b>{x.naoLidas > 0 && sel !== x.id ? <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{x.naoLidas}</span> : null}<span className="ml-auto shrink-0 text-xs text-muted-foreground">{ha(x.ultimaEm)}</span></span>
                  <span className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS[x.status]!.cls}`}>{STATUS[x.status]!.rotulo}</span>{x.interesse ? <span className="truncate text-xs text-muted-foreground">{x.interesse}</span> : null}</span>
                  {x.ultimaMensagem ? <span className="truncate text-xs text-body">{x.ultimaMensagem}</span> : null}
                </button>
              </li>
            )) : <li className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa aqui ainda. Quando alguém falar com o Maurício no site, aparece na hora.</li>}
          </ul>
        </section>

        <section aria-label="Conversa" className="crm-col">
          {c ? (
            <>
              <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                <div className="min-w-0 flex-1"><p className="truncate font-bold text-foreground">{c.nome ?? `Visitante ${codigo(c.id)}`}</p><p className="text-xs text-muted-foreground">Conversa {codigo(c.id)} · {STATUS[c.status]!.rotulo}{c.responsavelNome ? ` · ${c.responsavelNome}` : ""}</p></div>
                {c.canal === "PAINEL" && c.status === "HUMANO" ? null : c.status === "HUMANO"
                  ? <button type="button" disabled={pending} onClick={() => agir(() => devolverConversaAction(c.id), "O Maurício voltou a responder")} className="ds-btn ds-btn--secondary ds-btn--sm"><Bot className="size-4" aria-hidden /> Devolver ao Maurício</button>
                  : <button type="button" disabled={pending} onClick={() => agir(() => assumirConversaAction(c.id), "Você assumiu a conversa")} className="ds-btn ds-btn--sm"><UserRound className="size-4" aria-hidden /> Assumir conversa</button>}
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-surface-muted/40 px-4 py-4">
                {aberta!.mensagens.map((m) => m.autor === "SISTEMA"
                  ? <p key={m.id} className="text-center text-xs text-muted-foreground">{m.texto}</p>
                  : <div key={m.id} className={m.autor === "CLIENTE" ? "flex justify-start" : "flex justify-end"}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.autor === "CLIENTE" ? "bg-surface text-foreground shadow-sm" : m.autor === "HUMANO" ? "bg-emerald-600 text-white" : "bg-[color-mix(in_srgb,var(--ds-primary)_12%,var(--ds-surface))] text-foreground"}`}>
                        <p className="mb-0.5 text-[11px] font-semibold opacity-80">{m.autor === "CLIENTE" ? (c.nome ?? "Visitante") : m.autor === "HUMANO" ? `${m.autorNome} (equipe)` : "Maurício"} · {ha(m.createdAt)}</p>
                        <p className="whitespace-pre-line leading-relaxed">{m.texto.replaceAll("**", "")}</p>
                      </div>
                    </div>)}
                <div ref={fim} />
              </div>
              <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); const t = resposta.trim(); if (!t) return; setResposta(""); agir(() => responderConversaAction(c.id, t)); }}>
                <label htmlFor="crm-resposta" className="sr-only">Responder como equipe</label>
                <textarea id="crm-resposta" rows={2} value={resposta} onChange={(e) => setResposta(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder={c.status === "HUMANO" ? "Responder como equipe…" : "Responder assume a conversa e pausa o Maurício…"} className="ds-input min-h-0 flex-1 resize-none py-2" />
                <button type="submit" disabled={pending || !resposta.trim()} className="ds-btn" aria-label="Enviar resposta"><Send className="size-4" aria-hidden /></button>
              </form>
            </>
          ) : <p className="m-auto p-8 text-center text-sm text-muted-foreground">Escolha uma conversa.</p>}
        </section>

        <aside aria-label="Dados do contato" className="crm-col crm-info">
          {c ? (
            <div className="space-y-5 p-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contato</p>
                <dl className="mt-2 space-y-1.5">
                  {([["Nome", c.nome], ["WhatsApp", c.whatsapp], ["E-mail", c.email], ["Faturamento", c.faturamento], ["Interesse", c.interesse], ["Página", c.pagina], ["Origem", Object.entries(c.origem ?? {}).map(([k, v]) => `${k}=${v}`).join(", ") || null], ["Desde", new Date(c.createdAt).toLocaleString("pt-BR")]] as const).map(([k, v]) => (
                    <div key={k} className="flex gap-2"><dt className="w-24 shrink-0 text-muted-foreground">{k}</dt><dd className="min-w-0 break-words font-medium text-foreground">{v ?? <span className="font-normal text-muted-foreground">ainda não informou</span>}</dd></div>
                  ))}
                </dl>
                {c.whatsapp ? <a href={`https://wa.me/${c.whatsapp.length <= 11 ? `55${c.whatsapp}` : c.whatsapp}?text=${encodeURIComponent(`Olá, ${c.nome?.split(" ")[0] ?? ""}! Aqui é da NextLevel E-commerce, sobre a sua conversa no site.`)}`} target="_blank" rel="noreferrer" className="vh-whats mx-0 mt-3"><MessageCircle className="size-4" aria-hidden /> Chamar no WhatsApp</a> : null}
              </div>
              <div>
                <label htmlFor="crm-notas" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas da equipe</label>
                <textarea id="crm-notas" rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} className="ds-input mt-2 min-h-0 py-2" placeholder="O que combinaram, próximos passos…" />
                <button type="button" disabled={pending} onClick={() => agir(() => atualizarConversaAction(c.id, { notas }), "Notas salvas")} className="ds-btn ds-btn--secondary ds-btn--sm mt-2">Salvar notas</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => agir(() => atualizarConversaAction(c.id, { status: "GANHA" }), "Marcada como ganha")} className="ds-btn ds-btn--sm"><CheckCircle2 className="size-4" aria-hidden /> Ganha</button>
                <button type="button" disabled={pending} onClick={() => agir(() => atualizarConversaAction(c.id, { status: "PERDIDA" }), "Marcada como perdida")} className="ds-btn ds-btn--secondary ds-btn--sm"><XCircle className="size-4" aria-hidden /> Perdida</button>
              </div>
              <p className="flex items-start gap-2 text-xs text-muted-foreground"><Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Enquanto a equipe está na conversa, o Maurício não responde. Devolva quando terminar.</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
