import { AppShell } from "@/components/app/app-shell";
import { listDemoUsers, loginAs, logout } from "@/app/actions/auth";
import { isDemoMode, type Session } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";

export async function RoleLayout({ session, children }: { session: Session; children: React.ReactNode }) {
  // Libera reservas de pedidos não pagos vencidos (rede de segurança além do cron).
  await expireStaleReservations(await getDb());
  const nav = NAV[session.user.role];
  const demoUsers = isDemoMode() ? await listDemoUsers() : undefined;
  const passwordHref = "/account/password";
  const tenantName = session.store?.name ?? session.supplier?.name ?? "NextLevel";
  const tenantSub = session.store ? "Loja parceira" : session.supplier ? "Fornecedor / Central" : "Plataforma";
  return (
    <AppShell items={nav.items} roleLabel={nav.label} tenantName={tenantName} tenantSub={tenantSub} userName={session.user.name} storefrontHref={session.store ? `/store/${session.store.slug}` : undefined} demoUsers={demoUsers} onSwitch={loginAs} onLogout={logout} passwordHref={passwordHref}>
      {children}
    </AppShell>
  );
}
