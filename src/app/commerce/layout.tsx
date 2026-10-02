import { requireRole } from "@/lib/require-session";
import { CommerceShell } from "@/components/commerce/commerce-shell";

export const dynamic = "force-dynamic";

export default async function CommerceLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  return <CommerceShell userName={session.user.name}>{children}</CommerceShell>;
}
