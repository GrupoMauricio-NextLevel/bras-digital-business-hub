import { ServiceOrderPage } from "@/components/services/order-page";
import { requireRole } from "@/lib/require-session";

export default async function MasterServiceOrder({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  return <ServiceOrderPage session={session} id={(await params).id} backHref="/master/services" />;
}
