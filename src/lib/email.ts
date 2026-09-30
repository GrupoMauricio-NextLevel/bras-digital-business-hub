import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { emailOutbox, partners, users } from "@/db/schema";
import { newId } from "@/lib/ids";

export type EmailInput = { kind: string; to: string; subject: string; text: string; cta?: { label: string; url: string }; dedupeKey?: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const BRAND = "#0f1c16", ACCENT = "#22c55e";

/** HTML simples e compatível com clientes de e-mail (tabelas e estilos em linha), com a assinatura da NextLevel. */
export function renderHtml(m: Pick<EmailInput, "subject" | "text" | "cta">): string {
  const paras = m.text.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1f2937">${esc(p).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0b6b34">$1</a>')}</p>`).join("");
  const cta = m.cta ? `<p style="margin:22px 0"><a href="${esc(m.cta.url)}" style="display:inline-block;background:${ACCENT};color:#052e14;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px">${esc(m.cta.label)}</a></p>` : "";
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6f5;padding:24px 12px;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden" cellpadding="0" cellspacing="0"><tr><td style="background:${BRAND};padding:18px 24px;color:#ffffff;font-size:18px;font-weight:700">SuperDrop</td></tr><tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px;color:${BRAND}">${esc(m.subject)}</h1>${paras}${cta}</td></tr><tr><td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5">SuperDrop é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda.<br>Você recebeu este e-mail porque tem uma conta ou fez uma compra na plataforma.</td></tr></table></td></tr></table></body></html>`;
}

/**
 * E-mail transacional. Com `RESEND_API_KEY` e `EMAIL_FROM` envia pela API da Resend (`EMAIL_REPLY_TO` opcional);
 * sem eles só registra (status LOGGED). Com `dedupeKey` envia no máximo uma vez. Nunca lança: falha de e-mail
 * não pode derrubar cadastro, pagamento ou recuperação de senha.
 */
export async function sendEmail(db: Database, m: EmailInput, fetchImpl: typeof fetch = fetch): Promise<"SENT" | "FAILED" | "LOGGED" | "SKIPPED"> {
  const id = newId("eml");
  try {
    const r = await db.insert(emailOutbox).values({ id, kind: m.kind, toEmail: m.to, subject: m.subject, body: m.text + (m.cta ? `\n\n${m.cta.label}: ${m.cta.url}` : ""), status: "LOGGED", dedupeKey: m.dedupeKey ?? null }).onConflictDoNothing().returning({ id: emailOutbox.id });
    if (!r.length) return "SKIPPED";
  } catch (e) { console.error("[email outbox]", e); return "FAILED"; }
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from) return "LOGGED";
  let status: "SENT" | "FAILED" = "SENT"; let error: string | null = null;
  try {
    const replyTo = process.env.EMAIL_REPLY_TO;
    const res = await fetchImpl("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [m.to], subject: m.subject, text: m.text + (m.cta ? `\n\n${m.cta.label}: ${m.cta.url}` : ""), html: renderHtml(m), ...(replyTo ? { reply_to: replyTo } : {}) }) });
    if (!res.ok) { status = "FAILED"; error = `HTTP ${res.status}`; }
  } catch (e) { status = "FAILED"; error = e instanceof Error ? e.message.slice(0, 200) : "erro"; }
  try { await db.update(emailOutbox).set({ status, error }).where(eq(emailOutbox.id, id)); } catch (e) { console.error("[email outbox]", e); }
  return status;
}

/** Destinatários por tenant: donos da loja, administradores do fornecedor ou o parceiro. */
export async function recipientsOf(db: Database, t: { storeId?: string | null; supplierId?: string | null; partnerId?: string | null }): Promise<string[]> {
  const out = new Set<string>();
  if (t.storeId) for (const u of await db.select({ email: users.email }).from(users).where(and(eq(users.storeId, t.storeId), eq(users.role, "STORE_OWNER")))) out.add(u.email);
  else if (t.supplierId) for (const u of await db.select({ email: users.email }).from(users).where(and(eq(users.supplierId, t.supplierId), inArray(users.role, ["SUPPLIER_ADMIN"])))) out.add(u.email);
  if (t.partnerId) { const p = await db.query.partners.findFirst({ where: eq(partners.id, t.partnerId) }); const u = p ? await db.query.users.findFirst({ where: eq(users.id, p.userId) }) : null; if (u) out.add(u.email); }
  return [...out];
}

/** Envia o mesmo aviso a todos os destinatários do tenant; a trava de envio único vale por destinatário. */
export async function notifyTenant(db: Database, t: Parameters<typeof recipientsOf>[1], m: Omit<EmailInput, "to">): Promise<number> {
  let n = 0;
  for (const to of await recipientsOf(db, t)) if ((await sendEmail(db, { ...m, to, dedupeKey: m.dedupeKey ? `${m.dedupeKey}:${to}` : undefined })) !== "SKIPPED") n++;
  return n;
}

const app = () => (process.env.APP_URL ?? process.env.URL ?? "https://superdrop.com.br").replace(/\/$/, "");
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const sign = "\n\n— Equipe NextLevel";

export const emails = {
  passwordReset: (link: string) => ({ subject: "Redefinir a sua senha SuperDrop", text: `Recebemos um pedido para redefinir a sua senha. O link vale por 1 hora.\n\nSe não foi você, ignore este e-mail: a sua senha continua a mesma.${sign}`, cta: { label: "Criar nova senha", url: link } }),
  welcomeStore: (name: string, url: string, trial: boolean) => ({ subject: "Bem-vindo ao SuperDrop", text: `Olá! A loja ${name} foi criada.\n\n${trial ? "Você tem 7 dias de teste com todas as funcionalidades." : "Assim que o pagamento por Pix for confirmado, o acesso é liberado sozinho."}${sign}`, cta: { label: "Abrir o meu painel", url } }),
  welcomePartner: (name: string, url: string) => ({ subject: "Você é parceiro SuperDrop", text: `Olá, ${name}! Seu cadastro no Programa de Parceiros está ativo.\n\nSeus links, cupons e comissões estão no escritório virtual. Lembrete: ative 1 novo cliente por mês para manter o cadastro gratuito.${sign}`, cta: { label: "Abrir o escritório virtual", url } }),
  nlOrderPaid: (product: string, number: number, url: string) => ({ subject: `Pagamento confirmado · pedido #${number}`, text: `Recebemos o pagamento de "${product}" (pedido #${number}).\n\nA equipe NextLevel vai falar com você pelo WhatsApp.${sign}`, cta: { label: "Acompanhar o pedido", url } }),
  payoutPaid: (amount: string) => ({ subject: "Seu saque foi pago", text: `O saque de ${amount} foi pago por Pix para a chave cadastrada.${sign}` }),
  invoicePaid: (description: string, amountCents: number, path: string) => ({ subject: "Pagamento confirmado", text: `Recebemos o pagamento de ${brl(amountCents)}: ${description}.\n\nObrigado! Seu acesso já está atualizado.${sign}`, cta: { label: "Abrir o painel", url: `${app()}${path}` } }),
  dunning: (message: string, path: string) => ({ subject: "Aviso de pagamento SuperDrop", text: `${message}\n\nPague por Pix em poucos segundos e o acesso é liberado sozinho.${sign}`, cta: { label: "Pagar agora", url: `${app()}${path}` } }),
  trialEnding: (days: number, path: string) => ({ subject: days <= 0 ? "Seu teste de 7 dias termina hoje" : `Seu teste termina em ${days} dia${days > 1 ? "s" : ""}`, text: `Para continuar vendendo sem interrupção, assine o seu plano por Pix. O acesso é liberado na hora, sem burocracia.${sign}`, cta: { label: "Assinar por Pix", url: `${app()}${path}` } }),
  customerOrderPaid: (store: string, number: number, total: number, trackUrl: string) => ({ subject: `Pagamento confirmado · pedido #${number} da ${store}`, text: `Recebemos o pagamento de ${brl(total)} do seu pedido #${number} na loja ${store}.\n\nAvisaremos quando ele for enviado. Você também pode acompanhar a qualquer momento.`, cta: { label: "Acompanhar o pedido", url: trackUrl } }),
  customerOrderShipped: (store: string, number: number, carrier: string | null, code: string | null, trackUrl: string) => ({ subject: `Seu pedido #${number} foi enviado`, text: `A loja ${store} enviou o seu pedido #${number}.${carrier || code ? `\n\nTransportadora: ${carrier ?? "—"}\nCódigo de rastreio: ${code ?? "—"}` : ""}`, cta: { label: "Acompanhar o pedido", url: trackUrl } }),
  partnerActivation: (url: string, first: string) => ({ subject: "Você fez uma nova ativação!", text: `Uma loja indicada por você acabou de pagar a ativação. A comissão já aparece no seu extrato, em garantia até ficar disponível.${first}${sign}`, cta: { label: "Ver o financeiro", url } }),
};
export { app as appUrl };
