"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cancelMyBrasAppointmentAction, requestBrasAppointmentAction, sendBrasSupportMessageAction } from "@/app/actions/bras";

export function ChatBox() {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await sendBrasSupportMessageAction(body); if (r.ok) { setBody(""); router.refresh(); } else toast.error(r.error); }); }}>
      <label htmlFor="chat-msg" className="sr-only">Sua mensagem</label>
      <textarea id="chat-msg" rows={2} required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva para a equipe…" className="min-h-12 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm" />
      <Button type="submit" loading={pending}>Enviar</Button>
    </form>
  );
}

const amanha = () => new Date(Date.now() + 86_400_000 - 3 * 3600_000).toISOString().slice(0, 10);

export function AppointmentForm({ importers }: { importers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = React.useState({ preferredDate: amanha(), period: "MANHA" as "MANHA" | "TARDE", importerId: "", topic: "" });
  const [pending, start] = React.useTransition();
  return (
    <form className="mt-3 grid gap-3 sm:grid-cols-2" aria-label="Pedir visita" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await requestBrasAppointmentAction(f); if (r.ok) { toast.success("Visita pedida: a equipe confirma dia e hora pelo Suporte"); setF({ ...f, topic: "" }); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="text-sm font-medium">Dia preferido<Input type="date" required min={amanha()} value={f.preferredDate} onChange={(e) => setF({ ...f, preferredDate: e.target.value })} /></label>
      <label className="text-sm font-medium">Período<Select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value as "MANHA" | "TARDE" })}><option value="MANHA">Manhã</option><option value="TARDE">Tarde</option></Select></label>
      {importers.length ? <label className="text-sm font-medium sm:col-span-2">Importadora (opcional)<Select value={f.importerId} onChange={(e) => setF({ ...f, importerId: e.target.value })}><option value="">A equipe sugere</option>{importers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></label> : null}
      <label className="text-sm font-medium sm:col-span-2">O que você quer ver<Input required minLength={5} maxLength={500} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="Ex.: utilidades para o Natal, caixas até R$ 300" /></label>
      <Button type="submit" loading={pending} className="sm:col-span-2 sm:justify-self-start">Pedir visita</Button>
    </form>
  );
}

export function CancelAppointment({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="ghost" className="mt-1" disabled={pending} onClick={() => start(async () => { if (!window.confirm("Cancelar esta visita?")) return; const r = await cancelMyBrasAppointmentAction(id); if (r.ok) router.refresh(); else toast.error(r.error); })}>Cancelar visita</Button>;
}
