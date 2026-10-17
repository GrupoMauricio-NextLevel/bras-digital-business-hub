import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { brasPanelsEnabled } from "@/lib/bras/panels";
import { counterByToken } from "@/lib/domain/club/balcao";
import { AreaTheme } from "@/design-system/components/area-theme";
import { CounterDesk } from "@/components/club/balcao-forms";
import "@/components/portal/bras/bras.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Balcão do Club", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * Balcão do Brás Digital Club numa empresa do grupo (D120): link privado, sem login, atrás da chave BRAS_PANELS.
 * Lê o cartão do cliente (primeiro nome e saldo), registra a compra (vira pontos) e usa o vale que o cliente mostrar.
 */
export default async function BalcaoClub({ params }: { params: Promise<{ token: string }> }) {
  if (!brasPanelsEnabled()) notFound();
  const { token } = await params;
  const counter = await counterByToken(await getDb(), token);
  if (!counter) notFound();
  return (
    <>
      <AreaTheme theme="bras" brand="BRAS_DIGITAL" />
      <main className="bd-home mx-auto min-h-dvh max-w-xl px-4 py-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-acao)]">Brás Digital Club · Balcão</p>
        <h1 className="mt-1 text-2xl font-bold">{counter.companyName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{counter.name}. Peça o cartão do Club no celular do cliente, registre a compra e, se ele quiser, use o vale dele. Os pontos aparecem na hora no Meu Brás.</p>
        <div className="mt-6"><CounterDesk token={token} companyName={counter.companyName} /></div>
      </main>
    </>
  );
}
