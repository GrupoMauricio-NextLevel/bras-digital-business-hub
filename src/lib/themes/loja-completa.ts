import type { Database } from "@/db/client";
import type { Store } from "@/db/schema";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { themeTemplates } from "@/db/schema";
import { brandCodeOfStore } from "@/lib/store-brand";
import { THEME_BY_KEY, THEME_CATALOG } from "./catalog";
import { activeThemeKey } from "./license";
import type { ThemeFamily } from "./levels";
import { categoryImages, slotImage } from "./pacotes";
import type { PresetContext } from "./presets";

/**
 * Loja que já nasce completa (D237, fase L1): enquanto a loja da NextLevel E-commerce não salvou nenhum modelo, a vitrine
 * mostra o tema GRÁTIS completo da família (slideshow, categorias, vitrines, dupla de banners, faixa, sobre, selos), com as
 * fotos de exemplo da família ("troque pela sua" no editor). Nada é gravado: o lojista edita e, ao salvar, vira dele.
 * O SuperDrop continua com o modelo de sempre.
 */
const SLOTS = ["hero-1", "hero-2", "hero-3", "apoio-1", "apoio-2", "faixa-1", "sobre", "mosaico-1", "mosaico-2", "mosaico-3", "mosaico-4", "mosaico-5", "look-1", "look-2", "look-3", "look-4"];

/** Fotos de exemplo da família para cada posição de banner dos temas. */
export function midiaDeExemplo(family: ThemeFamily): NonNullable<PresetContext["media"]> {
  const out: NonNullable<PresetContext["media"]> = {};
  // Só arquivo que existe de verdade (o pacote lista imagens ainda pendentes): nunca imagem quebrada.
  const existe = (src: string) => !!src && existsSync(join(process.cwd(), "public", src.split("?")[0]!));
  for (const s of SLOTS) { const img = slotImage(family, `${family}-${s}`); if (img && existe(img.image)) out[`${family}-${s}`] = { image: img.image, imageMobile: existe(img.imageMobile) ? img.imageMobile : "", alt: img.alt }; }
  // Posições sem foto própria no pacote (mosaico, sobre, cartões) reaproveitam as fotos que existem: nada nasce vazio.
  const fotos = [...new Set([...Object.values(out).map((m) => m.image), ...Object.values(categoryImages(family))])].filter(existe);
  if (!fotos.length) return out;
  let i = 0;
  for (const s of [...SLOTS, "nav-1", "nav-2", "nav-3", "nav-4"]) {
    const k = `${family}-${s}`;
    if (!out[k]?.image) out[k] = { image: fotos[i++ % fotos.length]!, imageMobile: "", alt: "" };
  }
  return out;
}

/** Tema grátis (N1) da família; "base" (Starter) vira moda, o foco do Brás. */
export function temaGratisDaFamilia(family: ThemeFamily | undefined): string {
  const f = !family || family === "base" ? "moda" : family;
  return THEME_CATALOG.find((t) => t.family === f && t.level === 1 && t.priceCents === 0)?.key ?? "trama";
}

const emAndamento = new Map<string, Promise<boolean>>();
/** Lojas com um tema sendo aplicado agora (a aplicação lê o modelo atual: não pode disparar outra instalação). */
export const instalando = new Set<string>();

/**
 * Loja E-commerce que nunca salvou um modelo e está no Starter (ou sem tema): instala o tema grátis completo da família,
 * com as fotos de exemplo, uma vez. Devolve true quando instalou. SuperDrop e lojas já personalizadas: nada muda.
 */
export async function garantirLojaCompleta(db: Database, store: Store, now = new Date()): Promise<boolean> {
  if (instalando.has(store.id) || emAndamento.has(store.id)) return false;
  if ((await brandCodeOfStore(db, store)) !== "NEXTLEVEL_COMMERCE") return false;
  if (await db.query.themeTemplates.findFirst({ where: eq(themeTemplates.storeId, store.id), columns: { storeId: true } })) return false;
  const ativo = await activeThemeKey(db, store.id).catch(() => "starter");
  if (ativo && ativo !== "starter") return false;
  let p = emAndamento.get(store.id);
  if (!p) {
    p = (async () => {
      const key = temaGratisDaFamilia(undefined);
      const family = THEME_BY_KEY[key]?.family ?? "moda";
      const { applyThemeToStore } = await import("./install");
      await applyThemeToStore(db, store, key, "sistema", now, undefined, { media: midiaDeExemplo(family), categoryImages: categoryImages(family) });
      return true;
    })().catch(() => false).finally(() => emAndamento.delete(store.id));
    emAndamento.set(store.id, p);
  }
  return p;
}
