"use server";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession, setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { rateLimit } from "@/lib/rate-limit";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { setBrasDefaultCommissionBps, settleBrasCommission, undoBrasSettlement, updateBrasImporterDetails, type brasImporterDetailsSchema, type brasSettleSchema } from "@/lib/domain/bras/comissoes";
import { balcaoConfirmPickup, createBalcaoLink, revokeBalcaoLink } from "@/lib/domain/bras/balcao";
import { brasPanelsEnabled } from "@/lib/bras/panels";
import { reviewSupplier, signupSupplier, type SupplierSignupInput } from "@/lib/domain/bras/fornecedores";
import { referrerByCode, registerClientReferral } from "@/lib/domain/club/pontos";
import { acceptBrasTerms, getBrasMemberByUser, setBrasMemberStatus, signupBrasMember, type brasSignupSchema } from "@/lib/domain/bras/membros";
import { addBrasVideo, moveBrasVideo, removeBrasVideo, setBrasVideoActive, setBrasVideoPublishAt, type brasVideoSchema } from "@/lib/domain/bras/videos";
import { grantBrasAccess, revokeBrasAccess, saveBrasAnalysisSettings, setBrasDiscovery, type brasDiscoverySchema, type brasGrantSchema } from "@/lib/domain/bras/descobertas";
import { saveBrasRules, type BrasRulesInput } from "@/lib/domain/bras/regras";
import { saveBrasClassification, saveMyBrasProfile, setBrasLevelOverride, type BrasClientLevel, type BrasProfileInput } from "@/lib/domain/bras/perfil";
import { saveBrasLegal } from "@/lib/domain/bras/juridico";
import { cancelMyBrasAppointment, decideBrasAppointment, replyBrasSupport, requestBrasAppointment, requestBrasPlanUpgrade, sendBrasSupportMessage, type brasAppointmentSchema } from "@/lib/domain/bras/suporte";
import { deleteBrasContent, saveBrasContent, type brasContentSchema } from "@/lib/domain/bras/pauta";
import { brasMemberLevel } from "@/lib/domain/bras/painel";
import { addBrasImporter, createBrasRequest, removeBrasOffer, setBrasImporterActive, setBrasOffer, setBrasRequestStatus, type BrasRequestStatus, type brasImporterSchema, type brasOfferSchema, type brasRequestSchema } from "@/lib/domain/bras/catalogo";

/** Cadastro do fornecedor pelo próprio fornecedor (D160): só no endereço da Brás aberto; entra em análise e já tem login. */
export async function brasSupplierSignupAction(input: SupplierSignupInput) {
  const r = await runAction(async () => {
    const brand = await getBrand();
    if (!isClosedCommerceBrand(brand) || !brand.signupOpen) throw new DomainError("CLOSED", "O cadastro de fornecedores não está aberto neste endereço.");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`bras-fornecedor:${ip}`, 5, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const created = await signupSupplier(await getDb(), input);
    await setSessionCookie(created.userId);
    return { ok: true as const };
  });
  if (r.ok) redirect("/importadora?cadastro=recebido");
  return r;
}

/** Aprovação ou recusa do fornecedor no Estúdio (só Master). */
export async function reviewSupplierAction(importerId: string, input: { decision: "APROVAR" | "RECUSAR"; note?: string }) {
  return runAction(async () => { const { actor, db } = await master(); const r = await reviewSupplier(db, actor, importerId, input); refresh(); revalidatePath("/importadora", "layout"); return r; });
}

/** Cadastro grátis do membro comprador da Brás (D92): só no endereço da Brás com o cadastro aberto. Libera na hora. */
export async function brasSignupAction(input: z.input<typeof brasSignupSchema>) {
  const r = await runAction(async () => {
    const brand = await getBrand();
    if (!isClosedCommerceBrand(brand) || !brand.signupOpen) throw new DomainError("CLOSED", "O cadastro não está aberto neste endereço.");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`bras-signup:${ip}`, 8, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const db = await getDb();
    const created = await signupBrasMember(db, input);
    // Brás Digital Club (D115): quem chegou pelo link /c/ de um membro fica como indicação dele (parceiro /r/ tem prioridade).
    const jar = await cookies();
    const clubRef = jar.get("club-ref")?.value;
    if (clubRef) {
      const referrer = await referrerByCode(db, clubRef);
      if (referrer) await registerClientReferral(db, { referrerUserId: referrer, newUserId: created.userId, name: input.name, phone: input.whatsapp, memberId: created.memberId, partnerAttributed: !!jar.get("nl-ref")?.value });
    }
    await setSessionCookie(created.userId);
    return { ok: true as const };
  });
  if (r.ok) {
    const office = (await getBrand()).officeUrl;
    redirect(office ? `${office}/login?conta=criada` : "/meu-bras?bem-vindo=1");
  }
  return r;
}

async function master() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/bras", "layout"); revalidatePath("/"); revalidatePath("/meu-bras", "layout"); };

/** Aceite dos termos pelo membro que se cadastrou antes deles (ou quando a versão muda). */
export async function acceptBrasTermsAction() {
  return runAction(async () => {
    const session = await getSession();
    if (!session) throw new ForbiddenError("Entre na sua conta para aceitar os termos.");
    const r = await acceptBrasTerms(await getDb(), session.actor);
    revalidatePath("/meu-bras", "layout");
    return r;
  });
}

export async function setBrasMemberStatusAction(memberId: string, status: "ACTIVE" | "BLOCKED", reason?: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasMemberStatus(db, actor, memberId, status, reason); refresh(); return r; });
}

export async function addBrasVideoAction(input: z.input<typeof brasVideoSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await addBrasVideo(db, actor, input); refresh(); return r; });
}

export async function setBrasVideoActiveAction(id: string, active: boolean) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasVideoActive(db, actor, id, active); refresh(); return r; });
}

/** Agenda a publicação da descoberta (ISO) ou publica já (null). */
export async function setBrasVideoPublishAtAction(id: string, publishAt: string | null) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasVideoPublishAt(db, actor, id, publishAt); refresh(); return r; });
}

export async function moveBrasVideoAction(id: string, dir: "up" | "down") {
  return runAction(async () => { const { actor, db } = await master(); const r = await moveBrasVideo(db, actor, id, dir); refresh(); return r; });
}

export async function removeBrasVideoAction(id: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await removeBrasVideo(db, actor, id); refresh(); return r; });
}

export async function addBrasImporterAction(input: z.input<typeof brasImporterSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await addBrasImporter(db, actor, input); refresh(); return r; });
}

export async function setBrasImporterActiveAction(id: string, active: boolean) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasImporterActive(db, actor, id, active); refresh(); return r; });
}

export async function setBrasOfferAction(videoId: string, input: z.input<typeof brasOfferSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasOffer(db, actor, videoId, input); refresh(); return r; });
}

export async function removeBrasOfferAction(videoId: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await removeBrasOffer(db, actor, videoId); refresh(); return r; });
}

export async function setBrasRequestStatusAction(id: string, status: BrasRequestStatus) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasRequestStatus(db, actor, id, status); refresh(); return r; });
}

/** Pedido de compra do membro (D93). A permissão vem da sessão e do status do membro no banco, nunca do formulário. */
export async function createBrasRequestAction(input: z.input<typeof brasRequestSchema>) {
  const r = await runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada. Entre de novo.");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`bras-request:${s.user.id}:${ip}`, 20, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitos pedidos em pouco tempo. Fale com a equipe.");
    const created = await createBrasRequest(await getDb(), s.actor, input);
    refresh();
    return created;
  });
  if (r.ok) redirect("/meu-bras/pedidos?enviado=1");
  return r;
}

export async function setBrasDiscoveryAction(videoId: string, input: z.input<typeof brasDiscoverySchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasDiscovery(db, actor, videoId, input); refresh(); return r; });
}

export async function saveBrasAnalysisSettingsAction(input: unknown) {
  return runAction(async () => { const { actor, db } = await master(); const r = await saveBrasAnalysisSettings(db, actor, input); refresh(); return r; });
}

export async function grantBrasAccessAction(input: z.input<typeof brasGrantSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await grantBrasAccess(db, actor, input); refresh(); return r; });
}

export async function revokeBrasAccessAction(grantId: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await revokeBrasAccess(db, actor, grantId); refresh(); return r; });
}

/** Comissão (D102): padrão, dados da importadora, marcar o mês como recebido e desfazer. */
export async function setBrasDefaultCommissionAction(pct: number) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasDefaultCommissionBps(db, actor, Math.round(pct * 100)); refresh(); return r; });
}
export async function updateBrasImporterDetailsAction(id: string, input: z.input<typeof brasImporterDetailsSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await updateBrasImporterDetails(db, actor, id, input); refresh(); return r; });
}
export async function settleBrasCommissionAction(input: z.input<typeof brasSettleSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await settleBrasCommission(db, actor, input); refresh(); return r; });
}
export async function undoBrasSettlementAction(id: string, reason: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await undoBrasSettlement(db, actor, id, reason); refresh(); return r; });
}

/** Balcão (D106): link privado por importadora, só com a chave BRAS_PANELS ligada. */
export async function createBalcaoLinkAction(importerId: string) {
  return runAction(async () => {
    if (!brasPanelsEnabled()) throw new DomainError("PANELS_OFF", "O Balcão está desligado (BRAS_PANELS).");
    const { actor, db } = await master(); const r = await createBalcaoLink(db, actor, importerId); refresh(); return r;
  });
}
export async function revokeBalcaoLinkAction(importerId: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await revokeBalcaoLink(db, actor, importerId); refresh(); return r; });
}
/** Confirmação de retirada pela importadora (sem login, pelo link). Limite de tentativas por link contra chute de código. */
export async function confirmBalcaoPickupAction(token: string, requestId: string, code: string) {
  return runAction(async () => {
    if (!brasPanelsEnabled()) throw new DomainError("PANELS_OFF", "Balcão indisponível.");
    if (!rateLimit(`balcao:${token.slice(0, 16)}`, 12, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const r = await balcaoConfirmPickup(await getDb(), token, requestId, code);
    revalidatePath(`/balcao/${token}`);
    return r;
  });
}

// ---------------------------------------------------------------------------
// Brás v2 fase 0 (D108): regras, classificação, jurídico, suporte e pauta
// ---------------------------------------------------------------------------
export async function saveBrasRulesAction(patch: Partial<BrasRulesInput>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await saveBrasRules(db, actor, patch); refresh(); return { version: r.version }; });
}
export async function saveBrasClassificationAction(input: unknown) {
  return runAction(async () => { const { actor, db } = await master(); await saveBrasClassification(db, actor, input); refresh(); return undefined; });
}
export async function saveBrasLegalAction(input: Parameters<typeof saveBrasLegal>[2]) {
  return runAction(async () => { const { actor, db } = await master(); await saveBrasLegal(db, actor, input); refresh(); return undefined; });
}
export async function setBrasLevelOverrideAction(memberId: string, level: BrasClientLevel | null, reason?: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasLevelOverride(db, actor, memberId, level, reason); refresh(); return r; });
}

/** Nível do membro logado (para o reforço de suporte da grande conta), sempre do banco. */
async function memberCtx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Entre na sua conta.");
  const db = await getDb();
  const m = await getBrasMemberByUser(db, s.user.id);
  return { actor: s.actor, db, level: m ? await brasMemberLevel(db, m) : null };
}
export async function saveMyBrasProfileAction(input: BrasProfileInput) {
  return runAction(async () => { const { actor, db } = await memberCtx(); const r = await saveMyBrasProfile(db, actor, input); revalidatePath("/meu-bras", "layout"); return r; });
}
export async function sendBrasSupportMessageAction(body: string) {
  return runAction(async () => {
    const { actor, db, level } = await memberCtx();
    if (!rateLimit(`bras-chat:${actor.userId}`, 20, 10 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas mensagens seguidas. Aguarde a resposta da equipe.");
    const r = await sendBrasSupportMessage(db, actor, body, level); revalidatePath("/meu-bras/suporte"); revalidatePath("/bras/atendimento"); return r;
  });
}
export async function requestBrasAppointmentAction(input: z.input<typeof brasAppointmentSchema>) {
  return runAction(async () => { const { actor, db, level } = await memberCtx(); const r = await requestBrasAppointment(db, actor, input, level); revalidatePath("/meu-bras/suporte"); revalidatePath("/bras/atendimento"); return r; });
}
export async function cancelMyBrasAppointmentAction(id: string) {
  return runAction(async () => { const { actor, db } = await memberCtx(); const r = await cancelMyBrasAppointment(db, actor, id); revalidatePath("/meu-bras/suporte"); revalidatePath("/bras/atendimento"); return r; });
}
export async function replyBrasSupportAction(memberId: string, body: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await replyBrasSupport(db, actor, memberId, body); revalidatePath("/bras/atendimento"); revalidatePath("/meu-bras/suporte"); return r; });
}
export async function decideBrasAppointmentAction(id: string, input: Parameters<typeof decideBrasAppointment>[3]) {
  return runAction(async () => { const { actor, db } = await master(); const r = await decideBrasAppointment(db, actor, id, input); revalidatePath("/bras/atendimento"); revalidatePath("/meu-bras/suporte"); return r; });
}
export async function saveBrasContentAction(id: string | null, input: z.input<typeof brasContentSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await saveBrasContent(db, actor, id, input); revalidatePath("/bras/pauta"); return r; });
}
export async function deleteBrasContentAction(id: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await deleteBrasContent(db, actor, id); revalidatePath("/bras/pauta"); return r; });
}
export async function requestBrasPlanUpgradeAction(plan: "PRATA" | "OURO" | "PLATINUM") {
  return runAction(async () => { const { actor, db } = await memberCtx(); const r = await requestBrasPlanUpgrade(db, actor, plan); revalidatePath("/bras/atendimento"); return r; });
}
