"use client";
import * as React from "react";
import { enviarContatoAction } from "@/app/actions/site-publico";

type Servico = { id: string; nome: string };
const ETIQUETAS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "gbraid", "wbraid", "ttclid"] as const;
const campo = "mt-1 h-11 w-full rounded-[var(--sf-radius,10px)] border border-neutral-300 bg-white px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1";

/**
 * Formulário de orçamento do site (NextLevel Business, NB3, D309). A origem vai junto no envio, lida da própria página
 * (etiquetas da campanha e site de origem): nada é guardado em cookie (D185). A chave do envio nasce uma vez por
 * formulário aberto, para um clique duplo ou uma rede ruim não criarem dois pedidos.
 */
export function FormularioOrcamento({ slug, id, titulo, texto, botao, servicos, pedirServico, pedirEmail, editando }: { slug: string; id: string; titulo: string; texto: string; botao: string; servicos: Servico[]; pedirServico: boolean; pedirEmail: boolean; editando?: boolean }) {
  const [estado, setEstado] = React.useState<"aberto" | "enviando" | "enviado">("aberto");
  const [erro, setErro] = React.useState<string | null>(null);
  const chave = React.useRef<string>("");
  const abertoEm = React.useRef<number>(0);
  const servicoRef = React.useRef<HTMLSelectElement>(null);
  React.useEffect(() => {
    chave.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    abertoEm.current = Date.now();
    // Serviço vindo do botão "Pedir orçamento" de um cartão (?servico=<endereço>).
    const s = new URLSearchParams(window.location.search).get("servico");
    const achado = s ? servicos.find((x) => x.id === s || x.nome.toLowerCase() === s.toLowerCase()) : null;
    if (achado && servicoRef.current) servicoRef.current.value = achado.id;
  }, [servicos]);
  const tituloId = `${id}-titulo`;
  if (estado === "enviado") return <section aria-labelledby={tituloId} className="mt-12 rounded-2xl border border-neutral-200 p-6" id="orcamento"><h2 id={tituloId} role="status" className="text-xl font-semibold">Pedido recebido!</h2><p className="mt-2 text-neutral-600">Obrigado. A equipe vai responder pelo WhatsApp ou pelo e-mail que você deixou.</p></section>;
  return (
    <section aria-labelledby={tituloId} className="mt-12 rounded-2xl border border-neutral-200 p-6" id="orcamento">
      <h2 id={tituloId} className="text-xl font-semibold tracking-tight">{titulo}</h2>
      {texto ? <p className="mt-2 text-neutral-600">{texto}</p> : null}
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
        e.preventDefault(); if (editando) return; setErro(null);
        const f = new FormData(e.currentTarget); const q = new URLSearchParams(window.location.search);
        const origem = Object.fromEntries(ETIQUETAS.flatMap((k) => (q.get(k) ? [[k, q.get(k)!.slice(0, 200)]] : [])));
        setEstado("enviando");
        enviarContatoAction(slug, {
          nome: String(f.get("nome") ?? ""), whatsapp: String(f.get("whatsapp") ?? ""), email: pedirEmail ? String(f.get("email") ?? "") : null,
          servicoId: pedirServico ? String(f.get("servico") ?? "") || null : null, mensagem: String(f.get("mensagem") ?? ""),
          pagina: window.location.pathname.slice(0, 120), site: String(f.get("site") ?? ""), tempoMs: Date.now() - abertoEm.current, chaveEnvio: chave.current,
          origem: { ...origem, referrer: document.referrer ? document.referrer.slice(0, 300) : null },
        }).then((r) => { if (r.ok) setEstado("enviado"); else { setErro(r.error); setEstado("aberto"); } });
      }}>
        <label className="block text-sm font-medium">Seu nome<input name="nome" required minLength={2} maxLength={120} autoComplete="name" className={campo} /></label>
        <label className="block text-sm font-medium">WhatsApp com DDD<input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} className={campo} /></label>
        {pedirEmail ? <label className="block text-sm font-medium">E-mail (opcional)<input name="email" type="email" autoComplete="email" maxLength={160} className={campo} /></label> : null}
        {pedirServico && servicos.length ? (
          <label className="block text-sm font-medium">Serviço<select ref={servicoRef} name="servico" defaultValue="" className={campo}><option value="">Escolha (opcional)</option>{servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></label>
        ) : null}
        <label className="block text-sm font-medium sm:col-span-2">O que você precisa? (opcional)<textarea name="mensagem" rows={3} maxLength={1000} className={`${campo} h-auto py-2`} /></label>
        {/* Campo-isca: invisível para pessoas; robôs costumam preencher. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><label>Site<input name="site" tabIndex={-1} autoComplete="off" /></label></div>
        {erro ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{erro}</p> : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={estado === "enviando"} className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--sf-radius,10px)] px-6 text-base font-semibold disabled:opacity-60 sm:w-auto" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{estado === "enviando" ? "Enviando…" : botao}</button>
          <p className="mt-2 text-xs text-neutral-500">Informe o WhatsApp ou o e-mail. Usamos seus dados só para responder este pedido.</p>
        </div>
      </form>
    </section>
  );
}
