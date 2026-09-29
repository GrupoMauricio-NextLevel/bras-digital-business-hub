import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { SettingsForms } from "./settings-forms";

export default async function MerchantSettingsPage() {
  const session = await requireRole("STORE_OWNER");
  const s = session.store!;
  return (
    <>
      <PageHeader title="Configurações" description="Dados da loja e integrações (modo demonstração: nada é conectado de verdade)." />
      <SettingsForms store={{ name: s.name, tagline: s.tagline ?? "", whatsapp: s.whatsapp ?? "", instagram: s.instagram ?? "", slug: s.slug, paymentStatus: s.paymentStatus, paymentProvider: s.paymentProvider, shippingStatus: s.shippingStatus, shippingProvider: s.shippingProvider, domainStatus: s.domainStatus, customDomain: s.customDomain }} />
    </>
  );
}
