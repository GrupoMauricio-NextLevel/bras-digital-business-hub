import { formatBRL } from "@/lib/money";
import { faqCommerce } from "./faq-commerce";
import type { FatosPublicos } from "./fatos-publicos";
import { FRASE_ENTIDADE, EMPRESA } from "./entidade";
import { PAGINAS_COMMERCE, tituloCompleto } from "./paginas";

/**
 * Arquivos em texto para as IAs lerem rápido (D302, plano de busca v3, seção 8.4): `/llms.txt` (resumo e mapa do site),
 * `/llms-full.txt` (resumo, planos e perguntas completas) e as versões `.md` das páginas de planos e de perguntas.
 * Tudo montado das mesmas fontes do site (tabela de páginas e fatos do sistema), nunca escrito à mão.
 * Honestidade: nenhuma grande IA garante que lê `llms.txt`; o custo é baixo e o texto limpo ajuda quem lê.
 */
export const VERSOES_MD = [
  { caminho: "/planos.md", titulo: "Planos e preços (texto)", origem: "/planos" },
  { caminho: "/faq.md", titulo: "Perguntas frequentes (texto)", origem: "/faq" },
] as const;

const hoje = (agora: Date) => agora.toISOString().slice(0, 10);
const reais = (c: number | null) => (c === null ? "sob consulta" : formatBRL(c));

function fatosRapidos(f: FatosPublicos): string[] {
  const pagos = f.planos.filter((p) => p.mensalCents && p.mensalCents > 0);
  const taxaZero = pagos.length > 0 && pagos.every((p) => !p.taxaBps);
  return [
    "Atacado em todos os planos: grade, preço por quantidade, pedido mínimo e regras de mix.",
    ...(taxaZero ? ["0% de tarifa da plataforma sobre as vendas com o Mercado Pago, em todos os planos (as taxas do Mercado Pago são dele)."] : []),
    ...(pagos.length ? [`Planos: ${pagos.map((p) => `${p.nome} ${formatBRL(p.mensalCents!)} por mês`).join(", ")}; o anual sai mais barato por mês.`] : []),
    ...(f.diasDeTeste ? [`${f.diasDeTeste} dias grátis para testar, sem fidelidade.`] : []),
    "Pix e cartão pelo Mercado Pago; frete calculado na hora (Melhor Envio, Frenet, Correios com contrato).",
    "Domínio próprio em todos os planos; temas por nicho; atendimento por pessoas desde o primeiro plano.",
    `Empresa responsável: ${EMPRESA.nome}, CNPJ ${EMPRESA.cnpj}, São Paulo (SP).`,
  ];
}

export function llmsTxt(baseUrl: string, f: FatosPublicos, agora = new Date()): string {
  const linhas = [
    "# NextLevel Commerce",
    "",
    `> ${FRASE_ENTIDADE}`,
    "",
    `Fatos de ${hoje(agora)} (lidos do sistema):`,
    ...fatosRapidos(f).map((x) => `- ${x}`),
    "",
    "## Páginas principais",
    ...PAGINAS_COMMERCE.filter((p) => p.nucleo !== "legal").map((p) => `- [${tituloCompleto(p)}](${baseUrl}${p.caminho === "/" ? "" : p.caminho}): ${p.descricao}`),
    "",
    "## Versões em texto",
    ...VERSOES_MD.map((v) => `- [${v.titulo}](${baseUrl}${v.caminho})`),
    `- [Tudo em um arquivo](${baseUrl}/llms-full.txt)`,
    "",
    "## Opcional",
    ...PAGINAS_COMMERCE.filter((p) => p.nucleo === "legal").map((p) => `- [${tituloCompleto(p)}](${baseUrl}${p.caminho}): ${p.descricao}`),
  ];
  return `${linhas.join("\n")}\n`;
}

export function planosMd(baseUrl: string, f: FatosPublicos, agora = new Date()): string {
  const anual = new Map(f.planosAnuais.map((p) => [p.nome, p.anualCents]));
  const linhas = [
    "# Planos e preços da NextLevel Commerce",
    "",
    `Atualizado em ${hoje(agora)}, com os valores do sistema. Página completa: ${baseUrl}/planos`,
    "",
    "| Plano | Mensal | Anual (total) | Produtos | Faixas de preço no atacado | Atendimento | Migração |",
    "|---|---|---|---|---|---|---|",
    ...f.planos.map((p) => `| ${p.nome} | ${reais(p.mensalCents)} | ${reais(anual.get(p.nome) ?? null)} | ${p.produtos === null ? "sem limite" : p.produtos.toLocaleString("pt-BR")} | ${p.faixasAtacado} | ${p.suporte} | ${p.migracao} |`),
    "",
    ...fatosRapidos(f).map((x) => `- ${x}`),
  ];
  return `${linhas.join("\n")}\n`;
}

export function faqMd(baseUrl: string, f: FatosPublicos, agora = new Date()): string {
  const linhas = ["# Perguntas frequentes da NextLevel Commerce", "", `Atualizado em ${hoje(agora)}. Página completa: ${baseUrl}/faq`, ""];
  for (const q of faqCommerce(f)) linhas.push(`## ${q.q}`, "", q.a, "");
  return `${linhas.join("\n")}`;
}

export function llmsFullTxt(baseUrl: string, f: FatosPublicos, agora = new Date()): string {
  return [llmsTxt(baseUrl, f, agora), planosMd(baseUrl, f, agora), faqMd(baseUrl, f, agora)].join("\n---\n\n");
}
