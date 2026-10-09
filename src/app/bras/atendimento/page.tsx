import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { brasSupportInbox, brasSupportThreadForMaster, listBrasAppointments } from "@/lib/domain/bras/suporte";
import { LinkTabs } from "@/components/app/link-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { AppointmentsBoard, ReplyBox } from "./atendimento-client";

export const dynamic = "force-dynamic";

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Atendimento da Brás (D108): conversas do chat (Prata em diante) e agenda pessoal na importadora (Ouro e Platinum). */
export default async function Atendimento({ searchParams }: { searchParams: Promise<{ aba?: string; membro?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const sp = await searchParams;
  const aba = sp.aba === "agenda" ? "agenda" : "conversas";
  const db = await getDb();
  const [d, inbox, agenda] = await Promise.all([estudioData(session.actor), brasSupportInbox(db, session.actor), listBrasAppointments(db, session.actor)]);
  const aberta = sp.membro && inbox.some((i) => i.memberId === sp.membro) ? await brasSupportThreadForMaster(db, session.actor, sp.membro) : null;
  const pendentes = agenda.filter((a) => a.status === "REQUESTED").length;
  const naoLidas = inbox.reduce((s, i) => s + i.unread, 0);
  return (
    <>
      <EstudioHeader title="Atendimento" description="Chat dos membros pagos e visitas agendadas nas importadoras. As perguntas frequentes (todos os planos) ficam em Planos e regras." {...d} />
      <LinkTabs label="Atendimento" active={aba} items={[{ key: "conversas", label: `Conversas${naoLidas ? ` (${naoLidas})` : ""}`, href: "/bras/atendimento" }, { key: "agenda", label: `Agenda${pendentes ? ` (${pendentes})` : ""}`, href: "/bras/atendimento?aba=agenda" }]} />
      <div className="mt-6">
        {aba === "agenda" ? (
          agenda.length ? <AppointmentsBoard items={agenda.map((a) => ({ ...a, scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString() : null }))} /> : <EmptyState title="Nenhuma visita pedida" description="Membros Ouro e Platinum pedem visitas pelo Suporte do Meu Brás. Elas aparecem aqui para você confirmar dia e hora." />
        ) : inbox.length === 0 ? (
          <EmptyState title="Nenhuma conversa ainda" description="Membros com plano Prata, Ouro ou Platinum falam com a equipe pelo chat do Meu Brás." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
            <ul className="ds-card divide-y divide-border" aria-label="Conversas">
              {inbox.map((i) => (
                <li key={i.memberId}>
                  <Link href={`/bras/atendimento?membro=${i.memberId}`} aria-current={sp.membro === i.memberId ? "true" : undefined} className={`block p-3 text-sm hover:bg-surface-muted ${sp.membro === i.memberId ? "bg-accent-soft" : ""}`}>
                    <span className="flex items-center justify-between gap-2 font-semibold">{i.companyName}{i.unread ? <Badge tone="warning">{i.unread} nova(s)</Badge> : i.lastAuthor === "TEAM" ? <Badge tone="success">Respondida</Badge> : null}</span>
                    <span className="mt-0.5 block truncate text-muted-foreground">{i.lastAuthor === "TEAM" ? "Equipe: " : ""}{i.last}</span>
                    <span className="text-xs text-muted-foreground">{quando(i.lastAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <section className="ds-card flex min-h-80 flex-col p-4" aria-label="Conversa aberta">
              {aberta ? (
                <>
                  <h2 className="text-base font-semibold">{aberta.member.companyName}</h2>
                  <ol className="mt-3 flex-1 space-y-2">
                    {aberta.messages.map((m) => (
                      <li key={m.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.author === "TEAM" ? "ml-auto bg-accent-soft" : "bg-surface-muted"}`}>
                        <p className="whitespace-pre-line">{m.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{m.author === "TEAM" ? "Equipe" : "Membro"} · {quando(m.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                  <ReplyBox memberId={aberta.member.id} />
                </>
              ) : <p className="text-sm text-muted-foreground">Escolha uma conversa.</p>}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
