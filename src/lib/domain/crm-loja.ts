import { and, asc, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { abandonedCarts, crmAcompanhamento, customers, iaConversas, iaMensagens, orders, storeCustomers } from "@/db/schema";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import type { Actor } from "./access";
import { linkWhatsapp } from "./agora-ecommerce";
import { formatBRL } from "@/lib/money";

/**
 * CRM do lojista (D207): a mesma ideia do Comercial do Master, para os clientes DA LOJA. Junta numa pessoa só (e-mail ou
 * WhatsApp iguais) quem conversou no "Dúvidas?", quem abandonou carrinho e quem comprou. A etapa vem dos fatos
 * (ninguém digita); próxima ação, prazo e notas ficam em `crm_acompanhamento` (marca "LOJA:<id>"). Só a própria loja vê.
 */
export const ETAPAS_LOJA = [
  { key: "conversou", rotulo: "Conversou", dica: "Perguntou no “Dúvidas?” e ainda não comprou" },
  { key: "carrinho", rotulo: "Carrinho abandonado", dica: "Deixou produtos no carrinho" },
  { key: "primeira", rotulo: "Primeira compra", dica: "Comprou uma vez" },
  { key: "recorrente", rotulo: "Recorrente", dica: "Comprou 2 vezes ou mais" },
  { key: "inativo", rotulo: "Sumiu", dica: "Não compra há mais de 90 dias" },
] as const;
export type EtapaLoja = (typeof ETAPAS_LOJA)[number]["key"];

export type ClienteLoja = {
  chave: string; nome: string; email: string | null; whatsapp: string | null; etapa: EtapaLoja; desde: string; detalhe: string;
  pedidos: number; gastoCents: number; ultimaCompra: string | null; /** id do perfil na loja (`store_customers`), para abrir o cadastro. */ customerId: string | null; carrinhoId: string | null; conversaId: string | null;
  proximaAcao: string | null; prazo: string | null; whatsappHref: string | null;
};

const DIA = 86_400_000;
const emailN = (e: string | null | undefined) => (e ?? "").trim().toLowerCase() || null;
const tel = (t: string | null | undefined) => { const d = (t ?? "").replace(/\D/g, ""); return d.length >= 10 ? d.replace(/^55(?=\d{10,11}$)/, "") : null; };
export const marcaDaLoja = (storeId: string) => `LOJA:${storeId}`;

function lojaDo(actor: Actor): string {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("O CRM é do painel da loja.");
  return actor.storeId;
}

const MSG = {
  conversou: (n: string) => `Oi ${n}! Vi a sua pergunta na nossa loja. Posso te ajudar a escolher?`,
  carrinho: (n: string) => `Oi ${n}! Vi que você deixou produtos no carrinho da nossa loja. Quer ajuda para finalizar?`,
  primeira: (n: string) => `Oi ${n}! Obrigado pela compra. Chegou tudo certinho?`,
  recorrente: (n: string) => `Oi ${n}! Chegaram novidades que combinam com o que você já levou. Quer dar uma olhada?`,
  inativo: (n: string) => `Oi ${n}! Sentimos sua falta. Temos novidades na loja para você.`,
};

export async function clientesDaLoja(db: Database, actor: Actor, agora = new Date()): Promise<ClienteLoja[]> {
  const storeId = lojaDo(actor);
  const desde60 = new Date(agora.getTime() - 60 * DIA).toISOString();
  const [compradores, carrinhos, conversas, acomp] = await Promise.all([
    db.select({ id: customers.id, scId: storeCustomers.id, nome: customers.name, email: customers.email, phone: customers.phone, pedidos: storeCustomers.ordersCount, gasto: storeCustomers.totalSpentCents, ultima: storeCustomers.lastOrderAt, desde: storeCustomers.createdAt })
      .from(storeCustomers).innerJoin(customers, eq(customers.id, storeCustomers.customerId)).where(eq(storeCustomers.storeId, storeId)).orderBy(desc(storeCustomers.lastOrderAt)).limit(1000),
    db.select().from(abandonedCarts).where(and(eq(abandonedCarts.storeId, storeId), isNull(abandonedCarts.recoveredOrderId), isNull(abandonedCarts.optedOutAt), gte(abandonedCarts.createdAt, desde60))).orderBy(desc(abandonedCarts.createdAt)).limit(500),
    db.select().from(iaConversas).where(and(eq(iaConversas.storeId, storeId), eq(iaConversas.canal, "LOJA"))).orderBy(desc(iaConversas.ultimaEm)).limit(500),
    db.select().from(crmAcompanhamento).where(eq(crmAcompanhamento.brand, marcaDaLoja(storeId))),
  ]);
  const ac = new Map(acomp.map((a) => [a.chave, a]));
  const pessoas: ClienteLoja[] = [];
  const indice = new Map<string, ClienteLoja>();
  const indexar = (p: ClienteLoja) => { for (const k of [emailN(p.email), tel(p.whatsapp)]) if (k && !indice.has(k)) indice.set(k, p); };
  const achar = (e?: string | null, t?: string | null) => indice.get(emailN(e) ?? "") ?? indice.get(tel(t) ?? "");
  const fechar = (p: Omit<ClienteLoja, "proximaAcao" | "prazo" | "whatsappHref">): ClienteLoja => {
    const a = ac.get(p.chave);
    return { ...p, proximaAcao: a?.proximaAcao ?? null, prazo: a?.prazo ?? null, whatsappHref: linkWhatsapp(p.whatsapp, MSG[p.etapa](p.nome.split(" ")[0] ?? p.nome)) };
  };

  for (const c of compradores) {
    const inativo = c.ultima ? agora.getTime() - new Date(c.ultima).getTime() > 90 * DIA : false;
    const etapa: EtapaLoja = inativo ? "inativo" : c.pedidos >= 2 ? "recorrente" : c.pedidos >= 1 ? "primeira" : "conversou";
    const p = fechar({ chave: `cliente:${c.id}`, nome: c.nome, email: c.email, whatsapp: c.phone, etapa, desde: c.desde, detalhe: `${c.pedidos} pedido(s) · ${formatBRL(c.gasto)} no total`, pedidos: c.pedidos, gastoCents: c.gasto, ultimaCompra: c.ultima, customerId: c.scId, carrinhoId: null, conversaId: null });
    pessoas.push(p); indexar(p);
  }
  for (const k of carrinhos) {
    const ja = achar(k.email, null);
    if (ja) { ja.carrinhoId ??= k.id; continue; }
    const p = fechar({ chave: `carrinho:${k.id}`, nome: k.name ?? k.email.split("@")[0]!, email: k.email, whatsapp: null, etapa: "carrinho", desde: k.createdAt, detalhe: `${k.items.reduce((s, i) => s + i.quantity, 0)} item(ns) no carrinho${k.remindedAt1 ? " · lembrete enviado" : ""}`, pedidos: 0, gastoCents: 0, ultimaCompra: null, customerId: null, carrinhoId: k.id, conversaId: null });
    pessoas.push(p); indexar(p);
  }
  for (const v of conversas) {
    const ja = achar(v.email, v.whatsapp);
    if (ja) { ja.conversaId ??= v.id; continue; }
    const p = fechar({ chave: `conversa:${v.id}`, nome: v.nome ?? "Cliente", email: v.email, whatsapp: v.whatsapp, etapa: "conversou", desde: v.createdAt, detalhe: v.ultimaMensagem ?? "Conversou no “Dúvidas?”", pedidos: 0, gastoCents: 0, ultimaCompra: null, customerId: null, carrinhoId: null, conversaId: v.id });
    pessoas.push(p); indexar(p);
  }
  return pessoas.sort((a, b) => (b.ultimaCompra ?? b.desde).localeCompare(a.ultimaCompra ?? a.desde));
}

export async function fichaClienteLoja(db: Database, actor: Actor, chave: string, agora = new Date()) {
  const storeId = lojaDo(actor);
  const p = (await clientesDaLoja(db, actor, agora)).find((x) => x.chave === chave);
  if (!p) throw new NotFoundError("Cliente não encontrado.");
  type Evento = { em: string; texto: string; autor?: string };
  const linha: Evento[] = [];
  if (p.customerId && p.email) {
    const ps = await db.select({ numero: orders.number, total: orders.totalCents, status: orders.status, pago: orders.customerPaymentStatus, em: orders.createdAt }).from(orders).where(and(eq(orders.storeId, storeId), sql`lower(${orders.customerEmail}) = ${p.email.toLowerCase()}`)).orderBy(desc(orders.createdAt)).limit(30);
    for (const o of ps) linha.push({ em: o.em, texto: `Pedido #${o.numero} · ${formatBRL(o.total)} · ${o.pago === "PAID" ? "pago" : "aguardando pagamento"}`, autor: "Loja" });
  }
  if (p.carrinhoId) { const [k] = await db.select().from(abandonedCarts).where(eq(abandonedCarts.id, p.carrinhoId)).limit(1); if (k) linha.push({ em: k.createdAt, texto: `Deixou ${k.items.reduce((s, i) => s + i.quantity, 0)} item(ns) no carrinho`, autor: "Loja" }); }
  if (p.conversaId) for (const m of await db.select().from(iaMensagens).where(eq(iaMensagens.conversaId, p.conversaId)).orderBy(asc(iaMensagens.createdAt)).limit(100))
    if (m.autor !== "SISTEMA") linha.push({ em: m.createdAt, texto: m.texto, autor: m.autor === "CLIENTE" ? p.nome : "Você (loja)" });
  const [a] = await db.select().from(crmAcompanhamento).where(eq(crmAcompanhamento.chave, `${marcaDaLoja(storeId)}|${chave}`)).limit(1);
  linha.sort((x, y) => y.em.localeCompare(x.em));
  return { cliente: p, linha, notas: a?.notas ?? "" };
}

export async function salvarAcompanhamentoLoja(db: Database, actor: Actor, chave: string, d: { proximaAcao?: string; prazo?: string | null; notas?: string }) {
  const storeId = lojaDo(actor);
  if (!/^(cliente|carrinho|conversa):[\w-]+$/.test(chave)) throw new DomainError("CHAVE", "Cliente inválido.");
  const valores = {
    ...(d.proximaAcao !== undefined ? { proximaAcao: d.proximaAcao.trim().slice(0, 200) || null } : {}),
    ...(d.prazo !== undefined ? { prazo: d.prazo ? new Date(d.prazo).toISOString() : null } : {}),
    ...(d.notas !== undefined ? { notas: d.notas.slice(0, 3000) } : {}),
    responsavelId: actor.userId, updatedAt: new Date().toISOString(),
  };
  await db.insert(crmAcompanhamento).values({ chave: `${marcaDaLoja(storeId)}|${chave}`, brand: marcaDaLoja(storeId), ...valores }).onConflictDoUpdate({ target: crmAcompanhamento.chave, set: valores });
}

/** Itens extras da fila do lojista (D207): clientes esperando resposta e carrinhos recentes. */
export async function filaExtraDaLoja(db: Database, storeId: string, agora = new Date()) {
  const [[conv], [carr]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(iaConversas).where(and(eq(iaConversas.storeId, storeId), eq(iaConversas.canal, "LOJA"), inArray(iaConversas.status, ["NOVA", "IA", "HUMANO"]), ne(iaConversas.naoLidas, 0))),
    db.select({ n: sql<number>`count(*)::int` }).from(abandonedCarts).where(and(eq(abandonedCarts.storeId, storeId), isNull(abandonedCarts.recoveredOrderId), isNull(abandonedCarts.optedOutAt), gte(abandonedCarts.createdAt, new Date(agora.getTime() - 2 * DIA).toISOString()))),
  ]);
  const itens: { key: string; title: string; detail: string; count: number; href: string; action: string; tone: "danger" | "warning" | "info" }[] = [];
  if (conv?.n) itens.push({ key: "conversas", title: `${conv.n} cliente(s) esperando resposta`, detail: "Perguntas feitas no “Dúvidas?” da sua loja.", count: conv.n, href: "/merchant/atendimento", action: "Responder", tone: "danger" });
  if (carr?.n) itens.push({ key: "carrinhos", title: `${carr.n} carrinho(s) abandonado(s) nas últimas 48 h`, detail: "Chame no WhatsApp com a mensagem pronta e recupere a venda.", count: carr.n, href: "/merchant/crm?etapa=carrinho", action: "Recuperar", tone: "warning" });
  return itens;
}
