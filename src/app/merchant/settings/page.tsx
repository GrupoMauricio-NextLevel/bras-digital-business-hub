import { CreditCard, Globe, Store, Truck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { requireStoreAdmin } from "@/lib/require-session";
import { SettingsForms } from "./settings-forms";
import { getBaseUrl } from "@/lib/base-url";
import { getDb } from "@/db/client";
import { independentSupplierOfStore } from "@/lib/domain/independent";
import { parseShippingConfig } from "@/lib/shipping/quote";
import { isDemoMode } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { suppliers } from "@/db/schema";
import { isCommerceStore } from "@/lib/store-brand";

export const dynamic = "force-dynamic";

export default async function MerchantSettingsPage() {
  const session = await requireStoreAdmin();
  const s = session.store!;
  const db = await getDb();
  const commerce = await isCommerceStore(db, s);
  const hiddenId = await independentSupplierOfStore(db, s.id);
  const sup = hiddenId ? await db.query.suppliers.findFirst({ where: eq(suppliers.id, hiddenId) }) : null;
  const shippingConfig = parseShippingConfig(s.shippingConfig);
  const connect = sup ? { provider: sup.shippingProvider, status: sup.shippingStatus, account: sup.shippingAccount, originZip: sup.shippingOriginZip ?? "", demo: isDemoMode() } : null;
  const paymentConnected = !!s.mpAccessTokenEnc;
  const shippingReady = connect ? connect.status === "CONNECTED" : s.shippingStatus === "CONNECTED";
  const domainReady = s.domainStatus === "CONNECTED";
  const profileComplete = Boolean(s.name && s.contactEmail && s.whatsapp);
  const queue = ([
    !paymentConnected ? { id: "payment", title: "Conecte o Mercado Pago", description: "Sem uma conta conectada, sua loja não consegue confirmar pagamentos automaticamente.", tone: "danger", icon: CreditCard, href: "#payments", actionLabel: "Conectar" } : null,
    !shippingReady ? { id: "shipping", title: "Revise o frete da loja", description: "A configuração de envio ainda não está pronta para cotação completa.", tone: "warning", icon: Truck, href: "#shipping", actionLabel: "Configurar" } : null,
    !profileComplete ? { id: "profile", title: "Complete os dados públicos da loja", description: "Contato e identificação aumentam confiança no checkout e no rodapé.", tone: "warning", icon: Store, href: "#dados", actionLabel: "Completar" } : null,
  ] as (ActionQueueItem | null)[]).filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title="Configurações" description={commerce ? "Dados da empresa, pagamentos, frete, domínio e integrações da sua operação de e-commerce." : "Dados da loja e integrações (modo demonstração: nada é conectado de verdade)."} />
      <OperationalPulse className="mb-5" items={[
        { label: "Dados da loja", value: profileComplete ? "Prontos" : "Incompletos", icon: Store, tone: profileComplete ? "success" : "warning", hint: s.name },
        { label: "Pagamentos", value: paymentConnected ? "Conectado" : "Pendente", icon: CreditCard, tone: paymentConnected ? "success" : "danger", hint: "Mercado Pago" },
        { label: "Frete", value: shippingReady ? "Configurado" : "Pendente", icon: Truck, tone: shippingReady ? "success" : "warning", hint: connect?.provider ?? s.shippingProvider ?? "sem provedor" },
        { label: "Domínio", value: domainReady ? "Conectado" : s.domainStatus, icon: Globe, tone: domainReady ? "success" : "neutral", hint: s.customDomain ?? "subdomínio da plataforma" },
      ]} />
      <ActionQueue className="mb-6" items={queue} title="Configurações que exigem atenção" description="O que falta para sua loja operar com menos atrito." emptyMessage="As configurações essenciais estão prontas." />
      <section id="dados">
      <SettingsForms shippingConfig={shippingConfig} connect={connect} store={{ name: s.name, tagline: s.tagline ?? "", whatsapp: s.whatsapp ?? "", instagram: s.instagram ?? "", legalName: s.legalName ?? "", cnpj: s.cnpj ?? "", contactEmail: s.contactEmail ?? "", address: s.address ?? "", slug: s.slug, paymentStatus: s.paymentStatus, paymentProvider: s.paymentProvider, mpConnected: !!s.mpAccessTokenEnc, mpTest: false, webhookUrl: `${await getBaseUrl()}/api/webhooks/mercadopago?store=${s.slug}`, shippingStatus: s.shippingStatus, shippingProvider: s.shippingProvider, domainStatus: s.domainStatus, customDomain: s.customDomain }} />
      </section>
    </>
  );
}
