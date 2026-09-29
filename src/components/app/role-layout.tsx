import { AppShell } from "@/components/app/app-shell";
import { listDemoUsers, loginAs, logout } from "@/app/actions/auth";
import { globalSearchAction } from "@/app/actions/search";
import { isDemoMode, type Session } from "@/lib/auth";
import { canUse } from "@/lib/features";
import { storeUrl } from "@/lib/store-url";
import { NAV, type Panel } from "@/lib/nav";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";
import { recentNotices } from "@/lib/queries/notifications";

/** Painel (clima visual) do usuário: fornecedor e lojista variam por perfil. */
export function panelFor(session: Session): Panel {
  if (session.user.role === "NEXTLEVEL_MASTER") return "master";
  if (session.user.role === "SUPPLIER_ADMIN") return "supplier";
  if (session.user.role === "SUPPLIER_DISPATCH") return "dispatch";
  return session.store?.offer === "STORE_OWN" ? "pro" : "lite";
}

export async function RoleLayout({ session, children, banner }: { session: Session; children: React.ReactNode; banner?: React.ReactNode }) {
  // Libera reservas de pedidos não pagos vencidos (rede de segurança além do cron).
  await expireStaleReservations(await getDb());
  const nav = NAV[session.user.role];
  const demoUsers = isDemoMode() ? await listDemoUsers() : undefined;
  const notices = await recentNotices(session.actor);
  const tenantName = session.store?.name ?? session.supplier?.name ?? "NextLevel";
  const tenantSub = session.store ? "Loja parceira" : session.supplier ? "Fornecedor / Central" : "Plataforma";
  return (
    <AppShell panel={panelFor(session)} variant={session.user.role === "SUPPLIER_DISPATCH" ? "minimal" : "full"} items={nav.items} quick={nav.quick} roleLabel={nav.label} tenantName={tenantName} tenantSub={tenantSub} userName={session.user.name} storefrontHref={session.store && canUse(session.store.offer, "storefront") ? storeUrl(session.store.slug, session.store.offer, session.store.customDomain, session.store.domainStatus) : undefined} demoUsers={demoUsers} onSwitch={loginAs} onLogout={logout} passwordHref="/account/password" notices={notices} search={globalSearchAction} banner={banner}>
      {children}
    </AppShell>
  );
}
