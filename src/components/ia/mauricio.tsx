"use client";
import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowRight, ArrowUp, ArrowUpRight, BookOpen, ChevronDown, ChevronRight, LifeBuoy, Lock, Sparkles, X } from "lucide-react";
import type { MauricioDaLoja, FerramentaComEstado } from "@/lib/domain/ia";
import { INICIAIS_PARCEIRO, buscarGuia, guias, type Esfera, type Guia } from "@/lib/ia/manual";

/**
 * Maurício no painel (D194; D206: modo manual). Sem a chave da IA ele responde pelo manual vivo da esfera: no Master,
 * como operar o escritório; no lojista, o passo a passo da loja. O que o manual não cobre vira conversa com a equipe
 * (lojista → caixa de Atendimento do Master). Atalho: Ctrl+J.
 */
export function SeloIa({ estado, minimo }: { estado: FerramentaComEstado["estado"]; minimo: string }) {
  if (estado === "BLOQUEADA") return <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"><Lock className="size-3" aria-hidden /> Plano {minimo}</span>;
  return <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Em breve</span>;
}

type Msg = { de: "voce" | "mauricio"; texto: string; guia?: Guia; sugestoes?: Guia[]; semResposta?: boolean };

const BOAS_VINDAS: Record<Exclude<Esfera, "comprador">, { titulo: string; sub: string }> = {
  master: { titulo: "Como posso ajudar no Master?", sub: "Pergunte como fazer qualquer coisa no escritório: atender, acompanhar o funil, ver receita, ligar a IA." },
  lojista: { titulo: "Como posso ajudar na sua loja?", sub: "Pergunte como fazer: cadastrar produto, receber pelo Mercado Pago, configurar frete, publicar a loja." },
  parceiro: { titulo: "Bora vender mais hoje?", sub: "Sou o seu guia do programa: rotina do dia, o que falar com o lojista, objeções, níveis, saque e regras. Funciona sem internet de IA, a qualquer hora." },
};

export function BotaoMauricio({ m, central, esfera = "lojista" }: { m: MauricioDaLoja; central: string; upgrade?: string; esfera?: Exclude<Esfera, "comprador"> }) {
  const [aberto, setAberto] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [rascunho, setRascunho] = React.useState("");
  const botao = React.useRef<HTMLButtonElement>(null);
  const fim = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") { e.preventDefault(); setAberto((a) => !a); } };
    // Botão "Agente" da faixa do Master (D198) abre e fecha o mesmo painel.
    const alternar = () => setAberto((a) => !a);
    window.addEventListener("keydown", tecla);
    window.addEventListener("nl-mauricio", alternar);
    return () => { window.removeEventListener("keydown", tecla); window.removeEventListener("nl-mauricio", alternar); };
  }, []);
  // Coluna integrada ao painel (padrão da referência): o conteúdo encolhe ao lado e continua usável. Fica aberta entre páginas.
  React.useEffect(() => { try { if (sessionStorage.getItem("nl-mauricio-aberto") === "1") setAberto(true); } catch { /* sem armazenamento */ } }, []); // eslint-disable-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    document.documentElement.classList.toggle("ia-dock-aberto", aberto);
    try { sessionStorage.setItem("nl-mauricio-aberto", aberto ? "1" : "0"); } catch { /* sem armazenamento */ }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setAberto(false); botao.current?.focus(); } };
    if (aberto) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);
  React.useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);
  if (!m.mostrar) return null;

  const perguntar = (texto: string, guiaDireta?: Guia) => {
    const t = texto.trim();
    if (!t) return;
    const { guia, sugestoes } = guiaDireta ? { guia: guiaDireta, sugestoes: [] } : buscarGuia(esfera, t);
    const resposta: Msg = guia
      ? { de: "mauricio", texto: "Aqui está o passo a passo:", guia, sugestoes }
      : { de: "mauricio", texto: esfera === "lojista" ? "Ainda não tenho esse passo a passo no manual. Posso chamar a equipe NextLevel para te responder aqui no painel." : "Ainda não tenho esse passo a passo no manual. Veja os guias abaixo ou pergunte com outras palavras.", sugestoes: sugestoes.length ? sugestoes : guias(esfera).slice(0, 3), semResposta: true };
    setMsgs((x) => [...x, { de: "voce", texto: t }, resposta]);
    setRascunho("");
  };
  const chamarEquipe = (texto: string) => { setAberto(false); window.dispatchEvent(new CustomEvent("nl-ajuda", { detail: { texto } })); };
  const ultimaPergunta = [...msgs].reverse().find((x) => x.de === "voce")?.texto ?? "";
  const bv = BOAS_VINDAS[esfera];

  const painel = (
    <aside className="ia-dock" aria-labelledby="ia-titulo">
      <div className="flex h-full flex-col">
        <header className="ia-dock-topo flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="ia-simbolo" aria-hidden><Sparkles className="size-4" /></span>
            <h2 id="ia-titulo" className="text-base font-bold text-foreground">Maurício</h2>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground" title="Sem a chave da IA, o Maurício responde pelo manual do sistema">Modo manual</span>
          </div>
          <button type="button" onClick={() => setAberto(false)} aria-label="Fechar o Maurício" className="ds-btn ds-btn--quiet ds-btn--icon"><X className="ia-so-largo size-4" aria-hidden /><ChevronDown className="ia-so-celular size-6" aria-hidden /></button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6" aria-live="polite">
          <div className="text-center">
            <span className="ia-simbolo ia-simbolo--grande mx-auto" aria-hidden><Sparkles className="size-7" /></span>
            <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">{bv.titulo}</p>
            <p className="mt-1 text-sm text-muted-foreground">{bv.sub}</p>
          </div>
          {msgs.length === 0 ? (() => {
            // D255 (padrão da referência): um destaque em cor e as demais sugestões num cartão único com divisórias.
            const todas = guias(esfera);
            const lista = esfera === "parceiro" ? todas.filter((g) => INICIAIS_PARCEIRO.includes(g.id)) : todas.slice(0, 7);
            const [primeira, ...resto] = lista;
            return (
              <div className="space-y-3">
                {primeira ? (
                  <button type="button" onClick={() => perguntar(primeira.titulo, primeira)} className="ia-destaque">
                    <ArrowUpRight className="mt-0.5 size-5 shrink-0" aria-hidden />
                    <span><b className="block">{primeira.titulo}</b><span className="mt-1 line-clamp-2 block opacity-85">{primeira.passos[0]}</span></span>
                  </button>
                ) : null}
                <ul className="ia-grupo" aria-label="Guias passo a passo">
                  {resto.map((g) => <li key={g.id}><button type="button" onClick={() => perguntar(g.titulo, g)} className="ia-grupo-item"><BookOpen className="size-4 shrink-0 text-[var(--ds-primary)]" aria-hidden /><span>{g.titulo}</span><ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden /></button></li>)}
                </ul>
                {todas.length > lista.length ? (
                  <details className="ia-todos">
                    <summary>Todos os guias ({todas.length})</summary>
                    <ul className="ia-grupo mt-2">{todas.map((g) => <li key={g.id}><button type="button" onClick={() => perguntar(g.titulo, g)} className="ia-grupo-item"><span>{g.titulo}</span><ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden /></button></li>)}</ul>
                  </details>
                ) : null}
              </div>
            );
          })() : null}
          {msgs.map((x, i) => x.de === "voce"
            ? <div key={i} className="ml-8 rounded-2xl rounded-tr-sm bg-[color-mix(in_srgb,var(--ds-primary)_10%,transparent)] px-4 py-3 text-sm text-foreground">{x.texto}</div>
            : (
              <div key={i} className="flex gap-2">
                <span className="ia-simbolo mt-0.5 shrink-0" aria-hidden><Sparkles className="size-3.5" /></span>
                <div className="min-w-0 flex-1 space-y-2 text-sm text-body">
                  <p className="ia-balao">{x.texto}</p>
                  {x.guia ? (
                    <div className="rounded-2xl border border-border bg-surface p-4">
                      <p className="flex items-center gap-2 font-bold text-foreground"><BookOpen className="size-4 text-primary" aria-hidden />{x.guia.titulo}</p>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-5">{x.guia.passos.map((p) => <li key={p}>{p}</li>)}</ol>
                      {x.guia.link ? <Link href={x.guia.link.href} className="ds-btn ds-btn--sm mt-3 inline-flex">{x.guia.link.rotulo}<ArrowRight className="size-4" aria-hidden /></Link> : null}
                    </div>
                  ) : null}
                  {(x.semResposta || x.guia?.id === "suporte-nextlevel") && esfera === "lojista" ? <button type="button" onClick={() => chamarEquipe(ultimaPergunta)} className="ds-btn ds-btn--sm"><LifeBuoy className="size-4" aria-hidden />Chamar a equipe NextLevel</button> : null}
                  {x.sugestoes?.length ? <div className="flex flex-wrap gap-1.5 pt-1">{x.sugestoes.map((g) => <button key={g.id} type="button" onClick={() => perguntar(g.titulo, g)} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold hover:border-primary">{g.titulo}</button>)}</div> : null}
                </div>
              </div>
            ))}
          {esfera === "lojista" && msgs.length > 0 ? <p className="text-center text-xs text-muted-foreground">Não resolveu? <button type="button" onClick={() => chamarEquipe(ultimaPergunta)} className="font-semibold text-link underline underline-offset-2">Fale com a equipe</button></p> : null}
          <div ref={fim} />
        </div>
        <form className="ia-dock-base border-t border-border px-4 pb-3 pt-3" onSubmit={(e) => { e.preventDefault(); perguntar(rascunho); }}>
          <label htmlFor="ia-texto" className="sr-only">Pergunte ao Maurício</label>
          <div className="ia-compositor">
            <textarea id="ia-texto" rows={1} value={rascunho} onChange={(e) => setRascunho(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); perguntar(rascunho); } }} placeholder={esfera === "master" ? "Ex.: como vejo quem está esperando resposta?" : esfera === "parceiro" ? "Ex.: o que respondo quando o lojista acha caro?" : "Ex.: como conecto o Mercado Pago?"} className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none" />
            <button type="submit" disabled={!rascunho.trim()} aria-label="Perguntar" className="ia-enviar"><ArrowUp className="size-4" aria-hidden /></button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Modo manual: respostas do guia do sistema. {esfera === "lojista" ? <Link href={central} className="underline">Ferramentas de IA do seu plano</Link> : esfera === "parceiro" ? <Link href={central} className="underline">Termos do programa</Link> : <Link href={central} className="underline">Ligar a IA completa</Link>}</p>
        </form>
      </div>
    </aside>
  );
  return (
    <>
      <button ref={botao} type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-label="Pede pro Maurício (Ctrl+J)" title="Pede pro Maurício (Ctrl+J)" className="ia-botao nl-chega">
        <Sparkles className="size-6" aria-hidden />
      </button>
      {aberto ? createPortal(painel, document.body) : null}
    </>
  );
}
