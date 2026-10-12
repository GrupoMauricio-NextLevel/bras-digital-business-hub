"use client";
import * as React from "react";
import { Bus, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RatingBadge, TierBadge } from "@/components/cargas/vias-forms";

export type CatalogCarrier = { id: string; name: string; operation: "CARGA" | "EXCURSAO"; ufs: string[]; vehicles: string[]; insurance: boolean; rateNotes: string | null; groupCompany: boolean; docsOk: boolean; rating?: { count: number; score: number } | null; tier?: "BRONZE" | "PRATA" | "OURO" };

/**
 * "Como sua mercadoria vai chegar" (D113): o catálogo da NextLevel Cargas no pedido de qualquer importadora.
 * Quem atende o estado de entrega aparece primeiro; ordem pública (atende, documentação, nome), nunca por ser do grupo.
 * "Outra transportadora" mantém o texto livre de sempre.
 */
export function CarrierPicker({ carriers, uf, value, other, onChange }: { carriers: CatalogCarrier[]; uf: string; value: string; other: string; onChange: (v: { carrierId: string; carrier: string }) => void }) {
  const [all, setAll] = React.useState(false);
  const serve = carriers.filter((c) => c.ufs.includes(uf));
  const rest = carriers.filter((c) => !c.ufs.includes(uf));
  const shown = all ? [...serve, ...rest] : serve;
  const card = (c: CatalogCarrier) => (
    <li key={c.id}>
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand-primary)] ${value === c.id ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5" : "border-border"}`}>
        <input type="radio" name="carrier-pick" className="mt-1" checked={value === c.id} onChange={() => onChange({ carrierId: c.id, carrier: "" })} />
        {c.operation === "EXCURSAO" ? <Bus className="mt-0.5 size-5 shrink-0 text-[var(--brand-primary)]" aria-hidden /> : <Truck className="mt-0.5 size-5 shrink-0 text-[var(--brand-primary)]" aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5 font-semibold">{c.name}
            {c.operation === "EXCURSAO" ? <Badge tone="neutral">Ônibus de excursão</Badge> : null}
            {c.docsOk ? <Badge tone="success" icon={<ShieldCheck className="size-3" aria-hidden />}>Documentação em dia</Badge> : null}
            {c.insurance ? <Badge tone="success">Seguro de carga</Badge> : null}
            {c.groupCompany ? <Badge tone="brand">Empresa do grupo</Badge> : null}
            <TierBadge tier={c.tier} />
            <RatingBadge rating={c.rating} />
          </span>
          <span className="block text-muted-foreground">Atende: {c.ufs.join(", ")}</span>
          <span className="block text-muted-foreground">{c.rateNotes ? `Frete: ${c.rateNotes}` : "Frete combinado com a transportadora"}</span>
        </span>
      </label>
    </li>
  );
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-semibold">Como sua mercadoria vai chegar</legend>
      <p className="text-sm text-muted-foreground">Transportadoras e ônibus de excursão da NextLevel Cargas. A importadora já recebe a sua escolha para chamar a coleta.</p>
      {shown.length ? <ul className="grid gap-2">{shown.map(card)}</ul> : <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">Ainda não há transportadora cadastrada que atenda {uf}. Use a sua (abaixo).</p>}
      {!all && rest.length ? <button type="button" className="text-sm font-semibold text-link underline" onClick={() => setAll(true)}>Ver também as que não atendem {uf} ({rest.length})</button> : null}
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${value === "" ? "border-[var(--brand-primary)]" : "border-border"}`}>
        <input type="radio" name="carrier-pick" className="mt-1" checked={value === ""} onChange={() => onChange({ carrierId: "", carrier: other })} />
        <span className="flex-1"><span className="font-semibold">Outra transportadora (a minha)</span>
          {value === "" ? <Input aria-label="Nome da sua transportadora" required maxLength={80} value={other} onChange={(e) => onChange({ carrierId: "", carrier: e.target.value })} placeholder="Ex.: Braspress, Jadlog, transportadora própria" className="mt-2" /> : <span className="block text-muted-foreground">Depois, indique ela em Fretes e ela passa a aparecer aqui.</span>}
        </span>
      </label>
    </fieldset>
  );
}
