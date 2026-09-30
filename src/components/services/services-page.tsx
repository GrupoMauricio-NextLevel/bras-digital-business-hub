import { PageHeader } from "@/components/app/page-header";
import { ServicesHub } from "@/components/services/services-hub";
import { getServicesHub } from "@/lib/queries/services-hub";
import type { Session } from "@/lib/auth";

export async function ServicesPage({ session, base, pedir }: { session: Session; base: string; pedir?: string }) {
  const hub = await getServicesHub(session);
  return (
    <>
      <PageHeader title="Loja NextLevel" description="Especialistas para acelerar o seu negócio. Peça, receba o orçamento e acompanhe cada etapa aqui." />
      <ServicesHub catalog={hub.catalog} recommended={hub.recommended} orders={hub.orders} base={base} autoOpenKey={pedir} />
    </>
  );
}
