/**
 * Motor único de preço do atacado (AT0, D257). Puro: roda no servidor (pedido, proposta, balcão) e no navegador (box,
 * carrinho, checkout), e o servidor sempre recalcula. Regras (docs/prompts/atacado-nextlevel-ecommerce.md, seção 4):
 *  1. Grade e pacote têm preço próprio (por lote) e não somam faixa; as peças deles CONTAM para o mix.
 *  2. Peça avulsa: menor preço válido entre varejo, faixa do modelo (D52: soma dos tamanhos do mesmo produto) e preço de
 *     atacado do produto quando algum gatilho do carrinho está ativo (mix de peças, mix de valor, mix da categoria ou cliente
 *     aprovado). Nunca acima do varejo nem abaixo do piso (custo e preço mínimo do produto).
 *  3. O mix por valor usa o subtotal de VAREJO (sem o próprio desconto), para o preço não oscilar ao cruzar o mínimo.
 *  4. Sem regra e sem preço de atacado, o resultado é idêntico ao preço por quantidade de antes.
 */
export type FaixaQtd = { minQty: number; priceCents: number };
export type LinhaPreco = {
  key: string;
  productId: string;
  categoryId?: string | null;
  /** Grade ou pacote: a linha é um lote com preço próprio. */
  packId?: string | null;
  /** Peças de cada unidade da linha (grade de 12 = 12; peça avulsa = 1). */
  pecasPorUnidade?: number;
  quantity: number;
  /** Preço de varejo da unidade da linha (peça avulsa) ou do lote (grade). */
  varejoCents: number;
  /** Preço de atacado por peça (só peça avulsa). */
  atacadoCents?: number | null;
  faixas?: FaixaQtd[];
  /** Piso por peça: maior entre custo e preço mínimo do produto. */
  pisoCents?: number;
};
export type RegraMix =
  | { kind: "MIX_PECAS"; minPieces: number }
  | { kind: "MIX_VALOR"; minCents: number }
  | { kind: "MIX_CATEGORIA"; minPieces: number; categoryId: string };
export type Modo = "VAREJO" | "FAIXA" | "ATACADO" | "GRADE";
export type LinhaPrecificada = { key: string; unitCents: number; modo: Modo; economiaCents: number; totalCents: number };
export type ProgressoMix = { regra: RegraMix; atual: number; minimo: number; falta: number; atingida: boolean };
export type CarrinhoPrecificado = {
  linhas: LinhaPrecificada[];
  subtotalCents: number;
  varejoCents: number;
  economiaCents: number;
  pecas: number;
  mix: ProgressoMix[];
  /** Algum gatilho geral (mix de peças, de valor ou cliente aprovado) está ativo. */
  atacadoGeral: boolean;
};

const pecasDa = (l: LinhaPreco) => l.quantity * Math.max(1, l.pecasPorUnidade ?? 1);

/** Faixa do modelo (D52): a de maior quantidade mínima atingida; nunca sobe o preço base. */
export function precoDaFaixa(varejoCents: number, faixas: FaixaQtd[] | undefined, qtdDoModelo: number): number {
  let preco = varejoCents, melhor = 0;
  for (const f of faixas ?? []) if (qtdDoModelo >= f.minQty && f.minQty > melhor) { melhor = f.minQty; preco = Math.min(varejoCents, f.priceCents); }
  return preco;
}

export function precoDoCarrinho(linhas: LinhaPreco[], regras: RegraMix[] = [], opts: { clienteAtacado?: boolean } = {}): CarrinhoPrecificado {
  const pecas = linhas.reduce((t, l) => t + pecasDa(l), 0);
  const varejoTotal = linhas.reduce((t, l) => t + l.varejoCents * l.quantity, 0);
  const pecasPorCategoria = new Map<string, number>();
  for (const l of linhas) if (l.categoryId) pecasPorCategoria.set(l.categoryId, (pecasPorCategoria.get(l.categoryId) ?? 0) + pecasDa(l));
  const unidadesDoModelo = new Map<string, number>();
  for (const l of linhas) if (!l.packId) unidadesDoModelo.set(l.productId, (unidadesDoModelo.get(l.productId) ?? 0) + l.quantity);

  const mix: ProgressoMix[] = regras.map((r) => {
    const atual = r.kind === "MIX_PECAS" ? pecas : r.kind === "MIX_VALOR" ? varejoTotal : pecasPorCategoria.get(r.categoryId) ?? 0;
    const minimo = r.kind === "MIX_VALOR" ? r.minCents : r.minPieces;
    return { regra: r, atual, minimo, falta: Math.max(0, minimo - atual), atingida: minimo > 0 && atual >= minimo };
  });
  const atacadoGeral = !!opts.clienteAtacado || mix.some((m) => m.atingida && m.regra.kind !== "MIX_CATEGORIA");
  const categoriasAtivas = new Set(mix.filter((m) => m.atingida && m.regra.kind === "MIX_CATEGORIA").map((m) => (m.regra as { categoryId: string }).categoryId));

  const out: LinhaPrecificada[] = linhas.map((l) => {
    if (l.packId) return { key: l.key, unitCents: l.varejoCents, modo: "GRADE", economiaCents: 0, totalCents: l.varejoCents * l.quantity };
    const piso = Math.max(0, l.pisoCents ?? 0);
    let unit = l.varejoCents, modo: Modo = "VAREJO";
    const faixa = precoDaFaixa(l.varejoCents, l.faixas, unidadesDoModelo.get(l.productId) ?? l.quantity);
    if (faixa < unit) { unit = faixa; modo = "FAIXA"; }
    const elegivel = atacadoGeral || (!!l.categoryId && categoriasAtivas.has(l.categoryId));
    if (elegivel && l.atacadoCents != null && l.atacadoCents > 0 && l.atacadoCents < unit) { unit = l.atacadoCents; modo = "ATACADO"; }
    if (unit < piso) unit = Math.min(l.varejoCents, piso);
    return { key: l.key, unitCents: unit, modo, economiaCents: (l.varejoCents - unit) * l.quantity, totalCents: unit * l.quantity };
  });
  const subtotalCents = out.reduce((t, l) => t + l.totalCents, 0);
  return { linhas: out, subtotalCents, varejoCents: varejoTotal, economiaCents: varejoTotal - subtotalCents, pecas, mix, atacadoGeral };
}

/** Texto curto do que falta para a regra (barra do mix no carrinho e no box). */
export function faltaParaMix(m: ProgressoMix, brl: (c: number) => string): string {
  if (m.atingida) return "Preço de atacado liberado";
  if (m.regra.kind === "MIX_VALOR") return `Faltam ${brl(m.falta)} para o preço de atacado em tudo`;
  const p = `${m.falta} peça${m.falta === 1 ? "" : "s"}`;
  return m.regra.kind === "MIX_CATEGORIA" ? `Faltam ${p} desta coleção para o preço de atacado` : `Faltam ${p} para o preço de atacado em tudo`;
}
