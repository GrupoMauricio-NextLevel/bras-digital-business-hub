import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/auth";

/** Modo gravação (D144): no ambiente de demonstração, esconde os atalhos de demonstração das telas para gravar limpo. */
export const RECORDING_COOKIE = "nl_gravacao";
export async function isRecordingMode() {
  if (!isDemoMode()) return false;
  return (await cookies()).get(RECORDING_COOKIE)?.value === "1";
}
