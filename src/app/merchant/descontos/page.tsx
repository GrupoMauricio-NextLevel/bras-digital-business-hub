import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listDiscounts } from "@/lib/domain/discounts";
import { storeModality } from "@/lib/domain/order-policy";
import { DiscountManager } from "./discount-manager";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { cuponsAgora } from "@/lib/domain/loja-agora";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";

export const dynamic = "force-dynamic";

export default async function DescontosPage() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  if ((await storeModality(db, session.store!.id)) === "NETWORK") redirect("/merchant");
  const rows = await listDiscounts(db, session.store!.id);
  return (
    <>
      <PageHeader title="Cupons de desconto" description="Códigos que seus clientes digitam no carrinho. O desconto nunca deixa o pedido abaixo do custo dos produtos." />
      {(await perfilAtual(session.store!.id)).ecommerce ? <PrecisaDeVoce itens={cuponsAgora(rows)} vazio="Cupons em dia: nenhum vencendo ou esgotado." /> : null}
      <DiscountManager rows={rows.map((d) => ({ id: d.id, code: d.code, kind: d.kind, value: d.value, minSubtotalCents: d.minSubtotalCents, maxRedemptions: d.maxRedemptions, redemptions: d.redemptions, expiresAt: d.expiresAt, active: d.active }))} />
    </>
  );
}
