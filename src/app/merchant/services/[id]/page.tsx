import { ServiceOrderPage } from "@/components/services/order-page";
import { requireRole } from "@/lib/require-session";

export default async function MerchantServiceOrder({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("STORE_OWNER");
  return <ServiceOrderPage session={session} id={(await params).id} backHref="/merchant/services" />;
}
