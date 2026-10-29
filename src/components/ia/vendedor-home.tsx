"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUp, ChevronRight, Sparkles, X } from "lucide-react";
import { ATALHOS_INICIO, responder, responderTexto, type Acao, type Atalho, type FatosVenda } from "@/lib/ia/vendedor-publico";
import { perguntarAoVendedorAction } from "@/app/actions/vendedor";
import { submitLeadAction } from "@/app/actions/leads";

/**
 * Vendedor 24h na home (D195; padrão REF-001 e REF-010 da referência): cápsula "Pede pro Maurício" no rodapé da tela e
 * conversa lateral. Sem IA ligada, responde pelo motor guiado com os dados reais; com IA, a pergunta livre vai ao modelo.
 */
type Msg = { id: number; de: "cliente" | "mauricio"; texto: string; atalhos?: Atalho[]; acoes?: Acao[] };
const negrito = (t: string) => t.split("**").map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <React.Fragment key={i}>{p}</React.Fragment>));

export function VendedorHome({ fatos, iaLigada }: { fatos: FatosVenda; iaLigada: boolean }) {
  const [aberto, setAberto] = React.useState(false);
  const [capsula, setCapsula] = React.useState(true);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [texto, setTexto] = React.useState("");
  const [pensando, setPensando] = React.useState(false);
  const [contato, setContato] = React.useState<null | "form" | "ok">(null);
  const [lead, setLead] = React.useState({ name: "", phone: "", email: "" });
  const [erroLead, setErroLead] = React.useState("");
  const seq = React.useRef(1);
  const dlg = React.useRef<HTMLDialogElement>(null);
  const fim = React.useRef<HTMLDivElement>(null);
  const assuntos = React.useRef<string[]>([]);

  React.useEffect(() => { try { if (sessionStorage.getItem("nl-vendedor-fechado")) setCapsula(false); } catch { /* sem armazenamento */ } }, []); // eslint-disable-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    const d = dlg.current; if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);
  React.useEffect(() => { fim.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, pensando, contato]);

  const mauricio = (r: ReturnType<typeof responder>) => { assuntos.current.push(r.assunto); setMsgs((m) => [...m, { id: seq.current++, de: "mauricio", texto: r.texto, atalhos: r.atalhos, acoes: r.acoes }]); };
  const abrir = (primeira?: string) => {
    setAberto(true);
    if (!msgs.length) mauricio(responder(fatos, null));
    if (primeira) setTimeout(() => escolher({ id: primeira, rotulo: ATALHOS_INICIO.find((a) => a.id === primeira)?.rotulo ?? primeira }), 50);
  };
  const escolher = (a: Atalho) => {
    setMsgs((m) => [...m, { id: seq.current++, de: "cliente", texto: a.rotulo }]);
    if (a.id === "pessoa") setContato("form");
    setTimeout(() => mauricio(responder(fatos, a.id)), 280);
  };
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = texto.trim(); if (!t || pensando) return;
    setTexto("");
    const historico = [...msgs, { id: seq.current++, de: "cliente" as const, texto: t }];
    setMsgs(historico);
    if (iaLigada) {
      setPensando(true);
      const r = await perguntarAoVendedorAction(historico.map(({ de, texto: x }) => ({ de, texto: x })));
      setPensando(false);
      if (r.ok) { setMsgs((m) => [...m, { id: seq.current++, de: "mauricio", texto: r.data.texto, acoes: [{ rotulo: "Criar minha loja", href: fatos.cadastro }, { rotulo: "Quero que a equipe me chame", contato: true }] }]); return; }
    }
    setTimeout(() => mauricio(responderTexto(fatos, t)), 280);
  };
  const enviarLead = async (e: React.FormEvent) => {
    e.preventDefault(); setErroLead("");
    const historia = msgs.filter((m) => m.de === "cliente").map((m) => m.texto).slice(-6).join(" | ");
    const r = await submitLeadAction({ name: lead.name, phone: lead.phone, email: lead.email, message: `Conversa com o Maurício (vendedor da home): ${historia}`.slice(0, 600), segment: assuntos.current.at(-1) });
    if (r.ok) setContato("ok"); else setErroLead(r.error);
  };
  const fecharCapsula = () => { setCapsula(false); try { sessionStorage.setItem("nl-vendedor-fechado", "1"); } catch { /* sem armazenamento */ } };

  return (
    <>
      {capsula && !aberto ? (
        <div className="vh-capsula nl-chega" role="region" aria-label="Pede pro Maurício">
          <button type="button" onClick={() => abrir("plano")} className="vh-capsula-btn">
            <Sparkles className="size-4 shrink-0" aria-hidden /><span className="truncate">Pede pro Maurício: qual plano é o melhor para a minha loja?</span>
            <span className="vh-enviar" aria-hidden><ArrowUp className="size-4" /></span>
          </button>
          <button type="button" onClick={fecharCapsula} className="vh-fechar" aria-label="Fechar a sugestão do Maurício"><X className="size-3.5" aria-hidden /></button>
        </div>
      ) : null}
      {!capsula && !aberto ? <button type="button" onClick={() => abrir()} className="ia-botao vh-botao" aria-label="Pede pro Maurício"><Sparkles className="size-6" aria-hidden /></button> : null}

      <dialog ref={dlg} className="ia-painel" aria-labelledby="vh-titulo" onClose={() => setAberto(false)} onClick={(e) => { if (e.target === dlg.current) setAberto(false); }}>
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="ia-simbolo" aria-hidden><Sparkles className="size-4" /></span>
              <div><h2 id="vh-titulo" className="text-base font-bold leading-tight text-foreground">Maurício</h2><p className="text-xs text-muted-foreground"><span className="vh-online" aria-hidden /> Online agora · responde na hora</p></div>
            </div>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar a conversa" className="ds-btn ds-btn--quiet ds-btn--icon"><X className="size-4" aria-hidden /></button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
            {fatos.oferta && msgs.length <= 1 ? (
              <div className="vh-oferta"><Sparkles className="size-4 shrink-0" aria-hidden /><span><b>{fatos.oferta.trialDays} dias grátis</b> para montar e testar a sua loja. Sem fidelidade.</span></div>
            ) : null}
            {msgs.map((m) => (
              <div key={m.id} className={m.de === "cliente" ? "flex justify-end" : "flex gap-2"}>
                {m.de === "mauricio" ? <span className="ia-simbolo mt-0.5 shrink-0" aria-hidden><Sparkles className="size-3.5" /></span> : null}
                <div className={m.de === "cliente" ? "vh-balao-cliente" : "min-w-0 flex-1"}>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{negrito(m.texto)}</p>
                  {m.acoes?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.acoes.map((a) => "href" in a
                        ? <Link key={a.rotulo} href={a.href} onClick={() => setAberto(false)} className="ds-btn ds-btn--sm">{a.rotulo}</Link>
                        : <button key={a.rotulo} type="button" onClick={() => setContato("form")} className="ds-btn ds-btn--secondary ds-btn--sm">{a.rotulo}</button>)}
                    </div>
                  ) : null}
                  {m.atalhos?.length ? (
                    <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-surface-muted">
                      {m.atalhos.map((a) => <li key={a.id}><button type="button" onClick={() => escolher(a)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-[color-mix(in_srgb,var(--ds-primary)_6%,transparent)]"><span className="flex-1">{a.rotulo}</span><ChevronRight className="size-4 text-muted-foreground" aria-hidden /></button></li>)}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
            {pensando ? <div className="flex gap-2"><span className="ia-simbolo shrink-0" aria-hidden><Sparkles className="size-3.5" /></span><span className="nl-degraus mt-2 text-muted-foreground"><i /><i /><i /></span></div> : null}
            {contato === "form" ? (
              <form onSubmit={enviarLead} className="space-y-2 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">A equipe te chama no WhatsApp</p>
                <input required className="ds-input" placeholder="Seu nome" autoComplete="name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} aria-label="Seu nome" />
                <input required className="ds-input" placeholder="WhatsApp com DDD" inputMode="tel" autoComplete="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} aria-label="WhatsApp com DDD" />
                <input required type="email" className="ds-input" placeholder="E-mail" autoComplete="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} aria-label="E-mail" />
                {erroLead ? <p role="alert" className="text-sm text-danger">{erroLead}</p> : null}
                <button type="submit" className="ds-btn w-full">Quero ser chamado</button>
              </form>
            ) : contato === "ok" ? <p className="rounded-2xl border border-border p-4 text-sm text-body">Pronto! A equipe te chama em breve. Enquanto isso, se quiser, já dá para <Link href={fatos.cadastro} className="font-semibold text-link underline">criar a sua loja</Link>.</p> : null}
            <div ref={fim} />
          </div>
          <form className="border-t border-border px-4 pb-3 pt-3" onSubmit={enviar}>
            <label htmlFor="vh-texto" className="sr-only">Pergunte ao Maurício</label>
            <div className="ia-compositor">
              <textarea id="vh-texto" rows={1} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Pergunte sobre planos, frete, integrações…" className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none" />
              <button type="submit" disabled={!texto.trim() || pensando} aria-label="Enviar" className="ia-enviar"><ArrowUp className="size-4" aria-hidden /></button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">O Maurício pode errar. Valores e condições confirmados no cadastro.</p>
          </form>
        </div>
      </dialog>
    </>
  );
}
