import { RoleLayout } from "@/components/app/role-layout";
import { requireStoreAdmin } from "@/lib/require-session";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStoreAdmin();
  return <RoleLayout session={session}>{children}</RoleLayout>;
}
