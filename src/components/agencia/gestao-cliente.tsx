"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Send } from "lucide-react";
import { criarCampanhaAction, definirComissaoAction, lancarNumerosAction, mudarSituacaoCampanhaAction, perguntarAoAgenteAction, responderNaConversaAction, salvarMetasAction, verComoClienteAction } from "@/app/actions/gestao-agencia";
import { abrirIndiqueAction, ativarIndiqueAction } from "@/app/actions/solucoes-agencia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

const campo = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";
type R<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
function useAcao() {
  const router = useRouter(); const [pending, start] = React.useTransition();
  const rodar = <T,>(fn: () => Promise<R<T>>, ok?: string, depois?: (d: T) => void) => start(async () => { const r = await fn(); if (r.ok) { if (ok) toast.success(ok); depois?.(r.data); router.refresh(); } else toast.error(r.error); });
  return { pending, rodar };
}

/** Ver como cliente (D325): abre o portal daquele cliente só para ver. */
export function VerComoCliente({ clienteId }: { clienteId: string }) {
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { const r = await verComoClienteAction(clienteId); if (r.ok) window.location.assign(r.data.redirectTo); else toast.error(r.error); })}><Eye className="size-4" aria-hidden />Ver como o cliente</Button>;
}

export function Metas({ mes, inicial, verValores }: { mes: string; inicial: { entregas?: number; novosClientes?: number; receitaCents?: number }; verValores: boolean }) {
  const { pending, rodar } = useAcao();
  const [m, setM] = React.useState({ entregas: inicial.entregas ?? 0, novosClientes: inicial.novosClientes ?? 0, receitaCents: inicial.receitaCents ?? 0 });
  return (
    <form className="grid gap-3 sm:grid-cols-3" aria-label="Metas do mês" onSubmit={(e) => { e.preventDefault(); rodar(() => salvarMetasAction(mes, verValores ? m : { entregas: m.entregas, novosClientes: m.novosClientes }), "Metas salvas."); }}>
      <label className="text-sm font-medium">Conteúdos publicados<Input type="number" min={0} value={m.entregas} onChange={(e) => setM({ ...m, entregas: Number(e.target.value) })} className="mt-1" /></label>
      <label className="text-sm font-medium">Clientes novos<Input type="number" min={0} value={m.novosClientes} onChange={(e) => setM({ ...m, novosClientes: Number(e.target.value) })} className="mt-1" /></label>
      {verValores ? <div className="text-sm font-medium"><MoneyInput label="Receita recebida" valueCents={m.receitaCents} onChange={(v) => setM({ ...m, receitaCents: v })} className="mt-1" /></div> : null}
      <div className="sm:col-span-3"><Button type="submit" loading={pending}>Salvar metas</Button></div>
    </form>
  );
}

export function Comissao({ userId, pct }: { userId: string; pct: number | null }) {
  const { pending, rodar } = useAcao();
  const [v, setV] = React.useState(pct === null ? "" : String(pct));
  return (
    <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); rodar(() => definirComissaoAction(userId, v === "" ? null : Number(v)), "Comissão salva."); }}>
      <label className="text-xs font-medium">Comissão (%)<Input type="number" min={0} max={100} value={v} onChange={(e) => setV(e.target.value)} className="mt-1 w-24" /></label>
      <Button size="sm" variant="secondary" type="submit" loading={pending}>Salvar</Button>
    </form>
  );
}

export function NovaCampanha({ clientes }: { clientes: { id: string; nome: string }[] }) {
  const { pending, rodar } = useAcao();
  const [aberto, setAberto] = React.useState(false);
  const [d, setD] = React.useState({ clienteId: clientes[0]?.id ?? "", nome: "", plataforma: "META" as "META" | "GOOGLE" | "TIKTOK" | "OUTRA", objetivo: "", verbaMensalCents: 0, rotuloResultado: "contatos" });
  if (!aberto) return <Button onClick={() => setAberto(true)} disabled={!clientes.length}>Nova campanha</Button>;
  return (
    <form className="ds-card grid gap-3 p-4 sm:grid-cols-2" aria-label="Nova campanha" onSubmit={(e) => { e.preventDefault(); rodar(() => criarCampanhaAction({ ...d, verbaMensalCents: d.verbaMensalCents || null }), "Campanha criada.", () => setAberto(false)); }}>
      <label className="text-sm font-medium">Cliente<select value={d.clienteId} onChange={(e) => setD({ ...d, clienteId: e.target.value })} className={campo}>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      <label className="text-sm font-medium">Nome da campanha<Input value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} required className="mt-1" /></label>
      <label className="text-sm font-medium">Plataforma<select value={d.plataforma} onChange={(e) => setD({ ...d, plataforma: e.target.value as typeof d.plataforma })} className={campo}><option value="META">Meta (Instagram e Facebook)</option><option value="GOOGLE">Google</option><option value="TIKTOK">TikTok</option><option value="OUTRA">Outra</option></select></label>
      <label className="text-sm font-medium">Objetivo<Input value={d.objetivo} onChange={(e) => setD({ ...d, objetivo: e.target.value })} placeholder="Ex.: mensagens no WhatsApp" className="mt-1" /></label>
      <div className="text-sm font-medium"><MoneyInput label="Verba do mês" valueCents={d.verbaMensalCents} onChange={(v) => setD({ ...d, verbaMensalCents: v })} className="mt-1" /></div>
      <label className="text-sm font-medium">O que conta como resultado<Input value={d.rotuloResultado} onChange={(e) => setD({ ...d, rotuloResultado: e.target.value })} className="mt-1" /></label>
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" loading={pending}>Criar</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div>
    </form>
  );
}

export function AcoesCampanha({ id, situacao, investidoCents, resultados }: { id: string; situacao: string; investidoCents: number; resultados: number }) {
  const { pending, rodar } = useAcao();
  const [n, setN] = React.useState({ investidoCents, resultados });
  const [aberto, setAberto] = React.useState(false);
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {situacao !== "NO_AR" && situacao !== "ENCERRADA" ? <Button size="sm" loading={pending} onClick={() => rodar(() => mudarSituacaoCampanhaAction(id, "NO_AR"), "Campanha no ar.")}>Pôr no ar</Button> : null}
        {situacao === "NO_AR" ? <Button size="sm" variant="secondary" loading={pending} onClick={() => rodar(() => mudarSituacaoCampanhaAction(id, "PAUSADA"), "Campanha pausada.")}>Pausar</Button> : null}
        {situacao !== "ENCERRADA" ? <Button size="sm" variant="ghost" loading={pending} onClick={() => rodar(() => mudarSituacaoCampanhaAction(id, "ENCERRADA"), "Campanha encerrada.")}>Encerrar</Button> : null}
        <Button size="sm" variant="secondary" onClick={() => setAberto(!aberto)}>Lançar números</Button>
      </div>
      {aberto ? (
        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); rodar(() => lancarNumerosAction(id, n), "Números atualizados.", () => setAberto(false)); }}>
          <div className="text-xs font-medium"><MoneyInput label="Investido até hoje" valueCents={n.investidoCents} onChange={(v) => setN({ ...n, investidoCents: v })} className="mt-1 w-36" /></div>
          <label className="text-xs font-medium">Resultados<Input type="number" min={0} value={n.resultados} onChange={(e) => setN({ ...n, resultados: Number(e.target.value) })} className="mt-1 w-24" /></label>
          <Button size="sm" type="submit" loading={pending}>Salvar</Button>
        </form>
      ) : null}
    </div>
  );
}

export function ResponderAoCliente({ id }: { id: string }) {
  const { pending, rodar } = useAcao();
  const [t, setT] = React.useState("");
  return (
    <form className="grid gap-2" aria-label="Responder ao cliente" onSubmit={(e) => { e.preventDefault(); rodar(() => responderNaConversaAction(id, t, false), "Resposta enviada. O cliente vê no portal e recebe um e-mail.", () => setT("")); }}>
      <label className="text-sm font-medium">Sua resposta<textarea value={t} onChange={(e) => setT(e.target.value)} rows={3} maxLength={2000} className={`${campo} h-auto py-2`} /></label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} disabled={t.trim().length < 2}><Send className="size-4" aria-hidden />Responder</Button>
        <Button type="button" variant="secondary" loading={pending} disabled={t.trim().length < 2} onClick={() => rodar(() => responderNaConversaAction(id, t, true), "Respondido e encerrado.", () => setT(""))}>Responder e encerrar</Button>
      </div>
    </form>
  );
}

export function Agente({ prontas }: { prontas: readonly string[] }) {
  const [msgs, setMsgs] = React.useState<{ de: "voce" | "agente"; texto: string }[]>([]);
  const [t, setT] = React.useState(""); const [pending, start] = React.useTransition();
  const perguntar = (q: string) => { if (!q.trim()) return; setMsgs((m) => [...m, { de: "voce", texto: q }]); setT(""); start(async () => { const r = await perguntarAoAgenteAction(q); setMsgs((m) => [...m, { de: "agente", texto: r.ok ? r.data.texto : r.error }]); }); };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">{prontas.map((p) => <button key={p} type="button" onClick={() => perguntar(p)} className="min-h-11 rounded-full border border-border px-3 text-sm hover:border-[var(--ds-link)]">{p}</button>)}</div>
      <ul className="space-y-2" aria-live="polite">{msgs.map((m, i) => <li key={i} className={`rounded-xl px-3 py-2 text-sm ${m.de === "agente" ? "border-l-2 border-[var(--ds-link)] bg-surface-muted/60" : "ml-8 bg-[var(--ds-link)]/10"}`}><span className="block text-[11px] font-semibold text-muted-foreground">{m.de === "agente" ? "Maurício" : "Você"}</span>{m.texto}</li>)}{pending ? <li className="text-sm text-muted-foreground">Pensando…</li> : null}</ul>
      <form className="flex gap-2" aria-label="Perguntar ao Maurício" onSubmit={(e) => { e.preventDefault(); perguntar(t); }}>
        <label className="sr-only" htmlFor="agente-q">Pergunta</label>
        <Input id="agente-q" value={t} onChange={(e) => setT(e.target.value)} maxLength={400} placeholder="Pergunte sobre a agência" />
        <Button type="submit" loading={pending}>Perguntar</Button>
      </form>
    </div>
  );
}

export function AtivarIndique({ emailSugerido }: { emailSugerido: string }) {
  const { pending, rodar } = useAcao();
  const [d, setD] = React.useState({ email: emailSugerido, telefone: "", aceite: false });
  return (
    <form className="grid gap-3" aria-label="Ativar Indique e ganhe" onSubmit={(e) => { e.preventDefault(); rodar(() => ativarIndiqueAction({ email: d.email, telefone: d.telefone, aceite: d.aceite as true }), "Indique e ganhe ativado."); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">E-mail do perfil de parceiro<Input type="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} className="mt-1" /></label>
        <label className="text-sm font-medium">WhatsApp com DDD<Input type="tel" inputMode="tel" value={d.telefone} onChange={(e) => setD({ ...d, telefone: e.target.value })} className="mt-1" /></label>
      </div>
      <label className="flex min-h-11 items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={d.aceite} onChange={(e) => setD({ ...d, aceite: e.target.checked })} />Aceito os termos do programa de parceiros da NextLevel e ligar o perfil de parceiro ao meu login.</label>
      <div><Button type="submit" loading={pending} disabled={!d.aceite}>Ativar Indique e ganhe</Button></div>
    </form>
  );
}
export function AbrirIndique() {
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { const r = await abrirIndiqueAction(); if (r.ok) window.location.assign(r.data.redirectTo); else toast.error(r.error); })}>Abrir minhas indicações</Button>;
}
