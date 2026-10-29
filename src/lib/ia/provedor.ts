import type { FetchLike } from "@/lib/payments/mercadopago";
import { timeoutSignal } from "@/lib/http-timeout";

/** Chamada mínima ao modelo da OpenAI (sem SDK), só no servidor. A chave vem do Master já descriptografada. */
export type MensagemIa = { role: "system" | "user" | "assistant"; content: string };
export class IaIndisponivel extends Error {}

export async function conversar(opts: { chave: string; organizacao?: string; modelo: string; mensagens: MensagemIa[]; maxTokens?: number }, fetchImpl: FetchLike = fetch): Promise<string> {
  let res: Response;
  try {
    res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: timeoutSignal(),
      headers: { Authorization: `Bearer ${opts.chave}`, "Content-Type": "application/json", ...(opts.organizacao ? { "OpenAI-Organization": opts.organizacao } : {}) },
      body: JSON.stringify({ model: opts.modelo, messages: opts.mensagens, max_tokens: opts.maxTokens ?? 350, temperature: 0.4 }),
    });
  } catch { throw new IaIndisponivel("O Maurício está fora do ar agora. Tente em instantes."); }
  if (!res.ok) throw new IaIndisponivel("O Maurício está fora do ar agora. Tente em instantes.");
  const b = (await res.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
  const t = b.choices?.[0]?.message?.content?.trim();
  if (!t) throw new IaIndisponivel("O Maurício não conseguiu responder. Tente de novo.");
  return t;
}
