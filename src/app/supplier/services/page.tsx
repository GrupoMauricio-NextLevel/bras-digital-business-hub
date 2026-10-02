import { ServicesPage } from "@/components/services/services-page";
import { requireAreaRole } from "@/lib/require-session";

export default async function SupplierServices({ searchParams }: { searchParams: Promise<{ pedir?: string }> }) {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  return <ServicesPage session={session} base="/supplier" pedir={(await searchParams).pedir} />;
}
