/**
 * Faixa de preço no catálogo da loja (D348): `?ate=60` (até R$ 60) e `?acima=100` (acima de R$ 100), em reais inteiros
 * no endereço, comparados em centavos. Valor inválido é ignorado (o catálogo nunca quebra por um link errado).
 */
const reais = (v: string | undefined) => { const n = Number(v); return v && Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n * 100) : null; };
export function filtrarPorPreco<T extends { priceCents: number }>(produtos: T[], q: { ate?: string; acima?: string } | undefined): T[] {
  const ate = reais(q?.ate), acima = reais(q?.acima);
  if (ate === null && acima === null) return produtos;
  return produtos.filter((p) => (ate === null || p.priceCents <= ate) && (acima === null || p.priceCents > acima));
}
