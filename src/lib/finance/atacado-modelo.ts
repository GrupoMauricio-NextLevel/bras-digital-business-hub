/**
 * Grade livre (AT3, D268): mínimo de peças por modelo e venda em múltiplos. Puro: o box, o carrinho e o pedido usam a
 * mesma conta. Contam só as peças avulsas do modelo (qualquer tamanho e cor); grades e pacotes já são lotes fechados.
 */
export type RegraDoModelo = { minimo: number; multiplo: number };
export type ConferenciaModelo = { pecas: number; ok: boolean; falta: number; mensagem: string | null };

export const temRegraDoModelo = (r: RegraDoModelo | null | undefined): r is RegraDoModelo => !!r && (r.minimo > 1 || r.multiplo > 1);

/** Quantas peças faltam para fechar: atingir o mínimo e cair num múltiplo. Sem peças, não há o que conferir. */
export function conferirModelo(r: RegraDoModelo, pecas: number): ConferenciaModelo {
  if (pecas <= 0) return { pecas, ok: true, falta: 0, mensagem: null };
  const mult = Math.max(1, r.multiplo);
  const alvo = Math.ceil(Math.max(r.minimo, pecas) / mult) * mult;
  const falta = alvo - pecas;
  if (!falta) return { pecas, ok: true, falta: 0, mensagem: null };
  const p = `${falta} peça${falta === 1 ? "" : "s"}`;
  const f = `${falta === 1 ? "falta" : "faltam"} ${p}`;
  const mensagem = pecas < r.minimo ? `Mínimo de ${r.minimo} peças deste modelo: ${f}` : `Vendido de ${mult} em ${mult}: ${f} para fechar`;
  return { pecas, ok: false, falta, mensagem };
}

/** Texto da regra para o box e o painel. */
export function textoDaRegra(r: RegraDoModelo): string {
  const partes: string[] = [];
  if (r.minimo > 1) partes.push(`Mínimo de ${r.minimo} peças por modelo, em qualquer tamanho e cor`);
  if (r.multiplo > 1) partes.push(`vendido de ${r.multiplo} em ${r.multiplo}`);
  const t = partes.join(", ");
  return t ? t[0]!.toUpperCase() + t.slice(1) : "";
}

/** Modelos do carrinho que ainda não fecham a regra (peças avulsas somadas por produto). */
export function pendenciasDoCarrinho(linhas: { productId: string; packId?: string | null; quantity: number }[], regras: Record<string, RegraDoModelo | undefined>) {
  const porModelo = new Map<string, number>();
  for (const l of linhas) if (!l.packId) porModelo.set(l.productId, (porModelo.get(l.productId) ?? 0) + l.quantity);
  const out: (ConferenciaModelo & { productId: string })[] = [];
  for (const [productId, pecas] of porModelo) {
    const r = regras[productId];
    if (!temRegraDoModelo(r)) continue;
    const c = conferirModelo(r, pecas);
    if (!c.ok) out.push({ productId, ...c });
  }
  return out;
}

/** Rótulo da variação: cor e tamanho ("Azul · Tam. M"); cor nula = cor única ("Tam. M"). */
export const rotuloDaVariacao = (v: { size: string; color?: string | null }) => (v.color ? `${v.color} · Tam. ${v.size}` : `Tam. ${v.size}`);
