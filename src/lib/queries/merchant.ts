import { and, count, desc, eq, ne, sum } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activities, customers, invoices, marketingConsents, orders, plans, serviceLeads, services, storeCustomers, storeThemes, subscriptions, themeSettings, themes, type Store, type ThemeSettingsData } from "@/db/schema";
import { listStoreCatalog } from "@/lib/domain/catalog";

export type OnboardingStep = { key: string; label: string; done: boolean; href: string };

export function computeOnboarding(store: Store): { steps: OnboardingStep[]; percent: number } {
  const steps: OnboardingStep[] = [
    { key: "data", label: "Dados da loja", done: !!store.name && !!store.tagline && !!store.whatsapp, href: "/merchant/settings" },
    { key: "logo", label: "Adicionar logo", done: !!store.logoText || !!store.logoUrl, href: "/merchant/appearance" },
    { key: "colors", label: "Escolher cores", done: store.primaryColor !== "#0f172a" || store.accentColor !== "#16a34a", href: "/merchant/appearance" },
    { key: "payments", label: "Configurar pagamentos", done: store.paymentStatus !== "NOT_CONFIGURED", href: "/merchant/settings#payments" },
    { key: "shipping", label: "Configurar frete", done: store.shippingStatus !== "NOT_CONFIGURED", href: "/merchant/settings#shipping" },
    { key: "domain", label: "Conectar domínio", done: store.domainStatus === "CONNECTED", href: "/merchant/settings#domain" },
    { key: "publish", label: "Publicar loja", done: !!store.publishedAt, href: "/merchant/storefront" },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, percent: Math.round((done / steps.length) * 100) };
}

export async function getMerchantOverview(store: Store) {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const all = await db.select().from(orders).where(eq(orders.storeId, store.id)).orderBy(desc(orders.createdAt));
  const valid = all.filter((o) => o.status !== "CANCELED");
  const last30 = valid.filter((o) => new Date(o.createdAt) >= since);
  const sales = last30.reduce((s, o) => s + o.totalCents, 0);
  const margin = last30.reduce((s, o) => s + (o.subtotalCents - o.costTotalCents), 0);
  const pendingCentral = valid.filter((o) => o.customerPaymentStatus === "PAID" && o.centralPaymentStatus !== "PAID");
  const pendingLabel = valid.filter((o) => o.centralPaymentStatus === "PAID" && o.shippingLabelStatus !== "READY");
  const pendingCustomer = valid.filter((o) => o.customerPaymentStatus !== "PAID");
  const inProgress = valid.filter((o) => ["READY_TO_PICK", "PICKING", "READY_TO_SHIP"].includes(o.status));
  const [custCount] = await db.select({ n: count() }).from(storeCustomers).where(eq(storeCustomers.storeId, store.id));
  const recent = await db.select().from(activities).where(and(eq(activities.storeId, store.id), eq(activities.scope, "STORE"))).orderBy(desc(activities.createdAt)).limit(8);
  const sub = await getSubscription(store.id);
  return { ordersCount: valid.length, sales, margin, last30Count: last30.length, pendingCentral, pendingLabel, pendingCustomer, inProgress, customers: custCount?.n ?? 0, recentOrders: all.slice(0, 5), recent, onboarding: computeOnboarding(store), subscription: sub };
}

export async function getSubscription(storeId: string) {
  const db = getDb();
  const row = await db.select({ sub: subscriptions, plan: plans }).from(subscriptions).innerJoin(plans, eq(plans.id, subscriptions.planId)).where(eq(subscriptions.storeId, storeId)).limit(1);
  if (!row[0]) return null;
  const inv = await db.select().from(invoices).where(eq(invoices.subscriptionId, row[0].sub.id)).orderBy(desc(invoices.dueDate));
  return { ...row[0], invoices: inv };
}

export async function getMerchantProducts(storeId: string) {
  const db = getDb();
  return listStoreCatalog(db, storeId, { onlyActive: false });
}

export async function getMerchantCustomers(storeId: string) {
  const db = getDb();
  const rows = await db.select({ sc: storeCustomers, customer: customers }).from(storeCustomers).innerJoin(customers, eq(customers.id, storeCustomers.customerId)).where(eq(storeCustomers.storeId, storeId)).orderBy(desc(storeCustomers.lastOrderAt));
  const consents = await db.select().from(marketingConsents);
  return rows.map((r) => ({ ...r, consents: consents.filter((c) => c.storeCustomerId === r.sc.id && !c.revokedAt) }));
}

export async function getStoreTheme(storeId: string) {
  const db = getDb();
  const current = await db.select({ st: storeThemes, theme: themes }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, storeId)).limit(1);
  const all = await db.select().from(themes).orderBy(themes.priceCents);
  const settings = await db.query.themeSettings.findFirst({ where: eq(themeSettings.storeId, storeId) });
  return { current: current[0] ?? null, all, settings: settings?.settings ?? defaultThemeSettings() };
}

export function defaultThemeSettings(): ThemeSettingsData {
  return { heroTitle: "Bem-vindo à nossa loja", heroSubtitle: "Produtos selecionados com envio para todo o Brasil.", heroCta: "Ver catálogo", announcement: "", banners: [], showCategories: true, footerText: "" };
}

export async function getMerchantServices(storeId: string) {
  const db = getDb();
  const svc = await db.select().from(services);
  const leads = await db.select().from(serviceLeads).where(eq(serviceLeads.storeId, storeId));
  return svc.map((s) => ({ ...s, lead: leads.find((l) => l.serviceId === s.id) ?? null }));
}

export async function getMerchantFinance(storeId: string) {
  const db = getDb();
  const rows = await db.select().from(orders).where(and(eq(orders.storeId, storeId), ne(orders.status, "CANCELED"))).orderBy(desc(orders.createdAt));
  const received = rows.filter((o) => o.customerPaymentStatus === "PAID").reduce((s, o) => s + o.totalCents, 0);
  const owedToCentral = rows.filter((o) => o.centralPaymentStatus !== "PAID").reduce((s, o) => s + o.costTotalCents, 0);
  const paidToCentral = rows.filter((o) => o.centralPaymentStatus === "PAID").reduce((s, o) => s + o.costTotalCents, 0);
  const margin = rows.reduce((s, o) => s + (o.subtotalCents - o.costTotalCents), 0);
  return { rows, received, owedToCentral, paidToCentral, margin, subscription: await getSubscription(storeId) };
}

