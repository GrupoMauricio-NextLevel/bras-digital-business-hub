/**
 * Nome do seletor de variação na página do produto, deduzido das próprias variações: "Tamanho" para grades de roupa e
 * calçado (como sempre foi), "Caixa" para venda por caixa fechada ("Cx 12") e "Opção" para o resto (cor, modelo, tela).
 */
const SIZE = /^(PP|P|M|G|GG|XG|XGG|EG|EGG|U|ÚNICO|UNICO|\d{1,2}(-\d{1,2})?)$/i;
export function variantLabel(names: string[]): "Tamanho" | "Caixa" | "Opção" {
  const list = names.map((n) => n.trim()).filter(Boolean);
  if (!list.length || list.every((n) => SIZE.test(n))) return "Tamanho";
  if (list.every((n) => /^cx\b/i.test(n))) return "Caixa";
  return "Opção";
}
