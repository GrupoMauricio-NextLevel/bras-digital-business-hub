import { cookies } from "next/headers";

/**
 * Atribuição entre superfícies (D90): lê o último toque não direto gravado pelo proxy (`nl-attr`/`nl-ref`) e devolve
 * a query para levar a origem a outro domínio (Commerce ↔ SuperDrop ↔ Soluções). Só ref e utm, sem dado pessoal.
 */
export async function currentAttribution(): Promise<Record<string, string>> {
  try {
    const c = await cookies();
    const raw = c.get("nl-attr")?.value;
    const a = raw ? (JSON.parse(decodeURIComponent(raw)) as Record<string, string>) : {};
    const ref = c.get("nl-ref")?.value;
    return { ...a, ...(ref && !a.ref ? { ref } : {}) };
  } catch { return {}; }
}

export function withAttribution(href: string, a: Record<string, string>): string {
  const keys = ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].filter((k) => a[k]);
  if (!keys.length) return href;
  const [base, hash] = href.split("#");
  const sep = base!.includes("?") ? "&" : "?";
  return `${base}${sep}${keys.map((k) => `${k}=${encodeURIComponent(a[k]!)}`).join("&")}${hash ? `#${hash}` : ""}`;
}
