"use client";
import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cargasInterestAction } from "@/app/actions/cargas";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { CARGAS_KINDS, CARGAS_KIND_LABEL, CARGAS_VEHICLES, CARGAS_VEHICLE_LABEL } from "@/lib/cargas/rotulos";

type Kind = (typeof CARGAS_KINDS)[number];
type Vehicle = (typeof CARGAS_VEHICLES)[number];
type Uf = (typeof BRAS_UFS)[number];
const input = "mt-1 block w-full rounded-xl border border-[#d6d2c6] bg-white px-3 py-2.5 text-base text-[#101b34] focus:border-[#4b4fd8] focus:outline-none focus:ring-2 focus:ring-[#4b4fd8]/30";
const maskPhone = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 11); return d.length <= 10 ? d.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a.length === 2 ? ") " : "", b, c && `-${c}`].join("")) : d.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3"); };

/** Formulário de interesse da NextLevel Cargas: 1 minuto, com o que a equipe precisa para chamar na primeira rodada. */
export function CargasInterestForm() {
  const [kind, setKind] = React.useState<Kind>("TRANSPORTADORA");
  const [f, setF] = React.useState({ name: "", company: "", document: "", phone: "", email: "", message: "" });
  const [ufs, setUfs] = React.useState<Uf[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [rntrc, setRntrc] = React.useState(false);
  const [insurance, setInsurance] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const carrier = kind !== "IMPORTADORA";
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    start(async () => {
      const r = await cargasInterestAction({ kind, ...f, ufs: carrier ? ufs : [], vehicles: carrier ? vehicles : [], rntrc, insurance });
      if (r.ok) setDone(true); else { setError(r.error); toast.error(r.error); }
    });
  };
  if (done) return (
    <div role="status" className="py-6 text-center">
      <CheckCircle2 className="mx-auto size-12 text-[#05613f]" aria-hidden />
      <p className="cg-display mt-3 text-2xl">Cadastro recebido!</p>
      <p className="mt-2 text-[#4a5168]">A equipe da NextLevel Cargas confere os dados e chama você pelo WhatsApp quando as coletas da sua região abrirem.</p>
    </div>
  );
  return (
    <form onSubmit={submit} className="cg-form space-y-4" aria-label="Cadastro de interesse na NextLevel Cargas">
      <fieldset>
        <legend className="text-sm font-bold">Você é</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {CARGAS_KINDS.map((k) => <label key={k} className="cg-opt"><input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="accent-[#4b4fd8]" />{CARGAS_KIND_LABEL[k]}</label>)}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Seu nome<input required autoComplete="name" className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        {kind !== "AUTONOMO" ? <label className="block text-sm font-semibold">Nome da empresa<input required autoComplete="organization" className={input} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></label> : null}
        <label className="block text-sm font-semibold">{kind === "AUTONOMO" ? "CPF" : "CNPJ"}<input required inputMode="numeric" className={input} value={f.document} onChange={(e) => setF({ ...f, document: e.target.value.replace(/[^\d./-]/g, "").slice(0, 18) })} /></label>
        <label className="block text-sm font-semibold">WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })} /></label>
        <label className="block text-sm font-semibold sm:col-span-2">E-mail<input required type="email" autoComplete="email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      {carrier ? (
        <>
          <fieldset>
            <legend className="text-sm font-bold">Estados que você atende</legend>
            <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-9">
              {BRAS_UFS.map((u) => <label key={u} className="cg-opt justify-center !px-1 !py-1.5 text-xs font-semibold"><input type="checkbox" className="sr-only" checked={ufs.includes(u)} onChange={() => setUfs(toggle(ufs, u))} />{u}</label>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold">Veículos</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CARGAS_VEHICLES.map((v) => <label key={v} className="cg-opt"><input type="checkbox" className="accent-[#4b4fd8]" checked={vehicles.includes(v)} onChange={() => setVehicles(toggle(vehicles, v))} />{CARGAS_VEHICLE_LABEL[v]}</label>)}
            </div>
          </fieldset>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="cg-opt"><input type="checkbox" className="accent-[#4b4fd8]" checked={rntrc} onChange={(e) => setRntrc(e.target.checked)} />Tenho RNTRC (ANTT)</label>
            <label className="cg-opt"><input type="checkbox" className="accent-[#4b4fd8]" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />Tenho seguro de carga</label>
          </div>
        </>
      ) : null}
      <label className="block text-sm font-semibold">{carrier ? "Algo mais? (opcional)" : "O que você despacha e para onde? (opcional)"}<textarea rows={2} maxLength={400} className={input} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
      {error ? <p role="alert" className="text-sm font-semibold text-[#b53c35]">{error}</p> : null}
      <button type="submit" disabled={pending} className="cg-btn cg-btn--indigo w-full disabled:opacity-60">{pending ? "Enviando…" : "Quero entrar na primeira rodada"}</button>
      <p className="text-center text-xs text-[#4a5168]">Ao enviar, você aceita ser contatado pela equipe da NextLevel Cargas por WhatsApp e e-mail sobre este cadastro.</p>
    </form>
  );
}
