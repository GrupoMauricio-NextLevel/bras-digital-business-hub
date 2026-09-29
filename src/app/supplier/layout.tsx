import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <RoleLayout session={session}>{children}</RoleLayout>;
}
