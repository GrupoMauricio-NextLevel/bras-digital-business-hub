import type { FetchLike } from "@/lib/payments/mercadopago";

/** Plataformas de envio que o fornecedor pode conectar. A verificação consulta a conta com o token informado. */
export const SHIPPING_PROVIDERS = {
  SUPERFRETE: { name: "SuperFrete", url: "https://api.superfrete.com/api/v0/user", help: "No SuperFrete: Integrações, Desenvolvedores, gerar token." },
  MELHOR_ENVIO: { name: "Melhor Envio", url: "https://melhorenvio.com.br/api/v2/me", help: "No Melhor Envio: Configurações, Tokens, gerar novo token (com permissão de envios)." },
} as const;
export type ShippingProviderKey = keyof typeof SHIPPING_PROVIDERS;
export const SHIPPING_PROVIDER_KEYS = Object.keys(SHIPPING_PROVIDERS) as ShippingProviderKey[];

export class ShippingError extends Error {}

export async function verifyShippingToken(provider: ShippingProviderKey, token: string, fetchImpl: FetchLike = fetch): Promise<{ account: string }> {
  const p = SHIPPING_PROVIDERS[provider];
  let res: Response;
  try {
    res = await fetchImpl(p.url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": "SuperDrop (suporte@superdrop.com.br)" } });
  } catch { throw new ShippingError(`Não foi possível falar com o ${p.name}. Tente de novo em instantes.`); }
  if (res.status === 401 || res.status === 403) throw new ShippingError(`O ${p.name} recusou o token. Gere um novo e confira as permissões.`);
  if (!res.ok) throw new ShippingError(`O ${p.name} respondeu com erro (${res.status}).`);
  const body = (await res.json().catch(() => ({}))) as { email?: string; firstname?: string; name?: string; id?: string | number };
  const account = body.email || [body.firstname, (body as { lastname?: string }).lastname].filter(Boolean).join(" ") || body.name || (body.id ? String(body.id) : "conta conectada");
  return { account };
}
