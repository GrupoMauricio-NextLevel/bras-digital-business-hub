/** Texto: endereços amigáveis e formatação leve segura (sem HTML vindo do usuário). */
export function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const safeHref = (url: string) => (/^(https?:\/\/|\/|mailto:|tel:|#)/i.test(url.trim()) ? url.trim() : "#");

/**
 * Markdown leve: **negrito**, *itálico*, [texto](link), listas com "- " e parágrafos.
 * O texto é escapado primeiro, então nenhum HTML digitado passa; links só aceitam http, https, mailto, tel e caminhos.
 */
export function renderMarkdownLite(source: string): string {
  const inline = (line: string) =>
    escapeHtml(line)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t: string, u: string) => `<a href="${escapeHtml(safeHref(u.replace(/&amp;/g, "&")))}" rel="noopener noreferrer">${t}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const blocks = source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    return `<p>${lines.map(inline).join("<br />")}</p>`;
  }).join("");
}

/** Tamanhos recomendados para a prévia de busca. */
export const SEO_LIMITS = { title: 60, description: 160 } as const;
export const truncate = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

/** Links aceitos nos campos de edição: http(s), caminho interno, âncora, e-mail e telefone. */
export function isValidLink(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (/^(\/|#)[^\s]*$/.test(v)) return true;
  if (/^(mailto:|tel:)[^\s]+$/i.test(v)) return true;
  try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
}
