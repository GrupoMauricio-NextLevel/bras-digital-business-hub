import { negocioAberto } from "@/lib/negocios";
import { AVATAR_CEO, CEO } from "@/lib/marcas/equipe";
import { onSignal } from "@/lib/brand-palette";
import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { emailOutbox, organizations, partners, users } from "@/db/schema";
import { brandByCode, type Brand, type BrandCode } from "@/lib/brand";
import { newId } from "@/lib/ids";
import { timeoutSignal } from "@/lib/http-timeout";
import { statSync } from "node:fs";
import { join } from "node:path";

export type EmailInput = { kind: string; to: string; subject: string; text: string; cta?: { label: string; url: string }; /** Assina com nome e foto do CEO (D179). */ ceo?: boolean; dedupeKey?: string; /** Marca do remetente; sem ela vale a marca padrão. */ brand?: BrandCode | null; /** Anexos (D276: cópia do contrato aceito). O conteúdo vai em base64 e não é guardado no registro de e-mails. */ attachments?: { filename: string; contentBase64: string }[] };

/** Troca {marca} pelo nome da marca (os modelos de texto não trazem nome fixo). */
const brandize = (t: string, b: Brand) => t.replaceAll("{marca}", b.name);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML simples e compatível com clientes de e-mail (tabelas e estilos em linha), com a assinatura da NextLevel. */
/** Rodapé do grupo (D132): faixa estática com a cor de cada marca aberta e a frase do Club. */
export type GroupFooter = { segments: { name: string; color: string }[] };
const groupFooterHtml = (g: GroupFooter) => `<tr><td style="padding:14px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${g.segments.map((s) => `<td style="height:6px;background:${s.color}"></td>`).join("")}</tr></table><p style="margin:10px 0 0;font-size:13px;color:#374151">Grupo NextLevel: ${g.segments.map((s) => esc(s.name)).join(" · ")}.</p></td></tr>`;
/**
 * Faixa no topo do e-mail (lote E da auditoria de imagens, 1200×300 em JPG: e-mail não lê AVIF). Só SuperDrop, Commerce e
 * NextLevel têm faixa; sem o arquivo no servidor, o e-mail sai como antes (só a barra com o nome da marca).
 */
const EMAIL_TOPO: Partial<Record<BrandCode, string>> = {
  SUPERDROP: "portal/superdrop/v3/sd-email-topo.jpg",
  NEXTLEVEL_COMMERCE: "portal/commerce/v3/cm-email-topo.jpg",
  NEXTLEVEL: "portal/nextlevel/v3/nl-email-topo.jpg",
};
export function emailTopFor(brand: Pick<Brand, "code" | "baseUrl">): string | null {
  const file = EMAIL_TOPO[brand.code];
  if (!file) return null;
  try { if (statSync(join(process.cwd(), "public", file)).size === 0) return null; } catch { return null; }
  return `${brand.baseUrl.replace(/\/$/, "")}/${file}`;
}

export function renderHtml(m: Pick<EmailInput, "subject" | "text" | "cta" | "ceo">, brand: Brand = brandByCode(undefined), group?: GroupFooter | null): string {
  const BRAND = brand.primaryColor, ACCENT = brand.accentColor;
  const onAccent = onSignal(ACCENT);
  const paras = m.text.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1f2937">${esc(p).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0b6b34">$1</a>')}</p>`).join("");
  const cta = m.cta ? `<p style="margin:22px 0"><a href="${esc(m.cta.url)}" style="display:inline-block;background:${ACCENT};color:${onAccent};font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px">${esc(m.cta.label)}</a></p>` : "";
  const top = emailTopFor(brand);
  // Assinatura do CEO (D179): foto real (JPEG, lido por todo leitor de e-mail) e nome em texto, que aparece mesmo sem imagens.
  const ceo = m.ceo ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr><td style="padding-right:12px;vertical-align:middle"><img src="${esc(`${brand.baseUrl.replace(/\/$/, "")}${AVATAR_CEO}-192.jpg`)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border-radius:50%;border:0"></td><td style="vertical-align:middle;font-size:14px;line-height:1.4;color:#1f2937"><strong>${esc(CEO.nome)}</strong><br><span style="color:#6b7280">${esc(CEO.cargo)}</span></td></tr></table>` : "";
  // Decorativa (alt vazio): o nome da marca vem logo abaixo, em texto, mesmo com as imagens bloqueadas no leitor de e-mail.
  const topRow = top ? `<tr><td style="padding:0;line-height:0;font-size:0"><img src="${esc(top)}" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0"></td></tr>` : "";
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6f5;padding:24px 12px;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden" cellpadding="0" cellspacing="0">${topRow}<tr><td style="background:${BRAND};padding:18px 24px;color:#ffffff;font-size:18px;font-weight:700">${esc(brand.name)}</td></tr><tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px;color:${BRAND}">${esc(m.subject)}</h1>${paras}${cta}${ceo}</td></tr>${group ? groupFooterHtml(group) : ""}<tr><td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5">${esc(brand.legalLine)}<br>Você recebeu este e-mail porque tem uma conta ou fez uma compra na plataforma.</td></tr></table></td></tr></table></body></html>`;
}

/**
 * E-mail transacional. Com `RESEND_API_KEY` e `EMAIL_FROM` envia pela API da Resend (`EMAIL_REPLY_TO` opcional);
 * sem eles só registra (status LOGGED). Com `dedupeKey` envia no máximo uma vez. Nunca lança: falha de e-mail
 * não pode derrubar cadastro, pagamento ou recuperação de senha.
 */
export async function sendEmail(db: Database, m: EmailInput, fetchImpl: typeof fetch = fetch): Promise<"SENT" | "FAILED" | "LOGGED" | "SKIPPED"> {
  const id = newId("eml");
  // D285: marca fechada (hoje, tudo que não é a E-commerce nem o grupo) não assina e-mail; quem estava sem marca ou numa
  // marca em pausa recebe pela NextLevel E-commerce, a frente aberta (D216/D218).
  const pedida = brandByCode(m.brand);
  const brand = pedida.code === "NEXTLEVEL" || negocioAberto(pedida.code) ? pedida : brandByCode("NEXTLEVEL_COMMERCE");
  m = { ...m, subject: brandize(m.subject, brand), text: brandize(m.text, brand), cta: m.cta ? { ...m.cta, label: brandize(m.cta.label, brand) } : undefined };
  // Rodapé do grupo (D132), só com a chave ligada no Master; falha ao ler a chave nunca impede o e-mail.
  let group: GroupFooter | null = null;
  try {
    const eco = await import("@/lib/domain/ecossistema/lancador");
    if ((await eco.getEcoSettings(db)).emailFooter) {
      group = { segments: eco.groupSegments(brand.code) };
      m = { ...m, text: `${m.text}\n\n—\nGrupo NextLevel: ${group.segments.map((x) => x.name).join(" · ")}.` };
    }
  } catch { group = null; }
  try {
    const r = await db.insert(emailOutbox).values({ id, kind: m.kind, toEmail: m.to, subject: m.subject, body: m.text + (m.cta ? `\n\n${m.cta.label}: ${m.cta.url}` : ""), status: "LOGGED", dedupeKey: m.dedupeKey ?? null }).onConflictDoNothing().returning({ id: emailOutbox.id });
    if (!r.length) return "SKIPPED";
  } catch (e) { console.error("[email outbox]", e); return "FAILED"; }
  const key = process.env.RESEND_API_KEY, fromAddr = process.env.EMAIL_FROM;
  if (!key || !fromAddr) return "LOGGED";
  // "Nome da marca <endereço>": só o nome muda por marca; o endereço é do domínio verificado.
  const from = fromAddr.includes("<") ? fromAddr : `${brand.emailFromName} <${fromAddr}>`;
  let status: "SENT" | "FAILED" = "SENT"; let error: string | null = null;
  try {
    const replyTo = process.env.EMAIL_REPLY_TO;
    const res = await fetchImpl("https://api.resend.com/emails", { method: "POST", signal: timeoutSignal(), headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [m.to], subject: m.subject, text: m.text + (m.cta ? `\n\n${m.cta.label}: ${m.cta.url}` : ""), html: renderHtml(m, brand, group), ...(replyTo ? { reply_to: replyTo } : {}), ...(m.attachments?.length ? { attachments: m.attachments.map((a) => ({ filename: a.filename, content: a.contentBase64 })) } : {}) }) });
    if (!res.ok) { status = "FAILED"; error = `HTTP ${res.status}`; }
  } catch (e) { status = "FAILED"; error = e instanceof Error ? e.message.slice(0, 200) : "erro"; }
  try { await db.update(emailOutbox).set({ status, error }).where(eq(emailOutbox.id, id)); } catch (e) { console.error("[email outbox]", e); }
  return status;
}

/** Destinatários por tenant: donos da loja, administradores do fornecedor ou o parceiro. */
export async function recipientsOf(db: Database, t: { storeId?: string | null; supplierId?: string | null; partnerId?: string | null }): Promise<{ email: string; brand: BrandCode }[]> {
  const out = new Map<string, BrandCode>();
  const add = (rows: { email: string; brand: BrandCode }[]) => { for (const r of rows) out.set(r.email, r.brand); };
  const cols = { email: users.email, brand: organizations.brand };
  if (t.storeId) add(await db.select(cols).from(users).innerJoin(organizations, eq(organizations.id, users.organizationId)).where(and(eq(users.storeId, t.storeId), eq(users.role, "STORE_OWNER"))));
  else if (t.supplierId) add(await db.select(cols).from(users).innerJoin(organizations, eq(organizations.id, users.organizationId)).where(and(eq(users.supplierId, t.supplierId), inArray(users.role, ["SUPPLIER_ADMIN"]))));
  if (t.partnerId) { const p = await db.query.partners.findFirst({ where: eq(partners.id, t.partnerId) }); if (p) add(await db.select(cols).from(users).innerJoin(organizations, eq(organizations.id, users.organizationId)).where(eq(users.id, p.userId))); }
  return [...out].map(([email, brand]) => ({ email, brand }));
}

/** Marca da organização de um usuário (para e-mails que não vêm de um cadastro na hora). */
export async function brandOfUser(db: Database, userId: string): Promise<BrandCode> {
  const r = await db.select({ brand: organizations.brand, role: users.role }).from(users).innerJoin(organizations, eq(organizations.id, users.organizationId)).where(eq(users.id, userId)).limit(1);
  // Equipe do Master assina como o grupo (D285).
  if (r[0]?.role === "NEXTLEVEL_MASTER") return "NEXTLEVEL";
  return r[0]?.brand ?? brandByCode(undefined).code;
}

/** Envia o mesmo aviso a todos os destinatários do tenant; a trava de envio único vale por destinatário. */
export async function notifyTenant(db: Database, t: Parameters<typeof recipientsOf>[1], m: Omit<EmailInput, "to">): Promise<number> {
  let n = 0;
  for (const r of await recipientsOf(db, t)) if ((await sendEmail(db, { ...m, to: r.email, brand: m.brand ?? r.brand, dedupeKey: m.dedupeKey ? `${m.dedupeKey}:${r.email}` : undefined })) !== "SKIPPED") n++;
  return n;
}

/** Endereço público: APP_URL (se definido, vale para tudo) ou o da marca informada. */
const app = (b?: BrandCode | null) => (process.env.APP_URL ?? process.env.URL ?? brandByCode(b).baseUrl).replace(/\/$/, "");
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const sign = "\n\n— Equipe NextLevel";

export const emails = {
  passwordReset: (link: string) => ({ subject: "Redefinir a sua senha {marca}", text: `Recebemos um pedido para redefinir a sua senha. O link vale por 1 hora.\n\nSe não foi você, ignore este e-mail: a sua senha continua a mesma.${sign}`, cta: { label: "Criar nova senha", url: link } }),
  welcomeStore: (name: string, url: string, trialDays: number) => ({ ceo: true, subject: "Bem-vindo ao {marca}", text: `Olá! A loja ${name} foi criada.\n\n${trialDays > 0 ? `Você tem ${trialDays} ${trialDays === 1 ? "dia" : "dias"} de teste com todas as funcionalidades.` : "Assim que o pagamento por Pix for confirmado, o acesso é liberado sozinho."}${sign}`, cta: { label: "Abrir o meu painel", url } }),
  welcomePartner: (name: string, url: string) => ({ subject: "Você é parceiro {marca}", text: `Olá, ${name}! Seu cadastro no Programa de Parceiros está ativo.\n\nSeus links, cupons e comissões estão no escritório virtual. Lembrete: ative 1 novo cliente por mês para manter o cadastro gratuito.${sign}`, cta: { label: "Abrir o escritório virtual", url } }),
  nlOrderPaid: (product: string, number: number, url: string) => ({ subject: `Pagamento confirmado · pedido #${number}`, text: `Recebemos o pagamento de "${product}" (pedido #${number}).\n\nA equipe NextLevel vai falar com você pelo WhatsApp.${sign}`, cta: { label: "Acompanhar o pedido", url } }),
  payoutPaid: (amount: string) => ({ subject: "Seu saque foi pago", text: `O saque de ${amount} foi pago por Pix para a chave cadastrada.${sign}` }),
  invoicePaid: (description: string, amountCents: number, path: string) => ({ subject: "Pagamento confirmado", text: `Recebemos o pagamento de ${brl(amountCents)}: ${description}.\n\nObrigado! Seu acesso já está atualizado.${sign}`, cta: { label: "Abrir o painel", url: `${app()}${path}` } }),
  dunning: (message: string, path: string) => ({ subject: "Aviso de pagamento {marca}", text: `${message}\n\nPague por Pix em poucos segundos e o acesso é liberado sozinho.${sign}`, cta: { label: "Pagar agora", url: `${app()}${path}` } }),
  trialEnding: (days: number, path: string) => ({ subject: days <= 0 ? "Seu teste termina hoje" : `Seu teste termina em ${days} dia${days > 1 ? "s" : ""}`, text: `Para continuar vendendo sem interrupção, assine o seu plano por Pix. O acesso é liberado na hora, sem burocracia.${sign}`, cta: { label: "Assinar por Pix", url: `${app()}${path}` } }),
  customerOrderPaid: (store: string, number: number, total: number, trackUrl: string) => ({ subject: `Pagamento confirmado · pedido #${number} da ${store}`, text: `Recebemos o pagamento de ${brl(total)} do seu pedido #${number} na loja ${store}.\n\nAvisaremos quando ele for enviado. Você também pode acompanhar a qualquer momento.`, cta: { label: "Acompanhar o pedido", url: trackUrl } }),
  customerOrderCanceled: (store: string, number: number, total: number, devolucao: "MERCADO_PAGO" | "DEMO" | "MANUAL" | null, trackUrl: string) => ({ subject: `Seu pedido #${number} da ${store} foi cancelado`, text: `A loja ${store} cancelou o seu pedido #${number}.${devolucao === "MERCADO_PAGO" ? `\n\nO valor de ${brl(total)} foi devolvido pelo Mercado Pago, no mesmo meio que você usou: no Pix, volta para a sua conta; no cartão, aparece como estorno na fatura (o prazo depende do banco).` : devolucao === "MANUAL" ? `\n\nA loja vai devolver o valor de ${brl(total)} pelo mesmo meio do pagamento. Se tiver dúvida, fale direto com a loja.` : devolucao === "DEMO" ? "\n\nEste pedido era de demonstração: nenhum valor foi cobrado." : ""}`, cta: { label: "Ver o pedido", url: trackUrl } }),
  abandonedCart: (store: string, name: string | null, qual: 1 | 2, backUrl: string, optOutUrl: string) => ({ subject: qual === 1 ? `Você deixou itens no carrinho da ${store}` : `Seus itens ainda estão separados na ${store}`, text: `${name ? `Olá, ${name.split(" ")[0]}! ` : "Olá! "}${qual === 1 ? `Você começou uma compra na loja ${store} e não terminou.` : `Passando para lembrar da compra que você começou na loja ${store}.`}\n\nO link abaixo refaz o seu carrinho com o preço e o estoque de agora.\n\nNão quer mais esses lembretes? É só abrir este link: ${optOutUrl}`, cta: { label: "Voltar ao carrinho", url: backUrl } }),
  customerOrderShipped: (store: string, number: number, carrier: string | null, code: string | null, trackUrl: string) => ({ subject: `Seu pedido #${number} foi enviado`, text: `A loja ${store} enviou o seu pedido #${number}.${carrier || code ? `\n\nTransportadora: ${carrier ?? "—"}\nCódigo de rastreio: ${code ?? "—"}` : ""}`, cta: { label: "Acompanhar o pedido", url: trackUrl } }),
  leadReceived: (first: string) => ({ subject: "Recebemos o seu contato", text: `Olá, ${first}! Recebemos o seu interesse na {marca}.\n\nNossa equipe fala com você pelo WhatsApp para entender a sua loja e combinar a implantação. Obrigado!${sign}` }),
  partnerActivation: (url: string, first: string) => ({ subject: "Você fez uma nova ativação!", text: `Uma loja indicada por você acabou de pagar a ativação. A comissão já aparece no seu extrato, em garantia até ficar disponível.${first}${sign}`, cta: { label: "Ver o financeiro", url } }),
};
export { app as appUrl };
