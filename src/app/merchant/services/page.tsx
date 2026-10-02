import { ServicesPage } from "@/components/services/services-page";
import { requireAreaRole } from "@/lib/require-session";

export default async function MerchantServices({ searchParams }: { searchParams: Promise<{ pedir?: string }> }) {
  const session = await requireAreaRole("SUPERDROP", "MERCHANT_OWNER");
  return <ServicesPage session={session} base="/merchant" pedir={(await searchParams).pedir} />;
}
