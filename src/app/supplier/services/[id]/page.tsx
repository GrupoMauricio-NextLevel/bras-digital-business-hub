import { ServiceOrderPage } from "@/components/services/order-page";
import { requireRole } from "@/lib/require-session";

export default async function SupplierServiceOrder({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <ServiceOrderPage session={session} id={(await params).id} backHref="/supplier/services" />;
}
