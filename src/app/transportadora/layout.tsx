import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { AreaTheme } from "@/design-system/components/area-theme";
import { getDb } from "@/db/client";
import { myCarrier } from "@/lib/domain/cargas/cargas";
import { CARGAS_PLAN_LABEL } from "@/lib/cargas/rotulos";

/** Painel da transportadora na NextLevel Cargas (D111): login próprio, cor da Cargas, só a própria transportadora. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("CARRIER");
  const me = await myCarrier(await getDb(), session.actor).catch((e: Error) => ({ error: e.message }));
  const banner = "error" in me
    ? <div role="alert" className="border-b border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">{me.error}</div>
    : <div className="border-b border-border bg-surface px-4 py-2 text-sm"><b>{me.name}</b> <span className="text-muted-foreground">· plano {CARGAS_PLAN_LABEL[me.plan]} · transportadora da NextLevel Cargas</span></div>;
  return <><AreaTheme theme="cargas" brand="NEXTLEVEL_CARGAS" /><RoleLayout session={session} banner={banner}>{"error" in me ? null : children}</RoleLayout></>;
}
