"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Minus, PackageCheck, Plus, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch } from "@/components/ui/input";
import { MoneyField } from "@/components/finance/fields";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { formatBRL } from "@/lib/money";
import {
  busCollectAction, busDeliverAction, cancelMyParcelAction, createTripAction, helperCollectAction, helperDeliverAction, reserveParcelsAction, respondParcelAction, saveRouteAction,
  setParcelInvoiceAction, tripActionAction,
} from "@/app/actions/excursao";

/**
 * Formulários da Cargas Excursão (D114): dono do ônibus (rotas, viagens, chamadas, coleta e entrega), ajudante (link
 * sem login) e cliente (reservar fardos). Botões grandes: o dono do ônibus usa no celular, muitas vezes em pé no Brás.
 */
type Result = { ok: boolean; error?: string };
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends Result>(fn: () => Promise<T>, msg: string | ((r: T) => string), after?: (r: T) => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(typeof msg === "string" ? msg : msg(r)); after?.(r); router.refresh(); } else toast.error(r.error); }) };
}
const lab = "flex flex-col text-sm font-medium";
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
type Uf = (typeof BRAS_UFS)[number];

export type RouteValue = { id?: string; name: string; originCity: string; originUf: Uf; citiesServed: { city: string; uf: Uf }[]; brasPoint: string; cityPoint: string; arrivalWeekdays: number[]; travelHours: number; prices: { P: number; M: number; G: number }; active: boolean };
const emptyRoute: RouteValue = { name: "", originCity: "", originUf: "MG", citiesServed: [], brasPoint: "", cityPoint: "", arrivalWeekdays: [], travelHours: 10, prices: { P: 3000, M: 5000, G: 8000 }, active: true };

/** Rota fixa com a tabela por tamanho. As cidades atendidas no caminho vão uma por linha: "Cidade/UF". */
export function RouteForm({ carrierId, value }: { carrierId: string | null; value?: RouteValue }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState<RouteValue>(value ?? emptyRoute);
  const [cities, setCities] = React.useState((value?.citiesServed ?? []).map((c) => `${c.city}/${c.uf}`).join("\n"));
  const parsedCities = cities.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [city, uf] = l.split("/").map((x) => x.trim()); return { city: city ?? "", uf: (uf ?? "").toUpperCase() as Uf }; });
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label={value ? `Editar rota ${value.name}` : "Nova rota"} onSubmit={(e) => { e.preventDefault(); run(() => saveRouteAction(carrierId, value?.id ?? null, { ...f, citiesServed: parsedCities }), value ? "Rota atualizada" : "Rota cadastrada", () => { if (!value) { setF(emptyRoute); setCities(""); } }); }}>
      <label className={`${lab} sm:col-span-2`}>Nome da rota<Input required minLength={3} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Brás ↔ Belo Horizonte" className="mt-1" /></label>
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <label className={lab}>Cidade de origem<Input required minLength={2} value={f.originCity} onChange={(e) => setF({ ...f, originCity: e.target.value })} className="mt-1" /></label>
        <label className={lab}>UF<Select value={f.originUf} onChange={(e) => setF({ ...f, originUf: e.target.value as Uf })} className="mt-1">{BRAS_UFS.map((u) => <option key={u} value={u}>{u}</option>)}</Select></label>
      </div>
      <label className={lab}>Horas de viagem<Input required type="number" min={1} max={96} value={f.travelHours} onChange={(e) => setF({ ...f, travelHours: Number(e.target.value) || 1 })} className="mt-1" /></label>
      <label className={`${lab} sm:col-span-2`}>Cidades atendidas no caminho (opcional, uma por linha)<textarea className="ds-input mt-1 h-auto min-h-20 py-2" value={cities} onChange={(e) => setCities(e.target.value)} placeholder={"Ex.: Contagem/MG\nBetim/MG"} /></label>
      <label className={`${lab} sm:col-span-2`}>Ponto de embarque no Brás<Input required minLength={5} maxLength={200} value={f.brasPoint} onChange={(e) => setF({ ...f, brasPoint: e.target.value })} placeholder="Ex.: Rua Rodrigues dos Santos, 600 (estacionamento)" className="mt-1" /></label>
      <label className={`${lab} sm:col-span-2`}>Onde o cliente retira na cidade<Input required minLength={5} maxLength={200} value={f.cityPoint} onChange={(e) => setF({ ...f, cityPoint: e.target.value })} placeholder="Ex.: Rodoviária, plataforma 3" className="mt-1" /></label>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Dias que chega ao Brás</legend>
        <div className="flex flex-wrap gap-1.5">{WEEKDAYS.map((d, i) => (
          <label key={d} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand-primary)] ${f.arrivalWeekdays.includes(i) ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary,#fff)]" : "border-border"}`}>
            <input type="checkbox" className="sr-only" checked={f.arrivalWeekdays.includes(i)} onChange={() => setF({ ...f, arrivalWeekdays: f.arrivalWeekdays.includes(i) ? f.arrivalWeekdays.filter((x) => x !== i) : [...f.arrivalWeekdays, i].sort() })} />{d}
          </label>
        ))}</div>
      </fieldset>
      <fieldset className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-medium">Preço por fardo</legend>
        <MoneyField id={`pr-p-${value?.id ?? "n"}`} label="Fardinho P" valueCents={f.prices.P} onChange={(v) => setF({ ...f, prices: { ...f.prices, P: v } })} />
        <MoneyField id={`pr-m-${value?.id ?? "n"}`} label="Fardo M" valueCents={f.prices.M} onChange={(v) => setF({ ...f, prices: { ...f.prices, M: v } })} />
        <MoneyField id={`pr-g-${value?.id ?? "n"}`} label="Fardo G" valueCents={f.prices.G} onChange={(v) => setF({ ...f, prices: { ...f.prices, G: v } })} />
      </fieldset>
      {value ? <div className="sm:col-span-2"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} label="Rota em uso" /></div> : null}
      <Button type="submit" loading={pending} className="sm:justify-self-start">{value ? "Gravar rota" : "Cadastrar rota"}</Button>
    </form>
  );
}

/** Abrir viagem: chegada e saída no Brás. */
export function TripForm({ carrierId, routes, defaultCapacity }: { carrierId: string | null; routes: { id: string; name: string }[]; defaultCapacity: number }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ routeId: routes[0]?.id ?? "", arriveBrasAt: "", departAt: "", capacityUnits: defaultCapacity });
  if (!routes.length) return <p className="text-sm text-muted-foreground">Cadastre uma rota (abaixo) para abrir a primeira viagem.</p>;
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label="Abrir viagem" onSubmit={(e) => { e.preventDefault(); run(() => createTripAction(carrierId, f), (r) => `Viagem ${(r as unknown as { data: { number: number } }).data.number} aberta: os clientes já podem reservar`); }}>
      <label className={`${lab} sm:col-span-2`}>Rota<Select value={f.routeId} onChange={(e) => setF({ ...f, routeId: e.target.value })} className="mt-1">{routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></label>
      <label className={lab}>Chegada ao Brás<Input required type="datetime-local" value={f.arriveBrasAt} onChange={(e) => setF({ ...f, arriveBrasAt: e.target.value })} className="mt-1" /></label>
      <label className={lab}>Saída de São Paulo<Input required type="datetime-local" value={f.departAt} onChange={(e) => setF({ ...f, departAt: e.target.value })} className="mt-1" /></label>
      <label className={lab}>Bagageiro (fardinhos equivalentes)<Input required type="number" min={10} max={2000} value={f.capacityUnits} onChange={(e) => setF({ ...f, capacityUnits: Number(e.target.value) || 10 })} className="mt-1" /></label>
      <Button type="submit" size="lg" loading={pending} className="sm:col-span-2 sm:justify-self-start">Abrir viagem</Button>
    </form>
  );
}

const TRIP_ACTIONS: Record<string, { action: "FECHAR" | "REABRIR" | "SAIR" | "CHEGAR" | "ENCERRAR" | "CANCELAR"; label: string; variant?: "secondary" | "ghost"; confirm?: string }[]> = {
  ABERTA: [{ action: "SAIR", label: "Saí de São Paulo", confirm: "Confirmar a saída? Fardos não coletados ficam como \"não embarcou\"." }, { action: "FECHAR", label: "Fechar pedidos", variant: "secondary" }, { action: "CANCELAR", label: "Cancelar viagem", variant: "ghost", confirm: "Cancelar a viagem? Os clientes são avisados." }],
  LOTADA: [{ action: "SAIR", label: "Saí de São Paulo", confirm: "Confirmar a saída? Fardos não coletados ficam como \"não embarcou\"." }, { action: "REABRIR", label: "Reabrir pedidos", variant: "secondary" }, { action: "CANCELAR", label: "Cancelar viagem", variant: "ghost", confirm: "Cancelar a viagem? Os clientes são avisados." }],
  EM_VIAGEM: [{ action: "CHEGAR", label: "Cheguei na cidade" }],
  CHEGOU: [{ action: "ENCERRAR", label: "Encerrar viagem", variant: "secondary", confirm: "Encerrar a viagem? Fardos não entregues ficam no histórico." }],
};
export function TripActions({ tripId, status }: { tripId: string; status: string }) {
  const { pending, run } = useRun();
  const list = TRIP_ACTIONS[status] ?? [];
  if (!list.length) return null;
  return <div className="flex flex-wrap gap-2">{list.map((a) => <Button key={a.action} size={a.variant ? "md" : "lg"} variant={a.variant} disabled={pending} onClick={() => { if (!a.confirm || window.confirm(a.confirm)) run(() => tripActionAction(tripId, a.action), "Viagem atualizada"); }}>{a.label}</Button>)}</div>;
}

const REASONS = ["Sem espaço", "Tamanho grande demais", "Data não serve", "Loja fora da rota"];
/** Cartão de chamada: aceitar com um toque ou recusar com o motivo de um toque. */
export function ParcelCallActions({ parcelId }: { parcelId: string }) {
  const { pending, run } = useRun();
  const [refusing, setRefusing] = React.useState(false);
  if (refusing) return (
    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Motivo da recusa">
      {REASONS.map((r) => <Button key={r} size="sm" variant="secondary" disabled={pending} onClick={() => run(() => respondParcelAction(parcelId, { accept: false, reason: r }), "Recusado. O cliente é avisado.")}>{r}</Button>)}
      <Button size="sm" variant="ghost" onClick={() => setRefusing(false)}>Voltar</Button>
    </div>
  );
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Button size="lg" disabled={pending} onClick={() => run(() => respondParcelAction(parcelId, { accept: true }), "Fardo aceito")}><Check className="size-5" aria-hidden />Aceitar</Button>
      <Button size="lg" variant="secondary" disabled={pending} onClick={() => setRefusing(true)}><X className="size-5" aria-hidden />Recusar</Button>
    </div>
  );
}

/** Coletar no Brás pelo código da etiqueta (dono do ônibus logado ou ajudante pelo link). */
export function CollectByLabel({ token }: { token?: string }) {
  const { pending, run } = useRun();
  const [label, setLabel] = React.useState("");
  return (
    <form className="flex flex-wrap items-end gap-2" aria-label="Coletar fardo" onSubmit={(e) => { e.preventDefault(); run(() => (token ? helperCollectAction(token, label) : busCollectAction(label)), `Fardo ${label} coletado`, () => setLabel("")); }}>
      <label className={lab}>Código da etiqueta<Input required value={label} onChange={(e) => setLabel(e.target.value.replace(/[^\d-]/g, ""))} inputMode="numeric" placeholder="Ex.: 8001-07" autoComplete="off" className="mt-1 w-40 font-mono text-lg" /></label>
      <Button type="submit" size="lg" disabled={pending}><ScanLine className="size-5" aria-hidden />Coletei</Button>
    </form>
  );
}

/** Entregar na cidade com o código do cliente. */
export function DeliverParcel({ parcelId, token }: { parcelId: string; token?: string }) {
  const { pending, run } = useRun();
  const [code, setCode] = React.useState("");
  return (
    <form className="mt-2 flex flex-wrap items-end gap-2" aria-label="Entregar fardo" onSubmit={(e) => { e.preventDefault(); run(() => (token ? helperDeliverAction(token, parcelId, code) : busDeliverAction(parcelId, code)), "Fardo entregue", () => setCode("")); }}>
      <label className={lab}>Código do cliente<Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EX-XXXXXX" autoComplete="off" className="mt-1 w-40 font-mono uppercase" /></label>
      <Button type="submit" disabled={pending}><PackageCheck className="size-4" aria-hidden />Entregar</Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
type SizeKey = "P" | "M" | "G";
const SIZE = { P: "Fardinho P", M: "Fardo M", G: "Fardo G" } as const;
type TripOption = { tripId: string; number: number; carrierName: string; departAt: string; brasPoint: string; prices: { P: number; M: number; G: number }; full: boolean };

/** Reservar espaço no ônibus: quantos P, M e G, a loja de coleta e quem retira. Gera os códigos e o texto para a loja. */
export function ReserveParcelsForm({ trip, sizes, requests }: { trip: TripOption; sizes: Record<SizeKey, { maxCm: string; maxKg: number }>; requests: { id: string; label: string }[] }) {
  const { pending, run } = useRun();
  const [items, setItems] = React.useState<Record<SizeKey, number>>({ P: 1, M: 0, G: 0 });
  const [f, setF] = React.useState({ storeName: "", storeAddress: "", recipientName: "", requestId: "", invoiceKey: "" });
  const [done, setDone] = React.useState<{ waitlist: boolean; parcels: { label: string; size: SizeKey; deliveryCode: string }[]; storeMessage: string } | null>(null);
  const total = (Object.keys(items) as SizeKey[]).reduce((s, k) => s + items[k] * trip.prices[k], 0);
  if (done) return (
    <div role="status" className="space-y-3 rounded-lg border border-success/40 bg-success-soft p-4 text-sm">
      <p className="font-semibold">{done.waitlist ? "Viagem lotada: você entrou na lista de espera. Se abrir espaço, o ônibus aceita e você é avisado." : "Reserva enviada. O ônibus aceita e você acompanha em Meus fretes."}</p>
      <ul className="grid gap-1 sm:grid-cols-2">{done.parcels.map((p) => <li key={p.label} className="rounded border border-border bg-surface p-2"><b>Etiqueta {p.label}</b> · {SIZE[p.size]}<span className="block">Seu código para retirar: <span className="font-mono font-bold">{p.deliveryCode}</span></span></li>)}</ul>
      <p className="text-muted-foreground">Mande para a loja escrever a etiqueta no fardo (ou imprimir):</p>
      <p className="rounded border border-border bg-surface p-2">{done.storeMessage}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard?.writeText(done.storeMessage); toast.success("Texto copiado"); }}><Copy className="size-4" aria-hidden />Copiar para a loja</Button>
        <a className="ds-btn ds-btn--sm" href={`https://wa.me/?text=${encodeURIComponent(done.storeMessage)}`} target="_blank" rel="noopener noreferrer">Mandar no WhatsApp</a>
        <Button size="sm" variant="ghost" onClick={() => setDone(null)}>Reservar mais</Button>
      </div>
    </div>
  );
  return (
    <form className="space-y-4" aria-label={`Reservar na viagem ${trip.number}`} onSubmit={(e) => { e.preventDefault(); run(() => reserveParcelsAction({ tripId: trip.tripId, items, ...f }), "Reserva feita", (r) => setDone((r as unknown as { data: typeof done }).data)); }}>
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold">Quantos fardos</legend>
        {(["P", "M", "G"] as const).map((k) => (
          <div key={k} className="rounded-lg border border-border p-3 text-sm">
            <p className="font-semibold">{SIZE[k]} · {formatBRL(trip.prices[k])}</p>
            <p className="text-xs text-muted-foreground">até {sizes[k].maxCm} cm, {sizes[k].maxKg} kg</p>
            <div className="mt-2 flex items-center gap-2" role="group" aria-label={`Quantidade de ${SIZE[k]}`}>
              <Button type="button" size="icon" variant="secondary" aria-label={`Um ${SIZE[k]} a menos`} disabled={items[k] <= 0} onClick={() => setItems({ ...items, [k]: Math.max(0, items[k] - 1) })}><Minus className="size-4" aria-hidden /></Button>
              <span className="w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">{items[k]}</span>
              <Button type="button" size="icon" variant="secondary" aria-label={`Um ${SIZE[k]} a mais`} disabled={items[k] >= 50} onClick={() => setItems({ ...items, [k]: items[k] + 1 })}><Plus className="size-4" aria-hidden /></Button>
            </div>
          </div>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lab}>Loja onde o ônibus coleta<Input required minLength={2} maxLength={120} value={f.storeName} onChange={(e) => setF({ ...f, storeName: e.target.value })} placeholder="Ex.: Mega Tron, box 12" className="mt-1" /></label>
        <label className={lab}>Endereço da loja (opcional)<Input maxLength={200} value={f.storeAddress} onChange={(e) => setF({ ...f, storeAddress: e.target.value })} placeholder="Ex.: Rua Oriente, 500" className="mt-1" /></label>
        <label className={lab}>Quem retira na cidade<Input required minLength={2} maxLength={80} value={f.recipientName} onChange={(e) => setF({ ...f, recipientName: e.target.value })} className="mt-1" /></label>
        {requests.length ? <label className={lab}>É de um pedido da Brás? (opcional)<Select value={f.requestId} onChange={(e) => setF({ ...f, requestId: e.target.value })} className="mt-1"><option value="">Não, comprei em outra loja</option>{requests.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</Select></label> : null}
        <label className={`${lab} sm:col-span-2`}>Chave da nota (opcional agora, obrigatória para embarcar)<Input inputMode="numeric" value={f.invoiceKey} onChange={(e) => setF({ ...f, invoiceKey: e.target.value })} placeholder="44 números da nota da loja" className="mt-1 font-mono" /></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-muted p-3">
        <span className="text-sm">Frete: <b className="text-lg tabular-nums">{formatBRL(total)}</b> <span className="text-muted-foreground">· pago ao ônibus</span></span>
        <Button type="submit" size="lg" loading={pending}>{trip.full ? "Entrar na lista de espera" : "Reservar espaço"}</Button>
      </div>
    </form>
  );
}

export function CancelParcelButton({ parcelId }: { parcelId: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Cancelar este fardo?")) run(() => cancelMyParcelAction(parcelId), "Fardo cancelado"); }}>Cancelar fardo</Button>;
}

export function ParcelInvoiceForm({ parcelId }: { parcelId: string }) {
  const { pending, run } = useRun();
  const [key, setKey] = React.useState("");
  return (
    <form className="mt-2 flex flex-wrap items-end gap-2" aria-label="Informar a nota do fardo" onSubmit={(e) => { e.preventDefault(); run(() => setParcelInvoiceAction(parcelId, key), "Nota registrada no fardo", () => setKey("")); }}>
      <label className={lab}>Chave da nota<Input required inputMode="numeric" value={key} onChange={(e) => setKey(e.target.value)} placeholder="44 números" className="mt-1 w-72 max-w-full font-mono" /></label>
      <Button type="submit" size="sm" disabled={pending}>Registrar nota</Button>
    </form>
  );
}
