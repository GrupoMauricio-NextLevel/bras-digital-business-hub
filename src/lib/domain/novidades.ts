import type { BrandCode } from "@/lib/brand";

/**
 * "O que mudou" (W0, D183): novidades do sistema escritas à mão, em português simples, por marca. Só entra aqui o que já
 * está no ar para aquela marca. A mais nova fica em primeiro.
 */
export type Novidade = { data: string; marcas: readonly BrandCode[] | "TODAS"; titulo: string; texto: string; href?: string };

export const NOVIDADES: readonly Novidade[] = [
  { data: "2026-10-27", marcas: "TODAS", titulo: "Veja a conta da sua taxa", texto: "No financeiro, a taxa sobre vendas do mês aparece com a conta inteira: quanto já deu, o que entra, o que não entra e quando fecha.", href: "/merchant/finance#taxa" },
  { data: "2026-10-27", marcas: "TODAS", titulo: "Sair dos outros aparelhos", texto: "Em Segurança da conta você encerra a sua conta em todos os outros celulares e computadores, e vê a última entrada.", href: "/account/seguranca" },
  { data: "2026-10-27", marcas: ["NEXTLEVEL_COMMERCE"], titulo: "Economia do plano anual em reais", texto: "No financeiro, quem está no plano mensal vê quanto economiza passando para o anual.", href: "/merchant/finance#evolucao" },
  { data: "2026-10-27", marcas: "TODAS", titulo: "Suporte com gente de verdade", texto: "WhatsApp (11) 94086-2144 e sac@nextlevelgroup.com.br, com a equipe na nossa sede em São Paulo." },
  { data: "2026-10-27", marcas: ["NEXTLEVEL_COMMERCE"], titulo: "Enviar com rastreio e cancelar devolvendo o dinheiro", texto: "Depois da venda: \"Marcar como enviado\" com o código de rastreio, e o cancelamento de pedido pago devolve pelo Mercado Pago da loja.", href: "/merchant/orders" },
  { data: "2026-10-26", marcas: ["NEXTLEVEL_COMMERCE"], titulo: "Cartão em até 6 vezes na sua loja", texto: "Seus clientes pagam com Pix ou cartão de crédito em até 6 vezes, pelo Mercado Pago da loja." },
];

export function novidadesDa(marca: BrandCode, limite = 20): Novidade[] {
  return NOVIDADES.filter((n) => n.marcas === "TODAS" || n.marcas.includes(marca)).slice(0, limite);
}
