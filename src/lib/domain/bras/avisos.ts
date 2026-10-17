import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdMembers, bdRequests, platformSettings, users } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { sendEmail } from "@/lib/email";
import { formatBRL } from "@/lib/money";
import type { BrasRequestStatus } from "./catalogo";

/**
 * Avisos por e-mail da Brás Digital (D100): o membro sabe o que aconteceu com o pedido e a equipe sabe na hora de cada
 * cadastro e pedido (o atendimento é da Brás, D92). Usa o e-mail transacional existente (`sendEmail`: sem chave da Resend
 * só registra; envio único por `dedupeKey`). Nunca derruba a ação: qualquer falha aqui é registrada e engolida.
 * Destinatários da equipe: `platform_settings` `bras.team_emails` (lista) ou, sem ela, os usuários Master.
 */
const TEAM_KEY = "bras.team_emails";
const base = () => brandByCode("BRAS_DIGITAL").baseUrl.replace(/\/$/, "");
const assinatura = "\n\nEquipe Brás Digital Club";
/** Sem importar `membros` (evita ciclo: o cadastro chama estes avisos). */
const formatCnpj = (c: string) => c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

export async function brasTeamEmails(db: Database): Promise<string[]> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, TEAM_KEY) });
  const list = Array.isArray(row?.value) ? (row.value as unknown[]).filter((e): e is string => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) : [];
  if (list.length) return [...new Set(list.map((e) => e.toLowerCase()))];
  const masters = await db.select({ email: users.email }).from(users).where(eq(users.role, "NEXTLEVEL_MASTER"));
  return [...new Set(masters.map((m) => m.email.toLowerCase()))];
}

async function seguro(nome: string, fn: () => Promise<unknown>) {
  try { await fn(); } catch (e) { console.error(`[bras avisos] ${nome}`, e); }
}

/** Boas-vindas ao membro e aviso de novo membro à equipe. */
export async function notifyBrasSignup(db: Database, memberId: string) {
  await seguro("cadastro", async () => {
    const [m] = await db.select({ member: bdMembers, name: users.name, email: users.email }).from(bdMembers).innerJoin(users, eq(users.id, bdMembers.userId)).where(eq(bdMembers.id, memberId)).limit(1);
    if (!m) return;
    const primeiro = m.name.split(" ")[0];
    await sendEmail(db, {
      kind: "BRAS_WELCOME", brand: "BRAS_DIGITAL", to: m.email, dedupeKey: `bras-welcome-${memberId}`,
      subject: "Bem-vindo ao Brás Digital Club",
      text: `Olá, ${primeiro}!\n\nO cadastro da ${m.member.companyName} está ativo. Você já vê o preço da caixa, as caixas disponíveis e o veredito de cada descoberta.\n\nPara pedir, abra a descoberta, toque em Quero comprar e informe quantas caixas e para onde enviar. A equipe confirma o pedido e o pagamento com você. Retirada no Brás pela sua transportadora.${assinatura}`,
      cta: { label: "Abrir o Meu Brás", url: `${base()}/meu-bras` },
    });
    const origem = m.member.sourceVideoId ? "veio de uma descoberta" : m.member.source ? `origem: ${m.member.source}` : "origem: direto";
    for (const to of await brasTeamEmails(db)) {
      await sendEmail(db, {
        kind: "BRAS_TEAM_NEW_MEMBER", brand: "BRAS_DIGITAL", to, dedupeKey: `bras-team-member-${memberId}:${to}`,
        subject: `Novo membro: ${m.member.companyName}`,
        text: `Empresa: ${m.member.companyName}\nCNPJ: ${formatCnpj(m.member.cnpj)}\nContato: ${m.name}\nWhatsApp: ${m.member.whatsapp}\nE-mail: ${m.email}\n${origem[0]!.toUpperCase()}${origem.slice(1)}.`,
        cta: { label: "Ver membros", url: `${base()}/bras/membros` },
      });
    }
  });
}

const TEXTO: Record<Exclude<BrasRequestStatus, "NEW">, (r: typeof bdRequests.$inferSelect) => { subject: string; text: string }> = {
  CONFIRMED: (r) => ({ subject: `Pedido ${r.number} confirmado`, text: `A equipe confirmou o seu pedido ${r.number}: ${r.boxes} caixa(s) de ${r.productTitle}.\n\nImportadora: ${r.importerName}.\nTotal: ${formatBRL(r.totalCents)}.\n\nO pagamento é combinado com a equipe do Brás Digital Club.` }),
  PAID: (r) => ({ subject: `Pagamento do pedido ${r.number} registrado`, text: `Registramos o pagamento do pedido ${r.number}.\n\nAgora é com a sua transportadora (${r.carrier}): a retirada é na importadora ${r.importerName}, no Brás.` }),
  PICKED_UP: (r) => ({ subject: `Pedido ${r.number} retirado`, text: `As ${r.boxes} caixa(s) de ${r.productTitle} do pedido ${r.number} foram retiradas pela sua transportadora.\n\nQualquer ocorrência, fale com a equipe do Brás Digital Club.` }),
  CANCELED: (r) => ({ subject: `Pedido ${r.number} cancelado`, text: `O pedido ${r.number} (${r.boxes} caixa(s) de ${r.productTitle}) foi cancelado.\n\nSe você não esperava por isso, fale com a equipe do Brás Digital Club.` }),
};

async function emailDoMembro(db: Database, memberId: string) {
  const [m] = await db.select({ email: users.email, name: users.name, company: bdMembers.companyName }).from(bdMembers).innerJoin(users, eq(users.id, bdMembers.userId)).where(eq(bdMembers.id, memberId)).limit(1);
  return m ?? null;
}

/** Pedido recebido: confirmação ao membro e aviso à equipe (sem dado de outro membro). */
export async function notifyBrasRequestCreated(db: Database, requestId: string) {
  await seguro("pedido", async () => {
    const r = await db.query.bdRequests.findFirst({ where: eq(bdRequests.id, requestId) });
    if (!r) return;
    const m = await emailDoMembro(db, r.memberId);
    if (m) {
      await sendEmail(db, {
        kind: "BRAS_REQUEST_NEW", brand: "BRAS_DIGITAL", to: m.email, dedupeKey: `bras-request-${r.id}-NEW`,
        subject: `Recebemos o seu pedido ${r.number}`,
        text: `Pedido ${r.number}: ${r.boxes} caixa(s) de ${r.productTitle}.\nTotal estimado: ${formatBRL(r.totalCents)}.\nEnvio: ${r.shipCity}/${r.shipState}, pela ${r.carrier}.\n\nA equipe do Brás Digital Club confirma com você a disponibilidade, o valor e o pagamento.${assinatura}`,
        cta: { label: "Ver meus pedidos", url: `${base()}/meu-bras/pedidos` },
      });
    }
    for (const to of await brasTeamEmails(db)) {
      await sendEmail(db, {
        kind: "BRAS_TEAM_NEW_REQUEST", brand: "BRAS_DIGITAL", to, dedupeKey: `bras-team-request-${r.id}:${to}`,
        subject: `Novo pedido ${r.number}: ${r.boxes} caixa(s) de ${r.productTitle}`,
        text: `Empresa: ${m?.company ?? "membro"}\nProduto: ${r.productTitle}\nCaixas: ${r.boxes} (${r.unitsPerBox} un. cada)\nTotal: ${formatBRL(r.totalCents)}\nImportadora: ${r.importerName}\nEnvio: ${r.shipCity}/${r.shipState}, ${r.carrier}`,
        cta: { label: "Abrir pedidos no Estúdio", url: `${base()}/bras` },
      });
    }
  });
}

/** Mudança de situação: um e-mail ao membro por situação (repetir a mesma situação não reenvia). */
export async function notifyBrasRequestStatus(db: Database, requestId: string, status: BrasRequestStatus) {
  if (status === "NEW") return;
  await seguro("situação", async () => {
    const r = await db.query.bdRequests.findFirst({ where: eq(bdRequests.id, requestId) });
    if (!r) return;
    const m = await emailDoMembro(db, r.memberId);
    if (!m) return;
    const t = TEXTO[status](r);
    await sendEmail(db, { kind: `BRAS_REQUEST_${status}`, brand: "BRAS_DIGITAL", to: m.email, dedupeKey: `bras-request-${r.id}-${status}`, subject: t.subject, text: t.text + assinatura, cta: { label: "Ver meus pedidos", url: `${base()}/meu-bras/pedidos` } });
  });
}
