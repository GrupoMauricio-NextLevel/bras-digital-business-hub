import { ServiceOrderPage } from "@/components/services/order-page";
import { requireAreaRole } from "@/lib/require-session";

export default async function SupplierServiceOrder({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  return <ServiceOrderPage session={session} id={(await params).id} backHref="/supplier/services" />;
}
