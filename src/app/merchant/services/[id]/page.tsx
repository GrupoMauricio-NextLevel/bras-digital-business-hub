import { ServiceOrderPage } from "@/components/services/order-page";
import { requireStoreAdmin } from "@/lib/require-session";

export default async function MerchantServiceOrder({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStoreAdmin();
  return <ServiceOrderPage session={session} id={(await params).id} backHref="/merchant/services" />;
}
