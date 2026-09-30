import { ServicesPage } from "@/components/services/services-page";
import { requireRole } from "@/lib/require-session";

export default async function SupplierServices({ searchParams }: { searchParams: Promise<{ pedir?: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <ServicesPage session={session} base="/supplier" pedir={(await searchParams).pedir} />;
}
