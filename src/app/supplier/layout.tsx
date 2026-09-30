import { AlertTriangle, CalendarClock } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { BlockedScreen } from "@/components/app/blocked-screen";
import { getDb } from "@/db/client";
import { supplierBilling } from "@/lib/domain/finance";
import { isDemoMode } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH"]);
  const supplier = session.supplier;
  let banner: React.ReactNode = null;
  if (supplier) {
    const b = await supplierBilling(await getDb(), supplier.id);
    if (b.state === "SUSPENDED" && b.open.length) {
      if (session.user.role === "SUPPLIER_DISPATCH") {
        return <div className="flex min-h-dvh items-center justify-center p-6 text-center"><div><h1 className="text-xl font-bold">Acesso pausado</h1><p className="mt-2 text-muted-foreground">Fale com o gestor da {supplier.name} para regularizar o acesso.</p></div></div>;
      }
      const [main, ...others] = b.open;
      return <BlockedScreen storeName={supplier.name} reason="SUPPLIER" invoice={{ id: main!.id, amountCents: main!.amountCents, description: main!.description }} others={others.map((o) => ({ id: o.id, amountCents: o.amountCents, description: o.description }))} demo={isDemoMode()} logout={logout} />;
    }
    if (session.user.role === "SUPPLIER_ADMIN") {
      if (b.overdueCount > 0) {
        banner = (
          <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-danger/30 bg-danger-soft/50 p-4 text-sm" data-billing-banner>
            <AlertTriangle className="size-4 text-danger" aria-hidden />
            <div className="min-w-0 flex-1"><span className="font-semibold">{b.overdueCount} {b.overdueCount === 1 ? "fatura vencida" : "faturas vencidas"} ({formatBRL(b.overdueCents)}), a mais antiga há {b.worstOverdueDays} {b.worstOverdueDays === 1 ? "dia" : "dias"}.</span>{b.next ? <> Se nada for pago, o acesso {b.next.state === "PARTIAL_BLOCK" ? "fica com bloqueio parcial (sem novos pedidos e lojas)" : b.next.state === "SUSPENDED" ? "é pausado" : b.next.state === "CLOSED" ? "é encerrado" : "entra em aviso"} em {b.next.inDays} {b.next.inDays === 1 ? "dia" : "dias"}.</> : null}</div>
            <Link href="/supplier/invoices" className="font-semibold underline">Pagar agora</Link>
          </div>
        );
      } else if (b.open.some((i) => i.daysToDue <= 3)) {
        const next = b.open.find((i) => i.daysToDue <= 3)!;
        banner = (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft/50 p-4 text-sm" data-billing-banner>
            <CalendarClock className="size-4 text-warning" aria-hidden />
            <div className="min-w-0 flex-1"><span className="font-semibold">Fatura vence em {formatDate(next.dueDate)}:</span> {next.description} ({formatBRL(next.amountCents)}).</div>
            <Link href="/supplier/invoices" className="font-semibold underline">Ver faturas</Link>
          </div>
        );
      }
    }
  }
  return <RoleLayout session={session} banner={banner}>{children}</RoleLayout>;
}
