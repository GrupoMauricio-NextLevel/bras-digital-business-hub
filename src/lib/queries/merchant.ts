import { and, count, desc, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activities, invoices, orders, plans, serviceLeads, services, storeCustomers, storeProducts, storeThemes, subscriptions, themeSettings, themes, type Store, type ThemeSettingsData } from "@/db/schema";
import { isEligibleSale } from "@/lib/domain/analytics";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { independentSupplierOfStore } from "@/lib/domain/independent";

export type OnboardingStep = { key: string; label: string; done: boolean; href: string };

export function computeOnboarding(store: Store, opts: { independent?: boolean; activeProducts?: number } = {}): { steps: OnboardingStep[]; percent: number } {
  const steps: OnboardingStep[] = [
    { key: "data", label: "Dados da loja", done: !!store.name && !!store.tagline && !!store.whatsapp, href: "/merchant/settings" },
    { key: "logo", label: "Adicionar logo", done: !!store.logoText || !!store.logoUrl, href: "/merchant/appearance" },
    { key: "colors", label: "Escolher cores", done: store.primaryColor !== "#0f172a" || store.accentColor !== "#16a34a", href: "/merchant/appearance" },
    ...(opts.independent ? [{ key: "products", label: "Publicar 5 produtos", done: (opts.activeProducts ?? 0) >= 5, href: "/merchant/catalogo" }] : []),
    { key: "payments", label: "Configurar pagamentos", done: store.paymentStatus === "CONNECTED", href: "/merchant/settings#payments" },
    { key: "shipping", label: "Configurar frete", done: store.shippingStatus !== "NOT_CONFIGURED", href: "/merchant/settings#shipping" },
    { key: "domain", label: "Conectar domínio", done: store.domainStatus === "CONNECTED", href: "/merchant/settings#domain" },
    { key: "publish", label: "Publicar loja", done: !!store.publishedAt, href: "/merchant/storefront" },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, percent: Math.round((done / steps.length) * 100) };
}

export async function getMerchantOverview(store: Store) {
  const db = (await getDb());
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const all = await db.select().from(orders).where(eq(orders.storeId, store.id)).orderBy(desc(orders.createdAt));
  const valid = all.filter((o) => o.status !== "CANCELED"); // não cancelados (pendências)
  const sold = all.filter(isEligibleSale); // vendas: pagas e não canceladas (contrato único)
  const last30 = sold.filter((o) => new Date(o.createdAt) >= since);
  const sales = last30.reduce((s, o) => s + o.subtotalCents, 0);
  const prevSince = new Date(since); prevSince.setDate(prevSince.getDate() - 30);
  const prev30 = sold.filter((o) => new Date(o.createdAt) >= prevSince && new Date(o.createdAt) < since);
  const prevSales = prev30.reduce((s, o) => s + o.subtotalCents, 0);
  const prevMargin = prev30.reduce((s, o) => s + (o.subtotalCents - o.costTotalCents), 0);
  const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : undefined);
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (29 - i)); return d; });
  const daily = days.map((d) => { const end = new Date(d); end.setDate(end.getDate() + 1); return { date: d.toISOString().slice(0, 10), cents: sold.filter((o) => { const t = new Date(o.createdAt); return t >= d && t < end; }).reduce((s, o) => s + o.subtotalCents, 0) }; });
  const margin = last30.reduce((s, o) => s + (o.subtotalCents - o.costTotalCents), 0);
  const pendingCentral = valid.filter((o) => o.customerPaymentStatus === "PAID" && o.centralPaymentStatus !== "PAID");
  const pendingLabel = valid.filter((o) => o.centralPaymentStatus === "PAID" && o.shippingLabelStatus !== "READY");
  const pendingCustomer = valid.filter((o) => o.customerPaymentStatus !== "PAID");
  const inProgress = valid.filter((o) => ["READY_TO_PICK", "PICKING", "READY_TO_SHIP"].includes(o.status));
  const [custCount] = await db.select({ n: count() }).from(storeCustomers).where(eq(storeCustomers.storeId, store.id));
  const recent = await db.select().from(activities).where(and(eq(activities.storeId, store.id), eq(activities.scope, "STORE"))).orderBy(desc(activities.createdAt)).limit(8);
  const sub = await getSubscription(store.id);
  const independentId = await independentSupplierOfStore(db, store.id);
  const activeProducts = independentId ? (await db.select({ n: count() }).from(storeProducts).where(and(eq(storeProducts.storeId, store.id), eq(storeProducts.active, true))))[0]?.n ?? 0 : 0;
  return { ordersCount: valid.length, sales, margin, daily, salesDelta: pct(sales, prevSales), marginDelta: pct(margin, prevMargin), countDelta: pct(last30.length, prev30.length), last30Count: last30.length, pendingCentral, pendingLabel, pendingCustomer, inProgress, customers: custCount?.n ?? 0, recentOrders: all.slice(0, 5), recent, onboarding: computeOnboarding(store, { independent: !!independentId, activeProducts }), independent: !!independentId, subscription: sub };
}

export async function getSubscription(storeId: string) {
  const db = (await getDb());
  const row = await db.select({ sub: subscriptions, plan: plans }).from(subscriptions).innerJoin(plans, eq(plans.id, subscriptions.planId)).where(eq(subscriptions.storeId, storeId)).limit(1);
  if (!row[0]) return null;
  const inv = await db.select().from(invoices).where(eq(invoices.subscriptionId, row[0].sub.id)).orderBy(desc(invoices.dueDate));
  return { ...row[0], invoices: inv };
}

export async function getMerchantProducts(storeId: string) {
  const db = (await getDb());
  return listStoreCatalog(db, storeId, { onlyActive: false });
}

export async function getStoreTheme(storeId: string) {
  const db = (await getDb());
  const current = await db.select({ st: storeThemes, theme: themes }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, storeId)).limit(1);
  const all = await db.select().from(themes).orderBy(themes.priceCents);
  const settings = await db.query.themeSettings.findFirst({ where: eq(themeSettings.storeId, storeId) });
  return { current: current[0] ?? null, all, settings: settings?.settings ?? defaultThemeSettings() };
}

export function defaultThemeSettings(): ThemeSettingsData {
  return { heroTitle: "Bem-vindo à nossa loja", heroSubtitle: "Produtos selecionados com envio para todo o Brasil.", heroCta: "Ver catálogo", announcement: "", banners: [], showCategories: true, footerText: "" };
}

export async function getMerchantServices(storeId: string) {
  const db = (await getDb());
  const svc = await db.select().from(services);
  const leads = await db.select().from(serviceLeads).where(eq(serviceLeads.storeId, storeId));
  return svc.map((s) => ({ ...s, lead: leads.find((l) => l.serviceId === s.id) ?? null }));
}

export async function getMerchantFinance(storeId: string) {
  const db = (await getDb());
  const rows = await db.select().from(orders).where(and(eq(orders.storeId, storeId), ne(orders.status, "CANCELED"))).orderBy(desc(orders.createdAt));
  const received = rows.filter((o) => o.customerPaymentStatus === "PAID").reduce((s, o) => s + o.totalCents, 0);
  const owedToCentral = rows.filter((o) => o.customerPaymentStatus === "PAID" && o.centralPaymentStatus !== "PAID").reduce((s, o) => s + o.costTotalCents, 0);
  const paidToCentral = rows.filter((o) => o.centralPaymentStatus === "PAID").reduce((s, o) => s + o.costTotalCents, 0);
  const margin = rows.filter(isEligibleSale).reduce((s, o) => s + (o.subtotalCents - o.costTotalCents), 0);
  return { rows, received, owedToCentral, paidToCentral, margin, subscription: await getSubscription(storeId) };
}

