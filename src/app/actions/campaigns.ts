"use server";
import { assertStoreAdmin } from "@/lib/domain/access";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { createCampaign, deleteCampaign } from "@/lib/domain/campaigns";

async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  assertStoreAdmin(session.actor);
  return { storeId: requireStoreId(session.actor), slug: session.store?.slug, db: await getDb() };
}

const refresh = (slug?: string) => { revalidatePath("/merchant/campanhas"); if (slug) revalidatePath(`/store/${slug}`, "layout"); };

/** Datas chegam como "AAAA-MM-DDTHH:mm" no horário de Brasília (UTC−3, sem horário de verão). */
const brt = (v: string) => (/Z|[+-]\d\d:\d\d$/.test(v) ? v : `${v}:00-03:00`);

export async function createCampaignAction(input: { text: string; linkUrl?: string; startsAt: string; endsAt: string }) {
  return runAction(async () => {
    const { storeId, slug, db } = await ctx();
    await createCampaign(db, storeId, { ...input, startsAt: brt(input.startsAt), endsAt: brt(input.endsAt) });
    refresh(slug);
    return undefined;
  });
}

export async function deleteCampaignAction(id: string) {
  return runAction(async () => {
    const { storeId, slug, db } = await ctx();
    await deleteCampaign(db, storeId, id);
    refresh(slug);
    return undefined;
  });
}
