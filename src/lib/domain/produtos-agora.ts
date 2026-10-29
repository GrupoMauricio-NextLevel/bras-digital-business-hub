/**
 * Produtos que precisam do lojista agora (D211): cada produto com problema que trava venda, do mais grave ao menos,
 * com o botão que resolve. Pura: a página passa as linhas do catálogo.
 */
export type ProblemaProduto = "sem-estoque" | "sem-preco" | "sem-foto" | "estoque-baixo" | "rascunho";
export type ProdutoAgora = { id: string; nome: string; problema: ProblemaProduto; motivo: string; acao: string; tom: "danger" | "warning" | "info"; disponivel: number };

type Linha = { id: string; name: string; images: string[]; suggestedPriceCents: number; status: string; available: number };

const REGRA: Record<ProblemaProduto, { tom: ProdutoAgora["tom"]; acao: string; motivo: (l: Linha) => string }> = {
  "sem-estoque": { tom: "danger", acao: "Repor estoque", motivo: () => "Ativo, mas sem estoque: o cliente vê esgotado" },
  "sem-preco": { tom: "danger", acao: "Definir preço", motivo: () => "Sem preço de venda" },
  "sem-foto": { tom: "warning", acao: "Adicionar foto", motivo: () => "Sem foto: produto sem foto quase não vende" },
  "estoque-baixo": { tom: "warning", acao: "Repor estoque", motivo: (l) => `Só ${l.available} disponível(is)` },
  rascunho: { tom: "info", acao: "Revisar e ativar", motivo: () => "Em rascunho: ainda não aparece na loja" },
};
const ORDEM: ProblemaProduto[] = ["sem-estoque", "sem-preco", "sem-foto", "estoque-baixo", "rascunho"];

/** O problema mais grave de cada produto (um por produto, para a lista não repetir). Arquivados ficam de fora. */
export function problemaDoProduto(l: Linha, limiteBaixo = 10): ProblemaProduto | null {
  if (l.status === "ARCHIVED") return null;
  if (l.status === "ACTIVE" && l.available <= 0) return "sem-estoque";
  if (l.suggestedPriceCents <= 0) return "sem-preco";
  if (!l.images.length) return "sem-foto";
  if (l.status === "ACTIVE" && l.available < limiteBaixo) return "estoque-baixo";
  if (l.status === "DRAFT") return "rascunho";
  return null;
}

export function produtosQuePrecisamDeVoce(linhas: Linha[], limiteBaixo = 10): ProdutoAgora[] {
  const lista: ProdutoAgora[] = [];
  for (const l of linhas) {
    const p = problemaDoProduto(l, limiteBaixo);
    if (!p) continue;
    const r = REGRA[p];
    lista.push({ id: l.id, nome: l.name, problema: p, motivo: r.motivo(l), acao: r.acao, tom: r.tom, disponivel: l.available });
  }
  return lista.sort((a, b) => ORDEM.indexOf(a.problema) - ORDEM.indexOf(b.problema) || a.disponivel - b.disponivel);
}
