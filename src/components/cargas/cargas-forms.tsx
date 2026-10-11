"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, MessageCircle, Plus, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { MoneyField } from "@/components/finance/fields";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { CARGAS_DOC_KINDS, CARGAS_DOC_LABEL, CARGAS_OPERATION_LABEL, CARGAS_PLAN_LABEL, CARGAS_VEHICLES, CARGAS_VEHICLE_LABEL } from "@/lib/cargas/rotulos";
import {
  callCarrierAction, cancelLoadAction, carrierDeliveredAction, carrierFromLeadAction, createCarrierAccessAction, createCarrierAction, createDriverLinkAction,
  driverDeliveredAction, respondLoadAction, revokeDriverLinkAction, updateCarrierProfileAction, saveCarrierDocumentAction, reviewCarrierDocumentAction, deleteCarrierDocumentAction,
} from "@/app/actions/cargas-painel";
import { Badge } from "@/components/ui/badge";

/**
 * Formulários da NextLevel Cargas (D111): importadora, transportadora, motorista e Master. O servidor confere quem
 * pode o quê; aqui só a forma de pedir.
 */
type Result = { ok: boolean; error?: string };
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends Result>(fn: () => Promise<T>, msg: string | ((r: T) => string), after?: (r: T) => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(typeof msg === "string" ? msg : msg(r)); after?.(r); router.refresh(); } else toast.error(r.error); }) };
}
const lab = "flex flex-col text-sm font-medium";
const toggle = <T,>(list: T[], v: T) => list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

function Chips<T extends string>({ legend, options, value, onChange, label }: { legend: string; options: readonly T[]; value: T[]; onChange: (v: T[]) => void; label?: (v: T) => string }) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">{options.map((o) => (
        <label key={o} className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand-primary)] ${value.includes(o) ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary,#fff)]" : "border-border"}`}>
          <input type="checkbox" className="sr-only" checked={value.includes(o)} onChange={() => onChange(toggle(value, o))} />{label ? label(o) : o}
        </label>
      ))}</div>
    </fieldset>
  );
}

type Uf = (typeof BRAS_UFS)[number];
type Vehicle = (typeof CARGAS_VEHICLES)[number];

type CarrierDefaults = { name?: string; docType?: "CNPJ" | "CPF"; document?: string; operation?: "CARGA" | "EXCURSAO"; vehicles?: Vehicle[]; ufs?: Uf[]; label?: string };
/** Cadastro rápido de transportadora (importadora ou Master). Documento já cadastrado reaproveita a existente.
 * `defaults` pré-preenche (ex.: a Starline, empresa do grupo); o dono completa contato e WhatsApp. */
export function CarrierForm({ defaults, allowOperation = true }: { defaults?: CarrierDefaults; allowOperation?: boolean } = {}) {
  const { pending, run } = useRun();
  const empty = { name: defaults?.name ?? "", docType: defaults?.docType ?? ("CNPJ" as "CNPJ" | "CPF"), document: defaults?.document ?? "", contactName: "", phone: "", email: "", rntrc: "", insurance: false, rateNotes: "", operation: defaults?.operation ?? ("CARGA" as "CARGA" | "EXCURSAO") };
  const [f, setF] = React.useState(empty);
  const [ufs, setUfs] = React.useState<Uf[]>(defaults?.ufs ?? ["SP"]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(defaults?.vehicles ?? []);
  const setOperation = (operation: "CARGA" | "EXCURSAO") => { setF({ ...f, operation }); if (operation === "EXCURSAO" && !vehicles.includes("ONIBUS_EXCURSAO")) setVehicles([...vehicles, "ONIBUS_EXCURSAO"]); };
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label={defaults?.label ?? "Cadastrar transportadora"} onSubmit={(e) => { e.preventDefault(); run(() => createCarrierAction({ ...f, ufs, vehicles }), (r) => (r as { data?: { existed?: boolean } }).data?.existed ? "Essa transportadora já estava cadastrada: ela já aparece na lista." : "Transportadora cadastrada", () => { setF(empty); setVehicles(defaults?.vehicles ?? []); }); }}>
      {allowOperation ? (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Tipo</legend>
          <div className="flex flex-wrap gap-2">{(["CARGA", "EXCURSAO"] as const).map((o) => (
            <label key={o} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${f.operation === o ? "border-[var(--brand-primary)]" : "border-border"}`}><input type="radio" name="operation" checked={f.operation === o} onChange={() => setOperation(o)} />{CARGAS_OPERATION_LABEL[o]}</label>
          ))}</div>
        </fieldset>
      ) : null}
      <label className={lab}>Nome da transportadora ou do motorista<Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Rápido Brás Transportes" className="mt-1" /></label>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <label className={lab}>Documento<Select value={f.docType} onChange={(e) => setF({ ...f, docType: e.target.value as "CNPJ" | "CPF" })} className="mt-1"><option value="CNPJ">CNPJ</option><option value="CPF">CPF</option></Select></label>
        <label className={lab}>Número<Input required inputMode="numeric" value={f.document} onChange={(e) => setF({ ...f, document: e.target.value })} placeholder={f.docType === "CNPJ" ? "Ex.: 00.000.000/0001-00" : "Ex.: 000.000.000-00"} className="mt-1" /></label>
      </div>
      <label className={lab}>Contato<Input required minLength={2} value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} placeholder="Ex.: Sr. Antônio" className="mt-1" /></label>
      <label className={lab}>WhatsApp com DDD<Input required inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Ex.: (11) 90000-0000" className="mt-1" /></label>
      <label className={lab}>E-mail (opcional)<Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1" /></label>
      <label className={lab}>RNTRC (opcional)<Input value={f.rntrc} onChange={(e) => setF({ ...f, rntrc: e.target.value })} className="mt-1" /></label>
      <Chips legend="Veículos" options={CARGAS_VEHICLES} value={vehicles} onChange={setVehicles} label={(v) => CARGAS_VEHICLE_LABEL[v]} />
      <Chips legend="Estados atendidos" options={BRAS_UFS} value={ufs} onChange={setUfs} />
      <label className={`${lab} sm:col-span-2`}>Tabela ou observações de frete (opcional)<Input value={f.rateNotes} onChange={(e) => setF({ ...f, rateNotes: e.target.value })} placeholder="Ex.: Mínimo R$ 150 para a Grande SP" className="mt-1" /></label>
      <div className="sm:col-span-2"><Switch checked={f.insurance} onCheckedChange={(v) => setF({ ...f, insurance: v })} label="Tem seguro de carga" /></div>
      <Button type="submit" loading={pending} className="sm:justify-self-start"><Plus className="size-4" aria-hidden />Cadastrar transportadora</Button>
    </form>
  );
}

type CarrierOpt = { id: string; name: string; contactName: string; ufs: string[]; vehicles: string[]; plan: string; insurance: boolean; rateNotes: string | null; preferred?: boolean };
type ReqOpt = { id: string; number: number; productTitle: string; boxes: number; status: string; shipCity: string | null; shipState: string | null; carrier?: string | null; suggestedCarrierId?: string | null };

/** "Chamar transportadora": pedidos confirmados ou pagos + transportadora + dia → mensagem pronta no WhatsApp. */
export function CallCarrierForm({ carriers, requests, warehouses, today }: { carriers: CarrierOpt[]; requests: ReqOpt[]; warehouses: { id: string; name: string; isDefault: boolean }[]; today: string }) {
  const { pending, run } = useRun();
  const [sel, setSel] = React.useState<string[]>([]);
  const [f, setF] = React.useState({ carrierId: "", pickupDate: today, period: "MANHA" as "MANHA" | "TARDE", warehouseId: warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id ?? "", notes: "" });
  const [sent, setSent] = React.useState<{ number: number; whatsappUrl: string } | null>(null);
  const ufs = new Set(requests.filter((r) => sel.includes(r.id)).map((r) => r.shipState).filter(Boolean));
  const fit = (c: CarrierOpt) => [...ufs].every((u) => c.ufs.includes(u as string));
  const boxes = requests.filter((r) => sel.includes(r.id)).reduce((s, r) => s + r.boxes, 0);
  // Escolha do cliente no pedido (D113): se todos os pedidos marcados apontam para a mesma transportadora do catálogo, ela vem marcada.
  const suggested = (ids: string[]) => { const s = [...new Set(requests.filter((r) => ids.includes(r.id)).map((r) => r.suggestedCarrierId ?? ""))]; return s.length === 1 && s[0] && carriers.some((c) => c.id === s[0]) ? s[0] : ""; };
  const [touched, setTouched] = React.useState(false);
  const pick = (id: string) => { const next = toggle(sel, id); setSel(next); if (!touched) setF((x) => ({ ...x, carrierId: suggested(next) })); };
  const suggestedIds = new Set(requests.filter((r) => sel.includes(r.id)).map((r) => r.suggestedCarrierId).filter(Boolean));
  if (sent) return (
    <div className="rounded-lg border border-success/40 bg-success-soft p-4 text-sm" role="status">
      <p className="font-semibold">Coleta {sent.number} criada. Agora avise a transportadora:</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={sent.whatsappUrl} target="_blank" rel="noopener noreferrer" className="ds-btn inline-flex items-center gap-2"><MessageCircle className="size-4" aria-hidden />Mandar no WhatsApp</a>
        <Button variant="secondary" onClick={() => setSent(null)}>Chamar outra</Button>
      </div>
    </div>
  );
  if (!requests.length) return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhum pedido confirmado ou pago esperando coleta. Quando a equipe da Brás confirmar um pedido, ele aparece aqui.</p>;
  if (!carriers.length) return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Cadastre a transportadora com quem você já trabalha (abaixo) para chamar a coleta.</p>;
  return (
    <form className="grid gap-4" aria-label="Chamar transportadora" onSubmit={(e) => { e.preventDefault(); run(() => callCarrierAction({ ...f, requestIds: sel }), "Coleta criada", (r) => { const d = (r as unknown as { data: { number: number; whatsappUrl: string } }).data; setSent(d); setSel([]); }); }}>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">1. Pedidos desta coleta</legend>
        <ul className="grid gap-2 sm:grid-cols-2">{requests.map((r) => (
          <li key={r.id}><label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${sel.includes(r.id) ? "border-[var(--brand-primary)]" : "border-border"}`}>
            <input type="checkbox" className="mt-1 size-4" checked={sel.includes(r.id)} onChange={() => pick(r.id)} />
            <span><b>Pedido {r.number}</b> · {r.boxes} cx · {r.status === "PAID" ? "pago" : "confirmado"}<span className="block text-muted-foreground">{r.productTitle} → {r.shipCity}/{r.shipState}</span>{r.carrier ? <span className="block">Cliente escolheu: <b>{r.carrier}</b>{r.suggestedCarrierId ? "" : " (fora do catálogo)"}</span> : null}</span>
          </label></li>
        ))}</ul>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lab}>2. Transportadora<Select required value={f.carrierId} onChange={(e) => { setTouched(true); setF({ ...f, carrierId: e.target.value }); }} className="mt-1">
          <option value="">Escolha</option>
          {[...carriers].sort((a, b) => Number(suggestedIds.has(b.id)) - Number(suggestedIds.has(a.id)) || Number(!!b.preferred) - Number(!!a.preferred) || Number(fit(b)) - Number(fit(a))).map((c) => <option key={c.id} value={c.id}>{c.name}{suggestedIds.has(c.id) ? " (escolhida pelo cliente)" : c.preferred ? " (preferida)" : ""}{fit(c) ? "" : " (não atende todos os estados)"}</option>)}
        </Select></label>
        {warehouses.length ? <label className={lab}>Galpão de retirada<Select value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: e.target.value })} className="mt-1">{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></label> : <p className="self-end text-sm text-muted-foreground">Sem galpão cadastrado: vai o endereço de retirada da ficha.</p>}
        <label className={lab}>3. Dia da coleta<Input required type="date" min={today} value={f.pickupDate} onChange={(e) => setF({ ...f, pickupDate: e.target.value })} className="mt-1" /></label>
        <label className={lab}>Período<Select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value as "MANHA" | "TARDE" })} className="mt-1"><option value="MANHA">Manhã</option><option value="TARDE">Tarde</option></Select></label>
        <label className={`${lab} sm:col-span-2`}>Observação para o motorista (opcional)<Input value={f.notes} maxLength={500} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Ex.: Doca 2, falar com o Jorge" className="mt-1" /></label>
      </div>
      <Button type="submit" size="lg" loading={pending} disabled={!sel.length} className="sm:justify-self-start"><Truck className="size-5" aria-hidden />Chamar transportadora{sel.length ? ` (${boxes} cx)` : ""}</Button>
    </form>
  );
}

export function ImporterLoadActions({ id, status }: { id: string; status: string }) {
  const { pending, run } = useRun();
  if (status !== "CHAMADA" && status !== "ACEITA") return null;
  return <div className="mt-3"><Button size="sm" variant="ghost" disabled={pending} onClick={() => { const reason = window.prompt("Cancelar a coleta? Conte o motivo (opcional):"); if (reason !== null) run(() => cancelLoadAction(id, reason), "Coleta cancelada. Os pedidos podem entrar em outra."); }}><X className="size-4" aria-hidden />Cancelar coleta</Button></div>;
}

/** Transportadora: aceita com o frete (ou recusa com motivo) e marca a entrega. */
export function CarrierLoadActions({ id, status, commissionPct }: { id: string; status: string; commissionPct: string }) {
  const { pending, run } = useRun();
  const [freight, setFreight] = React.useState(0);
  const [reason, setReason] = React.useState("");
  if (status === "CHAMADA") return (
    <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      <form className="grid gap-2" aria-label="Aceitar coleta" onSubmit={(e) => { e.preventDefault(); run(() => respondLoadAction(id, { accept: true, freightCents: freight }), "Coleta aceita. Os códigos de retirada já aparecem."); }}>
        <MoneyField id={`frete-${id}`} label="Valor do frete" hint={`Comissão da NextLevel Cargas no seu plano: ${commissionPct}% do frete.`} valueCents={freight} onChange={setFreight} />
        <Button type="submit" loading={pending} disabled={freight < 100}><Check className="size-4" aria-hidden />Aceitar coleta</Button>
      </form>
      <form className="grid gap-2" aria-label="Recusar coleta" onSubmit={(e) => { e.preventDefault(); run(() => respondLoadAction(id, { accept: false, reason }), "Recusa enviada à importadora"); }}>
        <label className={lab}>Motivo da recusa<Input required value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: Sem veículo nessa data" className="mt-1" /></label>
        <Button type="submit" variant="secondary" disabled={pending}>Recusar</Button>
      </form>
    </div>
  );
  if (status === "COLETADA") return <div className="mt-3 border-t border-border pt-3"><Button disabled={pending} onClick={() => run(() => carrierDeliveredAction(id), "Entrega registrada")}><Check className="size-4" aria-hidden />Marcar como entregue</Button></div>;
  if (status === "ACEITA") return <p className="mt-3 border-t border-border pt-3 text-muted-foreground">Na coleta, o motorista mostra o código de cada pedido no balcão. A carga vira &quot;coletada&quot; quando o último pedido sair.</p>;
  return null;
}

/** Link do motorista (sem login): aparece inteiro uma vez; gerar outro desliga o anterior. */
export function DriverLinkManager({ carrierId, has, origin }: { carrierId: string | null; has: boolean; origin: string }) {
  const { pending, run } = useRun();
  const [url, setUrl] = React.useState<string | null>(null);
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">O motorista abre o link no celular e vê as coletas aceitas (endereço, horário e códigos) e marca a entrega. Sem senha: guarde o link só com quem dirige.</p>
      {url ? <div className="rounded-lg border border-success/40 bg-success-soft p-3"><p className="font-semibold">Link novo (copie agora; ele não aparece de novo):</p><p className="mt-1 break-all font-mono text-xs">{url}</p><Button size="sm" variant="secondary" className="mt-2" onClick={() => { void navigator.clipboard?.writeText(url); toast.success("Link copiado"); }}><Copy className="size-4" aria-hidden />Copiar</Button></div> : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => { if (!has || window.confirm("Gerar um link novo desliga o anterior. Continuar?")) run(() => createDriverLinkAction(carrierId), "Link do motorista gerado", (r) => setUrl(`${origin}${(r as unknown as { data: { path: string } }).data.path}`)); }}>{has ? "Gerar link novo" : "Gerar link do motorista"}</Button>
        {has ? <Button variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Desligar o link do motorista?")) run(() => revokeDriverLinkAction(carrierId), "Link desligado", () => setUrl(null)); }}>Desligar link</Button> : null}
      </div>
    </div>
  );
}

type Profile = { contactName: string; phone: string; email: string | null; ufs: string[]; vehicles: string[]; rntrc: string | null; insurance: boolean; rateNotes: string | null; plan: "GRATIS" | "PRO" | "PREMIUM"; status: "ATIVA" | "PAUSADA"; operation?: "CARGA" | "EXCURSAO" };
export function CarrierProfileForm({ carrierId, master, value }: { carrierId: string | null; master: boolean; value: Profile }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ contactName: value.contactName, phone: value.phone, email: value.email ?? "", rntrc: value.rntrc ?? "", insurance: value.insurance, rateNotes: value.rateNotes ?? "", plan: value.plan, status: value.status, operation: value.operation ?? ("CARGA" as "CARGA" | "EXCURSAO") });
  const [ufs, setUfs] = React.useState(value.ufs as Uf[]);
  const [vehicles, setVehicles] = React.useState(value.vehicles as Vehicle[]);
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label="Perfil da transportadora" onSubmit={(e) => { e.preventDefault(); const { plan, status, operation, ...rest } = f; run(() => updateCarrierProfileAction(carrierId, { ...rest, ufs, vehicles, ...(master ? { plan, status, operation } : {}) }), "Perfil atualizado"); }}>
      <label className={lab}>Contato<Input required minLength={2} value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} className="mt-1" /></label>
      <label className={lab}>WhatsApp com DDD<Input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="mt-1" /></label>
      <label className={lab}>E-mail<Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1" /></label>
      <label className={lab}>RNTRC<Input value={f.rntrc} onChange={(e) => setF({ ...f, rntrc: e.target.value })} className="mt-1" /></label>
      <Chips legend="Veículos" options={CARGAS_VEHICLES} value={vehicles} onChange={setVehicles} label={(v) => CARGAS_VEHICLE_LABEL[v]} />
      <Chips legend="Estados atendidos" options={BRAS_UFS} value={ufs} onChange={setUfs} />
      <label className={`${lab} sm:col-span-2`}>Tabela ou observações de frete<Textarea value={f.rateNotes} maxLength={500} onChange={(e) => setF({ ...f, rateNotes: e.target.value })} className="mt-1" /></label>
      <div className="sm:col-span-2"><Switch checked={f.insurance} onCheckedChange={(v) => setF({ ...f, insurance: v })} label="Tem seguro de carga" /></div>
      {master ? <>
        <label className={lab}>Plano<Select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value as Profile["plan"] })} className="mt-1">{Object.entries(CARGAS_PLAN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></label>
        <label className={lab}>Situação<Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Profile["status"] })} className="mt-1"><option value="ATIVA">Ativa</option><option value="PAUSADA">Pausada</option></Select></label>
        <label className={lab}>Tipo<Select value={f.operation} onChange={(e) => setF({ ...f, operation: e.target.value as "CARGA" | "EXCURSAO" })} className="mt-1">{(["CARGA", "EXCURSAO"] as const).map((o) => <option key={o} value={o}>{CARGAS_OPERATION_LABEL[o]}</option>)}</Select></label>
      </> : null}
      <Button type="submit" loading={pending} className="sm:justify-self-start">Gravar perfil</Button>
    </form>
  );
}

export function CarrierAccessForm({ carrierId }: { carrierId: string }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ name: "", email: "", password: "" });
  return (
    <form className="grid gap-2 sm:grid-cols-3" aria-label="Criar acesso da transportadora" onSubmit={(e) => { e.preventDefault(); run(() => createCarrierAccessAction(carrierId, f), "Acesso criado. Passe o e-mail e a senha provisória: a troca é no primeiro login.", () => setF({ name: "", email: "", password: "" })); }}>
      <label className={lab}>Nome<Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1" /></label>
      <label className={lab}>E-mail<Input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1" /></label>
      <label className={lab}>Senha provisória<Input required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="off" className="mt-1" /></label>
      <Button type="submit" size="sm" loading={pending} className="sm:justify-self-start">Criar acesso</Button>
    </form>
  );
}

export function LeadToCarrierButton({ leadId }: { leadId: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => carrierFromLeadAction(leadId), (r) => (r as { data?: { existed?: boolean } }).data?.existed ? "Já era transportadora cadastrada" : "Virou transportadora cadastrada")}>Cadastrar como transportadora</Button>;
}

/** Botão grande do motorista (link sem login). */
export function DriverDeliverButton({ token, loadId }: { token: string; loadId: string }) {
  const { pending, run } = useRun();
  return <Button size="lg" className="mt-3 w-full" disabled={pending} onClick={() => { if (window.confirm("Confirmar que entregou todos os pedidos desta coleta?")) run(() => driverDeliveredAction(token, loadId), "Entrega registrada. Obrigado!"); }}><Check className="size-5" aria-hidden />Entreguei</Button>;
}

type Doc = { id: string; kind: (typeof CARGAS_DOC_KINDS)[number]; number: string; issuer: string | null; validUntil: string | null; notes: string | null; status: "PENDENTE" | "VERIFICADA" | "RECUSADA" };
const DOC_STATUS = { PENDENTE: { label: "Aguardando conferência", tone: "warning" }, VERIFICADA: { label: "Conferida", tone: "success" }, RECUSADA: { label: "Recusada", tone: "danger" } } as const;
const brDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

/** Autorizações da transportadora (D112). A transportadora informa; o Master confere (o que ele cadastra já nasce conferido). */
export function CarrierDocsManager({ carrierId, docs, master }: { carrierId: string | null; docs: Doc[]; master: boolean }) {
  const { pending, run } = useRun();
  const empty = { kind: "FRETAMENTO" as Doc["kind"], number: "", issuer: "", validUntil: "", notes: "" };
  const [f, setF] = React.useState(empty);
  return (
    <div className="space-y-3 text-sm">
      {docs.length ? <ul className="space-y-2">{docs.map((d) => (
        <li key={d.id} className="rounded-lg border border-border p-3">
          <p className="flex flex-wrap items-center gap-2 font-semibold">{CARGAS_DOC_LABEL[d.kind]}<Badge tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</Badge></p>
          <p className="text-muted-foreground">Nº {d.number}{d.issuer ? ` · ${d.issuer}` : ""}{d.validUntil ? ` · válida até ${brDate(d.validUntil)}` : " · sem validade"}</p>
          {d.notes ? <p className="text-muted-foreground">{d.notes}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {master && d.status !== "VERIFICADA" ? <Button size="sm" disabled={pending} onClick={() => run(() => reviewCarrierDocumentAction(d.id, "VERIFICADA"), "Autorização conferida")}>Conferir</Button> : null}
            {master && d.status === "PENDENTE" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => reviewCarrierDocumentAction(d.id, "RECUSADA"), "Autorização recusada")}>Recusar</Button> : null}
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Remover esta autorização?")) run(() => deleteCarrierDocumentAction(d.id), "Autorização removida"); }}>Remover</Button>
          </div>
        </li>
      ))}</ul> : <p className="text-muted-foreground">Nenhuma autorização cadastrada. Com uma autorização conferida e dentro da validade, aparece o selo &quot;documentação em dia&quot; no catálogo.</p>}
      <form className="grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2" aria-label="Nova autorização" onSubmit={(e) => { e.preventDefault(); run(() => saveCarrierDocumentAction(carrierId, f), master ? "Autorização cadastrada e conferida" : "Autorização enviada para conferência", () => setF(empty)); }}>
        <label className={lab}>Tipo<Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Doc["kind"] })} className="mt-1">{CARGAS_DOC_KINDS.map((k) => <option key={k} value={k}>{CARGAS_DOC_LABEL[k]}</option>)}</Select></label>
        <label className={lab}>Número<Input required minLength={2} maxLength={60} value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} className="mt-1" /></label>
        <label className={lab}>Órgão (opcional)<Input value={f.issuer} maxLength={80} onChange={(e) => setF({ ...f, issuer: e.target.value })} placeholder="Ex.: ANTT, Artesp" className="mt-1" /></label>
        <label className={lab}>Válida até (opcional)<Input type="date" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} className="mt-1" /></label>
        <label className={`${lab} sm:col-span-2`}>Observação (opcional)<Input value={f.notes} maxLength={300} onChange={(e) => setF({ ...f, notes: e.target.value })} className="mt-1" /></label>
        <Button type="submit" size="sm" loading={pending} className="sm:justify-self-start">Adicionar autorização</Button>
      </form>
    </div>
  );
}
