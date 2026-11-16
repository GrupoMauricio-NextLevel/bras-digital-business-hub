import type { Database } from "@/db/client";

/**
 * Robôs de busca e de IA lendo as páginas públicas (D302, plano de busca v3, seção 16.3). O proxy soma as visitas em
 * memória e grava em lote (a cada 5 minutos ou 300 linhas), nunca uma escrita por visita. Só contagem por dia, marca,
 * robô e caminho: nada de IP nem navegador. Se o servidor reiniciar, perde no máximo os últimos minutos (aceitável:
 * é um termômetro, não cobrança).
 */
const ROBOS: [string, RegExp][] = [
  ["ChatGPT (busca)", /OAI-SearchBot/i], ["ChatGPT (pedido do usuário)", /ChatGPT-User/i], ["OpenAI (treino)", /GPTBot/i],
  ["Perplexity (busca)", /PerplexityBot/i], ["Perplexity (pedido do usuário)", /Perplexity-User/i],
  ["Claude (busca)", /Claude-SearchBot/i], ["Claude (pedido do usuário)", /Claude-User/i], ["Claude (treino)", /ClaudeBot/i],
  ["Gemini e Google (pedido do usuário)", /Google-Extended|Gemini|GoogleAgent/i], ["Google", /Googlebot|Google-InspectionTool|Storebot-Google/i],
  ["Bing e Copilot", /bingbot|BingPreview/i], ["Apple (Siri e Apple Intelligence)", /Applebot/i], ["Meta AI", /meta-externalagent|meta-externalfetcher/i],
  ["DuckDuckGo", /DuckAssistBot|DuckDuckBot/i], ["Mistral", /MistralAI-User/i], ["Amazon", /Amazonbot/i], ["Common Crawl (base de treino)", /CCBot/i],
  ["ByteDance", /Bytespider/i], ["Yandex", /YandexBot/i],
];

/** Nome do robô pelo navegador que ele diz ser; `null` para pessoas e robôs fora da lista. */
export function roboDe(ua: string | null | undefined): string | null {
  if (!ua) return null;
  for (const [nome, re] of ROBOS) if (re.test(ua)) return nome;
  return null;
}

/** Caminho limpo para a contagem (sem busca nem âncora, até 120 caracteres). */
export const caminhoDoRobo = (p: string) => (p.split("?")[0]!.split("#")[0]!.replace(/[^\w\-./~%]/g, "").slice(0, 120) || "/");

type Chave = string; // dia|marca|robo|caminho
const pendentes = new Map<Chave, number>();
let ultimaGravacao = Date.now();
const INTERVALO_MS = 5 * 60_000;
const LIMITE_LINHAS = 300;

/** Soma uma visita; devolve `true` quando é hora de gravar o lote. */
export function contarRobo(brand: string, robo: string, caminho: string, agora = new Date()): boolean {
  const k = [agora.toISOString().slice(0, 10), brand, robo, caminhoDoRobo(caminho)].join("|");
  pendentes.set(k, (pendentes.get(k) ?? 0) + 1);
  return pendentes.size >= LIMITE_LINHAS || agora.getTime() - ultimaGravacao >= INTERVALO_MS;
}

/** Grava o lote somando ao que já está no banco. Nunca lança. */
export async function gravarRobos(db: Database, agora = new Date()): Promise<number> {
  if (!pendentes.size) return 0;
  const lote = [...pendentes.entries()];
  pendentes.clear();
  ultimaGravacao = agora.getTime();
  try {
    const { robosVisitasDiarias } = await import("@/db/schema");
    const { sql } = await import("drizzle-orm");
    const valores = lote.map(([k, visitas]) => { const [dia, brand, robo, caminho] = k.split("|") as [string, string, string, string]; return { dia, brand, robo, caminho, visitas }; });
    await db.insert(robosVisitasDiarias).values(valores).onConflictDoUpdate({
      target: [robosVisitasDiarias.dia, robosVisitasDiarias.brand, robosVisitasDiarias.robo, robosVisitasDiarias.caminho],
      set: { visitas: sql`${robosVisitasDiarias.visitas} + excluded.visitas` },
    });
    return valores.length;
  } catch (e) { console.error("[robos] gravar", e); return 0; }
}

/** Só para os testes: zera o acumulado. */
export function _zerarRobos(desde = Date.now()) { pendentes.clear(); ultimaGravacao = desde; }
