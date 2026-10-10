import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { AreaTheme } from "@/design-system/components/area-theme";
import { getDb } from "@/db/client";
import { BRAS_STAFF_LABEL, myImporter } from "@/lib/domain/bras/importadora";
import "@/components/portal/bras/bras.css";

/** Painel da importadora parceira (D110): login próprio, cor da Brás, só a própria importadora. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("BRAS_IMPORTER");
  const me = await myImporter(await getDb(), session.actor).catch((e: Error) => ({ error: e.message }));
  const banner = "error" in me
    ? <div role="alert" className="border-b border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">{me.error}</div>
    : <div className="border-b border-border bg-surface px-4 py-2 text-sm"><b>{me.importer.name}</b> <span className="text-muted-foreground">· {BRAS_STAFF_LABEL[me.staffRole]} · importadora parceira da Brás Digital</span></div>;
  return <><AreaTheme theme="bras" brand="BRAS_DIGITAL" /><RoleLayout session={session} banner={banner}><div className="bd-home">{"error" in me ? null : children}</div></RoleLayout></>;
}
