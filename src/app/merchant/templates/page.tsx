import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { UpgradeCard } from "@/components/app/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { isDemoMode } from "@/lib/auth";
import { canUse } from "@/lib/features";
import { requireAreaRole } from "@/lib/require-session";
import { themeCardsFor } from "@/lib/themes/install";
import { ThemeStore } from "./theme-store";

export default async function MerchantTemplatesPage() {
  const session = await requireAreaRole("SUPERDROP", "MERCHANT_OWNER");
  const store = session.store!;
  return (
    <>
      <PageHeader title="Temas" description="Escolha o visual da sua loja. Veja com os seus produtos, compre por Pix e instale com 1 clique." />
      {!canUse(store.offer, "storefront") ? <UpgradeCard feature="storefront" /> : (
        <>
          <Card className="mb-6"><CardContent className="flex items-start gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 size-4 text-success" aria-hidden /><div><span className="font-medium">Troque de tema sem perder nada.</span> <span className="text-muted-foreground">Produtos, clientes, pedidos e configurações ficam intactos. O tema só muda a apresentação, e o visual anterior fica no histórico para você voltar.</span></div></CardContent></Card>
          <ThemeStore cards={await themeCardsFor(await getDb(), session.actor)} slug={store.slug} demo={isDemoMode()} />
        </>
      )}
    </>
  );
}
