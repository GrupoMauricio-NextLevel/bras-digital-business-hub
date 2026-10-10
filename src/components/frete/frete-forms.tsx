"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { dismissReferralAction, referCarrierAction } from "@/app/actions/frete";

/** "Minha transportadora ou ônibus não está aqui" (D113): indica com o WhatsApp e já leva o convite pronto. */
export function ReferCarrierForm({ defaultUf }: { defaultUf?: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const empty = { kind: "TRANSPORTADORA" as "TRANSPORTADORA" | "ONIBUS", name: "", contactName: "", phone: "", city: "", uf: (defaultUf ?? "SP") as (typeof BRAS_UFS)[number] };
  const [f, setF] = React.useState(empty);
  const [invite, setInvite] = React.useState<{ url: string; msg: string } | null>(null);
  const lab = "flex flex-col text-sm font-medium";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await referCarrierAction(f);
      if (!r.ok) { toast.error(r.error); return; }
      const d = r.data;
      if (d.status === "IN_CATALOG") { toast.success(`${d.carrierName} já está no catálogo: escolha no próximo pedido.`); setF(empty); router.refresh(); return; }
      setInvite({ url: d.whatsappUrl, msg: d.status === "CREATED" ? "Indicação registrada. Mande o convite: quando ela entrar e fizer a primeira entrega pelo sistema, a indicação conta para você." : d.status === "MINE" ? "Você já indicou esse contato. Reenvie o convite se quiser." : "Esse contato já foi indicado por outra pessoa e está sendo convidado." });
      setF(empty); router.refresh();
    });
  };
  if (invite) return (
    <div role="status" className="rounded-lg border border-success/40 bg-success-soft p-4 text-sm">
      <p className="font-semibold">{invite.msg}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={invite.url} target="_blank" rel="noopener noreferrer" className="ds-btn inline-flex items-center gap-2"><MessageCircle className="size-4" aria-hidden />Mandar convite no WhatsApp</a>
        <Button variant="secondary" onClick={() => setInvite(null)}>Indicar outra</Button>
      </div>
    </div>
  );
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label="Indicar transportadora ou ônibus" onSubmit={submit}>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">É uma</legend>
        <div className="flex flex-wrap gap-2">{(["TRANSPORTADORA", "ONIBUS"] as const).map((k) => (
          <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${f.kind === k ? "border-[var(--brand-primary)]" : "border-border"}`}><input type="radio" name="ref-kind" checked={f.kind === k} onChange={() => setF({ ...f, kind: k })} />{k === "ONIBUS" ? "Ônibus de excursão" : "Transportadora"}</label>
        ))}</div>
      </fieldset>
      <label className={lab}>{f.kind === "ONIBUS" ? "Nome da excursão" : "Nome da transportadora"}<Input required minLength={2} maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1" /></label>
      <label className={lab}>Responsável (opcional)<Input maxLength={80} value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} className="mt-1" /></label>
      <label className={lab}>WhatsApp com DDD<Input required inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Ex.: (31) 90000-0000" className="mt-1" /></label>
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <label className={lab}>Cidade<Input maxLength={80} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className="mt-1" /></label>
        <label className={lab}>UF<Select value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value as (typeof BRAS_UFS)[number] })} className="mt-1">{BRAS_UFS.map((u) => <option key={u} value={u}>{u}</option>)}</Select></label>
      </div>
      <Button type="submit" loading={pending} className="sm:justify-self-start"><UserPlus className="size-4" aria-hidden />Indicar</Button>
    </form>
  );
}

export function DismissReferralButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Recusar esta indicação?")) start(async () => { const r = await dismissReferralAction(id); if (r.ok) { toast.success("Indicação recusada"); router.refresh(); } else toast.error(r.error); }); }}>Recusar</Button>;
}
