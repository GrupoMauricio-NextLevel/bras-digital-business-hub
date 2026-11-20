import type { CatalogFamily } from "@/db/schema";

/**
 * Palavras que o visitante usa para cada família (busca por intenção da vitrine de Soluções, D162). É texto de apoio,
 * não regra de negócio: preço, nome e escopo continuam vindo do catálogo Master. As plataformas de origem da Migração
 * vêm de `meta.sources` de cada produto, não daqui.
 */
export const SINONIMOS: Partial<Record<CatalogFamily, string[]>> = {
  COMMERCE_PLAN: ["loja virtual", "loja online", "ecommerce", "e-commerce", "criar loja", "plataforma", "site de vendas", "plano", "mensalidade"],
  LOJA_PRONTA: ["loja pronta", "montar loja", "loja montada", "fazer minha loja", "criação de loja", "cadastro de produtos"],
  MIGRACAO: ["migrar", "migração", "trocar de plataforma", "sair da", "mudar de plataforma", "importar produtos", "transferir loja"],
  TEMA: ["tema", "template", "layout", "visual", "design", "aparência da loja"],
  MARKETING: ["anúncio", "anúncios", "tráfego", "tráfego pago", "instagram", "facebook", "tiktok", "google", "mercado livre", "redes sociais", "conteúdo", "vender mais", "divulgar"],
  CONSULTORIA: ["consultoria", "auditoria", "não vendo", "vender mais", "diagnóstico", "crescer", "estratégia"],
  WHITE_LABEL: ["white label", "minha marca", "agência", "revender a plataforma", "minha própria plataforma", "parceiro"],
};

/** Termos de busca normalizados (sem acento, minúsculos), para comparar "migracao" com "migração". */
export const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Itens que combinam com a consulta: todas as palavras da consulta aparecem em algum termo do item. */
export function filtrarPorIntencao<T extends { rotulo: string; termos: string[] }>(itens: T[], consulta: string, limite = 8): T[] {
  const q = normalizar(consulta).split(/\s+/).filter((p) => p.length > 1);
  if (!q.length) return [];
  const pontua = (i: T) => {
    const alvo = [i.rotulo, ...i.termos].map(normalizar).join(" | ");
    if (!q.every((p) => alvo.includes(p))) return -1;
    return normalizar(i.rotulo).includes(q.join(" ")) ? 2 : 1;
  };
  return itens.map((i) => ({ i, s: pontua(i) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limite).map((x) => x.i);
}
