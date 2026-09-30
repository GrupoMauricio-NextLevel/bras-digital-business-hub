import { AppShell } from "@/components/app/app-shell";
import { listDemoUsers, loginAs, logout } from "@/app/actions/auth";
import { globalSearchAction } from "@/app/actions/search";
import { isDemoMode, type Session } from "@/lib/auth";
import { canUse, type FeatureKey } from "@/lib/features";
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
  if (session.user.role === "AFFILIATE") return "partner";
  return session.store?.offer === "STORE_OWN" ? "pro" : "lite";
}

/** Itens do menu do lojista e o recurso que os libera; sem o recurso aparecem com cadeado. */
const MERCHANT_GATES: Record<string, FeatureKey> = { "/merchant/analytics": "analytics", "/merchant/storefront": "storefront", "/theme-editor": "appearanceBasic", "/merchant/templates": "templatesStarter" };

export async function RoleLayout({ session, children, banner }: { session: Session; children: React.ReactNode; banner?: React.ReactNode }) {
  // Libera reservas de pedidos não pagos vencidos (rede de segurança além do cron).
  await expireStaleReservations(await getDb());
  const nav = NAV[session.user.role];
  const store = session.store;
  const navItems = store?.kind === "SUPPLIER_OWN" ? nav.items.filter((i) => i.href !== "/merchant/wallet") : nav.items;
  const items = store ? navItems.map((i) => (MERCHANT_GATES[i.href] && !canUse(store.offer, MERCHANT_GATES[i.href]!) ? { ...i, locked: true } : i)) : nav.items;
  const demoUsers = isDemoMode() ? await listDemoUsers() : undefined;
  const notices = await recentNotices(session.actor);
  const tenantName = session.store?.name ?? session.supplier?.name ?? (session.user.role === "AFFILIATE" ? session.user.name.replace(/ \(.*\)$/, "") : "NextLevel");
  const tenantSub = session.store ? (session.store.kind === "SUPPLIER_OWN" ? "Loja própria do fornecedor" : "Loja parceira") : session.supplier ? "Fornecedor / Central" : session.user.role === "AFFILIATE" ? "Escritório do parceiro" : "Plataforma";
  return (
    <AppShell panel={panelFor(session)} variant={session.user.role === "SUPPLIER_DISPATCH" ? "minimal" : "full"} items={items} quick={nav.quick} roleLabel={nav.label} tenantName={tenantName} tenantSub={tenantSub} userName={session.user.name} storefrontHref={session.store && canUse(session.store.offer, "storefront") ? storeUrl(session.store.slug, session.store.offer, session.store.customDomain, session.store.domainStatus) : undefined} demoUsers={demoUsers} onSwitch={loginAs} onLogout={logout} passwordHref="/account/password" notices={notices} search={globalSearchAction} banner={banner}>
      {children}
    </AppShell>
  );
}
