"use client";
import { podeConsultar } from "@/lib/atividade-cliente";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, ChevronDown, ChevronRight, MessageCircle, Sparkles, X } from "lucide-react";
import type { Acao, Atalho, FatosVenda } from "@/lib/ia/vendedor-publico";
import { enviarMensagemAction, iniciarConversaAction, novasMensagensAction, salvarContatoAction } from "@/app/actions/vendedor";

/**
 * Vendedor 24h (D195 a D197): cápsula "Pede pro Maurício" e coluna integrada ao site. A conversa fica no servidor e
 * aparece ao vivo no CRM do Master; o Maurício pede nome e WhatsApp logo no começo, a equipe pode assumir e responder
 * aqui mesmo, e depois de algumas mensagens aparece o atalho para chamar a equipe no WhatsApp.
 */
type Msg = { id: string; autor: "CLIENTE" | "MAURICIO" | "HUMANO" | "SISTEMA"; autorNome: string | null; texto: string; extra: Record<string, unknown>; createdAt: string };
type Sessao = { id: string; token: string };
const CHAVE = "nl-vendedor-conversa";
const negrito = (t: string) => t.split("**").map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <React.Fragment key={i}>{p}</React.Fragment>));
const lerSessao = (chave: string): Sessao | null => { try { return JSON.parse(sessionStorage.getItem(chave) ?? "null"); } catch { return null; } };

export function VendedorHome({ fatos, whatsappEquipe }: { fatos: FatosVenda; whatsappEquipe: string | null }) {
  const [aberto, setAberto] = React.useState(false);
  // Nas páginas /parceiros (D253) o Maurício é o guia do programa: conversa própria e convite próprio.
  const parceiros = /^\/parceiros(\/|$)/.test(usePathname() ?? "");
  const chave = parceiros ? `${CHAVE}-parceiros` : CHAVE;
  const [sessaoDe, setSessaoDe] = React.useState(chave);
  const [capsula, setCapsula] = React.useState(true);
  const [sessao, setSessao] = React.useState<Sessao | null>(null);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [status, setStatus] = React.useState("NOVA");
  const [temContato, setTemContato] = React.useState(false);
  const [pedirContato, setPedirContato] = React.useState<"auto" | "agora" | "dispensado">("auto");
  const [texto, setTexto] = React.useState("");
  const [pensando, setPensando] = React.useState(false);
  const [contato, setContato] = React.useState({ nome: "", whatsapp: "", email: "" });
  const [erro, setErro] = React.useState("");
  const fim = React.useRef<HTMLDivElement>(null);
  const ultimo = msgs.at(-1)?.createdAt ?? null;
  const doCliente = msgs.filter((m) => m.autor === "CLIENTE").length;

  const aplicar = React.useCallback((r: { status: string; temContato: boolean; mensagens: Msg[] }, trocar = false) => {
    setStatus(r.status); setTemContato(r.temContato);
    setMsgs((atual) => { if (trocar) return r.mensagens; const ids = new Set(atual.map((m) => m.id)); return [...atual, ...r.mensagens.filter((m) => !ids.has(m.id))]; });
  }, []);

  React.useEffect(() => { try { if (sessionStorage.getItem("nl-vendedor-fechado")) setCapsula(false); } catch { /* sem armazenamento */ } }, []); // eslint-disable-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    document.documentElement.classList.toggle("ia-dock-aberto", aberto);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    if (aberto) window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.documentElement.classList.remove("ia-dock-aberto"); };
  }, [aberto]);
  React.useEffect(() => { fim.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs.length, pensando, pedirContato]);
  // Ao vivo: enquanto a conversa está aberta, busca as respostas da equipe a cada 4 segundos.
  React.useEffect(() => {
    if (!aberto || !sessao) return;
    const t = setInterval(async () => { if (!podeConsultar()) return; const r = await novasMensagensAction({ ...sessao, depoisDe: ultimo }); if (r.ok) aplicar(r.data); }, 4000);
    return () => clearInterval(t);
  }, [aberto, sessao, ultimo, aplicar]);

  const abrir = async (primeira?: Atalho) => {
    setAberto(true);
    const mesma = sessaoDe === chave && !!sessao;
    let s = mesma ? sessao : lerSessao(chave);
    if (sessaoDe !== chave) { setSessaoDe(chave); setSessao(null); setMsgs([]); }
    if (s && !mesma) { const r = await novasMensagensAction({ ...s }); if (r.ok) { setSessao(s); aplicar(r.data, true); } else s = null; }
    if (!s) {
      const origem = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith("utm_") || k === "ref"));
      const r = await iniciarConversaAction({ pagina: location.pathname, origem });
      if (!r.ok) { setErro(r.error); return; }
      s = { id: r.data.id, token: r.data.token };
      try { sessionStorage.setItem(chave, JSON.stringify(s)); } catch { /* sem armazenamento */ }
      setSessao(s); aplicar(r.data.mensagens, true);
    }
    if (primeira) await mandar(s, { atalho: primeira });
  };
  const mandar = async (s: Sessao | null, corpo: { texto?: string; atalho?: Atalho }) => {
    if (!s) return;
    setPensando(true); setErro("");
    const r = await enviarMensagemAction({ ...s, ...corpo, depoisDe: msgs.at(-1)?.createdAt ?? null });
    setPensando(false);
    if (r.ok) aplicar(r.data); else setErro(r.error);
  };
  const enviar = (e: React.FormEvent) => { e.preventDefault(); const t = texto.trim(); if (!t || pensando) return; setTexto(""); void mandar(sessao, { texto: t }); };
  const enviarContato = async (e: React.FormEvent) => {
    e.preventDefault(); if (!sessao) return; setErro("");
    const r = await salvarContatoAction({ ...sessao, ...contato });
    if (r.ok) { aplicar(r.data, true); setPedirContato("dispensado"); } else setErro(r.error);
  };
  const fecharCapsula = () => { setCapsula(false); try { sessionStorage.setItem("nl-vendedor-fechado", "1"); } catch { /* sem armazenamento */ } };
  // Coleta rápida: logo depois da 1ª resposta; se dispensada, volta uma vez depois de 3 mensagens.
  const mostrarContato = !temContato && (pedirContato === "agora" || (pedirContato === "auto" && msgs.length >= 1) || (pedirContato === "dispensado" && doCliente === 3));
  const codigo = sessao?.id.slice(-6).toUpperCase();
  const linkWhats = whatsappEquipe ? whatsappEquipe.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Vim do chat do site (conversa ${codigo}).`)}`) : null;

  return (
    <>
      {capsula && !aberto ? (
        <div className="vh-capsula nl-chega" role="region" aria-label="Pede pro Maurício">
          <button type="button" onClick={() => abrir(parceiros ? { id: "p-como", rotulo: "Como funciona o programa?" } : { id: "plano", rotulo: "Qual plano é ideal para mim?" })} className="vh-capsula-btn">
            <Sparkles className="size-4 shrink-0" aria-hidden /><span className="vh-longo truncate">{parceiros ? "Pergunte ao Maurício: como funciona o programa de parceiros?" : "Pede pro Maurício: qual plano é o melhor para a minha loja?"}</span><span className="vh-curto truncate">Pede pro Maurício</span>
            <span className="vh-enviar" aria-hidden><ArrowUp className="size-4" /></span>
          </button>
          <button type="button" onClick={fecharCapsula} className="vh-fechar" aria-label="Fechar a sugestão do Maurício"><X className="size-3.5" aria-hidden /></button>
        </div>
      ) : null}
      {!capsula && !aberto ? <button type="button" onClick={() => abrir()} className="ia-botao vh-botao" aria-label="Pede pro Maurício"><Sparkles className="size-6" aria-hidden /></button> : null}

      {aberto ? <aside className="ia-dock" aria-labelledby="vh-titulo">
        <div className="flex h-full flex-col">
          <header className="ia-dock-topo flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="ia-simbolo" aria-hidden><Sparkles className="size-4" /></span>
              <div><h2 id="vh-titulo" className="text-base font-bold leading-tight text-foreground">Maurício</h2><p className="text-xs text-muted-foreground"><span className="vh-online" aria-hidden /> {status === "HUMANO" ? "Você está falando com a nossa equipe" : "Online agora · responde na hora"}</p></div>
            </div>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar a conversa" className="ds-btn ds-btn--quiet ds-btn--icon"><X className="ia-so-largo size-4" aria-hidden /><ChevronDown className="ia-so-celular size-6" aria-hidden /></button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
            {fatos.oferta && doCliente === 0 ? <div className="vh-oferta"><Sparkles className="size-4 shrink-0" aria-hidden /><span><b>{fatos.oferta.trialDays} dias grátis</b> para montar e testar a sua loja. Sem fidelidade.</span></div> : null}
            {msgs.map((m, i) => {
              if (m.autor === "SISTEMA") return <p key={m.id} className="text-center text-xs text-muted-foreground">{m.texto}</p>;
              if (m.autor === "CLIENTE") return <div key={m.id} className="flex justify-end"><p className="vh-balao-cliente whitespace-pre-line text-sm leading-relaxed">{m.texto}</p></div>;
              const humano = m.autor === "HUMANO";
              const atalhos = (m.extra.atalhos as Atalho[] | undefined) ?? [];
              const acoes = (m.extra.acoes as Acao[] | undefined) ?? [];
              const recente = i === msgs.length - 1 || msgs.slice(i + 1).every((x) => x.autor === "SISTEMA");
              return (
                <div key={m.id} className="flex gap-2">
                  <span className={humano ? "vh-avatar-humano mt-0.5 shrink-0" : "ia-simbolo mt-0.5 shrink-0"} aria-hidden>{humano ? (m.autorNome ?? "E").charAt(0) : <Sparkles className="size-3.5" />}</span>
                  <div className="min-w-0 flex-1">
                    {humano ? <p className="mb-1 text-xs font-semibold text-foreground">{m.autorNome} · equipe NextLevel</p> : null}
                    <p className="ia-balao whitespace-pre-line text-sm leading-relaxed">{negrito(m.texto)}</p>
                    {acoes.length ? <div className="mt-3 flex flex-wrap gap-2">{acoes.map((a) => "href" in a
                      ? <Link key={a.rotulo} href={a.href} onClick={() => setAberto(false)} className="ds-btn ds-btn--sm">{a.rotulo}</Link>
                      : <button key={a.rotulo} type="button" onClick={() => setPedirContato("agora")} className="ds-btn ds-btn--secondary ds-btn--sm">{a.rotulo}</button>)}</div> : null}
                    {atalhos.length && recente ? (
                      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-surface-muted">
                        {atalhos.map((a) => <li key={a.id}><button type="button" disabled={pensando} onClick={() => (a.id === "pessoa" ? (setPedirContato("agora"), mandar(sessao, { atalho: a })) : mandar(sessao, { atalho: a }))} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-[color-mix(in_srgb,var(--ds-primary)_6%,transparent)]"><span className="flex-1">{a.rotulo}</span><ChevronRight className="size-4 text-muted-foreground" aria-hidden /></button></li>)}
                      </ul>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {pensando ? <div className="flex gap-2"><span className="ia-simbolo shrink-0" aria-hidden><Sparkles className="size-3.5" /></span><span className="nl-degraus mt-2 text-muted-foreground"><i /><i /><i /></span></div> : null}
            {mostrarContato ? (
              <form onSubmit={enviarContato} className="vh-contato space-y-2 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Pra eu te atender melhor, como te chamo?</p>
                <p className="text-xs text-muted-foreground">Com o seu WhatsApp, a equipe também pode te ajudar se precisar.</p>
                <input required className="ds-input" placeholder="Seu nome" autoComplete="given-name" value={contato.nome} onChange={(e) => setContato({ ...contato, nome: e.target.value })} aria-label="Seu nome" />
                <input required className="ds-input" placeholder="WhatsApp com DDD" inputMode="tel" autoComplete="tel" value={contato.whatsapp} onChange={(e) => setContato({ ...contato, whatsapp: e.target.value })} aria-label="WhatsApp com DDD" />
                <input type="email" className="ds-input" placeholder="E-mail (opcional)" autoComplete="email" value={contato.email} onChange={(e) => setContato({ ...contato, email: e.target.value })} aria-label="E-mail (opcional)" />
                <div className="flex items-center gap-3 pt-1"><button type="submit" className="ds-btn ds-btn--sm">Continuar</button><button type="button" onClick={() => setPedirContato("dispensado")} className="text-sm font-semibold text-link underline underline-offset-2">Agora não</button></div>
                <p className="text-[11px] text-muted-foreground">{parceiros ? "Usamos só para falar com você sobre o programa de parceiros." : "Usamos só para falar com você sobre a sua loja."} <Link href="/privacidade" className="underline">Privacidade</Link></p>
              </form>
            ) : null}
            {erro ? <p role="alert" className="text-sm text-danger">{erro}</p> : null}
            <div ref={fim} />
          </div>
          {doCliente >= 2 && linkWhats ? (
            <a href={linkWhats} target="_blank" rel="noreferrer" className="vh-whats"><MessageCircle className="size-4 shrink-0" aria-hidden /><span><b>Prefere falar com uma pessoa?</b> Chame a nossa equipe no WhatsApp.</span><ChevronRight className="ml-auto size-4" aria-hidden /></a>
          ) : null}
          <form className="ia-dock-base border-t border-border px-4 pb-3 pt-3" onSubmit={enviar}>
            <label htmlFor="vh-texto" className="sr-only">Pergunte ao Maurício</label>
            <div className="ia-compositor">
              <textarea id="vh-texto" rows={1} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder={parceiros ? "Pergunte sobre comissão, níveis, saque…" : "Pergunte sobre planos, frete, integrações…"} className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none" />
              <button type="submit" disabled={!texto.trim() || pensando} aria-label="Enviar" className="ia-enviar"><ArrowUp className="size-4" aria-hidden /></button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">O Maurício pode errar. Valores e condições confirmados no cadastro.</p>
          </form>
        </div>
      </aside> : null}
    </>
  );
}
