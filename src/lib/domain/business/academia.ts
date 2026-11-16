import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { businessContas, businessContatos, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import type { Actor } from "../access";
import { linkWhatsapp } from "../agora-ecommerce";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { diaDeBrasilia, resumoDeVisitas } from "../visitas";

/**
 * NextLevel Business para academia, fase A1: captação (D306, D307).
 * A academia não cobra nem controla catraca aqui: isso fica no sistema que ela já tem. Aqui a pessoa pede a aula
 * experimental na página da academia (com a origem gravada), e a etapa de cada interessado vem dos fatos; a recepção só
 * confirma "veio", "não veio", "matriculou" ou "perdeu" com um toque. Uma academia nunca vê os interessados de outra.
 */

// ---------------------------------------------------------------- configuração da página
const texto = (max: number) => z.string().trim().max(max);
export const configAcademiaSchema = z.object({
  bairro: texto(60).default(""),
  cidade: texto(60).default(""),
  sobre: texto(600).default(""),
  modalidades: z.array(texto(40).min(1)).max(12).default([]),
  horarios: texto(200).default(""),
  /** Dias da semana em que a aula experimental pode ser marcada (0 = domingo). */
  diasExperimental: z.array(z.number().int().min(0).max(6)).max(7).default([1, 2, 3, 4, 5]),
  /** Texto do convite (ex.: "Sua primeira aula é por nossa conta"). */
  chamada: texto(120).default("Venha conhecer: a primeira aula é por nossa conta"),
  destaques: z.array(texto(80).min(1)).max(6).default([]),
});
export type ConfigAcademia = z.infer<typeof configAcademiaSchema>;
export const lerConfig = (v: unknown): ConfigAcademia => configAcademiaSchema.parse(v ?? {});

// ---------------------------------------------------------------- conta e acesso
export async function contaBusiness(db: Database, storeId: string) {
  return (await db.select().from(businessContas).where(eq(businessContas.storeId, storeId)).limit(1))[0] ?? null;
}

/** Liga uma loja-tenant como academia (cadastro e demonstração). Idempotente. */
export async function ativarAcademia(db: Database, storeId: string, config: Partial<ConfigAcademia> = {}) {
  const cfg = configAcademiaSchema.parse(config);
  await db.insert(businessContas).values({ storeId, segmento: "ACADEMIA", config: cfg }).onConflictDoNothing();
}

/** Garante que o ator é da equipe de uma academia e devolve o tenant. Só a própria academia vê os seus dados. */
async function academiaDo(db: Database, actor: Actor) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Esta área é do painel da academia.");
  const conta = await contaBusiness(db, actor.storeId);
  if (conta?.segmento !== "ACADEMIA") throw new ForbiddenError("Esta conta não é de academia.");
  return { storeId: actor.storeId, config: lerConfig(conta.config) };
}

export async function ehAcademia(db: Database, storeId: string | null | undefined): Promise<boolean> {
  return !!storeId && (await contaBusiness(db, storeId))?.segmento === "ACADEMIA";
}

export async function configDaAcademia(db: Database, actor: Actor) {
  const { storeId, config } = await academiaDo(db, actor);
  const loja = await db.query.stores.findFirst({ where: eq(stores.id, storeId), columns: { name: true, slug: true, whatsapp: true, instagram: true, address: true } });
  return { config, loja: loja! };
}

export async function salvarConfigAcademia(db: Database, actor: Actor, raw: unknown) {
  const { storeId, config: antes } = await academiaDo(db, actor);
  if (actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono da academia muda a página.");
  const config = configAcademiaSchema.parse(raw);
  await db.update(businessContas).set({ config, updatedAt: new Date().toISOString() }).where(eq(businessContas.storeId, storeId));
  await recordAudit(db, actor, { action: "academia.pagina", entityType: "business_conta", entityId: storeId, storeId, before: antes, after: config });
  return config;
}

// ---------------------------------------------------------------- página pública
export type PaginaAcademia = { storeId: string; slug: string; nome: string; logoUrl: string | null; whatsapp: string | null; instagram: string | null; endereco: string | null; config: ConfigAcademia };

export async function paginaDaAcademia(db: Database, slug: string): Promise<PaginaAcademia | null> {
  const [r] = await db.select({ s: stores, c: businessContas }).from(stores).innerJoin(businessContas, eq(businessContas.storeId, stores.id)).where(eq(stores.slug, slug)).limit(1);
  if (!r || r.c.segmento !== "ACADEMIA" || r.s.status === "CLOSED" || r.s.status === "SUSPENDED") return null;
  return { storeId: r.s.id, slug: r.s.slug, nome: r.s.name, logoUrl: r.s.logoUrl, whatsapp: r.s.whatsapp, instagram: r.s.instagram, endereco: r.s.address, config: lerConfig(r.c.config) };
}

/** Próximos dias em que a aula experimental pode ser marcada (até 14 dias, a partir de amanhã se hoje já passou das 20h). */
export function diasDisponiveis(config: ConfigAcademia, agora = new Date(), quantos = 14): string[] {
  const hoje = diaDeBrasilia(agora);
  const horaSP = new Date(agora.getTime() - 3 * 3_600_000).getUTCHours();
  const out: string[] = [];
  for (let i = horaSP >= 20 ? 1 : 0; out.length < quantos && i < 45; i++) {
    const d = new Date(`${hoje}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i);
    if (config.diasExperimental.includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const soDigitos = (t: string) => t.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
export const pedidoExperimentalSchema = z.object({
  nome: z.string().trim().min(2, "Escreva seu nome.").max(80),
  whatsapp: z.string().transform(soDigitos).refine((d) => d.length === 10 || d.length === 11, "Confira o WhatsApp com DDD."),
  email: z.string().trim().toLowerCase().email("Confira o e-mail.").max(120).optional().or(z.literal("").transform(() => undefined)),
  interesse: z.string().trim().max(40).optional(),
  turno: z.enum(["MANHA", "TARDE", "NOITE"]).optional(),
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  consentimento: z.boolean().default(false),
});
export type Origem = { origem: string; campanha?: string | null; indicacao?: string | null; aparelho?: string | null };

/**
 * Pedido de aula experimental vindo da página pública. A mesma pessoa (mesmo WhatsApp) com pedido em aberto nos
 * últimos 30 dias atualiza o pedido em vez de duplicar; a primeira origem fica (é ela que trouxe a pessoa).
 */
export async function pedirAulaExperimental(db: Database, slug: string, raw: unknown, origem: Origem, agora = new Date()) {
  const pagina = await paginaDaAcademia(db, slug);
  if (!pagina) throw new NotFoundError("Academia não encontrada.");
  const p = pedidoExperimentalSchema.parse(raw);
  if (p.dia && !diasDisponiveis(pagina.config, agora, 30).includes(p.dia)) throw new DomainError("DIA", "Escolha um dos dias disponíveis para a aula experimental.");
  const desde = new Date(agora.getTime() - 30 * 86_400_000).toISOString();
  const [aberto] = await db.select().from(businessContatos).where(and(eq(businessContatos.storeId, pagina.storeId), eq(businessContatos.whatsapp, p.whatsapp), isNull(businessContatos.matriculouEm), isNull(businessContatos.perdidoEm), gte(businessContatos.createdAt, desde))).orderBy(desc(businessContatos.createdAt)).limit(1);
  const dados = { nome: p.nome, email: p.email ?? null, interesse: p.interesse || null, turno: p.turno ?? null, experimentalDia: p.dia ?? null, consentimento: p.consentimento, updatedAt: agora.toISOString() };
  if (aberto) {
    // Remarcou pela página: limpa a resposta anterior de "veio/não veio" para a nova data.
    await db.update(businessContatos).set({ ...dados, email: dados.email ?? aberto.email, veioEm: null, naoVeioEm: null, indicacao: aberto.indicacao ?? origem.indicacao ?? null }).where(eq(businessContatos.id, aberto.id));
    return { id: aberto.id, novo: false };
  }
  const id = newId("bct");
  await db.insert(businessContatos).values({ id, storeId: pagina.storeId, whatsapp: p.whatsapp, ...dados, origem: origem.origem || "direto", campanha: origem.campanha?.slice(0, 60) || null, indicacao: origem.indicacao?.slice(0, 40) || null, aparelho: origem.aparelho ?? null, createdAt: agora.toISOString() });
  return { id, novo: true };
}

// ---------------------------------------------------------------- funil
export const ETAPAS_ACADEMIA = [
  { key: "interessado", rotulo: "Interessado", dica: "Deixou contato sem dia marcado" },
  { key: "marcada", rotulo: "Experimental marcada", dica: "Tem dia marcado para a aula experimental" },
  { key: "confirmar", rotulo: "Confirmar presença", dica: "O dia passou: diga se a pessoa veio" },
  { key: "veio", rotulo: "Veio na experimental", dica: "Fez a aula e ainda não matriculou" },
  { key: "nao_veio", rotulo: "Não veio", dica: "Faltou na aula experimental" },
  { key: "matriculou", rotulo: "Matriculou", dica: "Virou aluno" },
  { key: "perdido", rotulo: "Perdido", dica: "Desistiu" },
] as const;
export type EtapaAcademia = (typeof ETAPAS_ACADEMIA)[number]["key"];

type Linha = typeof businessContatos.$inferSelect;
export function etapaDe(c: Pick<Linha, "perdidoEm" | "matriculouEm" | "veioEm" | "naoVeioEm" | "experimentalDia">, agora = new Date()): EtapaAcademia {
  if (c.perdidoEm) return "perdido";
  if (c.matriculouEm) return "matriculou";
  if (c.veioEm) return "veio";
  if (c.naoVeioEm) return "nao_veio";
  if (c.experimentalDia) return c.experimentalDia >= diaDeBrasilia(agora) ? "marcada" : "confirmar";
  return "interessado";
}

const dataBR = (dia: string) => new Date(`${dia}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const MENSAGEM: Record<EtapaAcademia, (n: string, a: string, dia: string | null) => string> = {
  interessado: (n, a) => `Oi ${n}! Aqui é da ${a}. Vi que você quer conhecer a academia. Qual o melhor dia para a sua aula experimental?`,
  marcada: (n, a, dia) => `Oi ${n}! Aqui é da ${a}. Sua aula experimental está marcada${dia ? ` para ${dataBR(dia)}` : ""}. Te esperamos!`,
  confirmar: (n, a) => `Oi ${n}! Aqui é da ${a}. Como foi a sua aula experimental?`,
  veio: (n, a) => `Oi ${n}! Aqui é da ${a}. Gostou da aula? Posso te mostrar os planos para você começar?`,
  nao_veio: (n, a) => `Oi ${n}! Aqui é da ${a}. Sentimos sua falta na aula experimental. Quer remarcar para outro dia?`,
  matriculou: (n, a) => `Oi ${n}! Seja bem-vindo(a) à ${a}! Qualquer dúvida, é só chamar aqui.`,
  perdido: (n, a) => `Oi ${n}! Aqui é da ${a}. Ainda quer começar a treinar? Sua aula experimental continua garantida.`,
};

export type ContatoAcademia = Linha & { etapa: EtapaAcademia; whatsappHref: string | null };

export async function contatosDaAcademia(db: Database, actor: Actor, agora = new Date()): Promise<ContatoAcademia[]> {
  const { storeId } = await academiaDo(db, actor);
  const loja = await db.query.stores.findFirst({ where: eq(stores.id, storeId), columns: { name: true } });
  const linhas = await db.select().from(businessContatos).where(eq(businessContatos.storeId, storeId)).orderBy(desc(businessContatos.createdAt)).limit(2000);
  return linhas.map((c) => {
    const etapa = etapaDe(c, agora);
    return { ...c, etapa, whatsappHref: linkWhatsapp(c.whatsapp, MENSAGEM[etapa](c.nome.split(" ")[0] ?? c.nome, loja?.name ?? "academia", c.experimentalDia)) };
  });
}

export type Resultado = "veio" | "nao_veio" | "matriculou" | "perdeu" | "reabrir";

/** Um toque da recepção. Sempre filtrado pela academia do ator: id de outra academia vira "não encontrado". */
export async function registrarResultado(db: Database, actor: Actor, id: string, resultado: Resultado, extra: { motivo?: string; dia?: string } = {}, agora = new Date()) {
  const { storeId } = await academiaDo(db, actor);
  const [c] = await db.select().from(businessContatos).where(and(eq(businessContatos.id, id), eq(businessContatos.storeId, storeId))).limit(1);
  if (!c) throw new NotFoundError("Interessado não encontrado.");
  const em = agora.toISOString();
  const mudar: Partial<Linha> =
    resultado === "veio" ? { veioEm: em, naoVeioEm: null }
    : resultado === "nao_veio" ? { naoVeioEm: em, veioEm: null }
    : resultado === "matriculou" ? { matriculouEm: em, perdidoEm: null, motivoPerda: null }
    : resultado === "perdeu" ? { perdidoEm: em, motivoPerda: extra.motivo?.trim().slice(0, 120) || null }
    : { perdidoEm: null, motivoPerda: null, matriculouEm: null, veioEm: null, naoVeioEm: null, experimentalDia: extra.dia && /^\d{4}-\d{2}-\d{2}$/.test(extra.dia) ? extra.dia : null };
  await db.update(businessContatos).set({ ...mudar, updatedAt: em }).where(and(eq(businessContatos.id, id), eq(businessContatos.storeId, storeId)));
  await recordAudit(db, actor, { action: `academia.${resultado}`, entityType: "business_contato", entityId: id, storeId }, { force: true });
  return { etapa: etapaDe({ ...c, ...mudar }, agora) };
}

export async function salvarNotas(db: Database, actor: Actor, id: string, notas: string) {
  const { storeId } = await academiaDo(db, actor);
  const r = await db.update(businessContatos).set({ notas: notas.slice(0, 2000), updatedAt: new Date().toISOString() }).where(and(eq(businessContatos.id, id), eq(businessContatos.storeId, storeId))).returning({ id: businessContatos.id });
  if (!r.length) throw new NotFoundError("Interessado não encontrado.");
}

// ---------------------------------------------------------------- números
const NOME_ORIGEM: Record<string, string> = { instagram: "Instagram", whatsapp: "WhatsApp", google: "Google", facebook: "Facebook", tiktok: "TikTok", direto: "Direto ou não informado", panfleto: "Panfleto (QR code)", indicacao: "Indicação", youtube: "YouTube" };
export const nomeDaOrigem = (o: string) => NOME_ORIGEM[o] ?? o;

export async function resumoDaCaptacao(db: Database, actor: Actor, dias = 30, agora = new Date()) {
  const { storeId } = await academiaDo(db, actor);
  const todos = await contatosDaAcademia(db, actor, agora);
  const desde = new Date(agora.getTime() - dias * 86_400_000).toISOString();
  const doPeriodo = todos.filter((c) => c.createdAt >= desde);
  const porEtapa = Object.fromEntries(ETAPAS_ACADEMIA.map((e) => [e.key, todos.filter((c) => c.etapa === e.key).length])) as Record<EtapaAcademia, number>;
  const matriculas = todos.filter((c) => c.matriculouEm && c.matriculouEm >= desde).length;
  const fizeram = doPeriodo.filter((c) => c.veioEm || c.matriculouEm).length;
  const responderam = doPeriodo.filter((c) => c.veioEm || c.naoVeioEm || c.matriculouEm).length;
  const origens = new Map<string, { interessados: number; matriculas: number }>();
  for (const c of doPeriodo) {
    const o = origens.get(c.origem) ?? { interessados: 0, matriculas: 0 };
    o.interessados++; if (c.matriculouEm) o.matriculas++;
    origens.set(c.origem, o);
  }
  const visitas = await resumoDeVisitas(db, storeId, dias, agora);
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);
  return {
    dias,
    interessados: doPeriodo.length,
    matriculas,
    /** Interessados do período que viraram aluno. */
    conversao: pct(doPeriodo.filter((c) => c.matriculouEm).length, doPeriodo.length),
    /** Dos que tiveram presença respondida, quantos vieram. */
    comparecimento: pct(fizeram, responderam),
    paraConfirmar: porEtapa.confirmar,
    porEtapa,
    visitas: visitas.total,
    origens: [...origens.entries()].map(([origem, v]) => ({ origem, nome: nomeDaOrigem(origem), ...v })).sort((a, b) => b.interessados - a.interessados),
  };
}

// ---------------------------------------------------------------- links rastreados
/** Links prontos para cada canal: a origem chega gravada em cada interessado (utm_source). */
export function linksDaAcademia(baseUrl: string, slug: string) {
  const url = (fonte: string) => `${baseUrl.replace(/\/$/, "")}/academia/${slug}?utm_source=${fonte}`;
  return [
    { fonte: "instagram", rotulo: "Link da bio do Instagram", dica: "Cole no campo de site do perfil e nos stories com link.", url: url("instagram") },
    { fonte: "whatsapp", rotulo: "WhatsApp (status e grupos)", dica: "Mande para os contatos e use no status.", url: url("whatsapp") },
    { fonte: "google", rotulo: "Perfil no Google (Maps)", dica: "Cole no campo de site do seu Perfil da Empresa no Google.", url: url("google") },
    { fonte: "panfleto", rotulo: "Panfleto e cartaz (QR code)", dica: "Gere um QR code com este link para o material impresso.", url: url("panfleto") },
  ];
}
