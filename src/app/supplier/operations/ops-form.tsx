"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { DAY_KEYS, DAY_LABEL } from "@/lib/domain/cutoff";
import type { Cutoffs } from "@/db/schema";
import { saveOpsAction } from "@/app/actions/dispatch";

const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const TZ = [["America/Sao_Paulo", "Brasília (UTC-3)"], ["America/Manaus", "Manaus (UTC-4)"], ["America/Fortaleza", "Fortaleza (UTC-3)"], ["America/Rio_Branco", "Rio Branco (UTC-5)"]];

export function OpsForm({ initial, configured }: { initial: { timezone: string; cutoffs: Cutoffs; holidays: string[]; minActivationStock: number }; configured: boolean }) {
  const router = useRouter();
  const [cutoffs, setCutoffs] = React.useState<Cutoffs>(initial.cutoffs);
  const [tz, setTz] = React.useState(initial.timezone);
  const [holidays, setHolidays] = React.useState<string[]>(initial.holidays);
  const [newHoliday, setNewHoliday] = React.useState("");
  const [minStock, setMinStock] = React.useState(String(initial.minActivationStock));
  const [busy, setBusy] = React.useState(false);
  void DAY_KEYS;
  return (
    <form className="grid gap-6 lg:grid-cols-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await saveOpsAction({ timezone: tz, cutoffs, holidays, minActivationStock: Number(minStock) || 0 }); setBusy(false); if (r.ok) { toast.success("Horários salvos"); router.refresh(); } else toast.error(r.error); }}>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Horário de corte por dia</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!configured ? <p className="rounded-md bg-info-soft p-3 text-sm text-info">Esta é a sugestão padrão (segunda a sexta, 14:00). Salve para ativar.</p> : null}
          <ul className="divide-y divide-border">
            {ORDER.map((k) => (
              <li key={k} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={cutoffs[k] !== null} onChange={(e) => setCutoffs({ ...cutoffs, [k]: e.target.checked ? "14:00" : null })} /> {DAY_LABEL[k]}</label>
                {cutoffs[k] !== null ? <Input type="time" aria-label={`Corte de ${DAY_LABEL[k]}`} className="w-32" value={cutoffs[k] ?? ""} onChange={(e) => setCutoffs({ ...cutoffs, [k]: e.target.value })} required /> : <span className="text-sm text-muted-foreground">Sem expedição</span>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Estoque mínimo para as lojas</CardTitle></CardHeader>
          <CardContent className="space-y-2"><FormField label="Peças por tamanho" htmlFor="minstock" hint="A loja só consegue ativar o produto se todos os tamanhos tiverem ao menos essa quantidade disponível. Padrão: 4."><Input id="minstock" type="number" min={0} max={100} value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-28" /></FormField></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fuso horário</CardTitle></CardHeader>
          <CardContent><Select value={tz} onChange={(e) => setTz(e.target.value)} aria-label="Fuso horário">{TZ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Feriados e folgas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-2"><FormField label="Data" htmlFor="hol" className="min-w-0 flex-1 basis-40"><Input id="hol" type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} /></FormField><Button type="button" variant="secondary" disabled={!newHoliday || holidays.includes(newHoliday)} onClick={() => { setHolidays([...holidays, newHoliday].sort()); setNewHoliday(""); }}>Adicionar</Button></div>
            <ul className="space-y-1 text-sm">{holidays.length === 0 ? <li className="text-muted-foreground">Nenhum feriado cadastrado.</li> : holidays.map((h) => <li key={h} className="flex items-center justify-between"><span>{new Date(`${h}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}</span><button type="button" className="text-xs text-danger underline" onClick={() => setHolidays(holidays.filter((x) => x !== h))}>remover</button></li>)}</ul>
          </CardContent>
        </Card>
        <Button type="submit" loading={busy} className="w-full">Salvar horários</Button>
      </div>
    </form>
  );
}
