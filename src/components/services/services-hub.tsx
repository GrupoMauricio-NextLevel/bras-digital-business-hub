"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { StatusBadge } from "@/components/app/status-badge";
import { requestServiceAction } from "@/app/actions/services";
import { formatBRL } from "@/lib/money";
import type { HubOrder, HubService } from "@/lib/queries/services-hub";

export const SERVICE_STATUS_LABEL: Record<string, string> = { REQUESTED: "Enviado", IN_ANALYSIS: "Em análise", QUOTED: "Orçamento recebido", IN_PROGRESS: "Em execução", DELIVERED: "Entregue", CANCELED: "Cancelado" };
const tone = (s: string) => (s === "DELIVERED" ? "PAID" : s === "CANCELED" ? "CANCELED" : "PENDING");

type Props = { catalog: HubService[]; recommended: { service: HubService; reason: string }[]; orders: HubOrder[]; base: string; autoOpenKey?: string };

export function ServicesHub({ catalog, recommended, orders, base, autoOpenKey }: Props) {
  const router = useRouter();
  const [target, setTarget] = React.useState<HubService | null>(() => catalog.find((c) => c.key === autoOpenKey) ?? null);
  const [briefing, setBriefing] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const openIds = new Set(orders.filter((o) => !["DELIVERED", "CANCELED"].includes(o.status)).map((o) => o.serviceName));
  const reasonOf = (id: string) => recommended.find((r) => r.service.id === id)?.reason;

  const send = async () => {
    if (!target) return;
    setBusy(true);
    const r = await requestServiceAction({ serviceId: target.id, briefing });
    setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success("Pedido enviado. A NextLevel responde com o orçamento.");
    setTarget(null); setBriefing(""); router.push(`${base}/services/${r.data.id}`);
  };

  return (
    <div className="space-y-8">
      {orders.length ? (
        <section aria-label="Meus pedidos">
          <h2 className="mb-3 text-base font-semibold">Meus pedidos</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`${base}/services/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-surface-hover">
                  <span className="font-medium">{o.serviceName}</span>
                  <span className="flex items-center gap-3">{o.quotedCents ? <span className="tabular-nums">{formatBRL(o.quotedCents)}</span> : null}<StatusBadge value={tone(o.status)} dot={false} /><span className="text-xs font-medium">{SERVICE_STATUS_LABEL[o.status]}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Catálogo">
        <h2 className="mb-3 text-base font-semibold">Serviços</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((s) => {
            const reason = reasonOf(s.id);
            return (
              <Card key={s.id} className="flex flex-col">
                <CardContent className="flex-1 pt-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone="outline">{s.category}</Badge>{reason ? <Badge tone="info">Recomendado</Badge> : null}{s.deliveryDays ? <span className="text-xs text-muted-foreground">Prazo ~{s.deliveryDays} {s.deliveryDays === 1 ? "dia" : "dias"}</span> : null}</div>
                  <h3 className="text-base font-semibold">{s.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  {reason ? <p className="mt-2 rounded-md bg-accent-soft px-2 py-1.5 text-xs text-accent-foreground">{reason}</p> : null}
                  {s.highlights.length ? <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{s.highlights.map((h) => <li key={h}>• {h}</li>)}</ul> : null}
                </CardContent>
                <CardFooter className="justify-between">
                  <span className="text-sm"><span className="text-xs text-muted-foreground">a partir de</span> <span className="font-semibold tabular-nums">{formatBRL(s.priceFromCents ?? 0)}</span></span>
                  {openIds.has(s.name) ? <span className="text-xs font-medium text-muted-foreground">Pedido em andamento</span> : <Button size="sm" onClick={() => { setTarget(s); setBriefing(""); }}><Sparkles /> Solicitar</Button>}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      <Dialog open={!!target} onOpenChange={(o) => { if (!o) setTarget(null); }}>
        {target ? (
          <DialogContent title={`Solicitar: ${target.name}`} description="Conte o que você precisa. A equipe NextLevel responde com um orçamento e acompanha tudo por aqui.">
            <FormField label="O que você precisa?" htmlFor="briefing" hint="Mínimo de 10 caracteres."><Textarea id="briefing" value={briefing} onChange={(e) => setBriefing(e.target.value)} rows={5} placeholder="Ex.: preciso de 6 banners para a campanha de fim de mês." /></FormField>
            <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setTarget(null)}>Cancelar</Button><Button loading={busy} disabled={briefing.trim().length < 10} onClick={send}>Enviar pedido</Button></div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
