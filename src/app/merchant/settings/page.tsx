import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { SettingsForms } from "./settings-forms";
import { getBaseUrl } from "@/lib/base-url";
import { getDb } from "@/db/client";
import { independentSupplierOfStore } from "@/lib/domain/independent";
import { parseShippingConfig } from "@/lib/shipping/quote";
import { isDemoMode } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { suppliers } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function MerchantSettingsPage() {
  const session = await requireStoreAdmin();
  const s = session.store!;
  const db = await getDb();
  const hiddenId = await independentSupplierOfStore(db, s.id);
  const sup = hiddenId ? await db.query.suppliers.findFirst({ where: eq(suppliers.id, hiddenId) }) : null;
  const shippingConfig = parseShippingConfig(s.shippingConfig);
  const connect = sup ? { provider: sup.shippingProvider, status: sup.shippingStatus, account: sup.shippingAccount, originZip: sup.shippingOriginZip ?? "", demo: isDemoMode() } : null;
  return (
    <>
      <PageHeader title="Configurações" description="Dados da loja e integrações (modo demonstração: nada é conectado de verdade)." />
      <SettingsForms shippingConfig={shippingConfig} connect={connect} store={{ name: s.name, tagline: s.tagline ?? "", whatsapp: s.whatsapp ?? "", instagram: s.instagram ?? "", legalName: s.legalName ?? "", cnpj: s.cnpj ?? "", contactEmail: s.contactEmail ?? "", address: s.address ?? "", slug: s.slug, paymentStatus: s.paymentStatus, paymentProvider: s.paymentProvider, mpConnected: !!s.mpAccessTokenEnc, mpTest: false, webhookUrl: `${await getBaseUrl()}/api/webhooks/mercadopago?store=${s.slug}`, shippingStatus: s.shippingStatus, shippingProvider: s.shippingProvider, domainStatus: s.domainStatus, customDomain: s.customDomain }} />
    </>
  );
}
