/**
 * Equipe do Master (D138): funções e o que cada uma enxerga. Arquivo puro (servidor e tela). O dono (sem função) vê tudo.
 * O contador parceiro é de fora: só a fila do Meu Contador.
 */
export const MASTER_FUNCTIONS = ["COMERCIAL", "SUPORTE", "FINANCEIRO", "CONTEUDO", "CONTADOR"] as const;
export type MasterFunction = (typeof MASTER_FUNCTIONS)[number];
export const MASTER_FUNCTION_LABEL: Record<MasterFunction, string> = { COMERCIAL: "Comercial", SUPORTE: "Suporte", FINANCEIRO: "Financeiro", CONTEUDO: "Conteúdo", CONTADOR: "Contador parceiro" };
/**
 * O que cada função vê, citando só os negócios abertos no Master (D218). `abertas` = marcasAtivasNoMaster().
 * Com só a E-commerce aberta, nada de SuperDrop, Brás ou Meu Contador no texto; o contador parceiro nem aparece.
 */
export function dicaDaFuncao(fn: MasterFunction, abertas: readonly string[]): string {
  const sd = abertas.includes("SUPERDROP"), bras = abertas.includes("BRAS_DIGITAL");
  const extra = (s: string, on: boolean) => (on ? s : "");
  switch (fn) {
    case "COMERCIAL": return "Agora, Atendimento, Comercial, lojistas, crescimento e parceiros";
    case "SUPORTE": return `Atendimento, clientes em modo suporte, pedidos das lojas, lojistas e erros${extra(", fornecedores", sd)}${extra(", membros da Brás e Meu Contador", bras)}`;
    case "FINANCEIRO": return `Receita, financeiro da NextLevel, planos e ofertas${extra(" (inclui o SuperDrop)", sd)}`;
    case "CONTEUDO": return `Templates e catálogo${extra(", estúdio de vídeos e descobertas da Brás", bras)}`;
    case "CONTADOR": return "Só a fila do Meu Contador (notas dos fardos)";
  }
}
/** Funções que fazem sentido com os negócios abertos (o contador parceiro é da Brás). */
export const funcoesDoMaster = (abertas: readonly string[]) => MASTER_FUNCTIONS.filter((f) => f !== "CONTADOR" || abertas.includes("BRAS_DIGITAL"));

export const MASTER_FUNCTION_HINT: Record<MasterFunction, string> = {
  COMERCIAL: "Torre do Ecossistema, oportunidades, CRM, clientes, lojas, marcas e parceiros",
  SUPORTE: "Clientes e suporte, pedidos, lojas, fornecedores, erros, membros da Brás e Meu Contador",
  FINANCEIRO: "Financeiro NextLevel e SuperDrop, planos, resumo e escritório virtual (preços, ofertas, acerto)",
  CONTEUDO: "Templates, catálogo e o estúdio de vídeos e descobertas da Brás",
  CONTADOR: "Só a fila do Meu Contador (notas dos fardos)",
};

/** Prefixos de endereço liberados por função (além de "/master", a página inicial, para todos menos o contador). */
const PATHS: Record<MasterFunction, string[]> = {
  COMERCIAL: ["/master/aprender", "/master/black", "/master/placar", "/master/agora", "/master/ia", "/master/comercial", "/master/crescimento", "/master/ecossistema", "/master/mapa", "/master/crm", "/master/clientes", "/master/marcas", "/master/stores", "/master/partners", "/commerce/leads", "/commerce/stores"],
  SUPORTE: ["/master/aprender", "/master/agora", "/master/ia", "/master/comercial", "/master/clientes", "/master/orders", "/master/stores", "/master/suppliers", "/master/errors", "/bras/membros", "/bras/meu-contador", "/bras/atendimento", "/commerce/stores", "/commerce/orders"],
  FINANCEIRO: ["/master/aprender", "/master/black", "/master/placar", "/master/receita", "/master/partners/bonus", "/master/financeiro", "/master/financeiro/operacao", "/master/plans", "/master/summary", "/master/office", "/commerce/plans"],
  CONTEUDO: ["/master/aprender", "/master/templates", "/master/catalog", "/bras/descobertas", "/bras/pauta", "/bras/catalogo"],
  CONTADOR: ["/master/aprender", "/bras/meu-contador"],
};
const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** O endereço é permitido para a função? Sem função (dono) tudo é permitido. */
export function masterPathAllowed(fn: MasterFunction | null | undefined, path: string): boolean {
  if (!fn) return true;
  if (path.startsWith("/account")) return true;
  if (fn !== "CONTADOR" && (path === "/master" || path === "/master/")) return true;
  return PATHS[fn].some((p) => under(path, p));
}

export const masterHomeFor = (fn: MasterFunction | null | undefined) => (fn === "CONTADOR" ? "/bras/meu-contador" : "/master");
