import { ServicesPage } from "@/components/services/services-page";
import { requireRole } from "@/lib/require-session";

export default async function MerchantServices({ searchParams }: { searchParams: Promise<{ pedir?: string }> }) {
  const session = await requireRole("STORE_OWNER");
  return <ServicesPage session={session} base="/merchant" pedir={(await searchParams).pedir} />;
}
