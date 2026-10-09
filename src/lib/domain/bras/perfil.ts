import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdMembers, platformSettings } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { BRAS_LEVELS, BRAS_PROFILE_QUESTIONS, type BrasClientLevel } from "@/lib/bras/perfil-perguntas";
export { BRAS_LEVELS, BRAS_LEVEL_HINT, BRAS_LEVEL_LABEL, BRAS_MOMENT_LABEL, BRAS_PROFILE_QUESTIONS, type BrasClientLevel } from "@/lib/bras/perfil-perguntas";

/**
 * Classificação do cliente da Brás (D108). Separa quem está começando e quer testar um produto de quem compra
 * contêiner. Três fontes, nessa ordem de força:
 * 1. ajuste manual do Master (com motivo, auditado);
 * 2. o maior entre o nível DECLARADO (perguntas do cadastro, com pontos e cortes editáveis no Master)
 *    e o nível COMPROVADO (compras pagas no período);
 * O momento da jornada (novo, aguardando, primeira compra, recorrente, esfriando) vem do comportamento real.
 * O painel do membro usa os dois para escolher o que mostrar primeiro (`brasPanelPlan`).
 */
const rank = (l: BrasClientLevel) => BRAS_LEVELS.indexOf(l);
const maxLevel = (...ls: BrasClientLevel[]) => ls.reduce((a, b) => (rank(b) > rank(a) ? b : a), "INICIANTE" as BrasClientLevel);

type Q = (typeof BRAS_PROFILE_QUESTIONS)[number];
type OptKey<K extends Q["key"]> = Extract<Q, { key: K }>["options"][number]["key"];
const opts = <K extends Q["key"]>(k: K) => BRAS_PROFILE_QUESTIONS.find((q) => q.key === k)!.options.map((o) => o.key) as [OptKey<K>, ...OptKey<K>[]];

export const brasProfileSchema = z.object({
  stage: z.enum(opts("stage"), { message: "Conte em que momento está o seu negócio." }),
  channels: z.array(z.enum(opts("channels"))).min(1, "Marque onde você vende (ou \"Ainda não vendo\").").max(7),
  monthlyPurchase: z.enum(opts("monthlyPurchase"), { message: "Escolha quanto pretende comprar por mês." }),
  revenue: z.enum(opts("revenue"), { message: "Escolha a faixa de faturamento." }),
  importExperience: z.enum(opts("importExperience"), { message: "Escolha a sua experiência com importação." }),
  team: z.enum(opts("team"), { message: "Escolha o tamanho da equipe." }),
  goals: z.array(z.enum(opts("goals"))).min(1, "Marque pelo menos um objetivo.").max(6),
}).transform((p) => ({ ...p, channels: [...new Set(p.channels)], goals: [...new Set(p.goals)] }));
export type BrasProfile = z.output<typeof brasProfileSchema>;
export type BrasProfileInput = z.input<typeof brasProfileSchema>;
export type BrasGoal = BrasProfile["goals"][number];

// ---------------------------------------------------------------------------
// Pontos e cortes (Master)
// ---------------------------------------------------------------------------
const pts = z.number().int().min(0).max(50);
const levelEnum = z.enum(BRAS_LEVELS);
export const brasClassificationSchema = z.object({
  points: z.object({
    stage: z.record(z.string(), pts), monthlyPurchase: z.record(z.string(), pts), revenue: z.record(z.string(), pts),
    importExperience: z.record(z.string(), pts), team: z.record(z.string(), pts),
    /** Pontos por canal marcado, com teto (vender em vários canais indica operação maior, até um limite). */
    channels: z.record(z.string(), pts), channelsCap: pts,
  }),
  /** Pontuação mínima de cada nível acima do Iniciante. */
  thresholds: z.object({ CRESCIMENTO: pts.max(200), PROFISSIONAL: pts.max(200), GRANDE: pts.max(200) }),
  /** Respostas que, sozinhas, já garantem um nível mínimo (ex.: compra acima de R$ 500 mil por mês = grande conta). */
  floors: z.object({ monthlyPurchase: z.record(z.string(), levelEnum), importExperience: z.record(z.string(), levelEnum) }),
  /** Nível comprovado: compras pagas na janela. */
  behavior: z.object({ windowDays: z.number().int().min(30).max(365), CRESCIMENTO: z.number().int().min(0), PROFISSIONAL: z.number().int().min(0), GRANDE: z.number().int().min(0) }),
  /** Dias sem visita (depois de já ter comprado) para o membro contar como "esfriando". */
  coolingDays: z.number().int().min(7).max(180),
}).refine((c) => c.thresholds.CRESCIMENTO < c.thresholds.PROFISSIONAL && c.thresholds.PROFISSIONAL < c.thresholds.GRANDE, { message: "Os cortes precisam subir: Crescimento < Profissional < Grande conta." })
  .refine((c) => c.behavior.CRESCIMENTO < c.behavior.PROFISSIONAL && c.behavior.PROFISSIONAL < c.behavior.GRANDE, { message: "Os valores de compra precisam subir: Crescimento < Profissional < Grande conta." });
export type BrasClassification = z.infer<typeof brasClassificationSchema>;

export const DEFAULT_BRAS_CLASSIFICATION: BrasClassification = {
  points: {
    stage: { comecando: 0, vendendo: 2, crescendo: 4, estruturado: 6 },
    monthlyPurchase: { ate5k: 0, "5a20k": 2, "20a100k": 4, "100a500k": 7, acima500k: 10 },
    revenue: { ate20k: 0, "20a100k": 2, "100a500k": 4, "500ka2m": 6, acima2m: 8 },
    importExperience: { nunca: 0, caixa: 1, participou: 3, container: 5 },
    team: { so_eu: 0, "2a5": 1, "6a20": 3, mais20: 4 },
    channels: { mercado_livre: 1, shopee: 1, amazon: 1, loja_online: 1, loja_fisica: 1, atacado: 2, ainda_nao: 0 },
    channelsCap: 4,
  },
  thresholds: { CRESCIMENTO: 8, PROFISSIONAL: 17, GRANDE: 27 },
  floors: { monthlyPurchase: { "100a500k": "PROFISSIONAL", acima500k: "GRANDE" }, importExperience: { container: "PROFISSIONAL" } },
  behavior: { windowDays: 90, CRESCIMENTO: 500_000, PROFISSIONAL: 3_000_000, GRANDE: 15_000_000 },
  coolingDays: 30,
};
/** Pontuação máxima possível com os pontos atuais (para mostrar "18 de 37"). */
export function brasMaxScore(c: BrasClassification) {
  const top = (r: Record<string, number>) => Math.max(0, ...Object.values(r));
  return top(c.points.stage) + top(c.points.monthlyPurchase) + top(c.points.revenue) + top(c.points.importExperience) + top(c.points.team) + c.points.channelsCap;
}

const KEY = "bras.classification";
export async function getBrasClassification(db: Database): Promise<BrasClassification> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const parsed = brasClassificationSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_BRAS_CLASSIFICATION;
}
export async function saveBrasClassification(db: Database, actor: Actor, raw: unknown) {
  requireMaster(actor);
  const value = brasClassificationSchema.parse(raw);
  const before = await getBrasClassification(db);
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "BRAS_CLASSIFICATION_SAVED", entityType: "platform_settings", entityId: KEY, before, after: value }, { force: true });
  return value;
}

// ---------------------------------------------------------------------------
// Cálculo (puro)
// ---------------------------------------------------------------------------
export function brasProfileScore(p: BrasProfile, c: BrasClassification): { score: number; level: BrasClientLevel } {
  const pt = c.points;
  const chan = Math.min(pt.channelsCap, p.channels.reduce((s, k) => s + (pt.channels[k] ?? 0), 0));
  const score = (pt.stage[p.stage] ?? 0) + (pt.monthlyPurchase[p.monthlyPurchase] ?? 0) + (pt.revenue[p.revenue] ?? 0) + (pt.importExperience[p.importExperience] ?? 0) + (pt.team[p.team] ?? 0) + chan;
  const byScore: BrasClientLevel = score >= c.thresholds.GRANDE ? "GRANDE" : score >= c.thresholds.PROFISSIONAL ? "PROFISSIONAL" : score >= c.thresholds.CRESCIMENTO ? "CRESCIMENTO" : "INICIANTE";
  const level = maxLevel(byScore, c.floors.monthlyPurchase[p.monthlyPurchase] ?? "INICIANTE", c.floors.importExperience[p.importExperience] ?? "INICIANTE");
  return { score, level };
}

export function brasBehaviorLevel(paidWindowCents: number, c: BrasClassification): BrasClientLevel {
  const b = c.behavior;
  return paidWindowCents >= b.GRANDE ? "GRANDE" : paidWindowCents >= b.PROFISSIONAL ? "PROFISSIONAL" : paidWindowCents >= b.CRESCIMENTO ? "CRESCIMENTO" : "INICIANTE";
}

export type BrasLevelSource = "AJUSTE" | "DECLARADO" | "COMPROVADO" | "SEM_PERFIL";
/** Nível final e de onde ele vem (o Master vê os três). */
export function brasClientLevel(m: { declaredLevel: string | null; levelOverride: string | null }, paidWindowCents: number, c: BrasClassification): { level: BrasClientLevel; source: BrasLevelSource; declared: BrasClientLevel | null; proven: BrasClientLevel } {
  const declared = (BRAS_LEVELS as readonly string[]).includes(m.declaredLevel ?? "") ? (m.declaredLevel as BrasClientLevel) : null;
  const proven = brasBehaviorLevel(paidWindowCents, c);
  if (m.levelOverride && (BRAS_LEVELS as readonly string[]).includes(m.levelOverride)) return { level: m.levelOverride as BrasClientLevel, source: "AJUSTE", declared, proven };
  if (!declared) return { level: proven, source: proven === "INICIANTE" ? "SEM_PERFIL" : "COMPROVADO", declared, proven };
  return rank(proven) > rank(declared) ? { level: proven, source: "COMPROVADO", declared, proven } : { level: declared, source: "DECLARADO", declared, proven };
}

import { BRAS_MOMENTS, type BrasMoment } from "@/lib/bras/perfil-perguntas";
export { BRAS_MOMENTS, type BrasMoment };

/** Momento da jornada a partir do comportamento (pedidos e visitas). */
export function brasJourneyMoment(a: { requests: number; paidRequests: number; paidInWindow: number; openUnpaid: number; lastPaidAt: string | null; lastSeenAt: string | null }, c: Pick<BrasClassification, "coolingDays">, now = new Date()): BrasMoment {
  const dias = (iso: string | null) => (iso ? (now.getTime() - new Date(iso).getTime()) / 86_400_000 : Infinity);
  if (a.paidRequests > 0 && dias(a.lastPaidAt) > c.coolingDays * 2 && dias(a.lastSeenAt) > c.coolingDays) return "ESFRIANDO";
  if (a.paidInWindow >= 2) return "RECORRENTE";
  if (a.openUnpaid > 0 && a.paidRequests === 0) return "AGUARDANDO";
  if (a.paidRequests > 0) return a.paidRequests >= 2 ? "RECORRENTE" : "PRIMEIRA_COMPRA";
  return a.requests > 0 ? "AGUARDANDO" : "NOVO";
}

// ---------------------------------------------------------------------------
// Painel por nível e momento (o que aparece primeiro no Meu Brás)
// ---------------------------------------------------------------------------
export type BrasPanelCard = { id: string; title: string; text: string; href: string; cta: string; soon?: boolean };
const CARDS: Record<string, BrasPanelCard> = {
  perfil: { id: "perfil", title: "Conte sobre a sua empresa", text: "Sete perguntas rápidas. Com elas o seu painel mostra primeiro o que faz sentido para o seu tamanho e o seu momento.", href: "/meu-bras/perfil", cta: "Responder em 1 minuto" },
  primeira_caixa: { id: "primeira_caixa", title: "Comece com uma caixa", text: "Escolha uma descoberta, leia o veredito, veja quantas unidades vêm na caixa e peça só uma para testar.", href: "/meu-bras/videos", cta: "Ver descobertas" },
  aguardando: { id: "aguardando", title: "Seu pedido está com a equipe", text: "A Brás Digital confirma o pedido e o pagamento com você. Acompanhe cada etapa em Meus pedidos.", href: "/meu-bras/pedidos", cta: "Acompanhar pedido" },
  repetir: { id: "repetir", title: "Repita o que deu certo", text: "Veja seus pedidos pagos e peça de novo a caixa que girou, antes que acabe na importadora.", href: "/meu-bras/pedidos", cta: "Ver meus pedidos" },
  voltar: { id: "voltar", title: "Chegou coisa nova desde a sua última compra", text: "As descobertas da semana já estão no catálogo, com veredito e preço da caixa.", href: "/meu-bras/videos", cta: "Ver o que chegou" },
  analise: { id: "analise", title: "Análises da semana", text: "Tendência, concorrência, preço praticado e riscos de cada descoberta, para escolher o produto com dado e não no escuro.", href: "/meu-bras/videos", cta: "Abrir análises" },
  aprender: { id: "aprender", title: "Como comprar por caixa sem erro", text: "Respostas diretas sobre caixa fechada, retirada, transportadora e pagamento.", href: "/meu-bras/suporte#faq", cta: "Ler as respostas" },
  frete: { id: "frete", title: "Retirada pela sua transportadora", text: "Cada pedido pago tem um comprovante com o código e o endereço. Mande para a transportadora e pronto.", href: "/meu-bras/pedidos", cta: "Ver comprovantes" },
  volume: { id: "volume", title: "Contêiner fechado e dividido", text: "Cotação de contêiner com as importadoras parceiras e cotas de contêiner dividido. Em preparação: fale com a equipe para entrar na primeira rodada.", href: "/meu-bras/suporte", cta: "Falar com a equipe", soon: true },
  alto_mar: { id: "alto_mar", title: "Comprar antes de chegar", text: "Pré-pedido de produtos em alto mar, com sinal e previsão de chegada. Em preparação, para o plano Platinum.", href: "/meu-bras/suporte", cta: "Quero saber primeiro", soon: true },
  agenda: { id: "agenda", title: "Visita guiada na importadora", text: "Agende um horário pessoal no showroom, com alguém da equipe para mostrar o que está saindo.", href: "/meu-bras/suporte#agenda", cta: "Agendar visita" },
  dedicado: { id: "dedicado", title: "Atendimento de grande conta", text: "Pelo volume que você informou, a equipe acompanha a sua conta de perto: condições de volume, contêiner e prioridade.", href: "/meu-bras/suporte", cta: "Falar com a equipe" },
};

/** Ordem de prioridade por nível, momento e objetivos. Devolve até 3 cartões, sem repetir. Puro e testado. */
export function brasPanelPlan(i: { hasProfile: boolean; level: BrasClientLevel; moment: BrasMoment; goals: readonly string[]; channels: readonly string[] }): { cards: BrasPanelCard[]; headline: string } {
  const out: string[] = [];
  const add = (...ids: string[]) => { for (const id of ids) if (!out.includes(id)) out.push(id); };
  if (!i.hasProfile) add("perfil");
  if (i.moment === "AGUARDANDO") add("aguardando");
  if (i.moment === "ESFRIANDO") add("voltar");
  if (i.level === "GRANDE") add("dedicado");
  if (i.moment === "NOVO" && (i.level === "INICIANTE" || i.level === "CRESCIMENTO")) add("primeira_caixa");
  if (i.moment === "RECORRENTE" || i.moment === "PRIMEIRA_COMPRA") add("repetir");
  if (i.goals.includes("volume") || i.level === "PROFISSIONAL" || i.level === "GRANDE") add("volume");
  if (i.goals.includes("alto_mar")) add("alto_mar");
  if (i.level === "GRANDE" || i.level === "PROFISSIONAL") add("agenda");
  if (i.goals.includes("produto") || i.goals.includes("preco")) add("analise");
  if (i.goals.includes("aprender") || i.level === "INICIANTE") add("aprender");
  if (i.goals.includes("frete")) add("frete");
  add("analise", "aprender");
  const headline = i.level === "GRANDE" ? "Sua conta tem atendimento de perto." : i.level === "PROFISSIONAL" ? "Volume, preço e prazo: o que importa para quem compra todo mês." : i.level === "CRESCIMENTO" ? "Produto certo com frequência: é isso que faz o negócio crescer." : "Primeiro passo seguro: uma caixa, com análise.";
  return { cards: out.slice(0, 3).map((id) => CARDS[id]!), headline };
}

// ---------------------------------------------------------------------------
// Gravação (membro responde; Master ajusta)
// ---------------------------------------------------------------------------
/** Calcula e grava o perfil do membro. Usado no cadastro (sem ator) e na edição pelo próprio membro. */
export async function saveBrasProfileFor(db: Database, memberId: string, raw: BrasProfileInput, now = new Date()) {
  const profile = brasProfileSchema.parse(raw);
  const c = await getBrasClassification(db);
  const { score, level } = brasProfileScore(profile, c);
  await db.update(bdMembers).set({ profile, profileScore: score, declaredLevel: level, profileAnsweredAt: now.toISOString() }).where(eq(bdMembers.id, memberId));
  return { score, level, profile };
}

export async function saveMyBrasProfile(db: Database, actor: Actor, raw: BrasProfileInput) {
  if (actor.role !== "BRAS_MEMBER") throw new ForbiddenError("Só o membro responde o próprio perfil.");
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, actor.userId) });
  if (!m) throw new NotFoundError("Cadastro de membro não encontrado.");
  const r = await saveBrasProfileFor(db, m.id, raw);
  await recordAudit(db, actor, { action: "BRAS_PROFILE_SAVED", entityType: "bd_member", entityId: m.id, before: { declaredLevel: m.declaredLevel, score: m.profileScore }, after: { declaredLevel: r.level, score: r.score } });
  return { level: r.level, score: r.score };
}

/** Ajuste manual do nível pelo Master (null volta ao automático). Motivo obrigatório ao ajustar. */
export async function setBrasLevelOverride(db: Database, actor: Actor, memberId: string, level: BrasClientLevel | null, reason?: string) {
  requireMaster(actor);
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.id, memberId) });
  if (!m) throw new NotFoundError("Membro não encontrado.");
  if (level !== null && !BRAS_LEVELS.includes(level)) throw new DomainError("LEVEL", "Nível desconhecido.");
  const motivo = reason?.trim().slice(0, 200) || null;
  if (level && !motivo) throw new DomainError("REASON", "Informe o motivo do ajuste (ex.: \"compra contêiner fora da plataforma\").");
  await db.update(bdMembers).set({ levelOverride: level, levelOverrideReason: level ? motivo : null }).where(eq(bdMembers.id, memberId));
  await recordAudit(db, actor, { action: "BRAS_LEVEL_OVERRIDE", entityType: "bd_member", entityId: memberId, before: { levelOverride: m.levelOverride }, after: { levelOverride: level, reason: motivo } }, { force: true });
  return { ok: true as const };
}

/** Rótulo legível de uma resposta (para o Master ler o perfil). */
export function brasProfileLabels(p: Record<string, string | string[]> | BrasProfile | null | undefined): { question: string; answer: string }[] {
  if (!p) return [];
  return BRAS_PROFILE_QUESTIONS.map((q) => {
    const v = (p as Record<string, string | string[]>)[q.key];
    const keys = Array.isArray(v) ? v : [v];
    return { question: q.label, answer: keys.map((k) => q.options.find((o) => o.key === k)?.label ?? k).join(", ") };
  });
}
