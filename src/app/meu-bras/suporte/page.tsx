import Link from "next/link";
import { CalendarDays, Lock, MessageCircle, MessagesSquare, HelpCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { brasMemberLevel } from "@/lib/domain/bras/painel";
import { brasImportersForAgenda, brasSupportView, myBrasAppointments, myBrasSupportThread } from "@/lib/domain/bras/suporte";
import { BRAS_PLAN_LABEL, BRAS_SUPPORT_LABEL, type BrasSupportChannel } from "@/lib/bras/planos";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { AppointmentForm, CancelAppointment, ChatBox } from "./suporte-client";

export const dynamic = "force-dynamic";

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Suporte do membro (D108): o que o plano dá, sem esconder o que existe nos outros planos (com o plano que libera). */
export default async function Suporte() {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const m = await getBrasMemberByUser(db, session.user.id);
  if (!m || m.status !== "ACTIVE") return <PageHeader eyebrow="Meu Brás" title="Suporte" description="Disponível quando o cadastro estiver liberado pela equipe." />;
  const level = await brasMemberLevel(db, m);
  const view = await brasSupportView(db, session.actor, level);
  const has = (c: BrasSupportChannel) => view.channels.includes(c);
  const [thread, agenda] = await Promise.all([has("CHAT") ? myBrasSupportThread(db, session.actor) : Promise.resolve([]), myBrasAppointments(db, session.actor)]);
  // Importadoras ativas para escolher onde visitar: só o nome (sem contato).
  const importers = has("AGENDA") ? await brasImportersForAgenda(db, session.actor) : [];
  const wa = has("WHATSAPP") ? brasWhatsappUrl(`Olá! Sou da ${m.companyName}, membro ${BRAS_PLAN_LABEL[view.plan]} do Brás Digital Club.`) : null;
  const trancado = (c: BrasSupportChannel) => {
    const p = view.upgradeFor[c];
    return (
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4 text-sm">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p><b>{BRAS_SUPPORT_LABEL[c]}</b> faz parte do plano {p ? BRAS_PLAN_LABEL[p] : "pago"}. {c === "AGENDA" ? "Um horário pessoal no showroom, com alguém da equipe mostrando o que está saindo." : "Fale direto com a equipe do Brás Digital Club sobre pedidos, produtos e retirada."} <Link href="/meu-bras#plano" className="font-semibold text-link underline">Ver planos</Link></p>
      </div>
    );
  };
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Suporte" description={`Seu plano: ${BRAS_PLAN_LABEL[view.plan]}.${view.largeAccountBoost ? " Como grande conta, você também fala com a equipe pelo WhatsApp." : ""}`} />
      <ul aria-label="Seus canais" className="mb-8 flex flex-wrap gap-2 text-sm">
        {(["FAQ", "CHAT", "WHATSAPP", "AGENDA"] as const).map((c) => <li key={c} className={`rounded-full border px-3 py-1 ${has(c) ? "border-transparent bg-success-soft text-success" : "border-border text-muted-foreground"}`}>{has(c) ? "✓" : "🔒"} {BRAS_SUPPORT_LABEL[c]}</li>)}
      </ul>

      <div className="grid gap-6 xl:grid-cols-2">
        <section id="chat" aria-labelledby="sp-chat" className="ds-card flex flex-col p-5">
          <h2 id="sp-chat" className="flex items-center gap-2 text-lg font-bold"><MessagesSquare className="size-5 text-[var(--bd-acao)]" aria-hidden />Chat com a equipe</h2>
          {has("CHAT") ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Resposta em até {view.chatReplyHours} horas úteis.</p>
              <ol className="mt-4 max-h-96 flex-1 space-y-2 overflow-y-auto" aria-live="polite">
                {thread.length ? thread.map((t) => (
                  <li key={t.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${t.author === "MEMBER" ? "ml-auto bg-[var(--bd-acao)]/10" : "bg-surface-muted"}`}>
                    <p className="whitespace-pre-line">{t.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{t.author === "MEMBER" ? "Você" : "Equipe Brás Digital Club"} · {quando(t.createdAt)}</p>
                  </li>
                )) : <li className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Escreva abaixo.</li>}
              </ol>
              <ChatBox />
            </>
          ) : <div className="mt-3">{trancado("CHAT")}</div>}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="sp-wa" className="ds-card p-5">
            <h2 id="sp-wa" className="flex items-center gap-2 text-lg font-bold"><MessageCircle className="size-5 text-[var(--bd-acao)]" aria-hidden />WhatsApp da equipe</h2>
            {has("WHATSAPP") ? (wa ? <a href={wa} target="_blank" rel="noreferrer" className="bd-btn bd-btn--primario mt-3">Abrir conversa no WhatsApp</a> : <p className="mt-2 text-sm text-muted-foreground">O WhatsApp da equipe ainda não foi configurado. Use o chat.</p>) : <div className="mt-3">{trancado("WHATSAPP")}</div>}
          </section>

          <section id="agenda" aria-labelledby="sp-ag" className="ds-card scroll-mt-20 p-5">
            <h2 id="sp-ag" className="flex items-center gap-2 text-lg font-bold"><CalendarDays className="size-5 text-[var(--bd-acao)]" aria-hidden />Agenda pessoal na importadora</h2>
            {has("AGENDA") ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">Seu plano tem {view.agenda.perMonth} visita(s) por mês. Pedidas neste mês: {view.agenda.usedThisMonth}.</p>
                {view.agenda.usedThisMonth < view.agenda.perMonth ? <AppointmentForm importers={importers} /> : <p className="mt-3 text-sm">As visitas do mês já foram pedidas. Precisa de outra? Fale pelo chat.</p>}
              </>
            ) : <div className="mt-3">{trancado("AGENDA")}</div>}
            {agenda.length ? (
              <ul className="mt-4 space-y-2" aria-label="Suas visitas">
                {agenda.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-semibold">{a.status === "CONFIRMED" && a.scheduledAt ? `Confirmada: ${quando(new Date(a.scheduledAt).toISOString())}` : a.status === "REQUESTED" ? `Pedida para ${new Date(`${a.preferredDate}T12:00:00-03:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}, ${a.period === "MANHA" ? "manhã" : "tarde"}` : a.status === "DONE" ? "Visita feita" : "Cancelada"}{a.importerName ? ` · ${a.importerName}` : ""}</p>
                    <p className="text-muted-foreground">{a.topic}</p>
                    {a.teamNote ? <p className="mt-1">Recado da equipe: {a.teamNote}</p> : null}
                    {a.status === "REQUESTED" || a.status === "CONFIRMED" ? <CancelAppointment id={a.id} /> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </div>

      <section id="faq" aria-labelledby="sp-faq" className="mt-8 scroll-mt-20">
        <h2 id="sp-faq" className="flex items-center gap-2 text-lg font-bold"><HelpCircle className="size-5 text-[var(--bd-acao)]" aria-hidden />Perguntas frequentes</h2>
        <div className="ds-card mt-3 divide-y divide-border">
          {view.faq.map((f) => <details key={f.q} className="p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}
        </div>
      </section>
    </>
  );
}
