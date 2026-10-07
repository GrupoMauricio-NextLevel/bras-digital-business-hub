/**
 * Pacotes visuais das lojas de demonstração (gerados por scripts/importar-pacotes-visuais.ts a partir dos ZIPs do dono).
 * Contrato: só imagens com status GENERATED entram; caminhos públicos em /demos/<loja>/v1/; SKUs, nomes e namespace de
 * cada loja preservados; PENDING nunca ganha caminho. Textos, preços e chamadas continuam como texto da página (HTML),
 * nunca dentro das fotos.
 */
import trama from "./pacotes/trama-urbana.json";
import jogo from "./pacotes/linha-de-jogo.json";
import casa from "./pacotes/casa-em-ordem.json";
import bela from "./pacotes/bela-essencia.json";
import conecta from "./pacotes/ponto-conecta.json";
import giro from "./pacotes/giro-distribuidora.json";
import type { ThemeFamily } from "./levels";

export type PackageAsset = { qualifiedId: string; kind: string; sku?: string; alt: string; src: string; avif?: string; width: number; height: number; layoutReview?: boolean; vector?: boolean };
export type PackageProduct = { sku: string; slug: string; name: string; category: string; priceCents: number; inventoryDemo: number; sizes?: string[]; description: string; images: string[] };
export type PackageCampaign = { id: string; headline: string; cta: string; skus: string[] };
export type VisualPackage = { slug: string; family: ThemeFamily; store: string; status: string; generated: number; expected: number; palette: { ink: string; accent: string; background: string } | null; products: PackageProduct[]; campaigns: PackageCampaign[]; assets: Record<string, PackageAsset> };

const ALL = [trama, jogo, casa, bela, conecta, giro] as unknown as VisualPackage[];
export const PACKAGES: Partial<Record<ThemeFamily, VisualPackage>> = Object.fromEntries(ALL.map((p) => [p.family, p]));
export const packageOf = (family: ThemeFamily) => PACKAGES[family];

/** Link do catálogo que mostra exatamente os SKUs de uma campanha (nunca produtos inventados). */
export const selectionLink = (skus: string[]) => `/catalog?produtos=${skus.join(",")}`;

export type SlotImage = { image: string; imageMobile: string; alt: string; qualifiedId: string };
const img = (p: VisualPackage, id: string | undefined, alt = ""): SlotImage | null => {
  const a = id ? p.assets[id] : undefined;
  return a ? { image: a.src, imageMobile: "", alt: a.alt || alt, qualifiedId: a.qualifiedId } : null;
};

/**
 * Qual imagem do pacote ocupa cada posição dos temas (ids do manifesto de posições: <família>-hero-1, -apoio-1…).
 * As 3 campanhas do pacote (destaque computador + celular e 2 apoios cada) e as 3 imagens editoriais cobrem as posições;
 * quando o pacote não tem a imagem (PENDING), a posição fica pendente (fundo nas cores do tema), sem inventar foto.
 */
export function slotImage(family: ThemeFamily, slotId: string): SlotImage | null {
  const p = PACKAGES[family]; if (!p) return null;
  const slot = slotId.replace(`${family}-`, "");
  const [c1, c2, c3] = p.campaigns;
  const camp = (c: PackageCampaign | undefined, part: string) => (c ? `${c.id}-${part}` : undefined);
  const hero = (c: PackageCampaign | undefined) => {
    const d = img(p, camp(c, "hero-desktop"), c?.headline); if (!d) return null;
    const m = p.assets[camp(c, "hero-mobile")!];
    return { ...d, imageMobile: m?.src ?? "" };
  };
  switch (slot) {
    case "hero-1": return hero(c1);
    case "hero-2": return hero(c2);
    case "hero-3": case "hero-4": return hero(c3);
    case "apoio-1": return img(p, camp(c1, "apoio-01"), c1?.headline);
    case "apoio-2": return img(p, camp(c1, "apoio-02"), c1?.headline);
    case "faixa-1": return img(p, "editorial-materiais");
    case "sobre": return img(p, "editorial-historia");
    case "mosaico-1": return img(p, camp(c2, "hero-mobile"), c2?.headline);
    case "mosaico-2": return img(p, camp(c2, "apoio-01"), c2?.headline);
    case "mosaico-3": return img(p, camp(c2, "apoio-02"), c2?.headline);
    case "mosaico-4": return img(p, camp(c3, "apoio-01"), c3?.headline);
    case "mosaico-5": return img(p, camp(c3, "apoio-02"), c3?.headline);
    case "look-1": return img(p, "editorial-lookbook");
    case "look-2": return img(p, camp(c1, "hero-mobile"), c1?.headline);
    case "look-3": return img(p, camp(c3, "hero-mobile"), c3?.headline);
    case "look-4": return img(p, camp(c2, "apoio-01"), c2?.headline);
    default: return null;
  }
}

/** Imagem de cada categoria (pelo nome), quando o pacote tem; as demais usam a foto do primeiro produto, como antes. */
export function categoryImages(family: ThemeFamily): Record<string, string> {
  const p = PACKAGES[family]; if (!p) return {};
  return Object.fromEntries(Object.values(p.assets).filter((a) => a.kind === "categoria" && a.alt).map((a) => [a.alt, a.src]));
}

/** Logo (PNG transparente, raster conceitual; versão vetorial pendente) e imagem de compartilhamento, quando existem. */
export const brandLogo = (family: ThemeFamily) => PACKAGES[family]?.assets["marca-principal"]?.src ?? null;
export const socialImage = (family: ThemeFamily) => { const a = PACKAGES[family]?.assets["social-compartilhamento"]; return a ? { url: a.src, width: a.width, height: a.height } : null; };
