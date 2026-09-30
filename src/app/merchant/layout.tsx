import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { getDb } from "@/db/client";
import { financeInvoices } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { Clock, Hourglass } from "lucide-react";
import Link from "next/link";
import { BlockedScreen } from "@/components/app/blocked-screen";
import { ensurePlanInvoice, storeAccess } from "@/lib/domain/store-access";
import { isDemoMode } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { TrialDemoButton } from "./trial-demo-button";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STORE_OWNER");
  let banner: React.ReactNode = null;
  const access = session.store ? storeAccess(session.store) : null;
  if (session.store && access?.state === "BLOCKED") {
    const db = await getDb();
    // Setup em aberto vem primeiro; depois do pagamento aparece a fatura do plano.
    const setup = await db.query.financeInvoices.findFirst({ where: and(eq(financeInvoices.storeId, session.store.id), eq(financeInvoices.kind, "STORE_SETUP"), eq(financeInvoices.status, "OPEN")) });
    const inv = setup ? { invoiceId: setup.id, amountCents: setup.amountCents, description: `Setup da loja · ${setup.description}` } : await ensurePlanInvoice(db, session.store, 1);
    return <BlockedScreen storeName={session.store.name} reason={session.store.paidUntil ? "PLAN" : "TRIAL"} invoice={{ id: inv.invoiceId, amountCents: inv.amountCents, description: inv.description }} demo={isDemoMode()} logout={logout} />;
  }
  if (access?.state === "TRIAL") {
    banner = (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-info/30 bg-info-soft p-4 text-sm text-info" data-trial-banner>
        <Hourglass className="size-4" aria-hidden />
        <div className="min-w-0 flex-1"><span className="font-semibold">Teste gratuito: {access.daysLeft} {access.daysLeft === 1 ? "dia restante" : "dias restantes"}.</span> Tudo está liberado. Para continuar depois, assine por Pix.</div>
        <Link href="/merchant/finance" className="font-semibold underline">Assinar agora</Link>
        {isDemoMode() ? <TrialDemoButton /> : null}
      </div>
    );
  }
  if (session.store?.status === "PENDING_PAYMENT") {
    const inv = await (await getDb()).query.financeInvoices.findFirst({ where: and(eq(financeInvoices.storeId, session.store.id), eq(financeInvoices.kind, "STORE_SETUP")) });
    banner = (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft/50 p-4 text-sm">
        <Clock className="mt-0.5 size-4 text-warning" />
        <div><div className="font-semibold">Sua loja será liberada após o pagamento{inv ? ` de ${formatBRL(inv.amountCents)}` : ""} à NextLevel</div><p className="mt-0.5 text-muted-foreground">Enquanto isso você pode configurar aparência e produtos. A publicação e as vendas são liberadas quando o pagamento for confirmado.</p></div>
      </div>
    );
  }
  return <RoleLayout session={session} banner={banner}>{children}</RoleLayout>;
}
