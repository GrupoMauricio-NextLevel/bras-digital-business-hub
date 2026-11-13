/**
 * Cliente da API de e-mail da Hostinger (Agentic Mail, D290). Base `https://api.mail.hostinger.com/api/v1`, token em
 * `HOSTINGER_MAIL_TOKEN` (o dono cola no Render; nunca em código, tela ou log). A caixa é descoberta por `/me`.
 * Só o servidor usa este arquivo.
 */
// Endereço alternativo só fora de produção (simulador local para conferir a tela).
const BASE = (process.env.NODE_ENV !== "production" && process.env.HOSTINGER_MAIL_API_BASE) || "https://api.mail.hostinger.com/api/v1";

export type Endereco = { name: string; address: string };
export type Anexo = { id: string; contentType: string; sizeBytes: number; inline: boolean; filename: string | null; contentId: string | null };
export type Mensagem = {
  uid: number; path: string; date: string; flags: string[]; unseen: boolean; size: number; subject: string | null;
  from: Endereco[]; to: Endereco[]; cc: Endereco[]; bcc: Endereco[]; messageId: string | null; inReplyTo: string | null; attachments: Anexo[];
};
export type Pasta = { path: string; name: string; specialUse: string | null; messageCount: number; unreadCount: number };
export type Paginacao = { page: number; perPage: number; total: number; totalPages: number };

export class ErroCaixa extends Error { constructor(public status: number, msg: string) { super(msg); } }

export const caixaConfigurada = () => !!process.env.HOSTINGER_MAIL_TOKEN;

async function chamar<T>(path: string, init: RequestInit = {}, fetchImpl: typeof fetch = fetch): Promise<T> {
  const token = process.env.HOSTINGER_MAIL_TOKEN;
  if (!token) throw new ErroCaixa(0, "A caixa de e-mail ainda não está ligada (falta o token da Hostinger no Render).");
  const res = await fetchImpl(`${BASE}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const msg = res.status === 401 || res.status === 403 ? "O token da Hostinger não tem acesso a esta caixa." : res.status === 429 ? "A Hostinger pediu uma pausa (muitas consultas). Tente de novo em alguns segundos." : res.status === 404 ? "Mensagem ou pasta não encontrada." : `A Hostinger respondeu com erro ${res.status}.`;
    throw new ErroCaixa(res.status, msg);
  }
  return (await res.json()) as T;
}

let caixaCache: { id: string; address: string; em: number } | null = null;
/** A caixa (resourceId e endereço) do token; guardada por 10 minutos. */
export async function minhaCaixa(): Promise<{ id: string; address: string }> {
  if (caixaCache && Date.now() - caixaCache.em < 600_000) return caixaCache;
  const r = await chamar<{ data: { mailboxes: { resourceId: string; address: string }[] } }>("/me");
  const m = r.data.mailboxes[0];
  if (!m) throw new ErroCaixa(404, "O token não dá acesso a nenhuma caixa.");
  caixaCache = { id: m.resourceId, address: m.address, em: Date.now() };
  return caixaCache;
}

const f = (pasta: string) => encodeURIComponent(pasta);

/** A API manda `from` como um endereço só e as listas às vezes vazias ou ausentes: tudo vira lista aqui. */
const lista = (v: unknown): Endereco[] => (Array.isArray(v) ? v : v && typeof v === "object" ? [v] : []).map((x) => ({ name: String((x as Endereco).name ?? ""), address: String((x as Endereco).address ?? "") })).filter((x) => x.address);
export function normalizar(m: Record<string, unknown>): Mensagem {
  return { ...(m as unknown as Mensagem), from: lista(m.from), to: lista(m.to), cc: lista(m.cc), bcc: lista(m.bcc), attachments: Array.isArray(m.attachments) ? (m.attachments as Anexo[]) : [], flags: Array.isArray(m.flags) ? (m.flags as string[]) : [] };
}

export async function pastas(): Promise<Pasta[]> {
  const { id } = await minhaCaixa();
  return (await chamar<{ data: Pasta[] }>(`/mailboxes/${id}/folders?perPage=100`)).data;
}

export async function mensagens(pasta: string, page = 1, perPage = 30): Promise<{ data: Mensagem[]; pagination: Paginacao }> {
  const { id } = await minhaCaixa();
  const r = await chamar<{ data: Record<string, unknown>[]; pagination: Paginacao }>(`/mailboxes/${id}/folders/${f(pasta)}/messages?page=${page}&perPage=${perPage}&sort=-date`);
  return { data: r.data.map(normalizar), pagination: r.pagination };
}

export async function buscar(pasta: string, texto: string): Promise<Mensagem[]> {
  const { id } = await minhaCaixa();
  const r = await chamar<{ data: Record<string, unknown>[] }>(`/mailboxes/${id}/folders/${f(pasta)}/messages/search`, { method: "POST", body: JSON.stringify({ subject: texto, from: texto, body: texto }) });
  return r.data.map(normalizar);
}

export async function mensagem(pasta: string, uid: number): Promise<Mensagem> {
  const { id } = await minhaCaixa();
  return normalizar((await chamar<{ data: Record<string, unknown> }>(`/mailboxes/${id}/folders/${f(pasta)}/messages/${uid}`)).data);
}

export async function textoDaMensagem(pasta: string, uid: number): Promise<{ text: string; html: string }> {
  const { id } = await minhaCaixa();
  return (await chamar<{ data: { text: string; html: string } }>(`/mailboxes/${id}/folders/${f(pasta)}/messages/${uid}/text`)).data;
}

export async function mover(pasta: string, uid: number, destino: string) {
  const { id } = await minhaCaixa();
  await chamar(`/mailboxes/${id}/folders/${f(pasta)}/messages/${uid}/move`, { method: "POST", body: JSON.stringify({ targetFolder: destino }) });
}

export async function marcar(pasta: string, uid: number, lida: boolean) {
  const { id } = await minhaCaixa();
  await chamar(`/mailboxes/${id}/folders/${f(pasta)}/messages/${uid}`, { method: "PATCH", body: JSON.stringify(lida ? { addFlags: ["\\Seen"] } : { removeFlags: ["\\Seen"] }) });
}

export async function baixarAnexo(pasta: string, uid: number, anexoId: string): Promise<Response> {
  const { id } = await minhaCaixa();
  const token = process.env.HOSTINGER_MAIL_TOKEN!;
  return fetch(`${BASE}/mailboxes/${id}/folders/${f(pasta)}/messages/${uid}/attachments/${encodeURIComponent(anexoId)}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
}

export type Envio = { to: string[]; cc?: string[]; subject: string; text: string; html?: string; resposta?: { uid: number; folder: string }; displayName?: string };
export async function enviar(e: Envio) {
  const { id } = await minhaCaixa();
  return chamar(`/mailboxes/${id}/send`, { method: "POST", body: JSON.stringify({ to: e.to, cc: e.cc?.length ? e.cc : undefined, subject: e.subject, text: e.text, html: e.html, displayName: e.displayName ?? "NextLevel Commerce", inReplyTo: e.resposta }) });
}
