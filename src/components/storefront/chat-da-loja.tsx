"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { buscarGuia, guias, type Guia } from "@/lib/ia/manual";
import { abrirConversaComLojaAction, enviarParaLojaAction, mensagensDaLojaAction } from "@/app/actions/atendimento-loja";

type Linha = { id: string; de: "voce" | "assistente" | "loja" | "sistema"; texto: string; guia?: Guia; oferecerLoja?: boolean };
type MsgServidor = { id: string; autor: string; autorNome: string | null; texto: string; createdAt: string };

/**
 * Atendimento na loja (D206): o cliente final pergunta; o assistente responde pelo manual do comprador (sem IA, no
 * navegador) e, quando a pessoa quer, a pergunta vai para o lojista (caixa de Atendimento do painel dele). A resposta da
 * loja aparece aqui mesmo (consulta a cada 5 s enquanto aberto). Cores neutras: funciona sobre qualquer tema.
 */
export function ChatDaLoja({ slug, loja }: { slug: string; loja: string }) {
  const chave = `nl-chat-loja:${slug}`;
  const [aberto, setAberto] = React.useState(false);
  const [linhas, setLinhas] = React.useState<Linha[]>([]);
  const [texto, setTexto] = React.useState("");
  const [form, setForm] = React.useState<{ nome: string; whatsapp: string; texto: string } | null>(null);
  const [conversa, setConversa] = React.useState<{ id: string; token: string } | null>(null);
  const [pending, start] = React.useTransition();
  const [erro, setErro] = React.useState<string | null>(null);
  const fim = React.useRef<HTMLDivElement>(null);
  const ultima = React.useRef<string | null>(null);

  React.useEffect(() => { try { const c = localStorage.getItem(chave); if (c) setConversa(JSON.parse(c)); } catch { /* sem armazenamento */ } }, [chave]); // eslint-disable-line react-hooks/set-state-in-effect
  const juntar = React.useCallback((ms: MsgServidor[], pularTexto?: string) => {
    if (pularTexto) ms = ms.filter((m) => !(m.autor === "CLIENTE" && m.texto === pularTexto.trim()));
    if (!ms.length) return;
    ultima.current = ms.at(-1)!.createdAt;
    setLinhas((l) => { const ids = new Set(l.map((x) => x.id)); return [...l, ...ms.filter((m) => !ids.has(m.id)).map((m): Linha => ({ id: m.id, de: m.autor === "CLIENTE" ? "voce" : m.autor === "SISTEMA" ? "sistema" : "loja", texto: m.texto }))]; });
  }, []);
  React.useEffect(() => {
    if (!aberto || !conversa) return;
    let vivo = true;
    const buscar = async () => { const r = await mensagensDaLojaAction({ ...conversa, depoisDe: ultima.current }); if (!vivo) return; if (r.ok) juntar(r.data.mensagens as MsgServidor[]); else { try { localStorage.removeItem(chave); } catch { /* ok */ } setConversa(null); } };
    void buscar();
    const t = setInterval(buscar, 5000);
    return () => { vivo = false; clearInterval(t); };
  }, [aberto, conversa, juntar, chave]);
  React.useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [linhas.length, form]);

  const seq = React.useRef(0);
  const id = () => `l${++seq.current}`;
  const perguntar = (t: string, g?: Guia) => {
    const q = t.trim(); if (!q) return; setTexto("");
    if (conversa) { start(async () => { const r = await enviarParaLojaAction({ ...conversa, texto: q, depoisDe: ultima.current }); if (r.ok) juntar(r.data.mensagens as MsgServidor[]); else setErro(r.error ?? "Não foi possível enviar."); }); return; }
    const { guia } = g ? { guia: g } : buscarGuia("comprador", q);
    setLinhas((l) => [...l, { id: id(), de: "voce", texto: q }, guia
      ? { id: id(), de: "assistente", texto: "Veja como funciona:", guia, oferecerLoja: true }
      : { id: id(), de: "assistente", texto: `Essa a própria ${loja} responde melhor. Quer mandar a sua pergunta para a loja?`, oferecerLoja: true }]);
  };
  const ultimaPergunta = [...linhas].reverse().find((l) => l.de === "voce")?.texto ?? "";
  const enviarParaLoja = (e: React.FormEvent) => {
    e.preventDefault(); if (!form) return; setErro(null);
    start(async () => {
      const r = await abrirConversaComLojaAction({ slug, ...form, pagina: location.pathname });
      if (!r.ok) { setErro(r.error ?? "Não foi possível enviar."); return; }
      const c = { id: r.data.id, token: r.data.token };
      try { localStorage.setItem(chave, JSON.stringify(c)); } catch { /* ok */ }
      setConversa(c); setForm(null); juntar(r.data.mensagens as MsgServidor[], linhas.some((l) => l.de === "voce" && l.texto === form.texto.trim()) ? form.texto : undefined);
    });
  };
  const campo = "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900";

  const painel = (
    <aside aria-labelledby="chat-loja-t" className="fixed bottom-3 left-3 z-[80] flex max-h-[min(36rem,calc(100dvh-1.5rem))] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl">
      <header className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <div><h2 id="chat-loja-t" className="font-bold">Dúvidas? Fale com a {loja}</h2><p className="text-xs text-neutral-500">{conversa ? "Você está falando com a loja" : "Respostas na hora sobre compra, pagamento e entrega"}</p></div>
        <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="grid size-9 place-items-center rounded-full hover:bg-neutral-100"><X className="size-4" aria-hidden /></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm" aria-live="polite">
        {linhas.length === 0 && !conversa ? (
          <>
            <p className="rounded-2xl bg-neutral-100 px-3 py-2.5">Olá! Escolha um assunto ou escreva a sua dúvida.</p>
            <ul className="flex flex-wrap gap-1.5">{guias("comprador").map((g) => <li key={g.id}><button type="button" onClick={() => perguntar(g.titulo, g)} className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold hover:border-neutral-900">{g.titulo}</button></li>)}</ul>
          </>
        ) : null}
        {linhas.map((l) => l.de === "voce" ? <p key={l.id} className="ml-10 rounded-2xl rounded-br-md bg-neutral-900 px-3 py-2 text-white">{l.texto}</p>
          : l.de === "sistema" ? <p key={l.id} className="text-center text-xs text-neutral-500">{l.texto}</p>
          : (
            <div key={l.id} className="mr-6 space-y-2 rounded-2xl rounded-bl-md bg-neutral-100 px-3 py-2.5">
              {l.de === "loja" ? <b className="block text-xs">{loja}</b> : null}
              <p className="whitespace-pre-line">{l.texto}</p>
              {l.guia ? <><b className="block">{l.guia.titulo}</b><ol className="list-decimal space-y-1 pl-5">{l.guia.passos.map((p) => <li key={p}>{p}</li>)}</ol></> : null}
              {l.oferecerLoja && !conversa && !form ? <button type="button" onClick={() => setForm({ nome: "", whatsapp: "", texto: ultimaPergunta })} className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white">Mandar a pergunta para a loja</button> : null}
            </div>
          ))}
        {form ? (
          <form onSubmit={enviarParaLoja} className="space-y-2 rounded-2xl border border-neutral-200 p-3">
            <p className="text-xs text-neutral-600">A loja responde aqui e também pode te chamar no WhatsApp.</p>
            <label className="sr-only" htmlFor="cl-nome">Seu nome</label><input id="cl-nome" required placeholder="Seu nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={campo} />
            <label className="sr-only" htmlFor="cl-whats">WhatsApp com DDD</label><input id="cl-whats" required inputMode="tel" placeholder="WhatsApp com DDD" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={campo} />
            <label className="sr-only" htmlFor="cl-texto">Sua pergunta</label><textarea id="cl-texto" required rows={2} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} className={campo} />
            <button type="submit" disabled={pending} className="w-full rounded-full bg-neutral-900 py-2 text-sm font-bold text-white">Enviar para a loja</button>
          </form>
        ) : null}
        {erro ? <p role="alert" className="text-xs text-red-700">{erro}</p> : null}
        <div ref={fim} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); perguntar(texto); }} className="flex items-end gap-2 border-t border-neutral-200 p-3">
        <label htmlFor="cl-pergunta" className="sr-only">Sua dúvida</label>
        <textarea id="cl-pergunta" rows={1} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); perguntar(texto); } }} placeholder={conversa ? "Escreva para a loja…" : "Ex.: qual o prazo de entrega?"} className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none" />
        <button type="submit" disabled={pending || !texto.trim()} aria-label="Enviar" className="grid size-9 place-items-center rounded-full bg-neutral-900 text-white disabled:opacity-40"><Send className="size-4" aria-hidden /></button>
      </form>
    </aside>
  );
  return (
    <>
      {!aberto ? <button type="button" onClick={() => setAberto(true)} className="fixed bottom-3 left-3 z-[70] inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-xl" aria-label={`Dúvidas? Fale com a ${loja}`}><MessageCircle className="size-4" aria-hidden />Dúvidas?</button> : null}
      {aberto ? createPortal(painel, document.body) : null}
    </>
  );
}
