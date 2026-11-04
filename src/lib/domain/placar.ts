import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { DEGRAUS_PLACAR, SUMULA_PADRAO, type DegrauPlacar, type ItemSumula, type Sumula } from "@/lib/marcas/placar-seed";
import { type Actor, requireMasterFn } from "./access";
import { recordAudit } from "./audit";

/**
 * Placar da goleada, "O Clássico do E-commerce" (D230). O placar é CALCULADO a partir da súmula (ninguém digita o
 * resultado). Regras de honestidade:
 *  - valor vazio = "não divulga": o lance não vale gol para ninguém;
 *  - só vai ao ar o jogo que é vitória da NextLevel; se uma mudança da súmula virar o jogo, ele sai do ar e o Master é avisado;
 *  - "Seleção dos concorrentes": o gol conta contra o MELHOR do grupo em cada item; o texto do lance mostra o ponto mais
 *    fraco de um concorrente, sempre com o nome dele.
 */
export const CHAVE_SUMULA = "placar.sumula";
const ROTULOS: Record<string, Record<string, string>> = {
  suporte: { "1": "e-mail", "2": "chat ou WhatsApp", "3": "prioritário", "4": "telefone e gerente" },
  migracao: { "0": "paga à parte", "1": "com desconto", "2": "inclusa" },
};

/** Texto da súmula → número comparável (null = não divulga). */
export function valorSumula(raw: string | undefined): number | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return null;
  if (["sem limite", "ilimitado", "ilimitada", "∞"].includes(v)) return Number.POSITIVE_INFINITY;
  if (["sim", "s", "tem"].includes(v)) return 1;
  if (["não", "nao", "n", "não tem", "nao tem"].includes(v)) return 0;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Texto para mostrar no lance. */
export function textoSumula(item: Pick<ItemSumula, "key" | "unidade">, raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "não divulga";
  const rot = ROTULOS[item.key]?.[v];
  if (rot) return rot;
  const n = valorSumula(v);
  if (n === Number.POSITIVE_INFINITY) return "sem limite";
  if (n === 1 && /^s/i.test(v)) return "sim";
  if (n === 0 && /^n/i.test(v)) return "não";
  return item.unidade ? `${v}${item.unidade}` : v;
}

export type Quem = "nextlevel" | "rival" | "empate" | "nd";
export type Lance = { key: string; minuto: number; lance: string; quem: Quem; nosso: string; deles: string; rival: string };
export type Jogo = { rival: string; rivalKey: string; plano: string; degrau: DegrauPlacar; nextlevel: number; adversario: number; lances: Lance[]; vitoria: boolean; goleada: boolean };

const comparar = (regra: ItemSumula["regra"], nl: number | null, r: number | null): Quem => {
  if (nl === null || r === null) return "nd";
  if (nl === r) return "empate";
  return (regra === "maior" ? nl > r : nl < r) ? "nextlevel" : "rival";
};
const fechar = (rival: string, rivalKey: string, plano: string, degrau: DegrauPlacar, lances: Lance[]): Jogo => {
  const nextlevel = lances.filter((l) => l.quem === "nextlevel").length, adversario = lances.filter((l) => l.quem === "rival").length;
  return { rival, rivalKey, plano, degrau, nextlevel, adversario, lances: [...lances].sort((a, b) => a.minuto - b.minuto), vitoria: nextlevel > adversario, goleada: nextlevel - adversario >= 3 };
};

/** NextLevel × um concorrente, num plano. */
export function jogo(s: Sumula, rivalKey: string, degrau: DegrauPlacar): Jogo {
  const r = s.rivais.find((x) => x.key === rivalKey);
  if (!r) throw new Error(`Rival desconhecido: ${rivalKey}`);
  const lances = s.itens.map((i) => {
    const nosso = i.nextlevel[degrau], deles = i.rivais[rivalKey]?.[degrau];
    return { key: i.key, minuto: i.minuto, lance: i.lance, quem: comparar(i.regra, valorSumula(nosso), valorSumula(deles)), nosso: textoSumula(i, nosso), deles: textoSumula(i, deles), rival: r.nome };
  });
  return fechar(r.nome, r.key, r.planos[degrau], degrau, lances);
}

/** NextLevel × Seleção dos concorrentes: o gol conta contra o melhor do grupo; o texto mostra o mais fraco, com o nome. */
export function selecao(s: Sumula, degrau: DegrauPlacar): Jogo {
  const lances = s.itens.map((i) => {
    const nosso = i.nextlevel[degrau];
    const conhecidos = s.rivais.map((r) => ({ r, raw: i.rivais[r.key]?.[degrau], v: valorSumula(i.rivais[r.key]?.[degrau]) })).filter((x) => x.v !== null);
    if (!conhecidos.length) return { key: i.key, minuto: i.minuto, lance: i.lance, quem: "nd" as Quem, nosso: textoSumula(i, nosso), deles: "não divulgam", rival: "Seleção" };
    const ord = [...conhecidos].sort((a, b) => (i.regra === "maior" ? b.v! - a.v! : a.v! - b.v!));
    const melhor = ord[0]!, pior = ord[ord.length - 1]!;
    const quem = comparar(i.regra, valorSumula(nosso), melhor.v);
    // Gol nosso: mostra o ponto mais fraco de um deles (com o nome). Gol deles ou empate: mostra quem de fato empatou ou venceu.
    const ref = quem === "nextlevel" ? pior : melhor;
    return { key: i.key, minuto: i.minuto, lance: i.lance, quem, nosso: textoSumula(i, nosso), deles: textoSumula(i, ref.raw), rival: ref.r.nome };
  });
  return fechar("Seleção dos concorrentes", "selecao", "planos equivalentes", degrau, lances);
}

/** Todos os jogos (por plano) e quais podem ir ao ar (só vitórias). */
export function rodada(s: Sumula) {
  const jogos = DEGRAUS_PLACAR.flatMap((d) => [selecao(s, d), ...s.rivais.map((r) => jogo(s, r.key, d))]);
  return { jogos, noAr: jogos.filter((j) => j.vitoria), foraDoAr: jogos.filter((j) => !j.vitoria) };
}

const tres = z.object({ entrada: z.string().max(40), intermediario: z.string().max(40), avancado: z.string().max(40) });
export const sumulaSchema = z.object({
  atualizadoEm: z.string(),
  rivais: z.array(z.object({ key: z.string().min(1), nome: z.string().min(1).max(40), planos: tres, fonte: z.string().url() })).min(1).max(8),
  itens: z.array(z.object({ key: z.string().min(1), lance: z.string().min(3).max(120), minuto: z.number().int().min(1).max(90), regra: z.enum(["maior", "menor"]), unidade: z.string().max(6).optional(), nextlevel: tres, rivais: z.record(z.string(), tres) })).min(1).max(20),
});

/** Súmula salva antes de um rival ou lance novo do padrão (ex.: Shopify, D233): entra com os valores do padrão. */
export function completarSumula(s: Sumula): Sumula {
  const rivais = [...s.rivais, ...SUMULA_PADRAO.rivais.filter((r) => !s.rivais.some((x) => x.key === r.key))];
  const itens = s.itens.map((i) => {
    const pad = SUMULA_PADRAO.itens.find((x) => x.key === i.key);
    const faltam = pad ? Object.fromEntries(Object.entries(pad.rivais).filter(([k]) => !i.rivais[k])) : {};
    return { ...i, rivais: { ...faltam, ...i.rivais } };
  });
  for (const pad of SUMULA_PADRAO.itens) if (!itens.some((i) => i.key === pad.key)) itens.push(pad);
  return { ...s, rivais, itens };
}

export async function sumulaAtual(db: Database): Promise<Sumula> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, CHAVE_SUMULA) });
  const p = sumulaSchema.safeParse(row?.value);
  const s = p.success ? completarSumula(p.data) : SUMULA_PADRAO;
  // D247: os números da NextLevel (produtos, pessoas, IA, tema pago) vêm da tabela única de benefícios: o placar mostra o que vale de verdade.
  const { beneficiosPorPlano } = await import("./beneficios-plano");
  return comBeneficios(s, await beneficiosPorPlano(db));
}

/** Aplica a tabela de benefícios aos valores da NextLevel na súmula (puro). */
export function comBeneficios(s: Sumula, b: Record<"COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE", { produtos: number | null; pessoas: number; ia: number; temaPago: boolean }>): Sumula {
  const d = { entrada: b.COMMERCE_START, intermediario: b.COMMERCE_PRO, avancado: b.COMMERCE_SCALE };
  const v = (f: (x: (typeof d)["entrada"]) => string) => ({ entrada: f(d.entrada), intermediario: f(d.intermediario), avancado: f(d.avancado) });
  const valores: Record<string, ReturnType<typeof v>> = {
    produtos: v((x) => (x.produtos === null ? "sem limite" : String(x.produtos))),
    pessoas: v((x) => String(x.pessoas)),
    ia: v((x) => String(x.ia)),
    tema: v((x) => (x.temaPago ? "sim" : "não")),
  };
  return { ...s, itens: s.itens.map((i) => (valores[i.key] ? { ...i, nextlevel: valores[i.key]! } : i)) };
}

/** O dono atualiza a súmula à mão; o placar se recalcula. Devolve os jogos que deixaram de ser vitória (saem do ar). */
export async function salvarSumula(db: Database, actor: Actor, raw: unknown) {
  requireMasterFn(actor, ["COMERCIAL", "FINANCEIRO"]);
  const antes = await sumulaAtual(db);
  const value = sumulaSchema.parse({ ...(raw as object), atualizadoEm: new Date().toISOString() });
  await db.insert(platformSettings).values({ key: CHAVE_SUMULA, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: value.atualizadoEm } });
  await recordAudit(db, actor, { action: "PLACAR_SUMULA", entityType: "platform_setting", entityId: CHAVE_SUMULA, before: antes, after: value });
  const eram = new Set(rodada(antes).noAr.map((j) => `${j.rivalKey}:${j.degrau}`));
  return { sumula: value, sairamDoAr: rodada(value).foraDoAr.filter((j) => eram.has(`${j.rivalKey}:${j.degrau}`)) };
}
