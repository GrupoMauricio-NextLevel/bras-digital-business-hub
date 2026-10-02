import { requireAreaRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireAreaRole("SUPERDROP", ["SUPPLIER_ADMIN", "OPERATOR"]);
  return <RoleLayout session={session}>{children}</RoleLayout>;
}
