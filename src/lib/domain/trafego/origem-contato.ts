import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import { conheceuValido, rotuloConheceu } from "@/lib/trafego/conheceu";
import type { Database } from "@/db/client";
import { origensContato, trafegoEventos, trafegoSessoes } from "@/db/schema";
import { newId } from "@/lib/ids";
import { CLICK_IDS, canalDe, ROTULO_CANAL, type Canal } from "@/lib/trafego/canal";
import { type Actor, requireMasterFn } from "../access";
import { DomainError } from "../errors";
import { CODIGO_VISITA, SESSAO_MIN } from "./coletor";
import { enfileirarConversao } from "./retorno";

/**
 * Origem de cada contato (TR3, D294). Quando alguém deixa o contato ou cria a loja, o sistema guarda de onde veio: a
 * visita em andamento (canal, campanha, peça, cidade, aparelho, clique do anúncio) e, se não houver, o último toque
 * (cookie de 30 dias, D90) e o primeiro (D290). Quem chega pelo WhatsApp manda o código da visita, que a equipe cola.
 */
export type Via = "FORMULARIO" | "SAIDA" | "DIAGNOSTICO" | "CADASTRO" | "CODIGO_WHATSAPP";
export const ROTULO_VIA: Record<Via, string> = {
  FORMULARIO: "Formulário", SAIDA: "Janela de saída", DIAGNOSTICO: "Diagnóstico", CADASTRO: "Cadastro da loja", CODIGO_WHATSAPP: "Código da visita no WhatsApp",
};
export type VisitaAtual = {
  ultimo: Record<string, string>; primeiro: Record<string, string>; sessaoId: string | null;
  /** Navegador, escolha no aviso de cookies e os cookies da Meta (_fbp, _fbc), para o retorno às plataformas (TR5, D298). */
  ua?: string | null; consentimento?: "SIM" | "NAO" | "SEM_ESCOLHA"; fbp?: string | null; fbc?: string | null;
  /** Resposta a "Como você conheceu a NextLevel?" (D302); só chaves da lista de `src/lib/trafego/conheceu.ts`. */
  conheceuPor?: string | null;
};

const APARELHO: Record<string, string> = { MOBILE: "Celular", DESKTOP: "Computador", TABLET: "Tablet" };
const resumoAparelho = (s: Pick<typeof trafegoSessoes.$inferSelect, "aparelho" | "sistema" | "modelo" | "navegador">) =>
  [APARELHO[s.aparelho] ?? s.aparelho, s.sistema, s.modelo, s.navegador].filter(Boolean).join(" · ");
const t = (v: string | undefined | null, n = 60) => (v ? v.replace(/[^\w\-. ]/g, "").slice(0, n) || null : null);

type Snapshot = Omit<typeof origensContato.$inferInsert, "chave" | "brand" | "via">;

function deSessao(s: typeof trafegoSessoes.$inferSelect): Snapshot {
  return {
    canal: s.canal, utmSource: s.utmSource, utmMedium: s.utmMedium, utmCampaign: s.utmCampaign, utmContent: s.utmContent, utmTerm: s.utmTerm,
    clickIds: s.clickIds, sessaoId: s.id, codigoVisita: s.codigo, cidade: s.cidade, uf: s.uf, pais: s.pais, aparelho: resumoAparelho(s),
  };
}

function deCookie(a: Record<string, string>): Snapshot {
  const clickIds: Record<string, string> = {};
  for (const k of CLICK_IDS) if (a[k]) clickIds[k] = t(a[k], 120)!;
  return {
    canal: (a.canal && a.canal in ROTULO_CANAL ? a.canal : canalDe({ ...a })) as Canal,
    utmSource: t(a.utm_source), utmMedium: t(a.utm_medium), utmCampaign: t(a.utm_campaign), utmContent: t(a.utm_content), utmTerm: t(a.utm_term), clickIds,
  };
}

/**
 * Guarda a origem do contato `chave` (a primeira fica; não sobrescreve) e marca a visita como lead. Nunca lança: medir
 * não pode derrubar o cadastro.
 */
export async function registrarOrigemDoContato(db: Database, chave: string, brand: string, via: Via, v: VisitaAtual, pagina = "/", agora = new Date()): Promise<boolean> {
  try {
    const sessao = v.sessaoId && /^tss_[A-Za-z0-9_-]{4,40}$/.test(v.sessaoId)
      ? await db.query.trafegoSessoes.findFirst({ where: and(eq(trafegoSessoes.id, v.sessaoId), gte(trafegoSessoes.ultimoSinalEm, new Date(agora.getTime() - SESSAO_MIN * 60_000).toISOString())) })
      : null;
    // A visita atual só manda se ela trouxe origem própria; se entrou "direto", o último toque com campanha (30 dias) explica melhor.
    const ultimo = Object.keys(v.ultimo).length ? deCookie(v.ultimo) : null;
    const base: Snapshot = sessao && (sessao.canal !== "direto" || !ultimo) ? deSessao(sessao) : { ...(ultimo ?? { canal: "direto" }), ...(sessao ? { sessaoId: sessao.id, codigoVisita: sessao.codigo, cidade: sessao.cidade, uf: sessao.uf, pais: sessao.pais, aparelho: resumoAparelho(sessao) } : {}) };
    const primeiroCanal = v.primeiro.canal && v.primeiro.canal in ROTULO_CANAL ? v.primeiro.canal : null;
    const metaCookies = { ...(v.fbp && /^fb\.\d\.\d+\.\d+$/.test(v.fbp) ? { fbp: v.fbp } : {}), ...(v.fbc && /^fb\.\d\.\d+\.[\w.-]{1,200}$/.test(v.fbc) ? { fbc: v.fbc } : {}) };
    base.clickIds = { ...(base.clickIds ?? {}), ...metaCookies };
    const conheceuPor = conheceuValido(v.conheceuPor);
    const r = await db.insert(origensContato).values({ chave, brand, via, ...base, primeiroCanal, conheceuPor, ua: v.ua?.slice(0, 400) ?? null, consentimento: v.consentimento ?? "SEM_ESCOLHA", primeiraPagina: v.primeiro.page ? v.primeiro.page.replace(/[^\w\-./~%]/g, "").slice(0, 80) || null : null, capturadaEm: agora.toISOString() })
      .onConflictDoNothing().returning({ chave: origensContato.chave });
    // A origem medida fica a primeira; a resposta da pessoa entra mesmo se o contato já existia (e não apaga uma anterior).
    if (!r.length && conheceuPor) await db.update(origensContato).set({ conheceuPor }).where(and(eq(origensContato.chave, chave), isNull(origensContato.conheceuPor)));
    if (sessao) {
      await db.update(trafegoSessoes).set({ lead: true, ultimoSinalEm: agora.toISOString() }).where(eq(trafegoSessoes.id, sessao.id));
      await db.insert(trafegoEventos).values({ id: newId("tev"), sessaoId: sessao.id, tipo: "LEAD", caminho: pagina.slice(0, 120) || "/", criadoEm: agora.toISOString() });
    }
    // TR5 (D298): o contato ou a conta entram na fila de retorno à Meta e ao Google (o mesmo número do navegador, D295).
    if (r.length) await enfileirarConversao(db, { evento: via === "CADASTRO" ? "CONTA" : "LEAD", chave, ocorreuEm: agora });
    return r.length > 0;
  } catch (e) { console.error("[origem] contato", e); return false; }
}

/** A equipe cola o código que veio na mensagem do WhatsApp: a origem daquela visita passa a valer para o contato. */
export async function vincularCodigoVisita(db: Database, actor: Actor, chave: string, codigoBruto: string, agora = new Date()) {
  requireMasterFn(actor, ["COMERCIAL", "SUPORTE"]);
  if (!/^(loja|interessado|conversa):[\w-]+$/.test(chave)) throw new DomainError("CHAVE", "Cliente inválido.");
  const codigo = codigoBruto.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!CODIGO_VISITA.test(codigo)) throw new DomainError("CODIGO", "O código tem 5 letras e números, como aparece na mensagem (ex.: K7Q2X).");
  const s = await db.query.trafegoSessoes.findFirst({ where: and(eq(trafegoSessoes.codigo, codigo), gte(trafegoSessoes.iniciadaEm, new Date(agora.getTime() - 60 * 86_400_000).toISOString())) });
  if (!s) throw new DomainError("CODIGO", "Não achei uma visita com esse código nos últimos 60 dias. Confira as letras.");
  const valores = { brand: s.brand, via: "CODIGO_WHATSAPP" as const, ...deSessao(s), capturadaEm: agora.toISOString() };
  await db.insert(origensContato).values({ chave, ...valores }).onConflictDoUpdate({ target: origensContato.chave, set: valores });
  if (!s.lead) await db.update(trafegoSessoes).set({ lead: true }).where(eq(trafegoSessoes.id, s.id));
  await enfileirarConversao(db, { evento: chave.startsWith("loja:") ? "CONTA" : "LEAD", chave, ocorreuEm: agora });
  return { canal: s.canal as Canal, campanha: s.utmCampaign };
}

export type OrigemResumo = {
  via: Via; canal: Canal; rotulo: string; campanha: string | null; peca: string | null; publico: string | null; anuncio: "Meta" | "Google" | "TikTok" | null;
  primeiroCanal: Canal | null; conheceuPor: string | null; cidade: string | null; uf: string | null; pais: string | null; aparelho: string | null; codigo: string | null; em: string;
};

export function resumir(o: typeof origensContato.$inferSelect): OrigemResumo {
  const c = o.clickIds ?? {};
  return {
    via: o.via, canal: o.canal as Canal, rotulo: ROTULO_CANAL[o.canal as Canal] ?? o.canal, campanha: o.utmCampaign, peca: o.utmContent, publico: o.utmTerm,
    anuncio: c.fbclid ? "Meta" : c.gclid || c.gbraid || c.wbraid ? "Google" : c.ttclid ? "TikTok" : null,
    primeiroCanal: (o.primeiroCanal as Canal | null) ?? null, conheceuPor: rotuloConheceu(o.conheceuPor), cidade: o.cidade, uf: o.uf, pais: o.pais, aparelho: o.aparelho, codigo: o.codigoVisita, em: new Date(o.capturadaEm).toISOString(),
  };
}

export async function origensDe(db: Database, chaves: string[]): Promise<Map<string, OrigemResumo>> {
  if (!chaves.length) return new Map();
  const out = new Map<string, OrigemResumo>();
  for (let i = 0; i < chaves.length; i += 500) {
    const rows = await db.select().from(origensContato).where(inArray(origensContato.chave, chaves.slice(i, i + 500)));
    for (const r of rows) out.set(r.chave, resumir(r));
  }
  return out;
}
