/**
 * Banners (puro): janela de campanha, condição por contexto e contrato de cada posição.
 * O render público avalia isto a cada visita (a loja é renderizada por requisição), então um banner entra e sai no
 * horário certo mesmo sem o lojista conectado e sem depender de serviço externo de agendamento.
 */
import type { SettingValue } from "./types";

/** Fuso das campanhas: Brasília (UTC−3, sem horário de verão desde 2019). Explícito para não depender do servidor. */
export const CAMPAIGN_TZ = "America/Sao_Paulo";
const OFFSET = "-03:00";

/** "2026-11-20T09:00" no horário de Brasília → instante UTC. Vazio ou inválido → null. */
export function campaignInstant(v: unknown): Date | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type BannerBlock = { id: string; settings: Record<string, SettingValue> };
export type BannerContext = { now: Date; page: string; categoryId?: string | null };

/** O bloco está no ar agora? (sem janela = sempre; com categoria = só na coleção daquela categoria) */
export function isBlockLive(b: BannerBlock, c: BannerContext): boolean {
  const start = campaignInstant(b.settings.startsAt); const end = campaignInstant(b.settings.endsAt);
  if (start && c.now < start) return false;
  if (end && c.now >= end) return false;
  const cat = typeof b.settings.onlyCategory === "string" ? b.settings.onlyCategory : "";
  // Condição por contexto: com categoria escolhida, o banner aparece só na página daquela categoria.
  if (cat) return c.page === "collection" && c.categoryId === cat;
  return true;
}

const scheduled = (b: BannerBlock) => !!(campaignInstant(b.settings.startsAt) || campaignInstant(b.settings.endsAt));

/**
 * Blocos que aparecem agora. Se nenhum estiver no ar, a posição mostra o primeiro bloco SEM agendamento (reserva);
 * sem reserva, a posição fica vazia e a seção some (nunca mostra campanha vencida).
 */
export function liveBlocks<B extends BannerBlock>(blocks: B[], c: BannerContext): B[] {
  const live = blocks.filter((b) => isBlockLive(b, c));
  if (live.length) return live;
  const fallback = blocks.find((b) => !scheduled(b) && !(typeof b.settings.onlyCategory === "string" && b.settings.onlyCategory));
  return fallback ? [fallback] : [];
}

/** Avisos para o editor (não bloqueiam): janela invertida, campanha já vencida, sobreposição numa posição de uma imagem só. */
export function scheduleIssues(blocks: BannerBlock[], now: Date, singleSlot = false): string[] {
  const out: string[] = [];
  const wins = blocks.map((b) => ({ id: b.id, s: campaignInstant(b.settings.startsAt), e: campaignInstant(b.settings.endsAt) }));
  for (const w of wins) {
    if (w.s && w.e && w.e <= w.s) out.push("Um banner termina antes de começar: confira as datas.");
    if (w.e && w.e <= now) out.push("Um banner já terminou e não aparece mais na loja.");
  }
  if (singleSlot) for (let i = 0; i < wins.length; i++) for (let j = i + 1; j < wins.length; j++) {
    const a = wins[i]!, b = wins[j]!;
    if ((a.s ?? new Date(0)) < (b.e ?? new Date(8.64e15)) && (b.s ?? new Date(0)) < (a.e ?? new Date(8.64e15))) out.push("Dois banners da mesma posição ficam no ar ao mesmo tempo.");
  }
  return [...new Set(out)];
}

/**
 * Contrato de cada posição: proporção no computador e no celular, área segura, recorte e prioridade.
 * Proporções derivadas do layout implementado (componentes em storefront/sections/banners.tsx).
 */
export type Placement = { key: string; name: string; desktop: { ratio: string; minWidth: number }; mobile: { ratio: string; minWidth: number }; safeArea: string; crop: string; priority: string; levels: string };
export const PLACEMENTS: Placement[] = [
  { key: "hero-banner", name: "Destaque com banners", desktop: { ratio: "16:9 (alta) · 21:9 (média) · 3:1 (baixa)", minWidth: 1920 }, mobile: { ratio: "4:5", minWidth: 900 }, safeArea: "Texto ocupa até 45% da largura no lado escolhido; mantenha o assunto fora dessa faixa ou use o foco.", crop: "object-fit: cover com ponto de foco por aparelho", priority: "Primeira imagem com prioridade (fetchpriority=high) quando o destaque é a 1ª seção; slides seguintes carregam só quando aparecem", levels: "N1: 1 · N2: 2 · N3/N4: até 6 (N4: vídeo e agendamento)" },
  { key: "banner-duo", name: "Dois banners de apoio", desktop: { ratio: "4:3 (padrão) · 4:5 · 1:1", minWidth: 1200 }, mobile: { ratio: "4:3", minWidth: 800 }, safeArea: "Texto no terço inferior, com escurecimento ajustável.", crop: "cover com foco", priority: "Carregamento tardio", levels: "Todos (formato a partir do N2)" },
  { key: "banner-strip", name: "Faixa de campanha", desktop: { ratio: "4:1 (baixa) · 3:1 (média)", minWidth: 1920 }, mobile: { ratio: "3:2", minWidth: 900 }, safeArea: "Texto à esquerda ocupa até 55% da largura.", crop: "cover com foco", priority: "Carregamento tardio", levels: "Todos (altura a partir do N2)" },
  { key: "banner-mosaic", name: "Mosaico de banners", desktop: { ratio: "Grande 4:5 · menores 1:1 (ou quatro 1:1)", minWidth: 1200 }, mobile: { ratio: "1:1", minWidth: 800 }, safeArea: "Título no canto inferior esquerdo de cada peça.", crop: "cover com foco", priority: "Carregamento tardio", levels: "N3 e N4" },
];
