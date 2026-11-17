import Link from "next/link";
import { Inbox, MessagesSquare } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { atendimentoDaAgencia, caixaDeEntrada } from "@/lib/agencias/gestao";

export const dynamic = "force-dynamic";
export const metadata = { title: "Atendimento" };

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const SIT = { ABERTA: "Esperando a agência", EM_ANDAMENTO: "Em andamento", RESPONDIDA: "Encerrado" } as const;
const TIPO = { PEDIDO: "Pedido", IDEIA: "Ideia", DUVIDA: "Dúvida" } as const;

/** Atendimento e Caixa de entrada da agência (D325), como o Atendimento e a Caixa de entrada do Master. */
export default async function Atendimento({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  const aba = (await searchParams).aba === "caixa" ? "caixa" : "conversas";
  const podeCaixa = pode.editarClientes(membro) || pode.verValores(membro);
  const [conversas, caixa] = await Promise.all([atendimentoDaAgencia(db, session.actor), aba === "caixa" && podeCaixa ? caixaDeEntrada(db, session.actor) : Promise.resolve([])]);
  const abas = (
    <nav aria-label="Atendimento" className="flex gap-2">
      <Link href="/agencia/atendimento" aria-current={aba === "conversas" ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${aba === "conversas" ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10 font-semibold" : "border-border"}`}>Conversas ({conversas.filter((c) => c.situacao === "ABERTA").length} esperando)</Link>
      {podeCaixa ? <Link href="/agencia/atendimento?aba=caixa" aria-current={aba === "caixa" ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${aba === "caixa" ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10 font-semibold" : "border-border"}`}>Caixa de entrada</Link> : null}
    </nav>
  );
  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <PageHeader eyebrow="Clientes" title="Atendimento" description="As conversas com os clientes que chegam pelo portal, num lugar só, e os e-mails que o sistema mandou para eles." />
      {abas}
      {aba === "conversas" ? (conversas.length ? (
        <ul className="ds-card ds-card--flush divide-y divide-border overflow-hidden" aria-label="Conversas">{conversas.map((c) => (
          <li key={c.id}><Link href={`/agencia/atendimento/${c.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-muted/50">
            <span className="min-w-0"><b className="block">{c.clienteNome}</b><span className="block truncate text-sm text-muted-foreground">{TIPO[c.tipo]}: {c.texto}</span></span>
            <span className="text-right text-xs"><span className={`rounded-full px-2.5 py-0.5 font-semibold ${c.situacao === "ABERTA" ? "bg-warning-soft text-warning" : c.situacao === "EM_ANDAMENTO" ? "bg-accent-soft text-[var(--ds-link)]" : "bg-surface-muted text-muted-foreground"}`}>{SIT[c.situacao]}</span><span className="mt-1 block text-muted-foreground">{c.mensagens} mensagem(ns) · {quando(c.ultimaEm)}</span></span>
          </Link></li>
        ))}</ul>
      ) : <EmptyState icon={MessagesSquare} title="Nenhuma conversa ainda" description="Quando um cliente mandar pedido, ideia ou dúvida pelo portal, a conversa aparece aqui." />) : (caixa.length ? (
        <ul className="ds-card ds-card--flush divide-y divide-border overflow-hidden" aria-label="E-mails enviados aos clientes">{caixa.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span className="min-w-0"><b className="block">{e.cliente}</b><span className="block truncate text-muted-foreground">{e.subject}</span></span><span className="text-xs text-muted-foreground">{e.status === "FAILED" ? <b className="text-danger">Falhou</b> : "Enviado"} · {quando(e.createdAt)}</span></li>
        ))}</ul>
      ) : <EmptyState icon={Inbox} title="Nenhum e-mail enviado aos clientes ainda" description="Avisos de aprovação, contratos, cobranças e respostas aparecem aqui." />)}
    </div>
  );
}
