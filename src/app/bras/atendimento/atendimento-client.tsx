"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { decideBrasAppointmentAction, replyBrasSupportAction } from "@/app/actions/bras";

export function ReplyBox({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await replyBrasSupportAction(memberId, body); if (r.ok) { setBody(""); router.refresh(); } else toast.error(r.error); }); }}>
      <label htmlFor="rep" className="sr-only">Resposta da equipe</label>
      <textarea id="rep" rows={2} required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Responder ao membro…" className="min-h-12 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm" />
      <Button type="submit" loading={pending}>Enviar</Button>
    </form>
  );
}

type Appt = { id: string; preferredDate: string; period: "MANHA" | "TARDE"; topic: string; status: "REQUESTED" | "CONFIRMED" | "DONE" | "CANCELED"; scheduledAt: string | null; teamNote: string | null; importerName: string | null; companyName: string; contact: string; whatsapp: string };
const STATUS = { REQUESTED: ["Pedida", "warning"], CONFIRMED: ["Confirmada", "info"], DONE: ["Feita", "success"], CANCELED: ["Cancelada", "neutral"] } as const;

/** Visitas pedidas pelos membros: a equipe confirma dia e hora (com recado), marca como feita ou cancela. */
export function AppointmentsBoard({ items }: { items: Appt[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [form, setForm] = React.useState<Record<string, { when: string; note: string }>>({});
  const decide = (a: Appt, status: "CONFIRMED" | "DONE" | "CANCELED") => start(async () => {
    const f = form[a.id];
    const r = await decideBrasAppointmentAction(a.id, { status, scheduledAt: f?.when ? `${f.when}:00-03:00` : undefined, teamNote: f?.note || undefined });
    if (r.ok) { toast.success(status === "CONFIRMED" ? "Visita confirmada: o membro vê no Suporte" : status === "DONE" ? "Visita marcada como feita" : "Visita cancelada"); router.refresh(); } else toast.error(r.error);
  });
  return (
    <ul className="grid gap-3 lg:grid-cols-2" aria-label="Visitas">
      {items.map((a) => {
        const f = form[a.id] ?? { when: a.scheduledAt ? new Date(new Date(a.scheduledAt).getTime() - 3 * 3600_000).toISOString().slice(0, 16) : `${a.preferredDate}T${a.period === "MANHA" ? "10:00" : "14:00"}`, note: a.teamNote ?? "" };
        const set = (p: Partial<typeof f>) => setForm({ ...form, [a.id]: { ...f, ...p } });
        return (
          <li key={a.id} className="ds-card space-y-2 p-4 text-sm">
            <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">{a.companyName}<Badge tone={STATUS[a.status][1]}>{STATUS[a.status][0]}</Badge></p>
            <p className="text-muted-foreground">{a.contact} · WhatsApp {a.whatsapp}</p>
            <p>Prefere <b>{new Date(`${a.preferredDate}T12:00:00-03:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</b>, {a.period === "MANHA" ? "de manhã" : "à tarde"}{a.importerName ? <> · na <b>{a.importerName}</b></> : null}</p>
            <p className="rounded-md bg-surface-muted p-2">{a.topic}</p>
            {a.status === "REQUESTED" || a.status === "CONFIRMED" ? (
              <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
                <label className="text-xs font-medium text-muted-foreground">Dia e hora<Input type="datetime-local" value={f.when} onChange={(e) => set({ when: e.target.value })} /></label>
                <label className="text-xs font-medium text-muted-foreground">Recado ao membro<Input value={f.note} maxLength={500} onChange={(e) => set({ note: e.target.value })} placeholder="Ex.: procure a Danielle na recepção" /></label>
              </div>
            ) : a.teamNote ? <p className="text-muted-foreground">Recado: {a.teamNote}</p> : null}
            <div className="flex flex-wrap gap-2">
              {a.status === "REQUESTED" || a.status === "CONFIRMED" ? <Button size="sm" disabled={pending} onClick={() => decide(a, "CONFIRMED")}>{a.status === "CONFIRMED" ? "Remarcar" : "Confirmar"}</Button> : null}
              {a.status === "CONFIRMED" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => decide(a, "DONE")}>Marcar como feita</Button> : null}
              {a.status === "REQUESTED" || a.status === "CONFIRMED" ? <Button size="sm" variant="ghost" disabled={pending} onClick={() => decide(a, "CANCELED")}>Cancelar</Button> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
