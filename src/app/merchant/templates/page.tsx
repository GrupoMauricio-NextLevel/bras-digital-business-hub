import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getStoreTheme } from "@/lib/queries/merchant";
import { ThemeStore } from "./theme-store";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default async function MerchantTemplatesPage() {
  const session = await requireRole("STORE_OWNER");
  const { current, all } = await getStoreTheme(session.store!.id);
  return (
    <>
      <PageHeader title="Templates" description="NextLevel Theme Store. Escolha o visual da sua loja como quem escolhe um produto." />
      <Card className="mb-6"><CardContent className="flex items-start gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 size-4 text-success" /><div><span className="font-medium">Troque de tema sem perder nada.</span> <span className="text-muted-foreground">Produtos, clientes, pedidos e configurações ficam intactos — o tema só muda a apresentação.</span></div></CardContent></Card>
      <ThemeStore themes={all} activeThemeId={current?.theme.id ?? null} storeSlug={session.store!.slug} />
    </>
  );
}
