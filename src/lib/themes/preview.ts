import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export const PREVIEW_COOKIE = "nl-preview";

/**
 * A prévia do rascunho só vale para quem pode editar a loja (dono ou Master) e enquanto o editor mantém o cookie.
 * O público sempre vê o que foi publicado.
 */
export async function isPreviewMode(storeId: string): Promise<boolean> {
  const jar = await cookies();
  if (jar.get(PREVIEW_COOKIE)?.value !== "1") return false;
  const s = await getSession();
  return !!s && (s.user.role === "NEXTLEVEL_MASTER" || (s.user.role === "STORE_OWNER" && s.store?.id === storeId));
}
