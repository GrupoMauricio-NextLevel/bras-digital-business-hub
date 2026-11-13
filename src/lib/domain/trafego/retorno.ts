import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { brandLeads, conversoesEnvio, iaConversas, organizations, origensContato, platformSettings, stores, users } from "@/db/schema";
import { brandByCode, isBrandCode } from "@/lib/brand";
import { newId } from "@/lib/ids";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { timeoutSignal } from "@/lib/http-timeout";
import { type Actor, requireMasterFn } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { situacoesComerciais } from "../situacao-comercial";
import { getTagsAnuncio } from "./tags";

/**
 * Retorno às plataformas (TR5, D296): o que aconteceu de verdade no sistema volta para a Meta (API de conversões) e para o
 * Google Ads (importação de conversões por clique), para as campanhas aprenderem quem vira cliente.
 * - LEAD: deixou o contato (mesmo número do navegador, D295) · CONTA: criou a loja · PAGANTE: primeira mensalidade
 *   conferida (a situação "pagante" vem do pagamento conferido no Mercado Pago) · VENDA: negócio fechado à mão no Comercial.
 * - E-mail e telefone só vão como resumo SHA-256, nunca abertos, nunca gravados na fila; tokens só criptografados.
 * - Quem disse "não" para anúncios no aviso de cookies fica BLOQUEADO (não vai a lugar nenhum).
 */
export const META_GRAPH_VERSAO = process.env.META_GRAPH_VERSION?.trim() || "v23.0";
export const GOOGLE_ADS_VERSAO = process.env.GOOGLE_ADS_API_VERSION?.trim() || "v22";
const JANELA_DIAS = { META: 7, GOOGLE: 90 } as const;
const MAX_TENTATIVAS = 5;
const ESPERA_MIN = [10, 60, 360, 1440];

export type Evento = "LEAD" | "CONTA" | "PAGANTE" | "VENDA";
const NOME_META: Record<Evento, string> = { LEAD: "Lead", CONTA: "CompleteRegistration", PAGANTE: "Subscribe", VENDA: "Purchase" };
export const ROTULO_EVENTO: Record<Evento, string> = { LEAD: "Deixou contato", CONTA: "Criou a loja", PAGANTE: "Virou pagante", VENDA: "Negócio fechado" };

// ---------------------------------------------------------------------------------------------------------------------
// Configuração (platform_settings "trafego.retorno"); segredos só criptografados
// ---------------------------------------------------------------------------------------------------------------------
const KEY = "trafego.retorno";
type Guardado = {
  metaTokenEnc?: string | null; metaTesteCodigo?: string | null;
  googleClienteId?: string | null; googleGerenteId?: string | null; googleDevTokenEnc?: string | null; googleOauthClientId?: string | null;
  googleOauthSecretEnc?: string | null; googleRefreshTokenEnc?: string | null; googleAcaoLead?: string | null; googleAcaoConta?: string | null; googleAcaoPagante?: string | null;
};
async function lerGuardado(db: Database): Promise<Guardado> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  return (row?.value && typeof row.value === "object" ? row.value : {}) as Guardado;
}

/** O que a tela pode ver: só se cada segredo existe, nunca o valor. */
export type ConfigRetornoTela = {
  meta: { pixel: string | null; temToken: boolean; testeCodigo: string | null; pronto: boolean };
  google: { clienteId: string | null; gerenteId: string | null; temDevToken: boolean; oauthClientId: string | null; temOauthSecret: boolean; temRefresh: boolean; acaoLead: string | null; acaoConta: string | null; acaoPagante: string | null; pronto: boolean };
};
export async function configRetorno(db: Database): Promise<ConfigRetornoTela> {
  const g = await lerGuardado(db);
  const pixel = (await getTagsAnuncio(db)).metaPixelId;
  const googlePronto = !!(g.googleClienteId && g.googleDevTokenEnc && g.googleOauthClientId && g.googleOauthSecretEnc && g.googleRefreshTokenEnc && (g.googleAcaoLead || g.googleAcaoConta || g.googleAcaoPagante));
  return {
    meta: { pixel, temToken: !!g.metaTokenEnc, testeCodigo: g.metaTesteCodigo ?? null, pronto: !!(pixel && g.metaTokenEnc) },
    google: { clienteId: g.googleClienteId ?? null, gerenteId: g.googleGerenteId ?? null, temDevToken: !!g.googleDevTokenEnc, oauthClientId: g.googleOauthClientId ?? null, temOauthSecret: !!g.googleOauthSecretEnc, temRefresh: !!g.googleRefreshTokenEnc, acaoLead: g.googleAcaoLead ?? null, acaoConta: g.googleAcaoConta ?? null, acaoPagante: g.googleAcaoPagante ?? null, pronto: googlePronto },
  };
}

const idConta = z.string().trim().transform((v) => v.replace(/-/g, "")).refine((v) => v === "" || /^\d{10}$/.test(v), "O número da conta do Google Ads tem 10 algarismos (ex.: 123-456-7890).");
const idAcao = z.string().trim().refine((v) => v === "" || /^\d{4,20}$/.test(v), "O número da ação de conversão tem só algarismos (aparece no endereço da ação: ctId=…).");
/** Campo de segredo: vazio = manter o que já existe; "-" = apagar; outro = trocar (criptografado). */
const segredo = z.string().max(4000).optional();
export const retornoSchema = z.object({
  metaToken: segredo, metaTesteCodigo: z.string().trim().max(30).optional().refine((v) => !v || /^TEST\w{2,26}$/.test(v), "O código de teste da Meta começa com TEST (Gerenciador de Eventos → Testar eventos)."),
  googleClienteId: idConta.optional(), googleGerenteId: idConta.optional(), googleDevToken: segredo, googleOauthClientId: z.string().trim().max(200).optional(),
  googleOauthSecret: segredo, googleRefresh: segredo, googleAcaoLead: idAcao.optional(), googleAcaoConta: idAcao.optional(), googleAcaoPagante: idAcao.optional(),
});

export async function salvarConfigRetorno(db: Database, actor: Actor, raw: z.input<typeof retornoSchema>): Promise<ConfigRetornoTela> {
  requireMasterFn(actor, []); // só o dono: tokens dão acesso às contas de anúncio
  const i = retornoSchema.parse(raw);
  const atual = await lerGuardado(db);
  const sec = (novo: string | undefined, velho: string | null | undefined) => (novo === undefined || novo.trim() === "" ? velho ?? null : novo.trim() === "-" ? null : encryptSecret(novo.trim()));
  const txt = (novo: string | undefined, velho: string | null | undefined) => (novo === undefined ? velho ?? null : novo || null);
  const v: Guardado = {
    metaTokenEnc: sec(i.metaToken, atual.metaTokenEnc), metaTesteCodigo: txt(i.metaTesteCodigo, atual.metaTesteCodigo),
    googleClienteId: txt(i.googleClienteId, atual.googleClienteId), googleGerenteId: txt(i.googleGerenteId, atual.googleGerenteId), googleDevTokenEnc: sec(i.googleDevToken, atual.googleDevTokenEnc),
    googleOauthClientId: txt(i.googleOauthClientId, atual.googleOauthClientId), googleOauthSecretEnc: sec(i.googleOauthSecret, atual.googleOauthSecretEnc), googleRefreshTokenEnc: sec(i.googleRefresh, atual.googleRefreshTokenEnc),
    googleAcaoLead: txt(i.googleAcaoLead, atual.googleAcaoLead), googleAcaoConta: txt(i.googleAcaoConta, atual.googleAcaoConta), googleAcaoPagante: txt(i.googleAcaoPagante, atual.googleAcaoPagante),
  };
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  // Trilha: só "mudou o token", nunca o valor (o campo leva "token" no nome e a auditoria omite).
  await recordAudit(db, actor, { action: "RETORNO_PLATAFORMAS", entityType: "platform_settings", entityId: KEY, before: atual as Record<string, unknown>, after: v as Record<string, unknown> }, { force: true });
  return configRetorno(db);
}

// ---------------------------------------------------------------------------------------------------------------------
// Fila
// ---------------------------------------------------------------------------------------------------------------------
/** Põe o resultado na fila das duas plataformas (uma vez por plataforma, evento e contato). Nunca lança. */
export async function enfileirarConversao(db: Database, e: { evento: Evento; chave: string; valorCents?: number | null; ocorreuEm?: Date }): Promise<number> {
  try {
    const o = await db.query.origensContato.findFirst({ where: eq(origensContato.chave, e.chave), columns: { consentimento: true, clickIds: true } });
    const bloqueado = o?.consentimento === "NAO";
    const quando = (e.ocorreuEm ?? new Date()).toISOString();
    const eventoId = e.evento === "LEAD" || e.evento === "CONTA" ? e.chave : `${e.evento.toLowerCase()}:${e.chave}`;
    const c = o?.clickIds ?? {};
    const temCliqueGoogle = !!(c.gclid || c.gbraid || c.wbraid);
    const linhas = (["META", "GOOGLE"] as const).map((plataforma) => ({
      id: newId("cnv"), plataforma, evento: e.evento, chave: e.chave, eventoId, valorCents: e.valorCents ?? null, ocorreuEm: quando,
      status: bloqueado ? "BLOQUEADO" as const : plataforma === "GOOGLE" && !temCliqueGoogle ? "IGNORADO" as const : "PENDENTE" as const,
      motivo: bloqueado ? "A pessoa recusou anúncios no aviso de cookies." : plataforma === "GOOGLE" && !temCliqueGoogle ? "Não veio de clique de anúncio do Google." : null,
      proximaTentativaEm: quando, dedupeKey: `${plataforma}:${e.evento}:${e.chave}`,
    }));
    const r = await db.insert(conversoesEnvio).values(linhas).onConflictDoNothing().returning({ id: conversoesEnvio.id });
    return r.length;
  } catch (err) { console.error("[retorno] fila", err); return 0; }
}

/** Lojas com origem registrada que viraram pagantes: entram na fila com o valor da mensalidade (uma vez). */
export async function enfileirarPagantes(db: Database, agora = new Date()): Promise<number> {
  const origens = await db.select({ chave: origensContato.chave }).from(origensContato)
    .leftJoin(conversoesEnvio, and(eq(conversoesEnvio.chave, origensContato.chave), eq(conversoesEnvio.evento, "PAGANTE"), eq(conversoesEnvio.plataforma, "META")))
    .where(and(sql`${origensContato.chave} like 'loja:%'`, isNull(conversoesEnvio.id))).limit(500);
  if (!origens.length) return 0;
  const ids = origens.map((o) => o.chave.slice(5));
  const lojas = await db.select({ id: stores.id, paidUntil: stores.paidUntil, trialEndsAt: stores.trialEndsAt, entryOffer: stores.entryOffer }).from(stores).where(inArray(stores.id, ids));
  const sit = await situacoesComerciais(db, lojas, agora);
  let n = 0;
  for (const l of lojas) {
    const s = sit.get(l.id);
    if (s?.pagamento === "pagante") n += await enfileirarConversao(db, { evento: "PAGANTE", chave: `loja:${l.id}`, valorCents: s.valorCents, ocorreuEm: agora });
  }
  return n;
}

// ---------------------------------------------------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------------------------------------------------
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const emailNorm = (e: string | null | undefined) => { const x = (e ?? "").trim().toLowerCase(); return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x) ? x : null; };
const foneNorm = (t: string | null | undefined) => { const d = (t ?? "").replace(/\D/g, ""); if (d.length < 10) return null; return d.startsWith("55") && d.length >= 12 ? d : `55${d}`; };

/** E-mail e telefone do contato, só para virar resumo na hora do envio. */
async function contatoDe(db: Database, chave: string): Promise<{ email: string | null; fone: string | null; brand: string | null }> {
  const [tipo, id] = chave.split(":") as [string, string];
  if (tipo === "interessado") { const l = await db.query.brandLeads.findFirst({ where: eq(brandLeads.id, id), columns: { email: true, phone: true, brand: true } }); return { email: l?.email ?? null, fone: l?.phone ?? null, brand: l?.brand ?? null }; }
  if (tipo === "loja") {
    const [s] = await db.select({ whatsapp: stores.whatsapp, contactEmail: stores.contactEmail, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, id)).limit(1);
    const dono = await db.query.users.findFirst({ where: and(eq(users.storeId, id), eq(users.role, "STORE_OWNER")), columns: { email: true } });
    return { email: dono?.email ?? s?.contactEmail ?? null, fone: s?.whatsapp ?? null, brand: s?.brand ?? null };
  }
  if (tipo === "conversa") { const c = await db.query.iaConversas.findFirst({ where: eq(iaConversas.id, id), columns: { email: true, whatsapp: true, brand: true } }); return { email: c?.email ?? null, fone: c?.whatsapp ?? null, brand: c?.brand ?? null }; }
  return { email: null, fone: null, brand: null };
}

type Linha = typeof conversoesEnvio.$inferSelect;
type Resultado = { ok: true } | { ok: false; motivo: string; definitivo?: boolean };
const limparErro = (t: string) => t.replace(/access_token=[^&\s"]+/g, "access_token=…").replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"…"').slice(0, 300);

async function enviarMeta(db: Database, l: Linha, g: Guardado, fetchImpl: typeof fetch): Promise<Resultado> {
  const pixel = (await getTagsAnuncio(db)).metaPixelId;
  const token = decryptSecret(g.metaTokenEnc);
  if (!pixel || !token) return { ok: false, motivo: "Meta ainda não configurada (Pixel e token no Master)." };
  const o = await db.query.origensContato.findFirst({ where: eq(origensContato.chave, l.chave) });
  const c = await contatoDe(db, l.chave);
  const em = emailNorm(c.email); const ph = foneNorm(c.fone);
  const ck = o?.clickIds ?? {};
  const capt = o ? new Date(o.capturadaEm).getTime() : Date.now();
  const fbc = ck.fbc ?? (ck.fbclid ? `fb.1.${capt}.${ck.fbclid}` : undefined);
  // Contato e conta nascem no site; pagante e venda, no sistema (Comercial/cobrança).
  const site = (l.evento === "LEAD" || l.evento === "CONTA") && !!o?.ua;
  const base = c.brand && isBrandCode(c.brand) ? brandByCode(c.brand).baseUrl.replace(/\/$/, "") : null;
  const evento = {
    event_name: NOME_META[l.evento], event_time: Math.floor(new Date(l.ocorreuEm).getTime() / 1000), event_id: l.eventoId,
    action_source: site ? "website" : "system_generated",
    ...(site && base ? { event_source_url: `${base}${o?.primeiraPagina && o.primeiraPagina.startsWith("/") ? "" : "/"}` } : {}),
    user_data: {
      ...(em ? { em: [sha(em)] } : {}), ...(ph ? { ph: [sha(ph)] } : {}), external_id: [sha(l.chave)],
      ...(fbc ? { fbc } : {}), ...(ck.fbp ? { fbp: ck.fbp } : {}), ...(site && o?.ua ? { client_user_agent: o.ua } : {}),
    },
    ...(l.valorCents ? { custom_data: { currency: "BRL", value: l.valorCents / 100 } } : {}),
  };
  if (!em && !ph && !fbc) return { ok: false, motivo: "Sem e-mail, telefone ou clique da Meta para identificar a pessoa.", definitivo: true };
  const corpo = { data: [evento], access_token: token, ...(g.metaTesteCodigo ? { test_event_code: g.metaTesteCodigo } : {}) };
  const r = await fetchImpl(`https://graph.facebook.com/${META_GRAPH_VERSAO}/${pixel}/events`, { method: "POST", signal: timeoutSignal(), headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
  if (r.ok) return { ok: true };
  const txt = limparErro(await r.text().catch(() => ""));
  return { ok: false, motivo: `A Meta respondeu ${r.status}: ${txt || "sem detalhe"}`, definitivo: r.status === 400 && !/temporar|rate|limit/i.test(txt) };
}

let tokenGoogle: { valor: string; ate: number } | null = null;
async function acessoGoogle(g: Guardado, fetchImpl: typeof fetch): Promise<string | null> {
  if (tokenGoogle && tokenGoogle.ate > Date.now() + 60_000) return tokenGoogle.valor;
  const secret = decryptSecret(g.googleOauthSecretEnc); const refresh = decryptSecret(g.googleRefreshTokenEnc);
  if (!g.googleOauthClientId || !secret || !refresh) return null;
  const r = await fetchImpl("https://oauth2.googleapis.com/token", { method: "POST", signal: timeoutSignal(), headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: g.googleOauthClientId, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" }).toString() });
  if (!r.ok) return null;
  const j = await r.json() as { access_token?: string; expires_in?: number };
  if (!j.access_token) return null;
  tokenGoogle = { valor: j.access_token, ate: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}
/** Para testes: esquece o acesso guardado em memória. */
export const _esquecerAcessoGoogle = () => { tokenGoogle = null; };

async function enviarGoogle(db: Database, l: Linha, g: Guardado, fetchImpl: typeof fetch): Promise<Resultado> {
  const acao = l.evento === "LEAD" ? g.googleAcaoLead : l.evento === "CONTA" ? g.googleAcaoConta : g.googleAcaoPagante;
  const dev = decryptSecret(g.googleDevTokenEnc);
  if (!g.googleClienteId || !dev) return { ok: false, motivo: "Google Ads ainda não configurado no Master." };
  if (!acao) return { ok: false, motivo: `Sem ação de conversão do Google para "${ROTULO_EVENTO[l.evento]}".`, definitivo: true };
  const o = await db.query.origensContato.findFirst({ where: eq(origensContato.chave, l.chave) });
  const ck = o?.clickIds ?? {};
  const clique = ck.gclid ? { gclid: ck.gclid } : ck.gbraid ? { gbraid: ck.gbraid } : ck.wbraid ? { wbraid: ck.wbraid } : null;
  if (!clique) return { ok: false, motivo: "Não veio de clique de anúncio do Google.", definitivo: true };
  const acesso = await acessoGoogle(g, fetchImpl);
  if (!acesso) return { ok: false, motivo: "Não consegui entrar no Google Ads (confira o acesso OAuth no Master)." };
  const c = await contatoDe(db, l.chave);
  const em = emailNorm(c.email); const ph = foneNorm(c.fone);
  const quando = new Date(l.ocorreuEm).toISOString().replace("T", " ").replace(/\.\d+Z$/, "+00:00");
  const conversao = {
    conversionAction: `customers/${g.googleClienteId}/conversionActions/${acao}`, conversionDateTime: quando, orderId: l.eventoId, currencyCode: "BRL",
    ...(l.valorCents ? { conversionValue: l.valorCents / 100 } : {}), ...clique,
    userIdentifiers: [...(em ? [{ hashedEmail: sha(em) }] : []), ...(ph ? [{ hashedPhoneNumber: sha(`+${ph}`) }] : [])],
  };
  const r = await fetchImpl(`https://googleads.googleapis.com/${GOOGLE_ADS_VERSAO}/customers/${g.googleClienteId}:uploadClickConversions`, {
    method: "POST", signal: timeoutSignal(),
    headers: { "content-type": "application/json", authorization: `Bearer ${acesso}`, "developer-token": dev, ...(g.googleGerenteId ? { "login-customer-id": g.googleGerenteId } : {}) },
    body: JSON.stringify({ conversions: [conversao], partialFailure: true }),
  });
  const txt = await r.text().catch(() => "");
  if (!r.ok) return { ok: false, motivo: `O Google respondeu ${r.status}: ${limparErro(txt) || "sem detalhe"}` };
  const j = (() => { try { return JSON.parse(txt) as { partialFailureError?: { message?: string } }; } catch { return {}; } })();
  if (j.partialFailureError?.message) return { ok: false, motivo: `O Google recusou: ${limparErro(j.partialFailureError.message)}`, definitivo: true };
  return { ok: true };
}

/** Rotina (a cada 5–10 min): manda o que está na fila, dentro da janela de cada plataforma, com novas tentativas. */
export async function enviarConversoes(db: Database, fetchImpl: typeof fetch = fetch, agora = new Date()): Promise<{ enviados: number; falhas: number; ignorados: number }> {
  const g = await lerGuardado(db);
  const fila = await db.select().from(conversoesEnvio)
    .where(and(inArray(conversoesEnvio.status, ["PENDENTE", "FALHOU"]), or(isNull(conversoesEnvio.proximaTentativaEm), lte(conversoesEnvio.proximaTentativaEm, agora.toISOString()))))
    .orderBy(conversoesEnvio.ocorreuEm).limit(100);
  let enviados = 0, falhas = 0, ignorados = 0;
  for (const l of fila) {
    const idade = (agora.getTime() - new Date(l.ocorreuEm).getTime()) / 86_400_000;
    if (idade > JANELA_DIAS[l.plataforma]) {
      await db.update(conversoesEnvio).set({ status: "IGNORADO", motivo: `Passou da janela de ${JANELA_DIAS[l.plataforma]} dias da ${l.plataforma === "META" ? "Meta" : "Google"}.`, proximaTentativaEm: null }).where(eq(conversoesEnvio.id, l.id));
      ignorados++; continue;
    }
    let r: Resultado;
    try { r = l.plataforma === "META" ? await enviarMeta(db, l, g, fetchImpl) : await enviarGoogle(db, l, g, fetchImpl); }
    catch (e) { r = { ok: false, motivo: `Falha de conexão: ${limparErro(e instanceof Error ? e.message : String(e))}` }; }
    if (r.ok) { await db.update(conversoesEnvio).set({ status: "ENVIADO", motivo: null, enviadoEm: agora.toISOString(), tentativas: l.tentativas + 1, proximaTentativaEm: null }).where(eq(conversoesEnvio.id, l.id)); enviados++; continue; }
    const t = l.tentativas + 1;
    const naoConfigurado = /ainda não configurad/.test(r.motivo);
    // Sem configuração: espera sem gastar tentativa (liga sozinho quando o dono configurar, dentro da janela).
    const fim = !naoConfigurado && (r.definitivo || t >= MAX_TENTATIVAS);
    await db.update(conversoesEnvio).set({
      status: "FALHOU", motivo: r.motivo, tentativas: naoConfigurado ? l.tentativas : t,
      proximaTentativaEm: fim ? null : new Date(agora.getTime() + (naoConfigurado ? 30 : ESPERA_MIN[Math.min(t - 1, ESPERA_MIN.length - 1)]!) * 60_000).toISOString(),
    }).where(eq(conversoesEnvio.id, l.id));
    falhas++;
  }
  return { enviados, falhas, ignorados };
}

// ---------------------------------------------------------------------------------------------------------------------
// Tela do Master
// ---------------------------------------------------------------------------------------------------------------------
export async function painelRetorno(db: Database, actor: Actor) {
  requireMasterFn(actor, ["COMERCIAL"]);
  const [contagem, ultimos] = await Promise.all([
    db.select({ plataforma: conversoesEnvio.plataforma, status: conversoesEnvio.status, n: sql<number>`count(*)` }).from(conversoesEnvio).groupBy(conversoesEnvio.plataforma, conversoesEnvio.status),
    // Linhas "não veio de clique do Google" não ajudam a equipe: ficam só na contagem.
    db.select().from(conversoesEnvio).where(sql`not (${conversoesEnvio.status} = 'IGNORADO' and ${conversoesEnvio.motivo} like 'Não veio de clique%')`).orderBy(desc(conversoesEnvio.criadoEm)).limit(60),
  ]);
  // Nome de quem é cada resultado (no lugar do código interno).
  const porTipo = (t: string) => [...new Set(ultimos.filter((l) => l.chave.startsWith(`${t}:`)).map((l) => l.chave.slice(t.length + 1)))];
  const [ls, ss, cs] = await Promise.all([
    porTipo("interessado").length ? db.select({ id: brandLeads.id, nome: brandLeads.name }).from(brandLeads).where(inArray(brandLeads.id, porTipo("interessado"))) : [],
    porTipo("loja").length ? db.select({ id: stores.id, nome: stores.name }).from(stores).where(inArray(stores.id, porTipo("loja"))) : [],
    porTipo("conversa").length ? db.select({ id: iaConversas.id, nome: iaConversas.nome }).from(iaConversas).where(inArray(iaConversas.id, porTipo("conversa"))) : [],
  ]);
  const nomes = new Map<string, string>([...ls.map((x) => [`interessado:${x.id}`, x.nome] as const), ...ss.map((x) => [`loja:${x.id}`, `Loja ${x.nome}`] as const), ...cs.map((x) => [`conversa:${x.id}`, x.nome ?? "Visitante"] as const)]);
  return { contagem: contagem.map((c) => ({ ...c, n: Number(c.n) })), ultimos: ultimos.map((l) => ({ ...l, nome: nomes.get(l.chave) ?? null })) };
}

/** Tenta de novo um envio que falhou (depois de corrigir a configuração). */
export async function reenviarConversao(db: Database, actor: Actor, id: string) {
  requireMasterFn(actor, ["COMERCIAL"]);
  const l = await db.query.conversoesEnvio.findFirst({ where: eq(conversoesEnvio.id, id) });
  if (!l) throw new NotFoundError("Envio não encontrado.");
  if (l.status === "ENVIADO") throw new DomainError("JA_ENVIADO", "Esse resultado já foi entregue.");
  if (l.status === "BLOQUEADO") throw new DomainError("BLOQUEADO", "A pessoa recusou anúncios no aviso de cookies: não reenviamos.");
  await db.update(conversoesEnvio).set({ status: "PENDENTE", proximaTentativaEm: new Date().toISOString(), tentativas: 0 }).where(eq(conversoesEnvio.id, id));
}
