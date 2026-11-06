/**
 * Atacado na vitrine (AT2, D259). Puro: escada de preço do box, "a partir de… a peça" do card e quais regras de mix
 * valem para um produto. Os valores vêm do mesmo dado que o motor `precoDoCarrinho` usa, então o que a vitrine promete
 * é o que o pedido cobra.
 */
import type { Modo, RegraMix } from "./atacado-preco";

export type PacoteDaVitrine = { id: string; name: string; kind: "GRADE_FECHADA" | "PACOTE_SORTIDO"; colorMode: "FIXA" | "SORTIDA" | "POR_COR"; color: string | null; totalQuantity: number; priceCents: number; available: number };
export type ProdutoDaVitrine = { priceCents: number; atacadoCents?: number | null; categoryId?: string | null; tiers: { minQty: number; priceCents: number }[]; packs: PacoteDaVitrine[]; sellsUnit: boolean; sellsPack: boolean };
export type Degrau = { chave: string; rotulo: string; detalhe: string; porPecaCents: number };

/** Regras de mix que liberam o atacado deste produto (as gerais e a da coleção dele). */
export function gatilhosDoProduto(p: Pick<ProdutoDaVitrine, "categoryId">, regras: RegraMix[]): RegraMix[] {
  return regras.filter((r) => r.kind !== "MIX_CATEGORIA" || (!!p.categoryId && r.categoryId === p.categoryId));
}

/** Frase curta do gatilho: "a partir de 6 peças na loja". */
export function textoDoGatilho(r: RegraMix, brl: (c: number) => string): string {
  if (r.kind === "MIX_PECAS") return `a partir de ${r.minPieces} peças na loja`;
  if (r.kind === "MIX_VALOR") return `a partir de ${brl(r.minCents)} em produtos`;
  return `a partir de ${r.minPieces} peças desta coleção`;
}

export const nomeDoPacote = (pk: Pick<PacoteDaVitrine, "kind" | "totalQuantity">) => (pk.kind === "PACOTE_SORTIDO" ? `Pacote de ${pk.totalQuantity}` : `Grade de ${pk.totalQuantity}`);

/** Cor da grade em texto: "Azul", "Cores sortidas" ou nada. */
export function corDoPacote(pk: Pick<PacoteDaVitrine, "kind" | "colorMode" | "color">): string | null {
  if (pk.kind === "PACOTE_SORTIDO") return "Modelos e cores sortidos";
  if (pk.colorMode === "SORTIDA") return "Cores sortidas";
  return pk.color?.trim() || null;
}

/** O atacado do produto só aparece quando existe e alguma regra da loja libera (sem regra, ninguém chega nele). */
export function atacadoAtivo(p: ProdutoDaVitrine, regras: RegraMix[]): boolean {
  return p.sellsUnit && p.atacadoCents != null && p.atacadoCents > 0 && p.atacadoCents < p.priceCents && gatilhosDoProduto(p, regras).length > 0;
}

/** Escada de preço do box: varejo, faixas do modelo, atacado da loja e grades/pacotes (por peça). */
export function escadaDePreco(p: ProdutoDaVitrine, regras: RegraMix[], brl: (c: number) => string): Degrau[] {
  const out: Degrau[] = [];
  if (p.sellsUnit) {
    out.push({ chave: "VAREJO", rotulo: "Varejo", detalhe: "peça avulsa", porPecaCents: p.priceCents });
    for (const t of p.tiers) if (t.priceCents < p.priceCents) out.push({ chave: `FAIXA:${t.minQty}`, rotulo: `${t.minQty}+ do modelo`, detalhe: `a partir de ${t.minQty} peças deste modelo`, porPecaCents: t.priceCents });
    if (atacadoAtivo(p, regras)) out.push({ chave: "ATACADO", rotulo: "Atacado", detalhe: gatilhosDoProduto(p, regras).map((r) => textoDoGatilho(r, brl)).join(" ou "), porPecaCents: p.atacadoCents! });
  }
  if (p.sellsPack) for (const pk of p.packs) {
    if (pk.totalQuantity <= 0) continue;
    const cor = corDoPacote(pk);
    out.push({ chave: `GRADE:${pk.id}`, rotulo: nomeDoPacote(pk), detalhe: `${brl(pk.priceCents)} o lote${cor ? ` · ${cor}` : ""}`, porPecaCents: Math.round(pk.priceCents / pk.totalQuantity) });
  }
  return out;
}

/** Degrau em que o comprador está, a partir do modo que o motor deu para a linha. */
export function degrauDoModo(modo: Modo, unitCents: number, p: ProdutoDaVitrine, packId?: string): string {
  if (modo === "GRADE") return `GRADE:${packId}`;
  if (modo === "ATACADO") return "ATACADO";
  if (modo === "FAIXA") return `FAIXA:${p.tiers.find((t) => t.priceCents === unitCents)?.minQty ?? ""}`;
  return "VAREJO";
}

/** Card da vitrine: menor preço por peça no atacado e o selo do formato. Nulo quando o produto não tem atacado. */
export function aPartirDe(p: ProdutoDaVitrine, regras: RegraMix[]): { porPecaCents: number; selo: string } | null {
  const escada = escadaDePreco(p, regras, () => "").filter((d) => d.chave !== "VAREJO");
  if (!escada.length) return null;
  const melhor = escada.reduce((a, b) => (b.porPecaCents < a.porPecaCents ? b : a));
  if (p.sellsUnit && melhor.porPecaCents >= p.priceCents) return null;
  const grade = p.sellsPack ? p.packs.find((pk) => `GRADE:${pk.id}` === melhor.chave) : undefined;
  const mix = gatilhosDoProduto(p, regras).find((r): r is Exclude<RegraMix, { kind: "MIX_VALOR" }> => r.kind !== "MIX_VALOR");
  const selo = grade ? nomeDoPacote(grade).replace(" de ", " ") : melhor.chave === "ATACADO" ? (mix ? `Mix ${mix.minPieces} peças` : "Atacado") : `${melhor.rotulo.split("+")[0]}+ peças`;
  return { porPecaCents: melhor.porPecaCents, selo };
}
