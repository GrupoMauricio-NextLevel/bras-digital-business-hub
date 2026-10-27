import type { FetchLike } from "@/lib/payments/mercadopago";
import { timeoutSignal } from "@/lib/http-timeout";

/**
 * Plataformas de envio que o fornecedor (ou a conta simples do lojista) pode conectar. A verificação consulta a plataforma
 * com o token informado. Onlog: só a credencial de integração (API), como na wBuy; endereço e formato vêm do plugin
 * oficial "Frete Onlog" para WooCommerce (apponlog.com.br/apiwoocommerce). PRECISA VALIDAR com credencial real.
 */
export const ONLOG_BASE = process.env.SHIPPING_ONLOG_BASE ?? "https://apponlog.com.br/apiwoocommerce";
export const FRENET_BASE = process.env.SHIPPING_FRENET_BASE ?? "https://api.frenet.com.br";
export const KANGU_BASE = process.env.SHIPPING_KANGU_BASE ?? "https://portal.kangu.com.br";
export const CORREIOS_BASE = process.env.SHIPPING_CORREIOS_BASE ?? "https://api.correios.com.br";
export const SHIPPING_PROVIDERS = {
  SUPERFRETE: { name: "SuperFrete", url: "https://api.superfrete.com/api/v0/user", method: "GET", tokenLabel: "Token de acesso", help: "No SuperFrete: Integrações, Desenvolvedores, gerar token." },
  MELHOR_ENVIO: { name: "Melhor Envio", url: "https://melhorenvio.com.br/api/v2/me", method: "GET", tokenLabel: "Token de acesso", help: "No Melhor Envio: Configurações, Tokens, gerar novo token (com permissão de envios)." },
  ONLOG: { name: "Onlog", url: `${ONLOG_BASE}/frete/disponibilidade`, method: "POST", tokenLabel: "Credencial de integração Onlog (API)", help: "Na Onlog: copie a credencial de integração (API) da sua conta e cole aqui." },
  // Rodada B das integrações (D190): só na loja da NextLevel E-commerce no começo (NOVAS_PLATAFORMAS_DE_ENVIO).
  FRENET: { name: "Frenet", url: `${FRENET_BASE}/shipping/info`, method: "GET", tokenLabel: "Token da API Frenet", help: "Na Frenet: Painel, Dados da conta, Configurações de API, copie o token." },
  KANGU: { name: "Kangu", url: `${KANGU_BASE}/tms/transporte/simular`, method: "POST", tokenLabel: "Token da Kangu", help: "Na Kangu: Configurações, Integrações, gerar token de API." },
  CORREIOS: { name: "Correios com contrato", url: `${CORREIOS_BASE}/token/v1/autentica/cartaopostagem`, method: "POST", tokenLabel: "Dados do contrato", help: "No portal Meu Correios (CWS): o usuário (CPF ou CNPJ do Meu Correios), o código de acesso às APIs e o número do cartão de postagem." },
} as const;
/** Plataformas da Rodada B: aparecem e conectam só na loja independente da E-commerce (o SuperDrop não muda). */
export const NOVAS_PLATAFORMAS_DE_ENVIO: readonly ShippingProviderKey[] = ["FRENET", "KANGU", "CORREIOS"];
export type ShippingProviderKey = keyof typeof SHIPPING_PROVIDERS;
export const SHIPPING_PROVIDER_KEYS = Object.keys(SHIPPING_PROVIDERS) as ShippingProviderKey[];

export class ShippingError extends Error {}

/** Credenciais do contrato dos Correios: guardadas juntas, criptografadas, no mesmo campo do token. */
export type ContratoCorreios = { usuario: string; codigo: string; cartao: string };
export function lerContratoCorreios(token: string): ContratoCorreios | null {
  try {
    const c = JSON.parse(token) as Partial<ContratoCorreios>;
    const usuario = String(c.usuario ?? "").trim(), codigo = String(c.codigo ?? "").trim(), cartao = String(c.cartao ?? "").replace(/\D/g, "");
    return usuario && codigo && cartao.length >= 8 ? { usuario, codigo, cartao } : null;
  } catch { return null; }
}

/** Token de uso dos Correios (vale cerca de 24 horas): usuário e código de acesso, com o cartão de postagem. */
export async function tokenCorreios(c: ContratoCorreios, fetchImpl: FetchLike = fetch): Promise<{ token: string; contrato: string | null }> {
  let res: Response;
  try {
    res = await fetchImpl(SHIPPING_PROVIDERS.CORREIOS.url, { method: "POST", signal: timeoutSignal(), headers: { Authorization: `Basic ${Buffer.from(`${c.usuario}:${c.codigo}`).toString("base64")}`, Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ numero: c.cartao }) });
  } catch { throw new ShippingError("Não foi possível falar com os Correios. Tente de novo em instantes."); }
  if (res.status === 401 || res.status === 403) throw new ShippingError("Os Correios recusaram o usuário, o código de acesso ou o cartão de postagem.");
  if (!res.ok) throw new ShippingError(`Os Correios responderam com erro (${res.status}).`);
  const b = (await res.json().catch(() => ({}))) as { token?: string; cartaoPostagem?: { contrato?: string } };
  if (!b.token) throw new ShippingError("Os Correios não devolveram o acesso. Confira o cartão de postagem.");
  return { token: b.token, contrato: b.cartaoPostagem?.contrato ?? null };
}

/** Cabeçalhos de cada plataforma: a Frenet e a Kangu usam "token"; as outras, "Authorization: Bearer". */
export function cabecalhosDoEnvio(provider: ShippingProviderKey, token: string): Record<string, string> {
  const base = { Accept: "application/json", "User-Agent": "SuperDrop (suporte@superdrop.com.br)" };
  return provider === "FRENET" || provider === "KANGU" ? { ...base, token } : { ...base, Authorization: `Bearer ${token}` };
}

export async function verifyShippingToken(provider: ShippingProviderKey, token: string, fetchImpl: FetchLike = fetch): Promise<{ account: string }> {
  const p = SHIPPING_PROVIDERS[provider];
  if (provider === "CORREIOS") {
    const c = lerContratoCorreios(token);
    if (!c) throw new ShippingError("Preencha o usuário, o código de acesso e o cartão de postagem.");
    const r = await tokenCorreios(c, fetchImpl);
    return { account: r.contrato ? `contrato ${r.contrato}` : `cartão ${c.cartao}` };
  }
  // A Kangu não tem consulta de conta: a verificação é uma cotação pequena (São Paulo para São Paulo).
  const corpo = provider === "KANGU" ? JSON.stringify({ cepOrigem: "01001000", cepDestino: "01001000", vlrMerc: 50, pesoMerc: 0.3, produtos: [{ peso: 0.3, altura: 5, largura: 15, comprimento: 20, quantidade: 1, valor: 50 }] }) : "";
  let res: Response;
  try {
    res = await fetchImpl(p.url, { method: p.method, signal: timeoutSignal(), headers: { ...cabecalhosDoEnvio(provider, token), ...(p.method === "POST" ? { "Content-Type": "application/json" } : {}) }, ...(p.method === "POST" ? { body: corpo } : {}) });
  } catch { throw new ShippingError(`Não foi possível falar com o ${p.name}. Tente de novo em instantes.`); }
  if (res.status === 401 || res.status === 403) throw new ShippingError(`O ${p.name} recusou o token. Gere um novo e confira as permissões.`);
  if (!res.ok) throw new ShippingError(`O ${p.name} respondeu com erro (${res.status}).`);
  // A Onlog, a Frenet e a Kangu não informam dados da conta: o token aceito basta.
  if (provider === "ONLOG") return { account: "credencial Onlog" };
  if (provider === "FRENET" || provider === "KANGU") return { account: `token ${p.name} conferido` };
  const body = (await res.json().catch(() => ({}))) as { email?: string; firstname?: string; name?: string; id?: string | number };
  const account = body.email || [body.firstname, (body as { lastname?: string }).lastname].filter(Boolean).join(" ") || body.name || (body.id ? String(body.id) : "conta conectada");
  return { account };
}
