import { and, count, eq, inArray, isNull, ne } from "drizzle-orm";
import type { Database } from "@/db/client";
import { nlSubscriptions, orders, organizations, products, storeProducts, stores } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { notifyTenant } from "@/lib/email";
import { requireMaster, type Actor } from "./access";

/**
 * Funil de ativação da NextLevel E-commerce (D176): do cadastro ao lojista pagante, com a mesma régua da prontidão da
 * loja (`readiness.ts`). Para cada loja, o primeiro degrau que falta é onde ela parou, com o próximo passo e há quantos
 * dias está ali. Uma consulta por degrau para todas as lojas (nada de consulta por loja). Só o Master.
 */
export const DEGRAUS = [
  { key: "CADASTRO", rotulo: "Criou a loja", passo: "—", href: "/commerce/stores" },
  { key: "PRODUTO", rotulo: "Cadastrou produto", passo: "Cadastrar o primeiro produto à venda", href: "/merchant/catalogo/new" },
  { key: "PUBLICOU", rotulo: "Publicou a loja", passo: "Publicar a loja para os clientes verem", href: "/merchant/storefront" },
  { key: "PAGAMENTO", rotulo: "Conectou o Mercado Pago", passo: "Conectar o Mercado Pago da loja (pagamento real)", href: "/merchant/settings#payments" },
  { key: "PRIMEIRA_VENDA", rotulo: "Primeira venda paga", passo: "Fazer a primeira venda (divulgar o link da loja)", href: "/merchant/orders" },
  { key: "ASSINANTE", rotulo: "Plano pago", passo: "Assinar um plano antes do fim do teste", href: "/merchant/finance#assinatura" },
] as const;
export type Degrau = (typeof DEGRAUS)[number]["key"];

export type LojaNoFunil = { storeId: string; nome: string; slug: string; criadaEm: string; feitos: Record<Degrau, boolean>; parouEm: Degrau | null; passo: string | null; href: string | null; diasParada: number };
export type FunilEcommerce = { total: number; degraus: { key: Degrau; rotulo: string; n: number; pct: number }[]; paradas: LojaNoFunil[]; pagantes: number };

const DIA = 86_400_000;

/** Regra pura: primeiro degrau que falta (em ordem), ou nulo quando a loja já é pagante e completa. */
export function ondeParou(feitos: Record<Degrau, boolean>): Degrau | null {
  return DEGRAUS.find((d) => !feitos[d.key])?.key ?? null;
}

export async function funilEcommerce(db: Database, actor: Actor, agora = new Date()): Promise<FunilEcommerce> {
  requireMaster(actor);
  return calcularFunil(db, agora);
}

async function calcularFunil(db: Database, agora: Date): Promise<FunilEcommerce> {
  const lojas = await db.select({ id: stores.id, nome: stores.name, slug: stores.slug, criadaEm: stores.createdAt, publishedAt: stores.publishedAt, status: stores.status, paymentStatus: stores.paymentStatus })
    .from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(and(eq(organizations.brand, "NEXTLEVEL_COMMERCE"), isNull(stores.showcaseTheme)));
  const ids = lojas.map((l) => l.id);
  if (!ids.length) return { total: 0, degraus: DEGRAUS.map((d) => ({ key: d.key, rotulo: d.rotulo, n: 0, pct: 0 })), paradas: [], pagantes: 0 };
  const [comProduto, comVenda, assinantes] = await Promise.all([
    db.select({ storeId: storeProducts.storeId, n: count() }).from(storeProducts).innerJoin(products, eq(products.id, storeProducts.productId))
      .where(and(inArray(storeProducts.storeId, ids), eq(storeProducts.active, true), eq(products.status, "ACTIVE"))).groupBy(storeProducts.storeId),
    db.select({ storeId: orders.storeId, n: count() }).from(orders)
      .where(and(inArray(orders.storeId, ids), eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"))).groupBy(orders.storeId),
    db.select({ storeId: nlSubscriptions.storeId }).from(nlSubscriptions).where(and(inArray(nlSubscriptions.storeId, ids), eq(nlSubscriptions.status, "active"))),
  ]);
  const temProduto = new Set(comProduto.map((r) => r.storeId)), temVenda = new Set(comVenda.map((r) => r.storeId)), paga = new Set(assinantes.map((r) => r.storeId));

  const todas: LojaNoFunil[] = lojas.map((l) => {
    const feitos: Record<Degrau, boolean> = {
      CADASTRO: true, PRODUTO: temProduto.has(l.id), PUBLICOU: !!l.publishedAt && l.status === "ACTIVE",
      PAGAMENTO: l.paymentStatus === "CONNECTED", PRIMEIRA_VENDA: temVenda.has(l.id), ASSINANTE: paga.has(l.id),
    };
    const parouEm = ondeParou(feitos);
    const d = DEGRAUS.find((x) => x.key === parouEm);
    return { storeId: l.id, nome: l.nome, slug: l.slug, criadaEm: l.criadaEm, feitos, parouEm, passo: d?.passo ?? null, href: d?.href ?? null, diasParada: Math.max(0, Math.floor((agora.getTime() - new Date(l.criadaEm).getTime()) / DIA)) };
  });
  const total = todas.length;
  // Funil cumulativo: conta quem já passou por aquele degrau E por todos os anteriores.
  const degraus = DEGRAUS.map((d, i) => {
    const n = todas.filter((l) => DEGRAUS.slice(0, i + 1).every((x) => l.feitos[x.key])).length;
    return { key: d.key, rotulo: d.rotulo, n, pct: Math.round((n / total) * 100) };
  });
  const paradas = todas.filter((l) => l.parouEm).sort((a, b) => DEGRAUS.findIndex((d) => d.key === a.parouEm) - DEGRAUS.findIndex((d) => d.key === b.parouEm) || b.diasParada - a.diasParada);
  return { total, degraus, paradas, pagantes: paga.size };
}

/** Lembrete por degrau (D176): depois de quantos dias parada a loja recebe o e-mail, e o texto. Assinatura fica com a cobrança. */
const LEMBRETE: Partial<Record<Degrau, { dias: number; assunto: string; texto: string; botao: string }>> = {
  PRODUTO: { dias: 2, assunto: "Falta só o primeiro produto para a sua loja começar", texto: "Sua loja já está criada. Cadastre o primeiro produto com foto, preço e estoque: leva poucos minutos e ele já entra à venda na loja.", botao: "Cadastrar produto" },
  PUBLICOU: { dias: 2, assunto: "Sua loja está pronta para ser publicada", texto: "Você já tem produto cadastrado. Publique a loja para os clientes verem e comprarem: é um clique em Loja virtual.", botao: "Publicar a loja" },
  PAGAMENTO: { dias: 2, assunto: "Conecte o Mercado Pago para receber das vendas", texto: "Sua loja está no ar. Conecte a conta Mercado Pago da loja para os clientes pagarem por Pix ou cartão, com o dinheiro caindo direto na sua conta.", botao: "Conectar o Mercado Pago" },
  PRIMEIRA_VENDA: { dias: 7, assunto: "Dicas para a primeira venda da sua loja", texto: "Sua loja está pronta para vender. Compartilhe o link da loja no Instagram e no WhatsApp e coloque-o na bio: é o caminho mais rápido para a primeira venda.", botao: "Ver meus pedidos" },
};

/**
 * Rotina diária (cron "finance"): manda UM lembrete por degrau a cada loja parada há tempo suficiente, com o botão para a
 * tela que resolve. Repetir no mesmo dia ou nos seguintes não reenvia (dedupe por loja e degrau). Sem a chave do Resend o
 * e-mail fica só registrado, como todos os outros.
 */
export async function lembretesDeAtivacao(db: Database, agora = new Date()): Promise<{ enviados: number }> {
  const f = await calcularFunil(db, agora);
  const base = brandByCode("NEXTLEVEL_COMMERCE").baseUrl;
  let enviados = 0;
  for (const l of f.paradas) {
    const m = l.parouEm ? LEMBRETE[l.parouEm] : undefined;
    if (!m || !l.href || l.diasParada < m.dias) continue;
    enviados += await notifyTenant(db, { storeId: l.storeId }, {
      kind: "ATIVACAO_LOJA", subject: m.assunto, text: `${m.texto}\n\nLoja: ${l.nome}`, cta: { label: m.botao, url: `${base}${l.href}` },
      dedupeKey: `ATIVACAO:${l.storeId}:${l.parouEm}`, brand: "NEXTLEVEL_COMMERCE",
    });
  }
  return { enviados };
}
