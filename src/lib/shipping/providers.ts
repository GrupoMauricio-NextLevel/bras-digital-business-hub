import type { FetchLike } from "@/lib/payments/mercadopago";
import { timeoutSignal } from "@/lib/http-timeout";

/**
 * Plataformas de envio que o fornecedor (ou a conta simples do lojista) pode conectar. A verificação consulta a plataforma
 * com o token informado. Onlog: só a credencial de integração (API), como na wBuy; endereço e formato vêm do plugin
 * oficial "Frete Onlog" para WooCommerce (apponlog.com.br/apiwoocommerce). PRECISA VALIDAR com credencial real.
 */
export const ONLOG_BASE = process.env.SHIPPING_ONLOG_BASE ?? "https://apponlog.com.br/apiwoocommerce";
export const SHIPPING_PROVIDERS = {
  SUPERFRETE: { name: "SuperFrete", url: "https://api.superfrete.com/api/v0/user", method: "GET", tokenLabel: "Token de acesso", help: "No SuperFrete: Integrações, Desenvolvedores, gerar token." },
  MELHOR_ENVIO: { name: "Melhor Envio", url: "https://melhorenvio.com.br/api/v2/me", method: "GET", tokenLabel: "Token de acesso", help: "No Melhor Envio: Configurações, Tokens, gerar novo token (com permissão de envios)." },
  ONLOG: { name: "Onlog", url: `${ONLOG_BASE}/frete/disponibilidade`, method: "POST", tokenLabel: "Credencial de integração Onlog (API)", help: "Na Onlog: copie a credencial de integração (API) da sua conta e cole aqui." },
} as const;
export type ShippingProviderKey = keyof typeof SHIPPING_PROVIDERS;
export const SHIPPING_PROVIDER_KEYS = Object.keys(SHIPPING_PROVIDERS) as ShippingProviderKey[];

export class ShippingError extends Error {}

export async function verifyShippingToken(provider: ShippingProviderKey, token: string, fetchImpl: FetchLike = fetch): Promise<{ account: string }> {
  const p = SHIPPING_PROVIDERS[provider];
  let res: Response;
  try {
    res = await fetchImpl(p.url, { method: p.method, signal: timeoutSignal(), headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": "SuperDrop (suporte@superdrop.com.br)", ...(p.method === "POST" ? { "Content-Type": "application/json" } : {}) }, ...(p.method === "POST" ? { body: "" } : {}) });
  } catch { throw new ShippingError(`Não foi possível falar com o ${p.name}. Tente de novo em instantes.`); }
  if (res.status === 401 || res.status === 403) throw new ShippingError(`O ${p.name} recusou o token. Gere um novo e confira as permissões.`);
  if (!res.ok) throw new ShippingError(`O ${p.name} respondeu com erro (${res.status}).`);
  // A Onlog não informa dados da conta: a credencial aceita basta.
  if (provider === "ONLOG") return { account: "credencial Onlog" };
  const body = (await res.json().catch(() => ({}))) as { email?: string; firstname?: string; name?: string; id?: string | number };
  const account = body.email || [body.firstname, (body as { lastname?: string }).lastname].filter(Boolean).join(" ") || body.name || (body.id ? String(body.id) : "conta conectada");
  return { account };
}
