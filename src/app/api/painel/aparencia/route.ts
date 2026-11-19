import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { normalizeStadiumTokens } from "@/theme-estadio/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "STORE_OWNER" || session.user.storeRole === "STAFF" || !session.store?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const body = await req.json().catch(() => null) as { tokens?: unknown } | null;
  if (!body?.tokens) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const tokens = normalizeStadiumTokens(body.tokens);
  const db = await getDb();
  await db.update(stores).set({ themeSettings: tokens, updatedAt: sql`now()` }).where(eq(stores.id, session.store.id));

  revalidatePath(`/store/${session.store.slug}`, "layout");
  revalidatePath(`/store/${session.store.slug}/product/[productSlug]`, "page");
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
