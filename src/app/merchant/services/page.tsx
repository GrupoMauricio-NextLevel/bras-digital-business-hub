import { ServicesPage } from "@/components/services/services-page";
import { StoreJourneyPage } from "@/components/nl-store/journey-page";
import { requireStoreAdmin } from "@/lib/require-session";
import { finFlag } from "@/lib/finance/flags";

export const dynamic = "force-dynamic";

export default async function MerchantServices({ searchParams }: { searchParams: Promise<{ pedir?: string }> }) {
  const session = await requireStoreAdmin();
  const { pedir } = await searchParams;
  // D90: Loja NextLevel em jornada (catálogo Master). FIN_CATALOG_MASTER=false volta à vitrine antiga.
  if (finFlag("FIN_CATALOG_MASTER")) return <StoreJourneyPage session={session} base="/merchant" pedir={pedir} />;
  return <ServicesPage session={session} base="/merchant" pedir={pedir} />;
}
