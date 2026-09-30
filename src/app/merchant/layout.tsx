import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { getDb } from "@/db/client";
import { financeInvoices } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatBRL } from "@/lib/money";
import { Clock } from "lucide-react";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STORE_OWNER");
  let banner: React.ReactNode = null;
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
