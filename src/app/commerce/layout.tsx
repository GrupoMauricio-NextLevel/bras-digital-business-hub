import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";

export const dynamic = "force-dynamic";

/** Console administrativo da Commerce: mesma casca operacional do sistema de design, com o menu da administração. */
export default async function CommerceLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  return <RoleLayout session={session} scope="commerce-admin">{children}</RoleLayout>;
}
