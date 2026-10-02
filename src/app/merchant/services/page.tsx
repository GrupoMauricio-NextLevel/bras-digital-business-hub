import { ServicesPage } from "@/components/services/services-page";
import { requireStoreAdmin } from "@/lib/require-session";

export default async function MerchantServices({ searchParams }: { searchParams: Promise<{ pedir?: string }> }) {
  const session = await requireStoreAdmin();
  return <ServicesPage session={session} base="/merchant" pedir={(await searchParams).pedir} />;
}
