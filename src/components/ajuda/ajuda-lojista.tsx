"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { LifeBuoy, Send, X } from "lucide-react";
import { toast } from "sonner";
import { enviarAjudaAction, verAjudaAction } from "@/app/actions/ajuda";

type Msg = { id: string; autor: string; autorNome: string | null; texto: string; createdAt: string };

/**
 * Botão "Ajuda" do painel da loja (D201): abre uma coluna de conversa com a equipe NextLevel. Atualiza a cada 4 s enquanto
 * aberta. O que o lojista escreve chega na caixa de atendimento do Master e na fila "Agora".
 */
export function AjudaLojista({ whatsappUrl }: { whatsappUrl?: string | null }) {
  const [aberto, setAberto] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [texto, setTexto] = React.useState("");
  const [pending, start] = React.useTransition();
  const fim = React.useRef<HTMLDivElement>(null);
  const ultima = msgs.at(-1)?.createdAt ?? null;

  const juntar = React.useCallback((novas: Msg[]) => setMsgs((m) => { const ids = new Set(m.map((x) => x.id)); return [...m, ...novas.filter((x) => !ids.has(x.id))]; }), []);
  React.useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    const buscar = async () => { const r = await verAjudaAction(); if (vivo && r.ok) juntar(r.data.mensagens as Msg[]); };
    void buscar();
    const t = setInterval(buscar, 4000);
    return () => { vivo = false; clearInterval(t); };
  }, [aberto, juntar]);
  React.useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);
  React.useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    start(async () => {
      const r = await enviarAjudaAction(t, ultima);
      if (!r.ok) { toast.error(r.error); return; }
      setTexto(""); juntar(r.data.mensagens as Msg[]);
    });
  };

  return (
    <>
      <button type="button" className="ds-chip" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-label="Falar com a equipe NextLevel">
        <LifeBuoy className="size-4" aria-hidden /><span className="ds-hide-compact">Ajuda</span>
      </button>
      {aberto ? createPortal(
        <aside className="ia-dock" aria-labelledby="ajuda-t">
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 id="ajuda-t" className="font-bold">Ajuda da equipe NextLevel</h2>
                <p className="text-xs text-muted-foreground">Pessoas de verdade respondendo aqui, de segunda a sexta, das 9h às 18h.</p>
              </div>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar a ajuda" className="ds-btn ds-btn--quiet ds-btn--icon"><X className="size-4" aria-hidden /></button>
            </header>
            <div className="nl-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
              {msgs.length === 0 ? <p className="rounded-2xl bg-surface-muted p-4 text-sm">Conte o que está acontecendo ou o que quer fazer na loja. A equipe vê a sua loja e responde por aqui.</p> : null}
              {msgs.map((m) => m.autor === "SISTEMA"
                ? <p key={m.id} className="text-center text-xs text-muted-foreground">{m.texto}</p>
                : <div key={m.id} className={m.autor === "CLIENTE" ? "ml-8 rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground" : "mr-8 rounded-2xl rounded-bl-md bg-surface-muted px-4 py-2.5 text-sm"}>
                    {m.autor !== "CLIENTE" ? <b className="mb-0.5 block text-xs">{m.autorNome ?? "Equipe"} · NextLevel</b> : null}
                    <span className="whitespace-pre-line">{m.texto}</span>
                  </div>)}
              <div ref={fim} />
            </div>
            {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="vh-whats">Urgente? Chame a equipe no WhatsApp</a> : null}
            <form onSubmit={enviar} className="ia-compositor mx-4 mb-4">
              <label htmlFor="ajuda-texto" className="sr-only">Sua mensagem</label>
              <textarea id="ajuda-texto" rows={1} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Escreva a sua dúvida…" className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none" />
              <button type="submit" disabled={pending || !texto.trim()} className="ia-enviar" aria-label="Enviar"><Send className="size-4" aria-hidden /></button>
            </form>
          </div>
        </aside>, document.body,
      ) : null}
    </>
  );
}
