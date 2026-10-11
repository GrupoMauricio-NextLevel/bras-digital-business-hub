"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Switch, Textarea } from "@/components/ui/input";
import { IntField, MoneyField } from "@/components/finance/fields";
import { referCarrierAction } from "@/app/actions/frete";
import { cancelTicketAction, closeTicketAction, openTicketAction, saveMeuContadorSettingsAction, takeTicketAction, ticketMessageAction } from "@/app/actions/fiscal";

/** Nota em dia (D117): pedir a nota à loja (convite do Nota Fácil) ou resolver agora com o Meu Contador. */
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends { ok: boolean; error?: string }>(fn: () => Promise<T>, msg: string | ((r: T) => string), after?: (r: T) => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(typeof msg === "string" ? msg : msg(r)); after?.(r); router.refresh(); } else toast.error(r.error); }) };
}
const lab = "flex flex-col text-sm font-medium";

export function NotaEmDia({ parcelId, storeName, hint }: { parcelId: string; storeName: string; hint?: string }) {
  const { pending, run } = useRun();
  const [mode, setMode] = React.useState<"" | "LOJA" | "CONTADOR">("");
  const [phone, setPhone] = React.useState("");
  const [invite, setInvite] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ description: "", value: 0 });
  return (
    <div className="mt-2 space-y-2">
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setMode(mode === "LOJA" ? "" : "LOJA")}>Pedir a nota para a loja</Button>
        <Button size="sm" onClick={() => setMode(mode === "CONTADOR" ? "" : "CONTADOR")}><Clock className="size-4" aria-hidden />Resolver agora com o Meu Contador</Button>
      </div>
      {mode === "LOJA" ? (invite
        ? <a href={invite} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn--sm inline-flex items-center gap-2"><MessageCircle className="size-4" aria-hidden />Mandar o pedido de nota para {storeName}</a>
        : <form className="flex flex-wrap items-end gap-2" aria-label="Pedir a nota para a loja" onSubmit={(e) => { e.preventDefault(); run(() => referCarrierAction({ kind: "LOJA", name: storeName, phone, contextType: "fardo", contextId: parcelId }), "Convite pronto", (r) => { const d = (r as unknown as { data: { whatsappUrl?: string } }).data; if (d.whatsappUrl) setInvite(d.whatsappUrl); }); }}>
            <label className={lab}>WhatsApp da loja<Input required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex.: (11) 90000-0000" className="mt-1 w-48" /></label>
            <Button type="submit" size="sm" disabled={pending}>Preparar mensagem</Button>
          </form>) : null}
      {mode === "CONTADOR" ? (
        <form className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2" aria-label="Abrir chamado no Meu Contador" onSubmit={(e) => { e.preventDefault(); run(() => openTicketAction({ parcelId, storeName, storePhone: phone || undefined, description: f.description, approxValueCents: f.value || undefined }), (r) => `Chamado ${(r as unknown as { data: { number: number } }).data.number} aberto: a equipe já está vendo`, () => setMode("")); }}>
          <label className={`${lab} sm:col-span-2`}>O que foi comprado<Textarea required minLength={5} maxLength={600} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex.: 20 kits de potes de vidro, 2 caixas" className="mt-1" /></label>
          <MoneyField id={`mc-v-${parcelId}`} label="Valor aproximado (opcional)" valueCents={f.value} onChange={(v) => setF({ ...f, value: v })} />
          <label className={lab}>WhatsApp da loja (opcional)<Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></label>
          <Button type="submit" size="sm" loading={pending} className="sm:justify-self-start">Abrir chamado urgente</Button>
          <p className="text-xs text-muted-foreground sm:col-span-2">O prazo é a saída do ônibus. Se não der tempo, o fardo vai na próxima viagem, sem custo extra. Acompanhe em <Link href="/meu-bras/meu-contador" className="text-link underline">Meu Contador</Link>.</p>
        </form>
      ) : null}
    </div>
  );
}

export function TicketMessageForm({ id }: { id: string }) {
  const { pending, run } = useRun();
  const [body, setBody] = React.useState("");
  return (
    <form className="mt-2 flex gap-2" aria-label="Mensagem do chamado" onSubmit={(e) => { e.preventDefault(); run(() => ticketMessageAction(id, body), "Mensagem enviada", () => setBody("")); }}>
      <Input aria-label="Mensagem" required minLength={2} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva para a equipe contábil" />
      <Button type="submit" size="sm" disabled={pending}><Send className="size-4" aria-hidden /><span className="sr-only">Enviar</span></Button>
    </form>
  );
}

export function CancelTicketButton({ id }: { id: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Cancelar o chamado?")) run(() => cancelTicketAction(id), "Chamado cancelado"); }}>Cancelar chamado</Button>;
}

/** Contador (Master): assumir, resolver com a chave da nota ou encerrar sem solução. */
export function TicketDesk({ id, status }: { id: string; status: string }) {
  const { pending, run } = useRun();
  const [key, setKey] = React.useState("");
  const [note, setNote] = React.useState("");
  return (
    <div className="mt-3 space-y-2">
      {status === "ABERTO" ? <Button size="sm" disabled={pending} onClick={() => run(() => takeTicketAction(id), "Chamado assumido")}>Assumir</Button> : null}
      <form className="flex flex-wrap items-end gap-2" aria-label="Resolver chamado" onSubmit={(e) => { e.preventDefault(); run(() => closeTicketAction(id, { resolved: true, invoiceKey: key, note }), "Resolvido: a nota foi para o fardo"); }}>
        <label className={lab}>Chave da nota emitida<Input required inputMode="numeric" value={key} onChange={(e) => setKey(e.target.value)} placeholder="44 números" className="mt-1 w-72 max-w-full font-mono" /></label>
        <label className={lab}>Observação<Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-56" /></label>
        <Button type="submit" size="sm" disabled={pending}>Resolver</Button>
      </form>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => { const n = window.prompt("Motivo (o cliente vê):"); if (n) run(() => closeTicketAction(id, { resolved: false, note: n }), "Encerrado sem solução"); }}>Sem solução</Button>
      <TicketMessageForm id={id} />
    </div>
  );
}

export function MeuContadorSettingsForm({ value }: { value: { priceCents: number; slaHours: number; hours: string; charging: boolean } }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState(value);
  return (
    <form className="grid gap-3 sm:grid-cols-3" aria-label="Regras do Meu Contador" onSubmit={(e) => { e.preventDefault(); run(() => saveMeuContadorSettingsAction(f), "Regras do Meu Contador gravadas"); }}>
      <MoneyField id="mc-price" label="Preço do serviço" valueCents={f.priceCents} onChange={(v) => setF({ ...f, priceCents: v })} />
      <IntField id="mc-sla" label="Prazo sem ônibus" suffix="h" min={1} value={f.slaHours} onChange={(v) => setF({ ...f, slaHours: v })} />
      <label className={lab}>Horário de atendimento<Input value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} className="mt-1" /></label>
      <div className="sm:col-span-3"><Switch checked={f.charging} onCheckedChange={(v) => setF({ ...f, charging: v })} label="Cobrança ligada (só com o preço publicado e a revisão feita)" /></div>
      <Button type="submit" loading={pending} className="sm:justify-self-start">Gravar</Button>
    </form>
  );
}
