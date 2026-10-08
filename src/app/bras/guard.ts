import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { canOpenBrasPanelPreview } from "@/lib/bras/panels";

/** Prévia das cascas Brás: Master + BRAS_PANELS=true. Sem a chave, a rota não existe (404), sem revelar a área. */
export async function requireBrasPanelPreview() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  if (!canOpenBrasPanelPreview(session.actor)) notFound();
  return session;
}
