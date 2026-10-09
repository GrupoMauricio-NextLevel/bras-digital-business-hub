import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { auditLog, bdMembers, catalogProducts } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember, brasMembersActivity } from "@/lib/domain/bras/membros";
import { grantBrasAccess } from "@/lib/domain/bras/descobertas";
import { DEFAULT_BRAS_RULES, brasCubageQuote, brasPlanForChannel, brasSupportFor, getBrasRules, saveBrasRules } from "@/lib/domain/bras/regras";
import {
  DEFAULT_BRAS_CLASSIFICATION, brasBehaviorLevel, brasClientLevel, brasJourneyMoment, brasMaxScore, brasPanelPlan, brasProfileScore, brasProfileSchema,
  getBrasClassification, saveBrasClassification, saveMyBrasProfile, setBrasLevelOverride, type BrasProfileInput,
} from "@/lib/domain/bras/perfil";
import {
  brasMemberPlan, brasSupportInbox, brasSupportThreadForMaster, brasSupportView, cancelMyBrasAppointment, decideBrasAppointment, listBrasAppointments,
  myBrasAppointments, myBrasSupportThread, myBrasUnreadReplies, replyBrasSupport, requestBrasAppointment, sendBrasSupportMessage,
} from "@/lib/domain/bras/suporte";
import { DEFAULT_BRAS_LEGAL, getBrasLegal, renderBrasLegal, saveBrasLegal } from "@/lib/domain/bras/juridico";
import { brasRecordingDays, deleteBrasContent, listBrasContent, saveBrasContent } from "@/lib/domain/bras/pauta";
import { addBrasImporter } from "@/lib/domain/bras/catalogo";
import { getCatalogItem, listCatalog } from "@/lib/domain/nl-catalog";

/** D108: Brás v2 fase 0 — regras no Master, classificação do cliente, painel por nível, suporte por plano, jurídico simulado, pauta. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let anaId: string;
const iniciante: BrasProfileInput = { stage: "comecando", channels: ["ainda_nao"], monthlyPurchase: "ate5k", revenue: "ate20k", importExperience: "nunca", team: "so_eu", goals: ["aprender", "produto"] };
const gigante: BrasProfileInput = { stage: "estruturado", channels: ["mercado_livre", "amazon", "atacado", "loja_fisica"], monthlyPurchase: "acima500k", revenue: "acima2m", importExperience: "container", team: "mais20", goals: ["volume", "alto_mar"] };
const membro = async (cnpj: string, email: string, profile?: BrasProfileInput) => {
  const r = await signupBrasMember(ctx.db, { name: "Ana", companyName: `Empresa ${cnpj.slice(-4)}`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true, profile });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { actor: { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor, member: m };
};

beforeEach(async () => {
  ctx = await freshDb();
  const a = await membro("11222333000181", "ana@u.teste", iniciante);
  ana = a.actor; anaId = a.member.id;
});

describe("regras da Brás v2 no Master", () => {
  it("padrões aceitos pelo dono: sinal 30%, atraso 30 dias, cotação 7/15 dias e 4 itens, cota 30 + 15 dias", async () => {
    const r = await getBrasRules(ctx.db);
    expect(r.version).toBe(0);
    expect(r.preorder).toMatchObject({ depositPct: 30, delayRefundDays: 30, minPlan: "PLATINUM" });
    expect(r.quotes).toMatchObject({ catalogDays: 7, offCatalogDays: 15, offCatalogMaxItems: 4, offCatalogLateRefundPct: 100 });
    expect(r.shared).toMatchObject({ closeDays: 30, extensionDays: 15, maxExtensions: 1, minFillPct: 100 });
  });

  it("só o Master grava; cada gravação sobe a versão, valida e fica na auditoria", async () => {
    await expect(saveBrasRules(ctx.db, ana, { preorder: { ...DEFAULT_BRAS_RULES.preorder, depositPct: 40 } })).rejects.toThrow();
    const v1 = await saveBrasRules(ctx.db, ctx.actors.master, { preorder: { ...DEFAULT_BRAS_RULES.preorder, depositPct: 40 } });
    expect(v1.version).toBe(1);
    expect((await getBrasRules(ctx.db)).preorder.depositPct).toBe(40);
    expect((await getBrasRules(ctx.db)).quotes.catalogDays).toBe(7);
    await expect(saveBrasRules(ctx.db, ctx.actors.master, { preorder: { ...DEFAULT_BRAS_RULES.preorder, depositPct: 95 } })).rejects.toThrow();
    await expect(saveBrasRules(ctx.db, ctx.actors.master, { cubage: { ...DEFAULT_BRAS_RULES.cubage, smallQtyCurve: [{ upToBoxes: 30, surchargeBps: 100 }, { upToBoxes: 10, surchargeBps: 200 }] } })).rejects.toThrow(/crescente/);
    const v2 = await saveBrasRules(ctx.db, ctx.actors.master, { carriers: { ...DEFAULT_BRAS_RULES.carriers, commissionBps: { GRATIS: 1000, PRO: 700, PREMIUM: 500 } } });
    expect(v2.version).toBe(2);
    const audit = await ctx.db.select().from(auditLog).where(eq(auditLog.action, "BRAS_RULES_SAVED"));
    expect(audit.length).toBe(2);
  });

  it("FAQ sempre presente em todo plano, mesmo se o Master tirar", async () => {
    const v = await saveBrasRules(ctx.db, ctx.actors.master, { support: { ...DEFAULT_BRAS_RULES.support, channels: { ...DEFAULT_BRAS_RULES.support.channels, PRATA: ["CHAT"] } } });
    expect(v.support.channels.PRATA).toEqual(["FAQ", "CHAT"]);
  });

  it("suporte por plano: grátis FAQ; Prata chat e WhatsApp; Ouro e Platinum com agenda; grande conta ganha WhatsApp no grátis", () => {
    const r = DEFAULT_BRAS_RULES;
    expect(brasSupportFor(r, "GRATIS").channels).toEqual(["FAQ"]);
    expect(brasSupportFor(r, "PRATA").channels).toEqual(["FAQ", "CHAT", "WHATSAPP"]);
    expect(brasSupportFor(r, "OURO")).toMatchObject({ channels: ["FAQ", "CHAT", "WHATSAPP", "AGENDA"], agendaPerMonth: 1 });
    expect(brasSupportFor(r, "PLATINUM").agendaPerMonth).toBe(2);
    expect(brasSupportFor(r, "GRATIS", "GRANDE")).toMatchObject({ channels: ["FAQ", "WHATSAPP"], largeAccountBoost: true });
    expect(brasSupportFor({ support: { ...r.support, largeAccountWhatsapp: false } }, "GRATIS", "GRANDE").channels).toEqual(["FAQ"]);
    expect(brasPlanForChannel(r, "CHAT")).toBe("PRATA");
    expect(brasPlanForChannel(r, "AGENDA")).toBe("OURO");
  });
});

describe("simulador de cubagem", () => {
  const base = { container: "c40hc" as const, fixedCostCents: 6_800_000, boxDm3: 100, productPerBoxCents: 20_000, unitsPerBox: 24, items: 1, soldPct: 100 };
  it("mesmo item: custo fixo dividido pelas caixas que cabem no volume útil", () => {
    const q = brasCubageQuote(DEFAULT_BRAS_RULES, base);
    expect(q.boxesFull).toBe(680);
    expect(q.logisticsPerBoxCents).toBe(10_000);
    expect(q.perBoxCents).toBe(30_000);
    expect(q.perUnitCents).toBe(1250);
    expect(q.occupancyAdjustmentPerBoxCents).toBe(0);
  });
  it("misto é mais caro: ocupação menor, taxa por item e acréscimo de pouca quantidade", () => {
    const igual = brasCubageQuote(DEFAULT_BRAS_RULES, base);
    const misto = brasCubageQuote(DEFAULT_BRAS_RULES, { ...base, items: 10 });
    expect(misto.mixed).toBe(true);
    expect(misto.boxesFull).toBe(578);
    expect(misto.handlingPerBoxCents).toBeGreaterThan(0);
    expect(misto.perUnitCents).toBeGreaterThan(igual.perUnitCents);
    const poucas = brasCubageQuote(DEFAULT_BRAS_RULES, { ...base, items: 10, boxesOfItem: 8 });
    expect(poucas.surchargeBps).toBe(1500);
  });
  it("contêiner pouco cheio mostra o ajuste de ocupação (nunca cobrado sem aceite)", () => {
    const q = brasCubageQuote(DEFAULT_BRAS_RULES, { ...base, soldPct: 50 });
    expect(q.occupancyAdjustmentPerBoxCents).toBe(10_000);
    expect(q.perUnitAtSoldCents).toBeGreaterThan(q.perUnitCents);
  });
});

describe("classificação do cliente", () => {
  it("cadastro com as perguntas grava pontuação e nível declarado", async () => {
    const m = (await ctx.db.query.bdMembers.findFirst({ where: eq(bdMembers.id, anaId) }))!;
    expect(m.declaredLevel).toBe("INICIANTE");
    expect(m.profileScore).toBe(0);
    expect(m.profile?.goals).toEqual(["aprender", "produto"]);
    const g = await membro("11444777000161", "g@u.teste", gigante);
    const gm = (await ctx.db.query.bdMembers.findFirst({ where: eq(bdMembers.id, g.member.id) }))!;
    expect(gm.declaredLevel).toBe("GRANDE");
    expect(gm.profileScore).toBe(brasMaxScore(DEFAULT_BRAS_CLASSIFICATION));
  });

  it("cadastro sem perguntas continua funcionando (responde depois)", async () => {
    const s = await membro("11444777000242", "s@u.teste");
    expect(s.member.declaredLevel).toBeNull();
    expect((await saveMyBrasProfile(ctx.db, s.actor, { ...iniciante, stage: "crescendo", monthlyPurchase: "20a100k", revenue: "100a500k" })).level).toBe("CRESCIMENTO");
    await expect(saveMyBrasProfile(ctx.db, ctx.actors.master, iniciante)).rejects.toThrow();
  });

  it("pontos e cortes: faixas e pisos (compra acima de R$ 500 mil/mês = grande conta mesmo com o resto pequeno)", () => {
    const c = DEFAULT_BRAS_CLASSIFICATION;
    const p = (x: Partial<BrasProfileInput>) => brasProfileScore(brasProfileSchema.parse({ ...iniciante, ...x }), c);
    expect(p({}).level).toBe("INICIANTE");
    expect(p({ stage: "vendendo", channels: ["mercado_livre", "shopee"], monthlyPurchase: "5a20k", revenue: "20a100k" })).toMatchObject({ score: 8, level: "CRESCIMENTO" });
    expect(p({ monthlyPurchase: "acima500k" }).level).toBe("GRANDE");
    expect(p({ importExperience: "container" }).level).toBe("PROFISSIONAL");
    // teto de canais
    expect(p({ channels: ["mercado_livre", "shopee", "amazon", "loja_online", "loja_fisica", "atacado"] }).score).toBe(4);
    expect(() => brasProfileSchema.parse({ ...iniciante, stage: "inventado" })).toThrow();
    expect(() => brasProfileSchema.parse({ ...iniciante, goals: [] })).toThrow();
  });

  it("nível comprovado pela compra sobe o declarado; ajuste do Master vence tudo (com motivo e auditoria)", async () => {
    const c = DEFAULT_BRAS_CLASSIFICATION;
    expect(brasBehaviorLevel(4_000_000, c)).toBe("PROFISSIONAL");
    expect(brasClientLevel({ declaredLevel: "INICIANTE", levelOverride: null }, 4_000_000, c)).toMatchObject({ level: "PROFISSIONAL", source: "COMPROVADO" });
    expect(brasClientLevel({ declaredLevel: "GRANDE", levelOverride: null }, 0, c)).toMatchObject({ level: "GRANDE", source: "DECLARADO" });
    expect(brasClientLevel({ declaredLevel: null, levelOverride: null }, 0, c)).toMatchObject({ level: "INICIANTE", source: "SEM_PERFIL" });
    expect(brasClientLevel({ declaredLevel: "INICIANTE", levelOverride: "GRANDE" }, 0, c)).toMatchObject({ level: "GRANDE", source: "AJUSTE" });
    await expect(setBrasLevelOverride(ctx.db, ctx.actors.master, anaId, "GRANDE")).rejects.toThrow(/motivo/);
    await expect(setBrasLevelOverride(ctx.db, ana, anaId, "GRANDE", "x")).rejects.toThrow();
    await setBrasLevelOverride(ctx.db, ctx.actors.master, anaId, "GRANDE", "Compra contêiner fora da plataforma");
    expect((await ctx.db.query.bdMembers.findFirst({ where: eq(bdMembers.id, anaId) }))!.levelOverride).toBe("GRANDE");
    await setBrasLevelOverride(ctx.db, ctx.actors.master, anaId, null);
    expect((await ctx.db.query.bdMembers.findFirst({ where: eq(bdMembers.id, anaId) }))!.levelOverride).toBeNull();
  });

  it("Master edita pontos e cortes, com validação de ordem", async () => {
    await expect(saveBrasClassification(ctx.db, ana, DEFAULT_BRAS_CLASSIFICATION)).rejects.toThrow();
    await expect(saveBrasClassification(ctx.db, ctx.actors.master, { ...DEFAULT_BRAS_CLASSIFICATION, thresholds: { CRESCIMENTO: 20, PROFISSIONAL: 10, GRANDE: 30 } })).rejects.toThrow(/subir/);
    await saveBrasClassification(ctx.db, ctx.actors.master, { ...DEFAULT_BRAS_CLASSIFICATION, thresholds: { CRESCIMENTO: 5, PROFISSIONAL: 15, GRANDE: 25 } });
    expect((await getBrasClassification(ctx.db)).thresholds.CRESCIMENTO).toBe(5);
  });

  it("momento da jornada vem do comportamento", () => {
    const c = { coolingDays: 30 };
    const now = new Date("2026-10-09T12:00:00Z");
    const z = { requests: 0, paidRequests: 0, paidInWindow: 0, openUnpaid: 0, lastPaidAt: null, lastSeenAt: null };
    expect(brasJourneyMoment(z, c, now)).toBe("NOVO");
    expect(brasJourneyMoment({ ...z, requests: 1, openUnpaid: 1 }, c, now)).toBe("AGUARDANDO");
    expect(brasJourneyMoment({ ...z, requests: 1, paidRequests: 1, paidInWindow: 1, lastPaidAt: "2026-10-01T00:00:00Z", lastSeenAt: "2026-10-08T00:00:00Z" }, c, now)).toBe("PRIMEIRA_COMPRA");
    expect(brasJourneyMoment({ ...z, requests: 3, paidRequests: 3, paidInWindow: 2, lastPaidAt: "2026-10-01T00:00:00Z", lastSeenAt: "2026-10-08T00:00:00Z" }, c, now)).toBe("RECORRENTE");
    expect(brasJourneyMoment({ ...z, requests: 2, paidRequests: 2, paidInWindow: 0, lastPaidAt: "2026-06-01T00:00:00Z", lastSeenAt: "2026-07-01T00:00:00Z" }, c, now)).toBe("ESFRIANDO");
  });

  it("painel por nível e momento: iniciante novo começa por uma caixa; grande conta vê atendimento de perto e contêiner", () => {
    const ini = brasPanelPlan({ hasProfile: true, level: "INICIANTE", moment: "NOVO", goals: ["aprender"], channels: [] });
    expect(ini.cards.map((c) => c.id)).toEqual(["primeira_caixa", "aprender", "analise"]);
    const big = brasPanelPlan({ hasProfile: true, level: "GRANDE", moment: "NOVO", goals: ["volume", "alto_mar"], channels: [] });
    expect(big.cards.map((c) => c.id)).toEqual(["dedicado", "volume", "alto_mar"]);
    expect(big.cards.find((c) => c.id === "volume")?.soon).toBe(true);
    const sem = brasPanelPlan({ hasProfile: false, level: "INICIANTE", moment: "AGUARDANDO", goals: [], channels: [] });
    expect(sem.cards.map((c) => c.id).slice(0, 2)).toEqual(["perfil", "aguardando"]);
    const rec = brasPanelPlan({ hasProfile: true, level: "CRESCIMENTO", moment: "RECORRENTE", goals: ["frete"], channels: [] });
    expect(rec.cards[0]!.id).toBe("repetir");
  });

  it("atividade do Master traz pagos na janela e abertos sem pagamento", async () => {
    const act = await brasMembersActivity(ctx.db, ctx.actors.master, 90);
    expect(act[anaId]).toBeUndefined();
    await expect(brasMembersActivity(ctx.db, ana)).rejects.toThrow();
  });
});

describe("plano e suporte do membro", () => {
  it("sem liberação é Grátis; liberação com plano define; o maior plano vigente vale; mudar de plano não soma dias", async () => {
    expect((await brasMemberPlan(ctx.db, anaId)).plan).toBe("GRATIS");
    await grantBrasAccess(ctx.db, ctx.actors.master, { memberId: anaId, kind: "COURTESY", days: 30 });
    expect((await brasMemberPlan(ctx.db, anaId)).plan).toBe("PRATA");
    const ouro = await grantBrasAccess(ctx.db, ctx.actors.master, { memberId: anaId, kind: "COURTESY", plan: "OURO", days: 10 });
    expect((await brasMemberPlan(ctx.db, anaId)).plan).toBe("OURO");
    const dias = (new Date(ouro.validUntil).getTime() - Date.now()) / 86_400_000;
    expect(dias).toBeLessThan(11);
  });

  it("grátis: chat bloqueado com a chamada do plano certo; Prata conversa; equipe responde; não lidas", async () => {
    await expect(sendBrasSupportMessage(ctx.db, ana, "Oi, preciso de ajuda", "INICIANTE")).rejects.toThrow(/Prata/);
    await grantBrasAccess(ctx.db, ctx.actors.master, { memberId: anaId, kind: "COURTESY", plan: "PRATA", days: 30 });
    await sendBrasSupportMessage(ctx.db, ana, "Oi, preciso de ajuda com a retirada", "INICIANTE");
    const inbox = await brasSupportInbox(ctx.db, ctx.actors.master);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({ memberId: anaId, unread: 1, lastAuthor: "MEMBER" });
    await expect(brasSupportInbox(ctx.db, ana)).rejects.toThrow();
    const t = await brasSupportThreadForMaster(ctx.db, ctx.actors.master, anaId);
    expect(t.messages).toHaveLength(1);
    expect((await brasSupportInbox(ctx.db, ctx.actors.master))[0]!.unread).toBe(0);
    await replyBrasSupport(ctx.db, ctx.actors.master, anaId, "Oi Ana! O código está no comprovante.");
    expect(await myBrasUnreadReplies(ctx.db, anaId)).toBe(1);
    const mine = await myBrasSupportThread(ctx.db, ana);
    expect(mine.map((m) => m.author)).toEqual(["MEMBER", "TEAM"]);
    expect(await myBrasUnreadReplies(ctx.db, anaId)).toBe(0);
    await expect(sendBrasSupportMessage(ctx.db, ana, " ", "INICIANTE")).rejects.toThrow();
  });

  it("outro membro não vê a conversa de ninguém", async () => {
    await grantBrasAccess(ctx.db, ctx.actors.master, { memberId: anaId, kind: "COURTESY", days: 30 });
    await sendBrasSupportMessage(ctx.db, ana, "Mensagem só minha", "INICIANTE");
    const b = await membro("11444777000161", "b@u.teste", iniciante);
    expect(await myBrasSupportThread(ctx.db, b.actor)).toEqual([]);
  });

  it("grande conta no grátis: WhatsApp liberado, chat não", async () => {
    const v = await brasSupportView(ctx.db, ana, "GRANDE");
    expect(v.channels).toEqual(["FAQ", "WHATSAPP"]);
    expect(v.upgradeFor.CHAT).toBe("PRATA");
  });

  it("agenda: só Ouro e Platinum, limite por mês, dia futuro, equipe confirma com hora", async () => {
    const amanha = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const imp = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX" })).id;
    await expect(requestBrasAppointment(ctx.db, ana, { preferredDate: amanha, period: "MANHA", topic: "Utilidades para o Natal" }, "INICIANTE")).rejects.toThrow(/Ouro/);
    await grantBrasAccess(ctx.db, ctx.actors.master, { memberId: anaId, kind: "COURTESY", plan: "OURO", days: 30 });
    await expect(requestBrasAppointment(ctx.db, ana, { preferredDate: "2020-01-01", period: "MANHA", topic: "Utilidades para o Natal" }, "INICIANTE")).rejects.toThrow(/amanhã/);
    const { id } = await requestBrasAppointment(ctx.db, ana, { preferredDate: amanha, period: "TARDE", importerId: imp, topic: "Utilidades para o Natal" }, "INICIANTE");
    await expect(requestBrasAppointment(ctx.db, ana, { preferredDate: amanha, period: "MANHA", topic: "Mais uma visita" }, "INICIANTE")).rejects.toThrow(/por mês/);
    const lista = await listBrasAppointments(ctx.db, ctx.actors.master);
    expect(lista[0]).toMatchObject({ id, importerName: "XDX", status: "REQUESTED" });
    await expect(decideBrasAppointment(ctx.db, ctx.actors.master, id, { status: "CONFIRMED" })).rejects.toThrow(/hora/);
    await decideBrasAppointment(ctx.db, ctx.actors.master, id, { status: "CONFIRMED", scheduledAt: `${amanha}T14:00:00-03:00`, teamNote: "Procure a Danielle na recepção" });
    const meus = await myBrasAppointments(ctx.db, ana);
    expect(meus[0]).toMatchObject({ status: "CONFIRMED", teamNote: "Procure a Danielle na recepção" });
    await cancelMyBrasAppointment(ctx.db, ana, id);
    // cancelada libera a cota do mês
    await requestBrasAppointment(ctx.db, ana, { preferredDate: amanha, period: "MANHA", topic: "Nova visita" }, "INICIANTE");
  });
});

describe("modelos jurídicos simulados e editáveis", () => {
  it("nascem simulados, com os valores das regras no texto; marcador desconhecido aparece", async () => {
    const l = await getBrasLegal(ctx.db);
    expect(l.entity.simulated).toBe(true);
    expect(l.docs.PRE_PEDIDO.status).toBe("SIMULADO");
    const txt = renderBrasLegal(l.docs.PRE_PEDIDO.body, l.entity, DEFAULT_BRAS_RULES, null);
    expect(txt).toContain("30% do valor");
    expect(txt).toContain("passar 30 dias");
    expect(txt).not.toMatch(/\{\{/);
    expect(renderBrasLegal("Taxa {{cotacaoForaTaxa}} e {{inexistente}}", l.entity, DEFAULT_BRAS_RULES, 150_000)).toMatch(/R\$\s?1\.500,00 e \[marcador desconhecido: inexistente\]/);
    expect(renderBrasLegal(DEFAULT_BRAS_LEGAL.docs.TRANSPORTADORA.body, l.entity, DEFAULT_BRAS_RULES, null)).toContain("8% no plano grátis");
  });

  it("Master edita; texto novo sobe versão; revisado exige quem revisou", async () => {
    await expect(saveBrasLegal(ctx.db, ana, { kind: "entity", entity: { ...DEFAULT_BRAS_LEGAL.entity } })).rejects.toThrow();
    const d = DEFAULT_BRAS_LEGAL.docs.PRE_PEDIDO;
    await expect(saveBrasLegal(ctx.db, ctx.actors.master, { kind: "doc", doc: "PRE_PEDIDO", title: d.title, body: d.body, reviewed: true })).rejects.toThrow(/revisou/);
    const n = await saveBrasLegal(ctx.db, ctx.actors.master, { kind: "doc", doc: "PRE_PEDIDO", title: d.title, body: `${d.body}\n10. Cláusula nova.`, reviewed: false });
    expect(n.docs.PRE_PEDIDO.version).toBe(2);
    const r = await saveBrasLegal(ctx.db, ctx.actors.master, { kind: "doc", doc: "PRE_PEDIDO", title: d.title, body: `${d.body}\n10. Cláusula nova.`, reviewed: true, reviewedBy: "Dra. Exemplo, OAB/SP 000000" });
    expect(r.docs.PRE_PEDIDO).toMatchObject({ status: "REVISADO", version: 2, reviewedBy: "Dra. Exemplo, OAB/SP 000000" });
    await saveBrasLegal(ctx.db, ctx.actors.master, { kind: "entity", entity: { ...DEFAULT_BRAS_LEGAL.entity, legalName: "NextLevel Marketing Ltda", simulated: false } });
    expect((await getBrasLegal(ctx.db)).entity).toMatchObject({ legalName: "NextLevel Marketing Ltda", simulated: false });
  });
});

describe("pauta de conteúdo", () => {
  it("Master cria, muda o status, apaga; dias de gravação contam as peças por formato", async () => {
    const imp = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX" })).id;
    await expect(saveBrasContent(ctx.db, ana, null, { title: "Garrafa", format: "SHORTS" })).rejects.toThrow();
    const a = await saveBrasContent(ctx.db, ctx.actors.master, null, { title: "Garrafa térmica 48 un.", format: "SHORTS", importerId: imp, recordDate: "2026-10-12", owner: "Mauricio" });
    await saveBrasContent(ctx.db, ctx.actors.master, null, { title: "Garrafa térmica 48 un.", format: "ANALISE", importerId: imp, recordDate: "2026-10-12" });
    await saveBrasContent(ctx.db, ctx.actors.master, null, { title: "Tour XDX", format: "TOUR", recordDate: "2026-10-12" });
    await saveBrasContent(ctx.db, ctx.actors.master, a.id, { title: "Garrafa térmica 48 un.", format: "SHORTS", status: "GRAVADO", importerId: imp, recordDate: "2026-10-12" });
    const all = await listBrasContent(ctx.db, ctx.actors.master);
    expect(all).toHaveLength(3);
    expect(all.find((x) => x.c.id === a.id)?.c.status).toBe("GRAVADO");
    const dias = brasRecordingDays(all.map((x) => x.c));
    expect(dias).toEqual([{ date: "2026-10-12", formats: { SHORTS: 1, ANALISE: 1, TOUR: 1 }, total: 3 }]);
    await deleteBrasContent(ctx.db, ctx.actors.master, a.id);
    expect(await listBrasContent(ctx.db, ctx.actors.master)).toHaveLength(2);
  });
});

describe("catálogo Master: planos da Brás e da NextLevel Cargas", () => {
  it("nascem em rascunho, com os preços aceitos, e não aparecem para lojas nem no público", async () => {
    const all = await listCatalog(ctx.db, { includeUnpublished: true, families: ["BRAS_MEMBER_PLAN"] });
    expect(all.map((p) => [p.key, p.status, p.prices.MONTHLY?.amountCents])).toEqual([["BRAS_PRATA", "DRAFT", 9700], ["BRAS_OURO", "DRAFT", 19700], ["BRAS_PLATINUM", "DRAFT", 39700]]);
    const pub = await listCatalog(ctx.db);
    expect(pub.some((p) => p.family.startsWith("BRAS_") || p.family === "CARRIER_PLAN" || p.family === "ADS")).toBe(false);
    const fee = await getCatalogItem(ctx.db, { key: "BRAS_COTACAO_FORA_CATALOGO" }, { includeUnpublished: true });
    expect(fee?.prices.ONE_TIME?.amountCents).toBe(150_000);
    const rows = await ctx.db.select({ key: catalogProducts.key, audience: catalogProducts.audience }).from(catalogProducts).where(eq(catalogProducts.family, "CARRIER_PLAN"));
    expect(rows.every((r) => r.audience.length === 1 && r.audience[0] === "CARRIER")).toBe(true);
  });
});
