import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { MasterScenarioControl } from "@/components/app/master-scenario-control";
import { getMasterScenarioSummary } from "@/lib/master-scenario";
import { getDb } from "@/db/client";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const scenario = await getMasterScenarioSummary(await getDb());
  return (
    <RoleLayout session={session}>
      {children}
      <MasterScenarioControl initial={scenario} />
    </RoleLayout>
  );
}
