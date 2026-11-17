import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { NotFoundError } from "@/lib/domain/errors";
import { conversaNaAgencia } from "@/lib/agencias/gestao";
import { ResponderAoCliente } from "@/components/agencia/gestao-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversa" };
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Conversa com o cliente (D325): o pedido do portal e as mensagens dos dois lados. */
export default async function Conversa({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("AGENCY");
  const c = await conversaNaAgencia(await getDb(), session.actor, (await params).id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const s = c.solicitacao;
  return (
    <div className="mx-auto max-w-[820px] space-y-5">
      <PageHeader backHref="/agencia/atendimento" eyebrow="Atendimento" title={c.cliente.nome} description={`Começou em ${quando(s.createdAt)} por ${s.autorEmail}`} />
      <ol className="space-y-3" aria-label="Mensagens">
        <li className="ds-card ml-0 mr-10 p-4 text-sm"><span className="block text-xs text-muted-foreground">Cliente · {quando(s.createdAt)}</span>{s.texto}</li>
        {!c.mensagens.length && s.resposta ? <li className="ml-10 rounded-2xl border-l-2 border-[var(--ds-link)] bg-surface p-4 text-sm"><span className="block text-xs text-muted-foreground">Agência</span>{s.resposta}</li> : null}
        {c.mensagens.map((m) => <li key={m.id} className={m.autor === "AGENCIA" ? "ml-10 rounded-2xl border-l-2 border-[var(--ds-link)] bg-surface p-4 text-sm" : "ds-card mr-10 p-4 text-sm"}><span className="block text-xs text-muted-foreground">{m.autor === "AGENCIA" ? m.autorNome : "Cliente"} · {quando(m.createdAt)}</span>{m.texto}</li>)}
      </ol>
      <section className="ds-card p-5" aria-label="Responder"><ResponderAoCliente id={s.id} /></section>
    </div>
  );
}
