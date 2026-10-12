"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, resetDemoDatabase } from "@/db/client";
import { users } from "@/db/schema";
import { getSession, isDemoMode, setSessionCookie } from "@/lib/auth";
import { safeStart } from "@/lib/gravacao";
import { RECORDING_COOKIE } from "@/lib/gravacao-server";

/** Estúdio de gravação (D144): tudo aqui só existe no ambiente de demonstração. */
function demoOnly() { if (!isDemoMode()) redirect("/login"); }

/** Entra como um participante da demonstração e já abre a tela da aula. */
export async function enterAs(email: string, start: string) {
  demoOnly();
  const user = await (await getDb()).query.users.findFirst({ where: eq(users.email, email) });
  if (!user) redirect("/gravacao?erro=conta");
  await setSessionCookie(user.id);
  redirect(safeStart(start));
}

export async function setRecordingMode(on: boolean) {
  demoOnly();
  const jar = await cookies();
  if (on) jar.set(RECORDING_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 12 });
  else jar.delete(RECORDING_COOKIE);
  redirect("/gravacao");
}

/** Volta a demonstração ao estado inicial (só o dono da demonstração, logado como Master). */
export async function resetDemoAction() {
  demoOnly();
  const s = await getSession();
  if (!s || s.user.role !== "NEXTLEVEL_MASTER" || s.user.masterFunction) redirect("/gravacao?erro=master");
  await resetDemoDatabase();
  redirect("/gravacao?ok=recomecou");
}
