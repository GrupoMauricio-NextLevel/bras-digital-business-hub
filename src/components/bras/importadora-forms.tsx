"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoneyField } from "@/components/finance/fields";
import { createImporterAccessAction, revokeImporterAccessAction, saveWarehouseAction, updateImporterProfileAction } from "@/app/actions/importadora";

/**
 * Formulários da importadora (D110), usados no painel dela (`importerId` null = a do usuário) e na Importadora 360
 * do Master (`importerId` preenchido). O servidor confere quem pode o quê.
 */
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(msg); after?.(); router.refresh(); } else toast.error(r.error); }) };
}

type Warehouse = { id: string; name: string; address: string; hours: string | null; rules: string | null; contact: string | null; isDefault: boolean; active: boolean };
function WarehouseForm({ importerId, w, onDone }: { importerId: string | null; w?: Warehouse; onDone?: () => void }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ name: w?.name ?? "", address: w?.address ?? "", hours: w?.hours ?? "", rules: w?.rules ?? "", contact: w?.contact ?? "", isDefault: w?.isDefault ?? false, active: w?.active ?? true });
  const lab = "flex flex-col text-sm font-medium";
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label={w ? `Editar ${w.name}` : "Novo galpão"} onSubmit={(e) => { e.preventDefault(); run(() => saveWarehouseAction(importerId, w?.id ?? null, f), w ? "Galpão atualizado" : "Galpão cadastrado", () => { if (!w) setF({ name: "", address: "", hours: "", rules: "", contact: "", isDefault: false, active: true }); onDone?.(); }); }}>
      <label className={lab}>Nome<Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Galpão Rua Oriente" className="mt-1" /></label>
      <label className={lab}>Endereço de retirada<Input required minLength={5} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Ex.: Rua Oriente, 500, Brás, São Paulo/SP" className="mt-1" /></label>
      <label className={lab}>Horário de retirada<Input value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} placeholder="Ex.: Seg a sex, 8h às 17h" className="mt-1" /></label>
      <label className={lab}>Contato do balcão<Input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="Ex.: Seu Jorge (11) 90000-0000" className="mt-1" /></label>
      <label className={`${lab} sm:col-span-2`}>Regras (agendamento, doca, limite de veículo)<Input value={f.rules} onChange={(e) => setF({ ...f, rules: e.target.value })} placeholder="Ex.: Agendar com 1 dia; até caminhão toco" className="mt-1" /></label>
      <div className="flex flex-wrap gap-6 sm:col-span-2"><Switch checked={f.isDefault} onCheckedChange={(v) => setF({ ...f, isDefault: v })} label="Galpão padrão" /><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} label="Em uso" /></div>
      <Button type="submit" loading={pending} className="sm:justify-self-start">{w ? "Gravar galpão" : "Cadastrar galpão"}</Button>
    </form>
  );
}

export function WarehousesEditor({ importerId, items, canEdit }: { importerId: string | null; items: Warehouse[]; canEdit: boolean }) {
  return (
    <div className="space-y-3">
      {items.length ? <ul className="space-y-2">{items.map((w) => (
        <li key={w.id} className="rounded-lg border border-border p-3 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-semibold">{w.name}{w.isDefault ? <Badge tone="success">Padrão</Badge> : null}{!w.active ? <Badge>Fora de uso</Badge> : null}</p>
          <p className="text-muted-foreground">{w.address}{w.hours ? ` · ${w.hours}` : ""}</p>
          {w.rules ? <p className="text-muted-foreground">{w.rules}</p> : null}
          {canEdit ? <details className="mt-2"><summary className="cursor-pointer font-semibold text-link">Editar</summary><div className="mt-3"><WarehouseForm importerId={importerId} w={w} /></div></details> : null}
        </li>
      ))}</ul> : <p className="text-sm text-muted-foreground">Nenhum galpão cadastrado.</p>}
      {canEdit ? <details className="rounded-lg border border-dashed border-border p-3" open={!items.length}><summary className="cursor-pointer text-sm font-semibold"><Plus className="mr-1 inline size-4" aria-hidden />Novo galpão</summary><div className="mt-3"><WarehouseForm importerId={importerId} /></div></details> : null}
    </div>
  );
}

type Person = { userId: string; name: string; email: string; staffRole: string; disabledAt: string | null; lastLoginAt: string | null };
const ROLES = { DONO: "Dono (tudo)", COMERCIAL: "Comercial (produtos e pedidos)", ESTOQUE: "Estoque (saldo e balcão)", BALCAO: "Balcão (separar e entregar)", FINANCEIRO: "Financeiro (ver pedidos)" } as const;

export function AccessManager({ importerId, people, master, myUserId }: { importerId: string | null; people: Person[]; master: boolean; myUserId?: string }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ name: "", email: "", password: "", staffRole: (master && !people.length ? "DONO" : "BALCAO") as keyof typeof ROLES });
  return (
    <div className="space-y-3">
      {people.length ? <ul className="space-y-2">{people.map((p) => (
        <li key={p.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
          <span><b>{p.name}</b> · {p.email}<span className="block text-muted-foreground">{ROLES[p.staffRole as keyof typeof ROLES] ?? p.staffRole}{p.disabledAt ? " · acesso encerrado" : p.lastLoginAt ? "" : " · ainda não entrou"}</span></span>
          {!p.disabledAt && p.userId !== myUserId ? <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm(`Encerrar o acesso de ${p.name}?`)) run(() => revokeImporterAccessAction(importerId, p.userId), "Acesso encerrado"); }}>Encerrar acesso</Button> : null}
        </li>
      ))}</ul> : <p className="text-sm text-muted-foreground">Ninguém com acesso ainda.</p>}
      <form className="grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2" aria-label="Criar acesso" onSubmit={(e) => { e.preventDefault(); run(() => createImporterAccessAction(importerId, f), "Acesso criado. Passe o e-mail e a senha provisória: a pessoa troca a senha no primeiro login.", () => setF({ ...f, name: "", email: "", password: "" })); }}>
        <p className="text-sm font-semibold sm:col-span-2">Criar acesso ao painel da importadora</p>
        <label className="flex flex-col text-sm font-medium">Nome<Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1" /></label>
        <label className="flex flex-col text-sm font-medium">E-mail<Input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1" /></label>
        <label className="flex flex-col text-sm font-medium">Senha provisória<Input required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="mt-1" autoComplete="off" /></label>
        <label className="flex flex-col text-sm font-medium">Função<Select value={f.staffRole} onChange={(e) => setF({ ...f, staffRole: e.target.value as keyof typeof ROLES })} className="mt-1">{Object.entries(ROLES).filter(([k]) => master || k !== "DONO").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></label>
        <Button type="submit" loading={pending} className="sm:justify-self-start">Criar acesso</Button>
      </form>
    </div>
  );
}

type Profile = { legalName: string | null; cnpj: string | null; stateRegistration: string | null; description: string | null; origin: string | null; pickupAddress: string | null; categories: string[]; contacts: { name: string; role: string; phone?: string; email?: string }[]; minBoxes: number | null; minOrderCents: number | null; paymentMethods: string[]; prepDays: number | null; exchangePolicy: string | null; stockMode: "MANUAL" | "PLANILHA" | "BLING"; plan: "GRATIS" | "PRO" | "PREMIUM" };
const PAGTO = { PIX: "Pix", DINHEIRO: "Dinheiro", BOLETO: "Boleto", CARTAO: "Cartão", TRANSFERENCIA: "Transferência" } as const;

/** Ficha da importadora. No painel dela, só o comercial; no Master, também modo de estoque e plano. */
export function ProfileEditor({ importerId, value, master }: { importerId: string | null; value: Profile; master: boolean }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState({ ...value, categoriesText: value.categories.join(", "), contact: value.contacts[0] ?? { name: "", role: "Comercial", phone: "", email: "" } });
  const lab = "flex flex-col text-sm font-medium";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = { description: f.description ?? "", origin: f.origin ?? "", pickupAddress: f.pickupAddress ?? "", categories: f.categoriesText.split(",").map((x) => x.trim()).filter(Boolean), contacts: f.contact.name.trim().length >= 2 ? [{ name: f.contact.name, role: f.contact.role || "Comercial", phone: f.contact.phone || undefined, email: f.contact.email || undefined }] : [], minBoxes: f.minBoxes, minOrderCents: f.minOrderCents, paymentMethods: f.paymentMethods as ("PIX" | "DINHEIRO" | "BOLETO" | "CARTAO" | "TRANSFERENCIA")[], prepDays: f.prepDays, exchangePolicy: f.exchangePolicy ?? "" };
    run(() => updateImporterProfileAction(importerId, master ? { ...base, legalName: f.legalName ?? "", cnpj: f.cnpj ?? "", stateRegistration: f.stateRegistration ?? "", stockMode: f.stockMode, plan: f.plan } : base), "Ficha gravada");
  };
  return (
    <form className="space-y-4" aria-label="Ficha da importadora" onSubmit={submit}>
      {master ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={lab}>Razão social<Input value={f.legalName ?? ""} onChange={(e) => setF({ ...f, legalName: e.target.value })} className="mt-1" /></label>
          <label className={lab}>CNPJ<Input inputMode="numeric" value={f.cnpj ?? ""} onChange={(e) => setF({ ...f, cnpj: e.target.value })} className="mt-1" /></label>
          <label className={lab}>Inscrição estadual<Input value={f.stateRegistration ?? ""} onChange={(e) => setF({ ...f, stateRegistration: e.target.value })} className="mt-1" /></label>
          <label className={lab}>Modo de estoque<Select value={f.stockMode} onChange={(e) => setF({ ...f, stockMode: e.target.value as Profile["stockMode"] })} className="mt-1"><option value="MANUAL">Manual no painel</option><option value="PLANILHA">Planilha</option><option value="BLING" disabled>Bling (fase F7)</option></Select></label>
          <label className={lab}>Plano<Select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value as Profile["plan"] })} className="mt-1"><option value="GRATIS">Grátis</option><option value="PRO">Pro</option><option value="PREMIUM">Premium</option></Select></label>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={`${lab} sm:col-span-2`}>Descrição para a vitrine<Input maxLength={600} value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex.: Utilidades, cozinha e decoração direto da China" className="mt-1" /></label>
        <label className={lab}>Categorias (separe por vírgula)<Input value={f.categoriesText} onChange={(e) => setF({ ...f, categoriesText: e.target.value })} placeholder="Ex.: Cozinha, Utilidades" className="mt-1" /></label>
        <label className={lab}>Origem dos produtos<Input value={f.origin ?? ""} onChange={(e) => setF({ ...f, origin: e.target.value })} placeholder="Ex.: China" className="mt-1" /></label>
        <label className={`${lab} sm:col-span-2`}>Endereço de retirada (comprovante)<Input value={f.pickupAddress ?? ""} onChange={(e) => setF({ ...f, pickupAddress: e.target.value })} className="mt-1" /></label>
        <label className={lab}>Contato comercial<Input value={f.contact.name} onChange={(e) => setF({ ...f, contact: { ...f.contact, name: e.target.value } })} placeholder="Nome" className="mt-1" /></label>
        <label className={lab}>Telefone do contato<Input value={f.contact.phone ?? ""} onChange={(e) => setF({ ...f, contact: { ...f.contact, phone: e.target.value } })} className="mt-1" /></label>
        <label className={lab}>Mínimo de caixas por pedido<Input inputMode="numeric" value={f.minBoxes ?? ""} onChange={(e) => setF({ ...f, minBoxes: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })} className="mt-1" /></label>
        <MoneyField id="pf-min" label="Pedido mínimo (valor)" valueCents={f.minOrderCents ?? 0} onChange={(v) => setF({ ...f, minOrderCents: v || null })} />
        <label className={lab}>Prazo para separar (dias)<Input inputMode="numeric" value={f.prepDays ?? ""} onChange={(e) => setF({ ...f, prepDays: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })} className="mt-1" /></label>
        <fieldset className="sm:col-span-2"><legend className="text-sm font-medium">Formas de pagamento aceitas</legend><div className="mt-1 flex flex-wrap gap-3">{Object.entries(PAGTO).map(([k, v]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.paymentMethods.includes(k)} onChange={(e) => setF({ ...f, paymentMethods: e.target.checked ? [...f.paymentMethods, k] : f.paymentMethods.filter((x) => x !== k) })} />{v}</label>)}</div></fieldset>
        <label className={`${lab} sm:col-span-2`}>Política de troca e avaria<Input maxLength={1500} value={f.exchangePolicy ?? ""} onChange={(e) => setF({ ...f, exchangePolicy: e.target.value })} placeholder="Ex.: Avaria conferida na retirada; troca em até 7 dias" className="mt-1" /></label>
      </div>
      <Button type="submit" loading={pending}>Gravar ficha</Button>
    </form>
  );
}
