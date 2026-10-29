import { and, count, desc, eq, gte, inArray, isNull, min, ne } from "drizzle-orm";
import type { Database } from "@/db/client";
import { brandLeads, iaConversas, orders, organizations, stores } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { requireMaster, type Actor } from "./access";
import { funilEcommerce, type FunilEcommerce } from "./funil-ecommerce";
import { resumoComercial, situacoesComerciais } from "./situacao-comercial";
import { getConfigComercial, mensageiro, PADRAO } from "./comercial-config";

/**
 * "Agora" do Master da E-commerce (D200): o que fazer nos próximos minutos, em ordem de urgência, com a ação a um clique.
 * Ordem: conversa esperando > interessado novo > cadastro novo > teste vencendo > ativação parada > cobrança vencida >
 * primeira venda. Cada item diz há quanto tempo está ali. `agora` sempre injetado.
 */
export type TipoAgora = "conversa" | "interessado" | "cadastro" | "teste" | "parada" | "cobranca" | "primeira_venda";
export type AcaoAgora = { rotulo: string; href: string; externo?: boolean };
export type ItemAgora = { key: string; tipo: TipoAgora; titulo: string; detalhe: string; desde: string; tom: "danger" | "warning" | "info" | "success"; acoes: AcaoAgora[] };

const ORDEM: TipoAgora[] = ["conversa", "interessado", "cadastro", "teste", "parada", "cobranca", "primeira_venda"];
const ROTULO_TIPO: Record<TipoAgora, string> = {
  conversa: "Conversa esperando", interessado: "Interessado novo", cadastro: "Cadastro novo", teste: "Teste acabando",
  parada: "Ativação parada", cobranca: "Pagamento pendente", primeira_venda: "Primeira venda",
};
export const rotuloTipoAgora = (t: TipoAgora) => ROTULO_TIPO[t];

const HORA = 3_600_000, DIA = 24 * HORA;

/** WhatsApp com DDD vira link `wa.me` com a mensagem pronta (sem integração: abre o app de quem atende). */
export function linkWhatsapp(telefone: string | null | undefined, texto: string): string | null {
  const d = (telefone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const num = d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

/** Mensagens prontas padrão (as editadas no Master valem por cima, via `mensageiro`). */
export const MENSAGENS = mensageiro({ ...PADRAO });

export type AgoraEcommerce = {
  fila: ItemAgora[];
  contadores: { conversas: number; novos24h: number; teste: number; pagantes: number; meta: number; mrrCents: number; cortesia: number };
  funil: FunilEcommerce;
};

export async function agoraEcommerce(db: Database, actor: Actor, agora = new Date()): Promise<AgoraEcommerce> {
  requireMaster(actor);
  const lojas = await db.select({ id: stores.id, nome: stores.name, slug: stores.slug, whatsapp: stores.whatsapp, email: stores.contactEmail, criadaEm: stores.createdAt, paidUntil: stores.paidUntil, trialEndsAt: stores.trialEndsAt, entryOffer: stores.entryOffer })
    .from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(and(eq(organizations.brand, "NEXTLEVEL_COMMERCE"), isNull(stores.showcaseTheme)));
  const ids = lojas.map((l) => l.id);
  const desde48h = new Date(agora.getTime() - 2 * DIA).toISOString();
  const [sit, funil, conversas, leads, vendas, cfg] = await Promise.all([
    situacoesComerciais(db, lojas, agora),
    funilEcommerce(db, actor, agora),
    db.select().from(iaConversas).where(and(eq(iaConversas.brand, "NEXTLEVEL_COMMERCE"), inArray(iaConversas.status, ["NOVA", "IA", "HUMANO"]), ne(iaConversas.naoLidas, 0))).orderBy(iaConversas.ultimaEm).limit(30),
    db.select().from(brandLeads).where(and(eq(brandLeads.brand, "NEXTLEVEL_COMMERCE"), eq(brandLeads.status, "NEW"))).orderBy(desc(brandLeads.createdAt)).limit(30),
    ids.length ? db.select({ storeId: orders.storeId, n: count(), primeira: min(orders.createdAt) }).from(orders)
      .where(and(inArray(orders.storeId, ids), eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), gte(orders.createdAt, new Date(agora.getTime() - 30 * DIA).toISOString()))).groupBy(orders.storeId) : Promise.resolve([]),
    getConfigComercial(db),
  ]);
  const MSG = mensageiro(cfg);
  const porId = new Map(lojas.map((l) => [l.id, l]));
  const nomeDe = (l: { nome: string }) => l.nome.split(" ")[0] ?? l.nome;
  const fila: ItemAgora[] = [];
  const add = (i: ItemAgora) => fila.push(i);
  const wa = (tel: string | null | undefined, msg: string): AcaoAgora[] => { const h = linkWhatsapp(tel, msg); return h ? [{ rotulo: "WhatsApp", href: h, externo: true }] : []; };

  for (const c of conversas) {
    const min = Math.max(0, Math.round((agora.getTime() - new Date(c.ultimaEm).getTime()) / 60_000));
    add({ key: `c:${c.id}`, tipo: "conversa", titulo: c.nome ?? "Visitante do site", detalhe: `${c.naoLidas} mensagem(ns) sem resposta${c.ultimaMensagem ? `: “${c.ultimaMensagem.slice(0, 80)}”` : ""}`, desde: c.ultimaEm,
      tom: min >= cfg.esperaVermelhaMin ? "danger" : min >= cfg.esperaAmarelaMin ? "warning" : "info", acoes: [{ rotulo: "Abrir conversa", href: `/master/ia?c=${c.id}` }, ...wa(c.whatsapp, MSG.interessado(c.nome ?? ""))] });
  }
  const leadsDaConversa = new Set(conversas.map((c) => c.leadId).filter(Boolean));
  for (const l of leads.filter((x) => !leadsDaConversa.has(x.id))) {
    add({ key: `l:${l.id}`, tipo: "interessado", titulo: l.name, detalhe: [l.storeName, l.segment, l.message?.slice(0, 80)].filter(Boolean).join(" · ") || l.email, desde: l.createdAt, tom: "warning",
      acoes: [...wa(l.phone, MSG.interessado(l.name.split(" ")[0] ?? l.name)), { rotulo: "Ver interessados", href: "/commerce/leads" }] });
  }
  for (const l of lojas.filter((x) => agora.getTime() - new Date(x.criadaEm).getTime() < DIA)) {
    add({ key: `n:${l.id}`, tipo: "cadastro", titulo: l.nome, detalhe: `Loja criada · ${l.email ?? "sem e-mail de contato"}`, desde: l.criadaEm, tom: "warning",
      acoes: [...wa(l.whatsapp, MSG.cadastro(nomeDe(l), l.nome)), { rotulo: "Ver loja", href: "/commerce/stores" }] });
  }
  for (const [id, s] of sit) {
    const l = porId.get(id)!;
    if (s.pagamento === "teste" && s.diasParaVencer !== null && s.diasParaVencer <= 3) add({ key: `t:${id}`, tipo: "teste", titulo: l.nome, detalhe: s.diasParaVencer <= 0 ? "Teste termina hoje" : `Teste termina em ${s.diasParaVencer} dia(s)`, desde: l.criadaEm, tom: s.diasParaVencer <= 1 ? "danger" : "warning", acoes: [...wa(l.whatsapp, MSG.teste(nomeDe(l), l.nome, Math.max(0, s.diasParaVencer))), { rotulo: "Ver loja", href: "/commerce/stores" }] });
    if (s.pagamento === "vencido" || s.pagamento === "aguardando") add({ key: `p:${id}`, tipo: "cobranca", titulo: l.nome, detalhe: `${s.rotulo}${s.plano ? ` · plano ${s.plano}` : ""}`, desde: s.venceEm ?? l.criadaEm, tom: s.pagamento === "vencido" ? "danger" : "warning", acoes: [...wa(l.whatsapp, MSG.cobranca(nomeDe(l), l.nome)), { rotulo: "Ver assinaturas", href: "/master/financeiro/assinaturas" }] });
  }
  for (const p of funil.paradas.filter((x) => x.diasParada >= 2 && x.parouEm !== "ASSINANTE")) {
    const l = porId.get(p.storeId);
    if (!l) continue;
    add({ key: `a:${p.storeId}`, tipo: "parada", titulo: p.nome, detalhe: `Parada há ${p.diasParada} dia(s) · falta: ${p.passo ?? "próximo passo"}`, desde: p.criadaEm, tom: p.diasParada >= 7 ? "danger" : "warning",
      acoes: [...wa(l.whatsapp, MSG.parada(nomeDe(l), (p.passo ?? "o próximo passo").toLowerCase())), { rotulo: "Ver loja", href: "/commerce/stores" }] });
  }
  for (const v of vendas.filter((x) => Number(x.n) === 1 && x.primeira && x.primeira >= desde48h)) {
    const l = porId.get(v.storeId!);
    if (!l) continue;
    add({ key: `v:${l.id}`, tipo: "primeira_venda", titulo: l.nome, detalhe: "A primeira venda entrou: hora de parabenizar e mostrar o próximo passo", desde: v.primeira!, tom: "success", acoes: [...wa(l.whatsapp, MSG.primeiraVenda(nomeDe(l), l.nome))] });
  }
  fila.sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo) || a.desde.localeCompare(b.desde));

  const r = resumoComercial(sit.values());
  const meta = cfg.metaPagantes;
  return {
    fila,
    contadores: { conversas: conversas.length, novos24h: lojas.filter((x) => agora.getTime() - new Date(x.criadaEm).getTime() < DIA).length + leads.filter((x) => agora.getTime() - new Date(x.createdAt).getTime() < DIA).length, teste: r.teste, pagantes: r.pagantes, meta, mrrCents: r.mrrCents, cortesia: r.cortesia },
    funil,
  };
}

export const resumoAgora = (a: AgoraEcommerce) => `${a.contadores.pagantes} de ${a.contadores.meta} pagantes · ${formatBRL(a.contadores.mrrCents)} por mês`;
