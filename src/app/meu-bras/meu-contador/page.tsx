import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getMeuContadorSettings, myTickets } from "@/lib/domain/fiscal/meu-contador";
import { TicketCard } from "@/components/fiscal/ticket-card";
import { CancelTicketButton, TicketMessageForm } from "@/components/fiscal/nota-forms";

export const dynamic = "force-dynamic";

/** Meu Contador (D117): os chamados urgentes de nota do cliente, com a conversa com a equipe contábil. */
export default async function MeuContador() {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [tickets, settings] = await Promise.all([myTickets(db, session.actor), getMeuContadorSettings(db)]);
  return (
    <>
      <PageHeader eyebrow="Meu Brás · Nota em dia" title="Meu Contador" description={`Ficou sem nota? A equipe contábil resolve pelo caminho correto, com prazo até a saída do ônibus. Atendimento: ${settings.hours}. Abra o chamado pelo fardo, em Fretes.`} />
      {tickets.length ? <ul className="grid gap-3 lg:grid-cols-2">{tickets.map((t) => (
        <TicketCard key={t.id} t={t}>{t.status === "ABERTO" || t.status === "EM_ATENDIMENTO" ? <><TicketMessageForm id={t.id} />{t.status === "ABERTO" ? <CancelTicketButton id={t.id} /> : null}</> : null}</TicketCard>
      ))}</ul> : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum chamado. Quando um fardo estiver sem nota, use &quot;Resolver agora com o Meu Contador&quot; em Fretes.</p>}
    </>
  );
}
