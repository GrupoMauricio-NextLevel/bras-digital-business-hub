/** Parâmetros de cubagem das regras da Brás (seção 9.3 do prompt v2). */
export type CubageRules = {
  usefulDm3: { c20: number; c40: number; c40hc: number };
  mixedOccupancyPct: number;
  perSkuFeeCents: number;
  smallQtyCurve: { upToBoxes: number; surchargeBps: number }[];
};

// ---------------------------------------------------------------------------
// Simulador de cubagem (seção 9.3). Pura: serve ao Master, à importadora e ao marketing.
// ---------------------------------------------------------------------------
export type CubageInput = {
  container: "c20" | "c40" | "c40hc";
  /** Custo fixo do contêiner (frete, seguro, despesas, desembaraço, armazenagem, porto → galpão, margem). */
  fixedCostCents: number;
  /** Cubagem de uma caixa em dm³ (litros). */
  boxDm3: number;
  /** Preço do produto por caixa, sem logística. */
  productPerBoxCents: number;
  unitsPerBox: number;
  /** 1 = mesmo item; mais de 1 = misto. */
  items: number;
  /** Caixas deste item no contêiner (para a curva de quantidade no misto). Vazio = contêiner cheio só deste item. */
  boxesOfItem?: number;
  /** Ocupação vendida (100 = cheio). Abaixo disso, aparece o ajuste de ocupação. */
  soldPct: number;
};

export function brasCubageQuote(rules: { cubage: CubageRules }, i: CubageInput) {
  const c = rules.cubage;
  const useful = c.usefulDm3[i.container];
  const mixed = i.items > 1;
  const effective = mixed ? Math.floor((useful * c.mixedOccupancyPct) / 100) : useful;
  const boxDm3 = Math.max(1, Math.round(i.boxDm3));
  const boxesFull = Math.max(1, Math.floor(effective / boxDm3));
  const logisticsFull = Math.round(i.fixedCostCents / boxesFull);
  const boxesOfItem = Math.max(1, Math.min(i.boxesOfItem ?? Math.floor(boxesFull / Math.max(1, i.items)), boxesFull));
  const handling = mixed ? Math.round(c.perSkuFeeCents / boxesOfItem) : 0;
  const surchargeBps = mixed ? (c.smallQtyCurve.find((t) => boxesOfItem <= t.upToBoxes)?.surchargeBps ?? 0) : 0;
  const product = Math.round(i.productPerBoxCents * (1 + surchargeBps / 10_000));
  const sold = Math.min(100, Math.max(1, i.soldPct));
  // Pouco cheio: o custo fixo se divide por menos caixas. A diferença é o "ajuste de ocupação", sempre mostrado antes do aceite.
  const logisticsSold = Math.round(logisticsFull * (100 / sold));
  const perBoxFull = product + logisticsFull + handling;
  const perBoxSold = product + logisticsSold + handling;
  const units = Math.max(1, i.unitsPerBox);
  return {
    mixed, boxesFull, boxesOfItem, usefulDm3: useful, effectiveDm3: effective,
    logisticsPerBoxCents: logisticsFull, handlingPerBoxCents: handling, surchargeBps, productPerBoxCents: product,
    perBoxCents: perBoxFull, perUnitCents: Math.round(perBoxFull / units),
    occupancyAdjustmentPerBoxCents: perBoxSold - perBoxFull, perUnitAtSoldCents: Math.round(perBoxSold / units),
  };
}
