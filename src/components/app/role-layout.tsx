import { AppShell } from "@/components/app/app-shell";
import { listDemoUsers, loginAs, logout } from "@/app/actions/auth";
import { globalSearchAction } from "@/app/actions/search";
import { isDemoMode, type Session } from "@/lib/auth";
import { canUse, type FeatureKey } from "@/lib/features";
import { storeUrl } from "@/lib/store-url";
import { NAV, navForBrand, type Panel } from "@/lib/nav";
import { getBrand } from "@/lib/brand-server";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";
import { recentNotices } from "@/lib/queries/notifications";
import { independentSupplierOfStore } from "@/lib/domain/independent";
import { CommerceMerchantShell } from "@/components/commerce/commerce-merchant-shell";
import { brandOfStore } from "@/lib/store-brand";

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
  const db = await getDb();
  await expireStaleReservations(db);
  const nav = NAV[session.user.role];
  const store = session.store;
  // A marca do lojista pertence à organização da loja, não ao hostname técnico.
  // Isso impede uma loja Commerce de herdar identidade e navegação SuperDrop.
  const brand = store ? await brandOfStore(db, store) : await getBrand();
  const independent = !!store && store.kind === "SUPPLIER_OWN" && !!(await independentSupplierOfStore(db, store.id));
  const ownItems = store?.kind === "SUPPLIER_OWN" ? nav.items.filter((i) => i.href !== "/merchant/wallet") : nav.items;
  // Conta simples: "Meus produtos" cadastra o que vende; "Preços e publicação" escolhe o que aparece na loja.
  const navItems = independent ? ownItems.flatMap((i) => i.href === "/merchant/products" ? [{ ...i, label: "Preços e publicação" }, { label: "Meus produtos", href: "/merchant/catalogo", icon: "Package" as const, group: i.group }] : [i]) : ownItems;
  // Equipe da loja: só o que é operação do dia a dia (o servidor também bloqueia o resto).
  const STAFF_OK = ["/merchant/orders", "/merchant/products", "/merchant/catalogo", "/merchant/customers", "/merchant/labels", "/merchant/after-sales", "/merchant/avaliacoes", "/merchant/avise-me", "/merchant/content"];
  const visible = session.user.role === "STORE_OWNER" && session.user.storeRole === "STAFF" ? navItems.filter((i) => STAFF_OK.some((p) => i.href.startsWith(p))) : navItems;
  const items = navForBrand(store ? visible.map((i) => (MERCHANT_GATES[i.href] && !canUse(store.offer, MERCHANT_GATES[i.href]!) ? { ...i, locked: true } : i)) : nav.items, brand);
  const storefrontHref = store && canUse(store.offer, "storefront") ? storeUrl(store.slug, store.offer, store.customDomain, store.domainStatus) : undefined;
  if (session.user.role === "STORE_OWNER" && store && brand.code === "NEXTLEVEL_COMMERCE") {
    return (
      <CommerceMerchantShell
        storeName={store.name}
        userName={session.user.name}
        storefrontHref={storefrontHref}
        staff={session.user.storeRole === "STAFF"}
        onLogout={logout}
      >
        {children}
      </CommerceMerchantShell>
    );
  }

  const demoUsers = isDemoMode() ? await listDemoUsers() : undefined;
  const notices = await recentNotices(session.actor);
  const tenantName = session.store?.name ?? session.supplier?.name ?? (session.user.role === "AFFILIATE" ? session.user.name.replace(/ \(.*\)$/, "") : "NextLevel");
  const tenantSub = session.store ? (independent ? "Minha loja" : session.store.kind === "SUPPLIER_OWN" ? "Loja própria do fornecedor" : "Loja parceira") : session.supplier ? "Fornecedor / Central" : session.user.role === "AFFILIATE" ? "Escritório do parceiro" : "Plataforma";
  return (
    <AppShell brand={{ code: brand.code, name: brand.name, logo: brand.logo, wordmark: brand.wordmark, accentColor: brand.accentColor }} panel={panelFor(session)} variant={session.user.role === "SUPPLIER_DISPATCH" ? "minimal" : "full"} items={items} quick={nav.quick} roleLabel={nav.label} tenantName={tenantName} tenantSub={tenantSub} userName={session.user.name} storefrontHref={storefrontHref} demoUsers={demoUsers} onSwitch={loginAs} onLogout={logout} passwordHref="/account/password" notices={notices} search={globalSearchAction} banner={banner}>
      {children}
    </AppShell>
  );
}
