import type { BrandCode } from "@/lib/brand";
import { marcasAtivasNoMaster, type MarcaMaster } from "@/lib/master-marca";
import type { ProductContextKey } from "@/lib/product-context";

/**
 * Cadastro único dos negócios do grupo no Master (D218). Toda tela que precisa saber "quais marcas aparecem" pergunta
 * aqui, em vez de citar SuperDrop, Brás ou fornecedores fixos no texto. Hoje só a Commerce está aberta; a próxima é a
 * NextLevel Soluções (portfólio de serviços feitos pela equipe). A NextLevel Business (gestão e captação que funciona
 * sozinha, D304) ainda não tem código de marca: entra na fase B1. Para abrir um negócio:
 *  1) ele precisa ter código no sistema (marca em `brand.ts` e área no Master);
 *  2) entra em `MASTER_MARCAS` (master-marca.ts) e em `MASTER_MARCAS_ATIVAS` no Render.
 * Nada é apagado ao fechar: os dados só deixam de aparecer.
 */
export type EstadoNegocio = "aberto" | "proximo" | "pausado" | "em-breve";
export type Negocio = { code: BrandCode; nome: string; sigla: string; descritor: string; ctx: ProductContextKey; /** já tem área no Master (pode ser aberto por variável) */ temArea: boolean };

export const NEGOCIOS: Negocio[] = [
  { code: "NEXTLEVEL_COMMERCE", nome: "Commerce", sigla: "E", descritor: "Lojas virtuais", ctx: "commerce", temArea: true },
  { code: "NEXTLEVEL", nome: "Soluções", sigla: "So", descritor: "Portfólio de serviços feitos pela equipe", ctx: "master", temArea: false },
  { code: "SUPERDROP", nome: "SuperDrop", sigla: "S", descritor: "Distribuição e dropshipping", ctx: "superdrop", temArea: true },
  { code: "BRAS_DIGITAL", nome: "Brás Digital Club", sigla: "B", descritor: "Atacado B2B", ctx: "bras", temArea: true },
  { code: "NEXTLEVEL_CARGAS", nome: "Cargas", sigla: "C", descritor: "Transporte e coletas", ctx: "cargas", temArea: true },
  { code: "CREATORS_HUB", nome: "Creators", sigla: "Cr", descritor: "Creators e social commerce", ctx: "creators", temArea: false },
  { code: "CHINA_HUB", nome: "China Hub", sigla: "CH", descritor: "Brasil e China", ctx: "china", temArea: false },
];

/** O próximo negócio a entrar no Master (decisão do dono, 2026-10-29): a NextLevel Soluções. */
export const PROXIMO_NEGOCIO: BrandCode = "NEXTLEVEL";

export function estadoDoNegocio(code: BrandCode, abertas: readonly string[] = marcasAtivasNoMaster()): EstadoNegocio {
  if (abertas.includes(code)) return "aberto";
  if (code === PROXIMO_NEGOCIO) return "proximo";
  return NEGOCIOS.find((n) => n.code === code)?.temArea ? "pausado" : "em-breve";
}

/** Negócios abertos no Master agora (os únicos que as telas citam). */
export const negociosAbertos = (abertas: readonly MarcaMaster[] = marcasAtivasNoMaster()) => NEGOCIOS.filter((n) => abertas.includes(n.code as MarcaMaster));
/** Uma marca está aberta no Master? Use para esconder blocos, filtros e textos de marcas fechadas. */
export const negocioAberto = (code: BrandCode, abertas: readonly string[] = marcasAtivasNoMaster()) => abertas.includes(code);
