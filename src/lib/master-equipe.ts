/**
 * Equipe do Master (D138): funções e o que cada uma enxerga. Arquivo puro (servidor e tela). O dono (sem função) vê tudo.
 * O contador parceiro é de fora: só a fila do Meu Contador.
 */
export const MASTER_FUNCTIONS = ["COMERCIAL", "SUPORTE", "FINANCEIRO", "CONTEUDO", "CONTADOR"] as const;
export type MasterFunction = (typeof MASTER_FUNCTIONS)[number];
export const MASTER_FUNCTION_LABEL: Record<MasterFunction, string> = { COMERCIAL: "Comercial", SUPORTE: "Suporte", FINANCEIRO: "Financeiro", CONTEUDO: "Conteúdo", CONTADOR: "Contador parceiro" };
export const MASTER_FUNCTION_HINT: Record<MasterFunction, string> = {
  COMERCIAL: "Torre do Ecossistema, oportunidades, CRM, clientes, lojas, marcas e parceiros",
  SUPORTE: "Clientes e suporte, pedidos, lojas, fornecedores, erros, membros da Brás e Meu Contador",
  FINANCEIRO: "Financeiro NextLevel e SuperDrop, planos, resumo e escritório virtual (preços, ofertas, acerto)",
  CONTEUDO: "Templates, catálogo e o estúdio de vídeos e descobertas da Brás",
  CONTADOR: "Só a fila do Meu Contador (notas dos fardos)",
};

/** Prefixos de endereço liberados por função (além de "/master", a página inicial, para todos menos o contador). */
const PATHS: Record<MasterFunction, string[]> = {
  COMERCIAL: ["/master/ecossistema", "/master/crm", "/master/clientes", "/master/marcas", "/master/stores", "/master/partners", "/commerce/leads", "/commerce/stores"],
  SUPORTE: ["/master/clientes", "/master/orders", "/master/stores", "/master/suppliers", "/master/errors", "/bras/membros", "/bras/meu-contador", "/bras/atendimento", "/commerce/stores", "/commerce/orders"],
  FINANCEIRO: ["/master/financeiro", "/master/financeiro/operacao", "/master/plans", "/master/summary", "/master/office", "/commerce/plans"],
  CONTEUDO: ["/master/templates", "/master/catalog", "/bras/descobertas", "/bras/pauta", "/bras/catalogo"],
  CONTADOR: ["/bras/meu-contador"],
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
