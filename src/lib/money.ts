const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function formatCompactBRL(cents: number): string {
  const value = cents / 100;
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (value >= 10_000) return `R$ ${(value / 1_000).toFixed(1).replace(".", ",")} mil`;
  return brl.format(value);
}

export function parseBRLToCents(input: string): number {
  const normalized = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}
