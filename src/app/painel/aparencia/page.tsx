import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { requireStoreAdmin } from "@/lib/require-session";
import { normalizeStadiumTokens } from "@/theme-estadio/tokens";
import { AparenciaClient } from "./aparencia-client";

export const dynamic = "force-dynamic";

export default async function AparenciaPage() {
  const session = await requireStoreAdmin();
  const storeId = session.store?.id;
  if (!storeId) notFound();
  const row = await (await getDb()).query.stores.findFirst({ where: eq(stores.id, storeId), columns: { themeSettings: true } });
  const initialTokens = normalizeStadiumTokens(row?.themeSettings ?? null);
  return <AparenciaClient initialTokens={initialTokens} />;
}
