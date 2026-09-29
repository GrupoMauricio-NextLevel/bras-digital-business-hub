import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getMerchantServices } from "@/lib/queries/merchant";
import { ServiceCards } from "./service-cards";

export default async function ServicesPage() {
  const session = await requireRole("STORE_OWNER");
  const services = await getMerchantServices(session.store!.id);
  return (
    <>
      <PageHeader title="Serviços NextLevel" description="Especialistas para acelerar sua loja: design, conteúdo, tráfego e configuração. Clique em “Tenho interesse” e nossa equipe entra em contato." />
      <ServiceCards services={services.map((s) => ({ id: s.id, name: s.name, description: s.description, category: s.category, priceFromCents: s.priceFromCents, icon: s.icon, leadStatus: s.lead?.status ?? null }))} />
    </>
  );
}
