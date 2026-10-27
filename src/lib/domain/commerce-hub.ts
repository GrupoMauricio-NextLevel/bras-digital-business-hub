import { jobStatus } from "./job-runs";
import { and, desc, eq, gte, inArray, like, or } from "drizzle-orm";
import type { Database } from "@/db/client";
import { brandLeads, financeInvoices, orders, organizations, storeProducts, stores, users } from "@/db/schema";
import { brandByCode, type BrandCode } from "@/lib/brand";
import { requireMaster, type Actor } from "./access";
import { getNextLevelMp } from "./nextlevel-billing";
import { isIndependentStore } from "./independent";
import { storeAccess } from "./store-access";

export type LaunchCheck = { key: string; label: string; ok: boolean; hint: string; href?: string; severity: "blocker" | "recommended" };

/** Visão do Master sobre uma marca (hoje NextLevel E-commerce): lojas, funil, receita e o que falta para lançar. */
export async function getBrandHub(db: Database, actor: Actor, code: BrandCode = "NEXTLEVEL_COMMERCE", env: Record<string, string | undefined> = process.env, now = new Date()) {
  requireMaster(actor);
  const brand = brandByCode(code, env);
  const rows = await db.select({ store: stores, orgBrand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(organizations.brand, code)).orderBy(desc(stores.createdAt));
  const ids = rows.map((r) => r.store.id);
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const orderRows = ids.length ? await db.select().from(orders).where(and(inArray(orders.storeId, ids), gte(orders.createdAt, since))) : [];
  const paidOrders = orderRows.filter((o) => o.customerPaymentStatus === "PAID" && o.status !== "CANCELED");
  const active = ids.length ? await db.select({ storeId: storeProducts.storeId }).from(storeProducts).where(and(inArray(storeProducts.storeId, ids), eq(storeProducts.active, true))) : [];
  const productCount = new Map<string, number>();
  for (const a of active) productCount.set(a.storeId, (productCount.get(a.storeId) ?? 0) + 1);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const planInvoices = ids.length ? await db.select().from(financeInvoices).where(and(inArray(financeInvoices.storeId, ids), eq(financeInvoices.status, "PAID"), gte(financeInvoices.paidAt, monthStart))) : [];

  const list = [];
  for (const { store } of rows) {
    const access = storeAccess(store, now);
    list.push({ id: store.id, name: store.name, slug: store.slug, status: store.status, offer: store.offer, createdAt: store.createdAt, published: !!store.publishedAt, independent: !!(await isIndependentStore(db, store.id)), access: access.state, activeProducts: productCount.get(store.id) ?? 0 });
  }
  const leads = await db.select().from(brandLeads).where(eq(brandLeads.brand, code)).orderBy(desc(brandLeads.createdAt));
  const leadCount = { NEW: 0, CONTACTED: 0, WON: 0, LOST: 0 } as Record<string, number>;
  for (const l of leads) leadCount[l.status] = (leadCount[l.status] ?? 0) + 1;

  // Usuários de demonstração em produção são uma brecha (senha conhecida).
  const demoUsers = await db.select({ email: users.email }).from(users).where(or(like(users.email, "%.demo"), like(users.email, "%@demo.superdrop.com.br")));
  const mp = await getNextLevelMp(db);
  const jobs = await jobStatus(db);
  const lateJobs = jobs.filter((j) => j.late || j.lastOk === false);
  const checks: LaunchCheck[] = [
    { key: "demo", label: "Contas de demonstração não podem entrar", ok: demoUsers.length === 0 || env.NEXT_PUBLIC_DEMO_MODE !== "true", hint: demoUsers.length === 0 ? "Nenhuma conta de demonstração no banco." : env.NEXT_PUBLIC_DEMO_MODE === "true" ? `Modo de demonstração ligado com ${demoUsers.length} conta(s) de senha conhecida (demo1234). Desligue NEXT_PUBLIC_DEMO_MODE antes de divulgar.` : `${demoUsers.length} conta(s) de demonstração existem no banco, mas o login delas está bloqueado. Pode apagá-las quando quiser.`, severity: "blocker" },
    { key: "cron", label: "Rotinas automáticas rodando (cobrança, reservas e conferência de pagamentos)", ok: lateJobs.length === 0, hint: lateJobs.length === 0 ? jobs.map((j) => `${j.label}: ok`).join(" · ") : `Atrasadas ou com falha: ${lateJobs.map((j) => j.label).join(", ")}. Crie no Render as chamadas agendadas (veja docs/nextlevel-commerce/onda-8-homologacao.md).`, severity: "blocker" },
    { key: "mp", label: "Mercado Pago da NextLevel conectado (recebe os Pix dos planos)", ok: mp.connected, hint: mp.connected ? `Conta ${mp.nickname ?? "conectada"}${mp.isTest ? " (modo de teste)" : ""}.` : "Conecte em Configurações do Master.", href: "/master/settings", severity: "blocker" },
    { key: "signup", label: "Cadastro de lojas aberto na marca", ok: brand.signupOpen, hint: brand.signupOpen ? "Aberto: BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true." : "Fechado (lista de espera). Ligue BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true no Render quando estiver pronto.", severity: "blocker" },
    { key: "domain", label: "Endereço próprio da marca no ar", ok: !!env.BRAND_URL_NEXTLEVEL_COMMERCE, hint: `Endereço oficial hoje: ${brand.baseUrl}. Defina BRAND_URL_NEXTLEVEL_COMMERCE e BRAND_DOMAINS_NEXTLEVEL_COMMERCE quando o domínio estiver apontado.`, severity: "recommended" },
    { key: "email", label: "E-mail transacional configurado (Resend)", ok: !!env.RESEND_API_KEY && !!env.EMAIL_FROM, hint: env.RESEND_API_KEY && env.EMAIL_FROM ? "Envio real ativo." : "Sem RESEND_API_KEY/EMAIL_FROM os e-mails só são registrados, não enviados.", severity: "recommended" },
    { key: "support", label: "WhatsApp e e-mail de suporte definidos", ok: true, /* D181: canal oficial no código */ hint: "NEXT_PUBLIC_SUPPORT_WHATSAPP e NEXT_PUBLIC_SUPPORT_EMAIL alimentam os botões de contato.", severity: "recommended" },
    { key: "db", label: "Banco permanente (Postgres/Neon)", ok: (env.DATABASE_URL ?? "").startsWith("postgres"), hint: (env.DATABASE_URL ?? "").startsWith("postgres") ? "Postgres em uso." : "Sem Postgres, os dados se perdem ao reiniciar.", severity: "blocker" },
  ];

  return {
    brand: { code: brand.code, name: brand.name, baseUrl: brand.baseUrl, signupOpen: brand.signupOpen },
    kpis: {
      stores: list.length,
      independent: list.filter((s) => s.independent).length,
      paying: list.filter((s) => s.access === "PAID").length,
      trial: list.filter((s) => s.access === "TRIAL").length,
      awaitingPayment: list.filter((s) => s.access === "BLOCKED").length,
      published: list.filter((s) => s.published).length,
      orders30d: paidOrders.length,
      gmv30dCents: paidOrders.reduce((s, o) => s + o.totalCents, 0),
      planRevenueMonthCents: planInvoices.reduce((s, i) => s + i.amountCents, 0),
      leadsNew: leadCount.NEW ?? 0, leadsTotal: leads.length,
    },
    stores: list.slice(0, 12),
    leads: leads.slice(0, 6).map((l) => ({ id: l.id, name: l.name, storeName: l.storeName, status: l.status, createdAt: l.createdAt })),
    checks,
    ready: checks.filter((c) => c.severity === "blocker").every((c) => c.ok),
  };
}
