"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Handshake, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CARGAS_WEEKDAYS as WEEKDAYS } from "@/lib/cargas/rotulos";
import { answerPreferredAction, askPreferredAction, callFixedPickupAction, loadMessageAction, markPreferredAction, rateLoadAction, setFixedPickupAction } from "@/app/actions/vias";

/** Formulários das duas vias (D118): preferida, coleta fixa e avaliação da coleta. */
type Result = { ok: boolean; error?: string };
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: (fn: () => Promise<Result>, msg: string, after?: () => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(msg); after?.(); router.refresh(); } else toast.error(r.error); }) };
}

/** Transportadora pede para ser preferida da importadora, com um recado curto. */
export function AskPreferredForm({ importerId, importerName, again }: { importerId: string; importerName: string; again?: boolean }) {
  const { pending, run } = useRun();
  const [open, setOpen] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  if (!open) return <Button variant="secondary" size="sm" onClick={() => setOpen(true)}><Handshake className="size-4" aria-hidden />{again ? "Pedir de novo" : "Pedir para ser preferida"}</Button>;
  return (
    <form className="grid gap-2" aria-label={`Pedir para ser preferida da ${importerName}`} onSubmit={(e) => { e.preventDefault(); run(() => askPreferredAction(importerId, msg), "Pedido enviado à importadora", () => setOpen(false)); }}>
      <label className="flex flex-col text-sm font-medium">Recado para a importadora (opcional)<Input maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ex.: coleto toda quinta à tarde, levo para MG e GO" className="mt-1" /></label>
      <div className="flex gap-2"><Button type="submit" size="sm" disabled={pending}>Enviar pedido</Button><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button></div>
    </form>
  );
}

/** Importadora aceita ou recusa o pedido de preferida. */
export function AnswerPreferred({ id, name }: { id: string; name: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run(() => answerPreferredAction(id, true), `${name} agora é preferida`)} aria-label={`Aceitar ${name} como preferida`}><Check className="size-4" aria-hidden />Aceitar</Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => answerPreferredAction(id, false), "Pedido recusado")} aria-label={`Recusar ${name}`}><X className="size-4" aria-hidden />Recusar</Button>
    </div>
  );
}

export function MarkPreferredButton({ carrierId, name }: { carrierId: string; name: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => markPreferredAction(carrierId), `${name} agora é preferida`)} aria-label={`Marcar ${name} como preferida`}><Star className="size-4" aria-hidden />Preferida</Button>;
}

/** Coleta fixa com a preferida: dias da semana + hora. Sem dias = desliga. */
export function FixedPickupForm({ id, name, weekdays, time }: { id: string; name: string; weekdays: number[]; time: string | null }) {
  const { pending, run } = useRun();
  const [days, setDays] = React.useState<number[]>(weekdays);
  const [t, setT] = React.useState(time ?? "");
  return (
    <form className="grid gap-2" aria-label={`Coleta fixa com ${name}`} onSubmit={(e) => { e.preventDefault(); run(() => setFixedPickupAction(id, { weekdays: days, time: days.length ? t : "" }), days.length ? "Coleta fixa salva" : "Coleta fixa desligada"); }}>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Coleta fixa (opcional)</legend>
        <div className="flex flex-wrap gap-1.5">{WEEKDAYS.map((d, i) => (
          <label key={d} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand-primary)] ${days.includes(i) ? "border-foreground bg-surface-muted text-foreground underline decoration-2 underline-offset-4" : "border-border"}`}>
            <input type="checkbox" className="sr-only" checked={days.includes(i)} onChange={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort())} />{d}
          </label>
        ))}</div>
      </fieldset>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-sm font-medium">Hora<Input type="time" value={t} onChange={(e) => setT(e.target.value)} required={days.length > 0} className="mt-1 w-32" /></label>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>Salvar coleta fixa</Button>
      </div>
    </form>
  );
}

/** Avaliação da coleta: pontualidade e cuidado, de 1 a 5. */
export function RateLoadForm({ loadId, number }: { loadId: string; number: number }) {
  const { pending, run } = useRun();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ punctuality: 5, care: 5, comment: "" });
  if (!open) return <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Star className="size-4" aria-hidden />Avaliar coleta</Button>;
  const stars = (key: "punctuality" | "care", label: string) => (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={`cursor-pointer rounded-md border px-2.5 py-1 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand-primary)] ${f[key] === n ? "border-foreground bg-surface-muted text-foreground underline decoration-2 underline-offset-4" : "border-border"}`}>
          <input type="radio" name={`${key}-${loadId}`} className="sr-only" checked={f[key] === n} onChange={() => setF({ ...f, [key]: n })} />{n}
        </label>
      ))}</div>
    </fieldset>
  );
  return (
    <form className="grid gap-2" aria-label={`Avaliar a coleta ${number}`} onSubmit={(e) => { e.preventDefault(); run(() => rateLoadAction(loadId, { punctuality: f.punctuality, care: f.care, comment: f.comment || undefined }), "Obrigado pela avaliação", () => setOpen(false)); }}>
      {stars("punctuality", "Pontualidade (1 a 5)")}
      {stars("care", "Cuidado com a carga (1 a 5)")}
      <label className="flex flex-col text-sm font-medium">Comentário (opcional)<Input maxLength={300} value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} className="mt-1" /></label>
      <div className="flex gap-2"><Button type="submit" size="sm" disabled={pending}>Enviar avaliação</Button><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button></div>
    </form>
  );
}

/** Nota pública (aparece com 3 avaliações ou mais). */
export function RatingBadge({ rating }: { rating?: { count: number; score: number } | null }) {
  if (!rating || rating.count < 3) return null;
  return <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold"><Star className="size-3.5" aria-hidden />{String(rating.score).replace(".", ",")} <span className="font-normal text-muted-foreground">({rating.count} avaliações)</span></span>;
}

/** Conversa presa à coleta: mensagens prontas de um toque ou texto curto. Fica no histórico da coleta. */
export function LoadMessageForm({ loadId, number, quick }: { loadId: string; number: number; quick: readonly string[] }) {
  const { pending, run } = useRun();
  const [text, setText] = React.useState("");
  return (
    <form className="mt-2 grid gap-2" aria-label={`Mensagem na coleta ${number}`} onSubmit={(e) => { e.preventDefault(); run(() => loadMessageAction(loadId, text), "Mensagem enviada", () => setText("")); }}>
      <div className="flex flex-wrap gap-1.5">{quick.map((q) => <Button key={q} type="button" size="sm" variant="secondary" disabled={pending} onClick={() => run(() => loadMessageAction(loadId, q), "Mensagem enviada")}>{q}</Button>)}</div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`msg-${loadId}`}>Mensagem para a coleta {number}</label>
        <Input id={`msg-${loadId}`} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem curta" className="min-w-0 flex-1" />
        <Button type="submit" size="sm" disabled={pending || text.trim().length < 2}>Enviar</Button>
      </div>
    </form>
  );
}

/** Coleta fixa de hoje: os pedidos para os estados da preferida já vêm juntos; a importadora só confirma. */
export function FixedPickupCall({ plan, today }: { plan: { carrierId: string; name: string; time: string; period: "MANHA" | "TARDE"; requestIds: string[]; boxes: number }; today: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--brand-primary)]/40 p-3 text-sm">
      <p><b>Coleta fixa de hoje: {plan.name} às {plan.time}</b><span className="block text-muted-foreground">{plan.requestIds.length} pedido(s), {plan.boxes} caixa(s) para os estados que ela atende.</span></p>
      <Button size="sm" disabled={pending} onClick={() => run(() => callFixedPickupAction({ carrierId: plan.carrierId, requestIds: plan.requestIds, pickupDate: today, period: plan.period }), "Coleta fixa chamada")}>Confirmar e chamar</Button>
    </div>
  );
}
