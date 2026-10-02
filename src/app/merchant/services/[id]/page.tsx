import { ServiceOrderPage } from "@/components/services/order-page";
import { requireAreaRole } from "@/lib/require-session";

export default async function MerchantServiceOrder({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAreaRole("SUPERDROP", "MERCHANT_OWNER");
  return <ServiceOrderPage session={session} id={(await params).id} backHref="/merchant/services" />;
}
