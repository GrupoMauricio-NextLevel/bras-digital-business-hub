"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUp, ChevronRight, Lock, Sparkles, X } from "lucide-react";
import type { MauricioDaLoja, FerramentaComEstado } from "@/lib/domain/ia";
import { GRUPOS_IA } from "@/lib/ia/ferramentas";

/**
 * Maurício no painel (fase IA0, D194; padrão de painel da Hostinger: botão flutuante + conversa lateral). Tudo visível;
 * o que o plano não inclui mostra o cadeado e um exemplo gravado. Nada chama a IA nesta fase. Atalho: Ctrl+J.
 */
export function SeloIa({ estado, minimo }: { estado: FerramentaComEstado["estado"]; minimo: string }) {
  if (estado === "BLOQUEADA") return <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"><Lock className="size-3" aria-hidden /> Plano {minimo}</span>;
  return <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Em breve</span>;
}

export function BotaoMauricio({ m, central, upgrade }: { m: MauricioDaLoja; central: string; upgrade: string }) {
  const [aberto, setAberto] = React.useState(false);
  const [escolhida, setEscolhida] = React.useState<FerramentaComEstado | null>(null);
  const [rascunho, setRascunho] = React.useState("");
  const botao = React.useRef<HTMLButtonElement>(null);
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
  if (!m.mostrar) return null;
  const minimo = (f: FerramentaComEstado) => (f.grupo === "TEXTO" ? m.minimoTexto : m.minimoAvancado);
  const sugestoes = m.ferramentas.filter((f) => ["pergunte", "descricao", "resposta", "cadastro"].includes(f.key));
  return (
    <>
      <button ref={botao} type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-label="Pede pro Maurício (Ctrl+J)" title="Pede pro Maurício (Ctrl+J)" className="ia-botao nl-chega">
        <Sparkles className="size-6" aria-hidden />
      </button>
      {aberto ? <aside className="ia-dock" aria-labelledby="ia-titulo">
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="ia-simbolo" aria-hidden><Sparkles className="size-4" /></span>
              <h2 id="ia-titulo" className="text-base font-bold text-foreground">Maurício</h2>
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Beta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Plano {m.plano}</span>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar o Maurício" className="ds-btn ds-btn--quiet ds-btn--icon"><X className="size-4" aria-hidden /></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-6" aria-live="polite">
            {escolhida ? (
              <div className="space-y-4">
                <button type="button" onClick={() => setEscolhida(null)} className="text-sm font-semibold text-link underline underline-offset-2">Voltar</button>
                <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-foreground">{escolhida.nome}</h3><SeloIa estado={escolhida.estado} minimo={minimo(escolhida)} /></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exemplo do que o Maurício faz</p>
                <div className="ml-8 rounded-2xl rounded-tr-sm bg-[color-mix(in_srgb,var(--ds-primary)_10%,transparent)] px-4 py-3 text-sm text-foreground">{escolhida.exemplo.pedido}</div>
                <div className="flex gap-2"><span className="ia-simbolo mt-0.5 shrink-0" aria-hidden><Sparkles className="size-3.5" /></span><p className="whitespace-pre-line text-sm leading-relaxed text-body">{escolhida.exemplo.resposta}</p></div>
                {escolhida.estado === "BLOQUEADA" ? (
                  <div className="rounded-2xl border border-border p-4 text-sm">
                    <p className="font-semibold text-foreground">Disponível no plano {minimo(escolhida)}.</p>
                    <p className="mt-1 text-body">Suba de plano para o Maurício {escolhida.grupo === "TEXTO" ? "escrever" : "analisar e preparar tarefas"} por você.</p>
                    <Link href={upgrade} className="ds-btn ds-btn--sm mt-3 inline-flex" onClick={() => setAberto(false)}>Ver plano {minimo(escolhida)}</Link>
                  </div>
                ) : <p className="rounded-2xl border border-border p-4 text-sm text-body">O seu plano já inclui esta ferramenta. O Maurício chega ao seu painel em breve.</p>}
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="ia-simbolo ia-simbolo--grande mx-auto" aria-hidden><Sparkles className="size-7" /></span>
                  <p className="mt-4 text-xl font-bold text-foreground">Como posso ajudar na sua loja?</p>
                  <p className="mt-1 text-sm text-muted-foreground">Eu escrevo, analiso e preparo; você confere e confirma.</p>
                </div>
                <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl bg-surface-muted">
                  {sugestoes.map((f) => (
                    <li key={f.key}><button type="button" onClick={() => setEscolhida(f)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm hover:bg-[color-mix(in_srgb,var(--ds-primary)_6%,transparent)]">
                      <span className="flex-1"><span className="block font-semibold text-foreground">{f.nome}</span><span className="block text-xs text-muted-foreground">{f.frase}</span></span>
                      {f.estado === "BLOQUEADA" ? <Lock className="size-4 text-muted-foreground" aria-label={`Plano ${minimo(f)}`} /> : null}<ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </button></li>
                  ))}
                </ul>
                <Link href={central} onClick={() => setAberto(false)} className="mt-4 block text-center text-sm font-semibold text-link underline underline-offset-2">Ver todas as ferramentas ({m.ferramentas.length})</Link>
              </>
            )}
          </div>
          <form className="border-t border-border px-4 pb-3 pt-3" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="ia-texto" className="sr-only">Mensagem para o Maurício</label>
            <div className="ia-compositor">
              <textarea id="ia-texto" rows={1} value={rascunho} onChange={(e) => setRascunho(e.target.value)} placeholder="Em breve: peça ao Maurício…" className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none" />
              <button type="submit" disabled aria-label="Enviar (em breve)" className="ia-enviar"><ArrowUp className="size-4" aria-hidden /></button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">O Maurício pode errar. Confira antes de confirmar. {Object.values(GRUPOS_IA).length} tipos de ajuda.</p>
          </form>
        </div>
      </aside> : null}
    </>
  );
}
