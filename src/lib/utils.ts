import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", opts).format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  return formatDate(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d`;
  return formatDate(iso);
}

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

/** Cor de texto (branco ou quase preto) com maior contraste WCAG sobre a cor de fundo informada. */
export function readableOn(hex: string): "#ffffff" | "#111827" {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return "#ffffff";
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(parseInt(c.slice(0, 2), 16)) + 0.7152 * lin(parseInt(c.slice(2, 4), 16)) + 0.0722 * lin(parseInt(c.slice(4, 6), 16));
  // contraste com branco = 1.05 / (L + 0.05); com #111827 (L ≈ 0.0096) = (L + 0.05) / 0.0596
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.0596 ? "#ffffff" : "#111827";
}
