import type { Database } from "@/db/client";
import { emailOutbox } from "@/db/schema";
import { newId } from "@/lib/ids";

export type EmailInput = { kind: string; to: string; subject: string; text: string };

/**
 * E-mail transacional. Com `RESEND_API_KEY` e `EMAIL_FROM` envia pela API da Resend; sem eles só registra (status LOGGED).
 * Nunca lança: falha de e-mail não pode derrubar cadastro, pagamento ou recuperação de senha.
 */
export async function sendEmail(db: Database, m: EmailInput, fetchImpl: typeof fetch = fetch): Promise<"SENT" | "FAILED" | "LOGGED"> {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  let status: "SENT" | "FAILED" | "LOGGED" = "LOGGED"; let error: string | null = null;
  if (key && from) {
    try {
      const r = await fetchImpl("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [m.to], subject: m.subject, text: m.text }) });
      if (r.ok) status = "SENT"; else { status = "FAILED"; error = `HTTP ${r.status}`; }
    } catch (e) { status = "FAILED"; error = e instanceof Error ? e.message.slice(0, 200) : "erro"; }
  }
  try { await db.insert(emailOutbox).values({ id: newId("eml"), kind: m.kind, toEmail: m.to, subject: m.subject, body: m.text, status, error }); } catch (e) { console.error("[email outbox]", e); }
  return status;
}

const sign = "\n\n— Equipe NextLevel\nSuperDrop é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda.";

export const emails = {
  passwordReset: (link: string) => ({ subject: "Redefinir a sua senha SuperDrop", text: `Recebemos um pedido para redefinir a sua senha.\n\nAbra o link (vale por 1 hora): ${link}\n\nSe não foi você, ignore este e-mail: a sua senha continua a mesma.${sign}` }),
  welcomeStore: (name: string, url: string, trial: boolean) => ({ subject: "Bem-vindo ao SuperDrop", text: `Olá! A loja ${name} foi criada.\n\n${trial ? "Você tem 7 dias de teste com todas as funcionalidades. " : "Assim que o pagamento por Pix for confirmado, o acesso é liberado sozinho. "}Entre no painel: ${url}${sign}` }),
  welcomePartner: (name: string, url: string) => ({ subject: "Você é parceiro SuperDrop", text: `Olá, ${name}! Seu cadastro no Programa de Parceiros está ativo.\n\nSeus links, cupons e comissões estão no escritório virtual: ${url}\n\nLembrete: ative 1 novo cliente por mês para manter o cadastro gratuito.${sign}` }),
  nlOrderPaid: (product: string, number: number, url: string) => ({ subject: `Pagamento confirmado · pedido #${number}`, text: `Recebemos o pagamento de "${product}" (pedido #${number}).\n\nA equipe NextLevel vai falar com você pelo WhatsApp. Acompanhe o pedido: ${url}${sign}` }),
  payoutPaid: (amount: string) => ({ subject: "Seu saque foi pago", text: `O saque de ${amount} foi pago por Pix para a chave cadastrada.${sign}` }),
};
