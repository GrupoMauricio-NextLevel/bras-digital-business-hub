import type { StoreCatalogItem } from "./catalog";

/** XML de produtos no formato do Google Merchant Center (RSS 2.0 com o espaço "g:"), W4 D187. Função pura. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const semTags = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const reais = (c: number) => `${(c / 100).toFixed(2)} BRL`;

export function feedGoogle(loja: { nome: string; origem: string; descricao: string }, catalogo: StoreCatalogItem[]): string {
  const site = new URL(loja.origem).origin;
  const abs = (img: string) => (img.startsWith("/") ? `${site}${img}` : img);
  const itens = catalogo.filter((c) => c.storeProduct.active).map((c) => {
    const disponivel = c.variants.reduce((s, v) => s + v.level.available, 0) > 0;
    const imagem = c.product.images.find((i) => /^https?:\/\//.test(i) || i.startsWith("/"));
    return [
      "  <item>",
      `    <g:id>${esc(c.product.sku || c.product.id)}</g:id>`,
      `    <title>${esc(c.product.name.slice(0, 150))}</title>`,
      `    <description>${esc(semTags(c.product.description || c.product.name).slice(0, 5000))}</description>`,
      `    <link>${esc(`${loja.origem}/product/${c.product.slug}`)}</link>`,
      imagem ? `    <g:image_link>${esc(abs(imagem))}</g:image_link>` : "",
      `    <g:availability>${disponivel ? "in_stock" : "out_of_stock"}</g:availability>`,
      `    <g:price>${reais(c.storeProduct.priceCents)}</g:price>`,
      "    <g:condition>new</g:condition>",
      `    <g:brand>${esc(loja.nome)}</g:brand>`,
      "  </item>",
    ].filter(Boolean).join("\n");
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n  <title>${esc(loja.nome)}</title>\n  <link>${esc(loja.origem)}</link>\n  <description>${esc(loja.descricao || loja.nome)}</description>\n${itens.join("\n")}\n</channel>\n</rss>\n`;
}
