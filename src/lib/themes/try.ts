import { cookies } from "next/headers";
import type { Database } from "@/db/client";
import type { Store } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { THEME_BY_KEY } from "./catalog";
import { presetContextFor } from "./install";
import { buildPreset, type ThemePreset } from "./presets";

export const TRY_COOKIE = "nl-try-theme";

/**
 * "Ver com seus produtos": o dono vê a loja dele com outro tema, sem instalar nada. O cookie só vale para o dono
 * da própria loja; o público continua vendo o tema publicado.
 */
export async function tryingTheme(db: Database, store: Store): Promise<{ key: string; name: string; preset: ThemePreset } | null> {
  const key = (await cookies()).get(TRY_COOKIE)?.value;
  if (!key || !THEME_BY_KEY[key]) return null;
  const s = await getSession();
  if (!s || s.user.role !== "STORE_OWNER" || s.store?.id !== store.id) return null;
  const { ctx } = await presetContextFor(db, store);
  const preset = buildPreset(key, ctx);
  return preset ? { key, name: THEME_BY_KEY[key]!.name, preset } : null;
}
