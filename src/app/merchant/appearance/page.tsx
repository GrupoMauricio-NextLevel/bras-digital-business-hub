import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getStoreTheme } from "@/lib/queries/merchant";
import { canUse } from "@/lib/features";
import { AppearanceForm } from "./appearance-form";

export default async function AppearancePage() {
  const session = await requireRole("STORE_OWNER");
  const store = session.store!;
  const { settings } = await getStoreTheme(store.id);
  return (
    <>
      <PageHeader title="Aparência" description="Logo, cores e conteúdo da home. As alterações valem para qualquer tema." />
      <AppearanceForm advanced={canUse(store.offer, "appearanceAdvanced")} slug={store.slug} name={store.name} initial={{ logoText: store.logoText ?? "", primaryColor: store.primaryColor, accentColor: store.accentColor, settings }} />
    </>
  );
}
