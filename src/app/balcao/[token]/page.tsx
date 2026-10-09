import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCheck, PackageOpen } from "lucide-react";
import { getDb } from "@/db/client";
import { brasPanelsEnabled } from "@/lib/bras/panels";
import { balcaoQueue, type BalcaoLine } from "@/lib/domain/bras/balcao";
import { AreaTheme } from "@/design-system/components/area-theme";
import { ConfirmPickup } from "./confirm";
import "@/components/portal/bras/bras.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Balcão", robots: { index: false, follow: false }, referrer: "no-referrer" };

function Linha({ l, token, retirar }: { l: BalcaoLine; token: string; retirar: boolean }) {
  return (
    <li className="ds-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">Pedido <span className="tabular-nums">{l.number}</span>{retirar ? <> · código <span className="font-mono">{l.pickupCode ?? "—"}</span></> : null}</p>
        <p className="text-sm font-bold tabular-nums">{l.boxes} caixa(s)</p>
      </div>
      <p className="mt-1">{l.productTitle} <span className="text-sm text-muted-foreground">({l.unitsPerBox} un. por caixa)</span></p>
      <p className="mt-2 text-sm text-muted-foreground">Transportadora: <b className="text-foreground">{l.carrier}</b> · Enviar para {l.shipName}, {l.shipAddress}, {l.shipCity}/{l.shipState}, CEP {l.shipZip}</p>
      {retirar ? <ConfirmPickup token={token} requestId={l.id} number={l.number} /> : null}
    </li>
  );
}

/**
 * Balcão da importadora (D106): link privado, sem login, atrás da chave BRAS_PANELS. Só o que separar e o que entregar à
 * transportadora; nada do comprador além do envio, nenhum valor. Confirmar a retirada exige o código do motorista.
 */
export default async function Balcao({ params }: { params: Promise<{ token: string }> }) {
  if (!brasPanelsEnabled()) notFound();
  const { token } = await params;
  const q = await balcaoQueue(await getDb(), token);
  if (!q) notFound();
  return (
    <>
      <AreaTheme theme="bras" brand="BRAS_DIGITAL" />
      <main className="bd-home mx-auto min-h-dvh max-w-3xl px-4 py-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-laranja)]">Brás Digital · Balcão</p>
        <h1 className="mt-1 text-2xl font-bold">{q.importer.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pedidos para separar e para entregar à transportadora. Dúvida ou ocorrência: fale com a equipe da Brás Digital.</p>
        <section aria-labelledby="ret-t" className="mt-8">
          <h2 id="ret-t" className="flex items-center gap-2 text-lg font-bold"><PackageCheck className="size-5 text-[var(--bd-laranja)]" aria-hidden />Pagos: entregar à transportadora ({q.retirar.length})</h2>
          {q.retirar.length ? <ul className="mt-3 space-y-3">{q.retirar.map((l) => <Linha key={l.id} l={l} token={token} retirar />)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nenhum pedido pago esperando retirada.</p>}
        </section>
        <section aria-labelledby="sep-t" className="mt-10">
          <h2 id="sep-t" className="flex items-center gap-2 text-lg font-bold"><PackageOpen className="size-5 text-[var(--bd-laranja)]" aria-hidden />Confirmados: separar as caixas ({q.separar.length})</h2>
          <p className="text-sm text-muted-foreground">Ainda sem pagamento: separe e aguarde. A retirada só é liberada quando o pedido aparecer em &quot;Pagos&quot;.</p>
          {q.separar.length ? <ul className="mt-3 space-y-3">{q.separar.map((l) => <Linha key={l.id} l={l} token={token} retirar={false} />)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nada para separar agora.</p>}
        </section>
      </main>
    </>
  );
}
