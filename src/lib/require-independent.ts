import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { independentSupplierOfStore } from "@/lib/domain/independent";
import { requireRole } from "./require-session";

/** Só o lojista de conta simples (Central oculta) entra; membros de fornecedor seguem pelo painel deles. */
export async function requireIndependent() {
  const session = await requireRole("STORE_OWNER");
  const supplierId = await independentSupplierOfStore(await getDb(), session.store?.id);
  if (!supplierId) redirect("/merchant/products");
  return { session, supplierId };
}
