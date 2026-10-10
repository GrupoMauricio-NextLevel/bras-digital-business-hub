import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCheck, Truck } from "lucide-react";
import { getDb } from "@/db/client";
import { driverQueue } from "@/lib/domain/cargas/cargas";
import { AreaTheme } from "@/design-system/components/area-theme";
import { LoadCard } from "@/components/cargas/load-card";
import { DriverDeliverButton } from "@/components/cargas/cargas-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Motorista", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * Tela do motorista (D111): link privado, sem login (padrão D106). Mostra as coletas aceitas (onde, quando e os códigos
 * de retirada) e as coletadas (onde entregar), com o botão "Entreguei". Sem frete, sem dados do comprador além do envio.
 */
export default async function Motorista({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const q = await driverQueue(await getDb(), token);
  if (!q) notFound();
  return (
    <>
      <AreaTheme theme="cargas" brand="NEXTLEVEL_CARGAS" />
      <main className="mx-auto min-h-dvh max-w-2xl bg-background px-4 py-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--brand-primary)]">NextLevel Cargas · Motorista</p>
        <h1 className="mt-1 text-2xl font-bold">{q.carrier.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">No balcão, mostre o código de cada pedido: sem o código a importadora não entrega. Dúvida: fale com a sua transportadora.</p>
        <section aria-labelledby="m-col" className="mt-8">
          <h2 id="m-col" className="flex items-center gap-2 text-lg font-bold"><PackageCheck className="size-5 text-[var(--brand-primary)]" aria-hidden />Coletar ({q.coletar.length})</h2>
          {q.coletar.length ? <ul className="mt-3 space-y-3">{q.coletar.map((l) => <LoadCard key={l.id} load={l} who="motorista" showEvents={false} />)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nenhuma coleta aceita esperando.</p>}
        </section>
        <section aria-labelledby="m-ent" className="mt-10">
          <h2 id="m-ent" className="flex items-center gap-2 text-lg font-bold"><Truck className="size-5 text-[var(--brand-primary)]" aria-hidden />Entregar ({q.entregar.length})</h2>
          {q.entregar.length ? <ul className="mt-3 space-y-3">{q.entregar.map((l) => <LoadCard key={l.id} load={l} who="motorista" showEvents={false} actions={<DriverDeliverButton token={token} loadId={l.id} />} />)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nada em trânsito.</p>}
        </section>
      </main>
    </>
  );
}
