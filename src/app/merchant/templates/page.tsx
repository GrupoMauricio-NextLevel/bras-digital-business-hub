import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { UpgradeCard } from "@/components/app/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { isDemoMode } from "@/lib/auth";
import { canUse } from "@/lib/features";
import { requireStoreAdmin } from "@/lib/require-session";
import { themeCardsFor } from "@/lib/themes/install";
import { eq } from "drizzle-orm";
import { financeInvoices, nextlevelPayments } from "@/db/schema";
import { ThemeStore } from "./theme-store";

export default async function MerchantTemplatesPage({ searchParams }: { searchParams: Promise<{ pago?: string; ver?: string }> }) {
  const { pago, ver } = await searchParams;
  const session = await requireStoreAdmin();
  const store = session.store!;
  let returning: { paymentId: string; key: string; paid: boolean } | null = null;
  if (pago && /^nlp_[a-z0-9]+$/i.test(pago)) {
    const db = await getDb();
    const pay = await db.query.nextlevelPayments.findFirst({ where: eq(nextlevelPayments.id, pago) });
    const inv = pay ? await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, pay.invoiceId) }) : null;
    const ent = inv?.storeId === store.id ? inv.dedupeKey.split(":")[2] : undefined;
    if (pay && ent?.startsWith("THEME_")) returning = { paymentId: pay.id, key: ent.replace("THEME_", "").toLowerCase(), paid: pay.status === "PAID" };
  }
  return (
    <>
      <PageHeader title="Temas" description="Escolha o visual da sua loja. Veja com os seus produtos, compre no cartão em até 6x ou no Pix com desconto e instale com 1 clique." />
      {!canUse(store.offer, "storefront") ? <UpgradeCard feature="storefront" /> : (
        <>
          <Card className="mb-6"><CardContent className="flex items-start gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 size-4 text-success" aria-hidden /><div><span className="font-medium">Troque de tema sem perder nada.</span> <span className="text-muted-foreground">Produtos, clientes, pedidos e configurações ficam intactos. O tema só muda a apresentação, e o visual anterior fica no histórico para você voltar.</span></div></CardContent></Card>
          <ThemeStore cards={await themeCardsFor(await getDb(), session.actor)} slug={store.slug} demo={isDemoMode()} returning={returning} autoPreview={ver && /^[a-z0-9-]{1,30}$/.test(ver) ? ver : undefined} />
        </>
      )}
    </>
  );
}
