import { sectionSchema } from "./sections";
import type { ThemeLevel } from "./levels";
import type { PageKind, SettingValue, Template } from "./types";

/**
 * Área "Banners" do painel (D238, fase L2): todos os pontos de banner da loja numa tela só, lidos dos MESMOS modelos do
 * editor de tema (nada de segunda cópia). Puro: recebe os modelos e o nível do tema e devolve o que mostrar e o que pode.
 */
export const TIPOS_BANNER: Record<string, { nome: string; onde: string; pagina: PageKind; bloco: string }> = {
  "hero-banner": { nome: "Destaque do topo (carrossel)", onde: "Primeira coisa que o cliente vê na página inicial", pagina: "home", bloco: "slide" },
  slideshow: { nome: "Apresentação de slides", onde: "Página inicial", pagina: "home", bloco: "slide" },
  "banner-duo": { nome: "Dupla de banners", onde: "Página inicial, entre as vitrines", pagina: "home", bloco: "banner" },
  "nav-cards": { nome: "Cartões de navegação", onde: "Página inicial: levam a Novidades, Ofertas e categorias", pagina: "home", bloco: "card" },
  "banner-mosaic": { nome: "Mosaico de banners", onde: "Página inicial, campanhas e categorias", pagina: "home", bloco: "banner" },
  "banner-strip": { nome: "Faixa de campanha", onde: "Página inicial, imagem larga com botão", pagina: "home", bloco: "banner" },
  "category-banner": { nome: "Banner de cada categoria", onde: "Topo das páginas de categoria", pagina: "collection", bloco: "banner" },
};
/** Campos de texto que a área de banners edita (os demais continuam no editor completo). */
export const CAMPOS_TEXTO = ["title", "subtitle", "ctaLabel", "link"] as const;
export const CAMPOS_AGENDA = ["startsAt", "endsAt"] as const;

export type BannerItem = { blockId: string; hidden: boolean; image: string; imageMobile: string; textos: Partial<Record<(typeof CAMPOS_TEXTO)[number] | "eyebrow" | "category", string>>; agenda: { startsAt: string; endsAt: string } };
export type PontoBanner = {
  pagina: PageKind; sectionId: string; tipo: string; nome: string; onde: string; oculto: boolean; bloco: string;
  itens: BannerItem[]; maximo: number;
  /** Campos que esse ponto aceita (título, texto, botão, link) e se a agenda está liberada no nível do tema. */
  campos: string[]; agenda: boolean; agendaNivel: number;
};

const str = (v: SettingValue | undefined) => (v === undefined || v === null ? "" : String(v));

export function pontosDeBanner(paginas: Partial<Record<PageKind, Template>>, nivel: ThemeLevel): PontoBanner[] {
  const out: PontoBanner[] = [];
  for (const [pagina, t] of Object.entries(paginas) as [PageKind, Template][]) {
    for (const id of t.order) {
      const s = t.sections[id]!; const info = TIPOS_BANNER[s.type];
      if (!info || info.pagina !== pagina) continue;
      const def = sectionSchema(s.type)?.blocks?.find((b) => b.type === info.bloco);
      if (!def) continue;
      const ids = new Set(def.settings.map((d) => d.id));
      const agendaDef = def.settings.find((d) => d.id === "startsAt");
      const agendaNivel = agendaDef?.minLevel ?? 1;
      out.push({
        pagina, sectionId: id, tipo: s.type, nome: info.nome, onde: info.onde, oculto: !!s.hidden, bloco: info.bloco,
        maximo: def.maxByLevel?.[nivel - 1] ?? def.limit ?? 6,
        campos: [...CAMPOS_TEXTO, "eyebrow", "category"].filter((c) => ids.has(c)),
        agenda: !!agendaDef && nivel >= agendaNivel, agendaNivel,
        itens: s.blockOrder.filter((b) => s.blocks[b]!.type === info.bloco).map((b) => {
          const st = s.blocks[b]!.settings;
          return {
            blockId: b, hidden: !!s.blocks[b]!.hidden, image: str(st.image), imageMobile: str(st.imageMobile),
            textos: Object.fromEntries([...CAMPOS_TEXTO, "eyebrow", "category"].filter((c) => ids.has(c)).map((c) => [c, str(st[c])])),
            agenda: { startsAt: str(st.startsAt), endsAt: str(st.endsAt) },
          };
        }),
      });
    }
  }
  return out;
}
