"use client";
import * as React from "react";
import { enviarPedidoAgenciaAction } from "@/app/actions/captacao-agencia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ETIQUETAS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "gbraid", "wbraid", "ttclid"] as const;
const campo = "mt-1 w-full rounded-md border border-border bg-surface px-3 text-sm";

/** Formulário de orçamento da agência (D322): mesmo cuidado do NB3 (isca, tempo, chave do envio, origem sem cookie). */
export function PedirOrcamento({ slug, servicos }: { slug: string; servicos: string[] }) {
  const [estado, setEstado] = React.useState<"aberto" | "enviando" | "enviado">("aberto");
  const [erro, setErro] = React.useState<string | null>(null);
  const chave = React.useRef(""); const abertoEm = React.useRef(0);
  React.useEffect(() => { chave.current = crypto.randomUUID(); abertoEm.current = Date.now(); }, []);
  if (estado === "enviado") return <div role="status" className="py-4"><h2 className="text-lg font-semibold">Pedido recebido!</h2><p className="mt-1 text-sm text-muted-foreground">Obrigado. A equipe vai responder pelo WhatsApp ou pelo e-mail que você deixou.</p></div>;
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label="Pedir orçamento" onSubmit={(e) => {
      e.preventDefault(); setErro(null);
      const f = new FormData(e.currentTarget); const q = new URLSearchParams(window.location.search);
      const origem = Object.fromEntries(ETIQUETAS.flatMap((k) => (q.get(k) ? [[k, q.get(k)!.slice(0, 200)]] : [])));
      setEstado("enviando");
      enviarPedidoAgenciaAction(slug, {
        nome: String(f.get("nome") ?? ""), empresa: String(f.get("empresa") ?? ""), whatsapp: String(f.get("whatsapp") ?? ""), email: String(f.get("email") ?? "") || null,
        servico: String(f.get("servico") ?? "") || null, mensagem: String(f.get("mensagem") ?? ""), pagina: (q.get("lp") ?? window.location.pathname).slice(0, 120),
        site: String(f.get("site") ?? ""), tempoMs: Date.now() - abertoEm.current, chaveEnvio: chave.current,
        origem: { ...origem, referrer: document.referrer ? document.referrer.slice(0, 300) : null },
      }).then((r) => { if (r.ok) setEstado("enviado"); else { setErro(r.error); setEstado("aberto"); } });
    }}>
      <label className="text-sm font-medium">Seu nome<Input name="nome" required minLength={2} maxLength={120} autoComplete="name" className="mt-1" /></label>
      <label className="text-sm font-medium">Empresa<Input name="empresa" required minLength={2} maxLength={120} autoComplete="organization" className="mt-1" /></label>
      <label className="text-sm font-medium">WhatsApp com DDD<Input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} className="mt-1" /></label>
      <label className="text-sm font-medium">E-mail<Input name="email" type="email" autoComplete="email" maxLength={160} className="mt-1" /></label>
      {servicos.length ? <label className="text-sm font-medium sm:col-span-2">O que interessa<select name="servico" defaultValue="" className={`${campo} h-10`}><option value="">Escolha (opcional)</option>{servicos.map((s) => <option key={s} value={s}>{s}</option>)}</select></label> : null}
      <label className="text-sm font-medium sm:col-span-2">Conte um pouco da sua empresa (opcional)<textarea name="mensagem" rows={3} maxLength={1000} className={`${campo} py-2`} /></label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><label>Site<input name="site" tabIndex={-1} autoComplete="off" /></label></div>
      {erro ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">{erro}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" loading={estado === "enviando"}>Pedir contato</Button>
        <p className="mt-2 text-xs text-muted-foreground">Informe o WhatsApp ou o e-mail. Usamos seus dados só para responder este pedido.</p>
      </div>
    </form>
  );
}
