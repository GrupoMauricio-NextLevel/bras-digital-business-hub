import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { AreaTheme } from "@/design-system/components/area-theme";

export const dynamic = "force-dynamic";

/** Estúdio da Brás Digital (D91): área do Master com nome, menu e cor da Brás. Só o Master entra. */
export default async function BrasLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  return <><AreaTheme theme="bras" brand="BRAS_DIGITAL" /><RoleLayout session={session} scope="bras-admin">{children}</RoleLayout></>;
}
