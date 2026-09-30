import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MONEY_FLOWS, revenueMap, type MapEntry, type Status } from "@/lib/finance/revenue-map";
import type { PriceBook } from "@/lib/finance/price-book";

const STATUS_TONE: Record<Status, "success" | "info" | "warning" | "outline"> = { Implementado: "success", Parcial: "info", Planejado: "warning", Futuro: "outline" };
const GROUPS: MapEntry["group"][] = ["Fornecedor", "Lojista", "Canal", "Extras"];
const FLOW_TONE = { Automático: "success", Manual: "warning", Planejado: "outline" } as const;

export function RevenueMapView({ book }: { book: PriceBook }) {
  const entries = revenueMap(book);
  const counts = (["Implementado", "Parcial", "Planejado", "Futuro"] as Status[]).map((s) => [s, entries.filter((e) => e.status === s).length] as const);
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><div><CardTitle>Fluxo do dinheiro</CardTitle><CardDescription>A NextLevel nunca guarda saldo de terceiros. Recargas vão direto para a conta Mercado Pago do fornecedor.</CardDescription></div></CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {MONEY_FLOWS.map((f) => (
              <li key={f.from + f.to + f.what} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex shrink-0 items-center gap-2 text-sm font-medium sm:w-72"><span className="rounded-md bg-surface-muted px-2 py-1">{f.from}</span><ArrowRight className="size-4 text-muted-foreground" /><span className="rounded-md bg-surface-muted px-2 py-1">{f.to}</span></div>
                <div className="min-w-0 flex-1 text-sm"><div>{f.what}</div>{f.note ? <div className="text-xs text-muted-foreground">{f.note}</div> : null}</div>
                <Badge tone={FLOW_TONE[f.status]}>{f.status}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{entries.length} fontes de receita:</span>
        {counts.map(([s, n]) => <Badge key={s} tone={STATUS_TONE[s]}>{n} {s.toLowerCase()}</Badge>)}
      </div>

      {GROUPS.map((g) => (
        <section key={g}>
          <h3 className="mb-3 text-base font-semibold">{g === "Canal" ? "Canal (custo repassado ao fornecedor)" : g === "Extras" ? "Extras e expansão" : `Pago por ${g === "Fornecedor" ? "fornecedores" : "lojistas"}`}</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {entries.filter((e) => e.group === g).map((e) => (
              <Card key={e.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-3"><h4 className="text-sm font-semibold leading-snug">{e.name}</h4><Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge></div>
                  <p className="text-sm">{e.pricing}</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div><dt className="text-muted-foreground">Quem paga</dt><dd className="font-medium">{e.payer}</dd></div>
                    <div><dt className="text-muted-foreground">Quem recebe</dt><dd className="font-medium">{e.receiver}</dd></div>
                    <div><dt className="text-muted-foreground">Cobrança</dt><dd className="font-medium">{e.billing}</dd></div>
                    <div><dt className="text-muted-foreground">Quando</dt><dd className="font-medium">{e.when}</dd></div>
                  </dl>
                  {e.note ? <p className="border-t border-border pt-2 text-xs text-muted-foreground">{e.note}</p> : null}
                  <p className="text-[11px] text-subtle-foreground">Onde no sistema: {e.where}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
