import { ServicesPage } from "@/components/services/services-page";
import { SupplierOffersPage } from "@/components/nl-store/journey-page";
import { requireRole } from "@/lib/require-session";
import { finFlag } from "@/lib/finance/flags";

export const dynamic = "force-dynamic";

export default async function SupplierServices({ searchParams }: { searchParams: Promise<{ pedir?: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  const { pedir } = await searchParams;
  if (finFlag("FIN_CATALOG_MASTER")) return <SupplierOffersPage session={session} base="/supplier" pedir={pedir} />;
  return <ServicesPage session={session} base="/supplier" pedir={pedir} />;
}
