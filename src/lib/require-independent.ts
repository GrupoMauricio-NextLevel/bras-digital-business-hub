import { redirect } from "next/navigation";
import type { CatalogOwner } from "@/lib/domain/independent";
import { requireRole } from "./require-session";

/** Só o lojista de loja independente da Commerce entra (D89); membros de fornecedor seguem pelo painel deles. */
export async function requireIndependent(): Promise<{ session: Awaited<ReturnType<typeof requireRole>>; owner: CatalogOwner }> {
  const session = await requireRole("STORE_OWNER");
  if (!session.store || session.store.networkId) redirect("/merchant/products");
  return { session, owner: { storeId: session.store.id } };
}
