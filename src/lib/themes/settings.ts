import { normalizeHex } from "@/lib/ds/color";
import { FONT_CHOICES } from "@/lib/ds/fonts";
import { isValidLink } from "@/lib/ds/text";
import type { SettingDef, SettingValue } from "./types";

const DEFAULT_MAX: Record<string, number> = { text: 160, textarea: 600, richtext: 4000, url: 500, image: 500, product: 60, collection: 60 };

/** Valor padrão de uma configuração (o que o esquema declara ou um vazio do tipo). */
export function defaultValue(def: SettingDef): SettingValue {
  if (def.default !== undefined) return def.default;
  switch (def.type) {
    case "checkbox": return false;
    case "range": case "number": return def.min ?? 0;
    case "color": return "#000000";
    case "select": return def.options?.[0]?.value ?? "";
    case "font": return FONT_CHOICES[0]!.key;
    default: return "";
  }
}

export const defaultsFor = (defs: SettingDef[]): Record<string, SettingValue> => Object.fromEntries(defs.map((d) => [d.id, defaultValue(d)]));

/** Vídeo aceito: arquivo https (mp4, webm, mov) ou link do YouTube. Nada de outros serviços nem de HTML. */
export const YOUTUBE_ID = /^(?:https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/))([A-Za-z0-9_-]{11})(?:[?&#].*)?$/;
export function isValidVideoRef(v: string): boolean { return v === "" || YOUTUBE_ID.test(v) || /^https:\/\/[^\s?#]+\.(mp4|webm|mov)(\?[^\s]*)?$/i.test(v); }
export function youtubeIdOf(v: string): string | null { return YOUTUBE_ID.exec(v)?.[1] ?? null; }
/** Data e hora do editor (AAAA-MM-DDTHH:mm) que realmente existem. */
export function isValidDateTime(v: string): boolean { if (v === "") return true; const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v); if (!m) return false; const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!)); return d.getUTCFullYear() === +m[1]! && d.getUTCMonth() === +m[2]! - 1 && d.getUTCDate() === +m[3]! && d.getUTCHours() === +m[4]!; }

/** Endereço de imagem aceito: caminho da loja ou https. Nada de javascript: nem HTML. */
export function isValidImageRef(v: string): boolean { return v === "" || /^\/[^\s]*$/.test(v) || /^https:\/\/[^\s]+$/.test(v); }

/**
 * Corrige um valor vindo do editor: converte o tipo, respeita limites e cai no padrão quando inválido.
 * Nunca lança erro por causa de conteúdo do usuário.
 */
export function normalizeValue(def: SettingDef, raw: unknown): SettingValue {
  const fallback = defaultValue(def);
  switch (def.type) {
    case "checkbox": return typeof raw === "boolean" ? raw : raw === "true" ? true : raw === "false" ? false : (fallback as boolean);
    case "range": case "number": {
      const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
      if (!Number.isFinite(n)) return fallback;
      const min = def.min ?? -Infinity, max = def.max ?? Infinity; let v = Math.min(max, Math.max(min, n));
      if (def.step && def.step > 0) { const base = Number.isFinite(min) ? min : 0; v = base + Math.round((v - base) / def.step) * def.step; v = Math.min(max, Math.max(min, Math.round(v * 1000) / 1000)); }
      return v;
    }
    case "color": { const h = typeof raw === "string" ? normalizeHex(raw) : null; return h ?? fallback; }
    case "select": return typeof raw === "string" && def.options?.some((o) => o.value === raw) ? raw : fallback;
    case "font": return typeof raw === "string" && FONT_CHOICES.some((f) => f.key === raw) ? raw : fallback;
    case "url": { if (typeof raw !== "string") return fallback; const v = raw.trim().slice(0, def.maxLength ?? DEFAULT_MAX.url!); return isValidLink(v) ? v : fallback; }
    case "image": { if (typeof raw !== "string") return fallback; const v = raw.trim().slice(0, def.maxLength ?? DEFAULT_MAX.image!); return isValidImageRef(v) ? v : fallback; }
    case "video": { if (typeof raw !== "string") return fallback; const v = raw.trim().slice(0, 500); return isValidVideoRef(v) ? v : fallback; }
    case "datetime": { if (typeof raw !== "string") return fallback; const v = raw.trim(); return isValidDateTime(v) ? v : fallback; }
    case "product": case "collection": return typeof raw === "string" && /^[A-Za-z0-9_-]{0,60}$/.test(raw) ? raw : fallback;
    default: { // text, textarea, richtext
      if (typeof raw !== "string") return fallback;
      const max = def.maxLength ?? DEFAULT_MAX[def.type] ?? 160;
      const clean = raw.replace(/\u0000/g, "");
      return def.type === "text" ? clean.replace(/[\r\n]+/g, " ").slice(0, max) : clean.slice(0, max);
    }
  }
}

/** Mantém só as configurações conhecidas do esquema, todas normalizadas e com padrão quando faltam. */
export function normalizeSettings(defs: SettingDef[], raw: Record<string, unknown> | undefined): Record<string, SettingValue> {
  const src = raw ?? {};
  return Object.fromEntries(defs.map((d) => [d.id, d.id in src ? normalizeValue(d, src[d.id]) : defaultValue(d)]));
}
