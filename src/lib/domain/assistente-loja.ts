import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores } from "@/db/schema";
import { listStoreCatalog } from "./catalog";
import { JOURNEY_LABEL, trackOrder } from "./tracking";

/**
 * Assistente da loja (D239, fase L3): o chat da vitrine responde com os DADOS da loja, sem inventar:
 *  - "onde está meu pedido": com o número e o e-mail da compra, mostra a etapa real do pedido (`trackOrder`);
 *  - pergunta sobre produto: procura no catálogo ativo e devolve até 4 produtos com preço e link;
 *  - o resto segue para os guias do comprador e, se a pessoa quiser, para o lojista (caixa de Atendimento).
 * Sem IA externa (sem custo e sem cota): regras simples e dados reais.
 */
export type RespostaAssistente =
  | { tipo: "produtos"; texto: string; produtos: { nome: string; precoCents: number; href: string; imagem: string | null }[] }
  | { tipo: "pedido"; texto: string; numero: number; etapa: string; detalhe: string; rastreio: string | null; href: string }
  | { tipo: "pedir-pedido"; texto: string }
  | { tipo: "nada" };

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const PARADAS = new Set(["voces", "vcs", "tem", "tenho", "quero", "queria", "gostaria", "algum", "alguma", "para", "pra", "com", "sem", "uma", "uns", "umas", "qual", "quais", "preco", "valor", "quanto", "custa", "vende", "vendem", "loja", "produto", "produtos", "esse", "essa", "isso", "mais", "tambem", "favor", "por", "obrigado", "ola", "bom", "boa", "dia", "tarde", "noite"]);
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const NUMERO = /(?:pedido|n[ºo°]?|#)\s*#?\s*(\d{1,8})|\b(\d{3,8})\b/i;

/** É uma pergunta sobre pedido já feito? */
export const falaDePedido = (q: string) => /\b(meu pedido|pedido|rastre|rastreio|entrega|chegou|chega|onde est|status|codigo de rastreio)/.test(sem(q));

export async function responderNaLoja(db: Database, slug: string, pergunta: string): Promise<RespostaAssistente> {
  const q = pergunta.trim().slice(0, 300);
  if (!q) return { tipo: "nada" };
  const loja = await db.query.stores.findFirst({ where: eq(stores.slug, slug), columns: { id: true, slug: true, status: true } });
  if (!loja || loja.status !== "ACTIVE") return { tipo: "nada" };
  const base = `/store/${loja.slug}`;

  if (falaDePedido(q)) {
    const email = q.match(EMAIL)?.[0];
    const m = q.replace(EMAIL, " ").match(NUMERO);
    const numero = m ? Number(m[1] ?? m[2]) : NaN;
    if (!email || !Number.isInteger(numero)) return { tipo: "pedir-pedido", texto: "Para ver o seu pedido, me mande o número do pedido e o e-mail usado na compra (ex.: pedido 1042, maria@email.com)." };
    const t = await trackOrder(db, loja.id, { number: String(numero), email });
    if (!t) return { tipo: "pedir-pedido", texto: "Não achei um pedido com esse número e esse e-mail. Confira os dois (estão no e-mail de confirmação da compra) e mande de novo." };
    const etapa = t.canceled ? "Cancelado" : JOURNEY_LABEL[t.step].title;
    return { tipo: "pedido", texto: `Pedido #${t.number}:`, numero: t.number, etapa, detalhe: t.canceled ? (t.refunded ? "O valor foi devolvido." : "Este pedido foi cancelado.") : JOURNEY_LABEL[t.step].text, rastreio: t.trackingCode, href: `${base}/acompanhar?pedido=${t.number}` };
  }

  const termos = sem(q).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !PARADAS.has(w));
  if (!termos.length) return { tipo: "nada" };
  const catalogo = await listStoreCatalog(db, loja.id);
  const pontos = catalogo.map((c) => {
    const alvo = sem(`${c.product.name} ${c.product.description ?? ""}`);
    const nome = sem(c.product.name);
    const p = termos.reduce((n, w) => n + (nome.includes(w) ? 3 : alvo.includes(w) ? 1 : 0), 0);
    return { c, p };
  }).filter((x) => x.p > 0).sort((a, b) => b.p - a.p).slice(0, 4);
  if (!pontos.length) return { tipo: "nada" };
  return {
    tipo: "produtos", texto: pontos.length === 1 ? "Achei este na loja:" : "Achei estes na loja:",
    produtos: pontos.map(({ c }) => ({ nome: c.product.name, precoCents: c.storeProduct.priceCents, href: `${base}/product/${c.product.slug}`, imagem: (c.product.images as string[] | null)?.[0] ?? null })),
  };
}
