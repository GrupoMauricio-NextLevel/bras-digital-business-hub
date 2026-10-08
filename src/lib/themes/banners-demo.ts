/**
 * Banners das lojas de demonstração (pacote do dono de 2026-10: 6 imagens por loja, sem texto embutido).
 * Arquivos em /demos/<loja>/v1/banners/ (scripts/importar-banners.ts):
 *  - hero-<campanha>__desktop.webp e hero-<campanha>__mobile.webp: o destaque responsivo (a campanha é a 1ª do pacote);
 *  - atalho-<categoria>.webp: um atalho por categoria (o nome é o endereço da categoria, ex.: atalho-pinceis).
 * Regras do dono: o destaque de computador nas áreas largas e o de celular no celular (nunca um esticado no outro); os
 * atalhos na grade de categorias e no banner do topo de cada categoria; faixas e blocos de apoio são recortes do destaque
 * (ponto de foco do tema). Cartões, cupom, faixa, camadas e sequência não têm arquivo próprio: cartões, campanhas,
 * mosaico e cupom reaproveitam atalhos e recortes do destaque (só onde o pacote visual não tinha foto); recorte de
 * produto, primeiro plano, quadros da sequência e galeria ficam como estavam (a peça some ou fica nas cores do tema),
 * nunca com imagem quebrada.
 * Puro: quem chama diz se o arquivo existe (`exists`), então dá para testar sem disco.
 */
import { slugify } from "@/lib/ids";
import type { PackageCampaign, VisualPackage } from "./pacotes";

type Media = Record<string, { image: string; imageMobile: string; alt: string }>;
export type DemoBanners = {
  /** Posições que os banners do dono ocupam mesmo quando o pacote visual já tinha imagem (destaque e categorias). */
  forced: Media;
  /** Posições que os banners só preenchem quando estavam pendentes (sem imagem do pacote). */
  fill: Media;
  /** Imagem da grade de categorias, pelo nome da categoria (substitui a do pacote quando há atalho). */
  categoryImages: Record<string, string>;
  /** Arquivos usados (caminhos públicos), para conferência. */
  used: string[];
};

export const bannerPath = (slug: string, name: string) => `/demos/${slug}/v1/banners/${name}.webp`;

export function demoBanners(p: VisualPackage, exists: (publicPath: string) => boolean): DemoBanners {
  const out: DemoBanners = { forced: {}, fill: {}, categoryImages: {}, used: [] };
  const file = (name: string) => { const f = bannerPath(p.slug, name); return exists(f) ? f : ""; };
  const family = p.family;
  const id = (slot: string) => `${family}-${slot}`;

  // Atalhos: um por categoria do catálogo (na ordem do catálogo), pelo endereço da categoria.
  const categories = [...new Set(p.products.map((x) => x.category))];
  const shortcut = new Map<string, string>();
  for (const c of categories) { const f = file(`atalho-${slugify(c)}`); if (f) shortcut.set(c, f); }
  for (const [c, f] of shortcut) {
    out.categoryImages[c] = f;
    out.forced[id(`cat-${slugify(c)}`)] = { image: f, imageMobile: "", alt: "" };
  }

  // Destaque: o da 1ª campanha (computador + celular). Sem a versão de celular, o computador serve aos dois (o
  // componente recorta pelo foco); sem a de computador, nada (não se estica a de celular numa área larga).
  const [c1, c2, c3] = p.campaigns;
  const desktop = c1 ? file(`hero-${c1.id}__desktop`) : "";
  const mobile = c1 ? file(`hero-${c1.id}__mobile`) : "";
  if (desktop) out.forced[id("hero-1")] = { image: desktop, imageMobile: mobile, alt: c1?.headline ?? "" };

  // Atalho que melhor representa uma campanha: a categoria mais frequente nos produtos dela (sem repetir, se der).
  const taken = new Set<string>();
  const forCampaign = (c: PackageCampaign | undefined): string => {
    if (!c) return "";
    const count = new Map<string, number>();
    for (const sku of c.skus) { const cat = p.products.find((x) => x.sku === sku)?.category; if (cat && shortcut.has(cat)) count.set(cat, (count.get(cat) ?? 0) + 1); }
    const ranked = [...count.entries()].sort((a, b) => b[1] - a[1] || categories.indexOf(a[0]) - categories.indexOf(b[0])).map(([cat]) => shortcut.get(cat)!);
    const pick = ranked.find((f) => !taken.has(f)) ?? [...shortcut.values()].find((f) => !taken.has(f)) ?? ranked[0] ?? "";
    if (pick) taken.add(pick);
    return pick;
  };
  const spare = () => { const f = [...shortcut.values()].find((x) => !taken.has(x)) ?? ""; if (f) taken.add(f); return f; };
  const put = (slot: string, image: string, imageMobile = "", alt = "") => { if (image) out.fill[id(slot)] = { image, imageMobile, alt }; };

  // Campanhas 2 e 3 (carrosséis) e o slide agendado do N4: atalho da campanha, o mesmo arquivo no celular (quadrado).
  const a1 = forCampaign(c1), a2 = forCampaign(c2), a3 = forCampaign(c3), a4 = spare();
  put("hero-2", a2, "", c2?.headline); put("hero-3", a3, "", c3?.headline); put("hero-4", a4 || a1);
  // Cartões de navegação (Novidades, Ofertas…): atalhos numa ordem diferente da do apoio, para o N2 (2 cartões + 2
  // apoios) não repetir imagem entre as duas seções.
  // Loja com menos de 4 atalhos: o destaque de celular e o de computador completam os cartões.
  [...new Set([a4, a3, a2, a1, mobile, desktop])].filter(Boolean).slice(0, 4).forEach((f, k) => put(`nav-${k + 1}`, f));
  // Apoio: atalho da 1ª campanha e um recorte do destaque de computador; faixa: outro recorte dele (foco do tema).
  put("apoio-1", a1, "", c1?.headline); put("apoio-2", desktop);
  put("faixa-1", desktop);
  // Imagem com texto e janela do cupom: o destaque de celular (retrato, cabe no quadrado).
  const portrait = mobile || desktop;
  put("sobre", portrait); put("cupom", portrait);
  // Mosaico (N3: 3 peças; N4: 5). A peça grande é o destaque de celular (retrato) para não repetir o atalho que abre o
  // carrossel de campanhas logo abaixo; as menores são atalhos, sem repetir imagem entre as cinco peças do N4.
  const rest = [...new Set([a1, a4, a3, a2, ...shortcut.values()])].filter(Boolean);
  rest.slice(0, 4).forEach((f, k) => put(`mosaico-${k + 2}`, f));
  put("mosaico-1", portrait, "", c2?.headline);

  out.used = [...new Set([...Object.values(out.forced), ...Object.values(out.fill)].flatMap((m) => [m.image, m.imageMobile]).filter(Boolean))].sort();
  return out;
}
