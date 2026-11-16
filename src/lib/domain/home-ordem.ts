import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { requireMasterFn, type Actor } from "./access";
import { recordAudit } from "./audit";

/**
 * Ordem da home da NextLevel Commerce (D290, auditoria do dono de 13/11/2026): o dono organiza o racional da página de
 * vendas pelo Master, sem código. O topo (oferta) e a chamada final ficam fixos; os blocos do meio mudam de lugar e
 * podem ser escondidos. Sem configuração salva, a home segue a ordem que estava no ar (`ORDEM_NO_AR`).
 */
export const BLOCOS_HOME = {
  "duelo-black": { nome: "Duelo da Black", papel: "Urgência: quanto a Black deixa no bolso no 1º ano (só aparece com a Black ligada)." },
  "taxa-zero": { nome: "Faixa taxa zero", papel: "Diferencial: a taxa da plataforma é zero no checkout do Mercado Pago." },
  placar: { nome: "Placar contra os concorrentes", papel: "Prova lúdica: cada vantagem vira um gol, plano a plano." },
  "por-que": { nome: "Por que a NextLevel", papel: "Os 4 motivos: taxa zero, custo total, pedidos sem limite, equipe perto." },
  atacado: { nome: "Feita para o atacado", papel: "Para quem é: grade, preço por quantidade, pedido mínimo." },
  vivencia: { nome: "Vivência de rua", papel: "Confiança: a equipe está no Brás e no Canindé." },
  planos: { nome: "Planos", papel: "Decisão: preço, simulador e o que cada plano entrega." },
  comparativo: { nome: "Comparativo", papel: "Prova racional: custo total contra Nuvemshop, Tray, Shopify e outras." },
  lojas: { nome: "Lojas de exemplo", papel: "Prova visual: lojas montadas na plataforma." },
  temas: { nome: "Temas", papel: "Desejo: como a loja vai ficar." },
  equipe: { nome: "Equipe", papel: "Confiança: gente de verdade e ajuda para começar." },
  duvidas: { nome: "Perguntas frequentes", papel: "Objeções: o que falta para decidir." },
} as const;
export type BlocoHome = keyof typeof BLOCOS_HOME;
export const CHAVES_HOME = Object.keys(BLOCOS_HOME) as BlocoHome[];

/** A ordem que estava no ar em 13/11/2026 (nada muda sozinho). */
export const ORDEM_NO_AR: BlocoHome[] = ["duelo-black", "taxa-zero", "placar", "por-que", "atacado", "vivencia", "planos", "comparativo", "lojas", "temas", "equipe", "duvidas"];

/**
 * Ordem recomendada na auditoria (docs/auditoria-dono/2026-11-13-auditoria.md): uma pergunta por bloco, na ordem em que o
 * visitante se pergunta. 1) é para mim? (atacado) 2) por que vocês? (motivos) 3) prove (comparativo) 4) como fica?
 * (lojas, temas) 5) quanto custa? (planos, com a Black logo antes) 6) posso confiar? (equipe, rua) 7) e se…? (dúvidas).
 * A faixa taxa zero e o placar repetem o "por que" e o comparativo: ficam escondidos.
 */
export const ORDEM_RECOMENDADA: { key: BlocoHome; visivel: boolean }[] = [
  { key: "atacado", visivel: true }, { key: "por-que", visivel: true }, { key: "comparativo", visivel: true },
  { key: "lojas", visivel: true }, { key: "temas", visivel: true }, { key: "duelo-black", visivel: true },
  { key: "planos", visivel: true }, { key: "equipe", visivel: true }, { key: "vivencia", visivel: true },
  { key: "duvidas", visivel: true }, { key: "taxa-zero", visivel: false }, { key: "placar", visivel: false },
];

const CHAVE = "ecommerce.home-ordem";
const itemSchema = z.object({ key: z.enum(CHAVES_HOME as [BlocoHome, ...BlocoHome[]]), visivel: z.boolean() });
export const ordemHomeSchema = z.object({ ordem: z.array(itemSchema).max(40) });
export type OrdemHome = { key: BlocoHome; visivel: boolean }[];

/** Sem repetidos e com todos os blocos: o que faltar entra no fim, visível (bloco novo no código nunca some calado). */
export function normalizarOrdem(itens: { key: BlocoHome; visivel: boolean }[]): OrdemHome {
  const vistos = new Set<BlocoHome>();
  const out: OrdemHome = [];
  for (const i of itens) if (!vistos.has(i.key)) { vistos.add(i.key); out.push({ key: i.key, visivel: i.visivel }); }
  for (const k of CHAVES_HOME) if (!vistos.has(k)) out.push({ key: k, visivel: true });
  return out;
}

export async function lerOrdemHome(db: Database): Promise<OrdemHome> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, CHAVE) });
  const p = ordemHomeSchema.safeParse(row?.value);
  return normalizarOrdem(p.success ? p.data.ordem : ORDEM_NO_AR.map((key) => ({ key, visivel: true })));
}

export async function salvarOrdemHome(db: Database, actor: Actor, raw: unknown): Promise<OrdemHome> {
  requireMasterFn(actor, ["COMERCIAL"]);
  const ordem = normalizarOrdem(ordemHomeSchema.parse(raw).ordem);
  if (!ordem.some((i) => i.visivel && i.key === "planos")) throw new z.ZodError([{ code: "custom", path: ["ordem"], message: "Os planos não podem sair da home: é onde o visitante decide." }]);
  const before = await lerOrdemHome(db);
  const value = { ordem };
  await db.insert(platformSettings).values({ key: CHAVE, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "ECOMMERCE_HOME_ORDEM", entityType: "platform_setting", entityId: CHAVE, before: { ordem: before } as Record<string, unknown>, after: value as Record<string, unknown> });
  return ordem;
}
