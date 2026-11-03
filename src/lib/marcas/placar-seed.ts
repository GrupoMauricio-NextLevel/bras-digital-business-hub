/**
 * Súmula inicial do placar da goleada (D230; Shopify e "em reais" em D233), a partir dos sites oficiais consultados em 03/11/2026 (seção 8 de
 * docs/prompts/parceiros-v2-crm-niveis-planos.md). O dono altera tudo no Master (/master/placar).
 * Cada valor é texto livre que o sistema entende: número ("300", "0,99"), "sem limite", "sim", "não" ou vazio.
 * Vazio = o concorrente não divulga: o lance não vale gol para ninguém (regra de honestidade).
 */
export const DEGRAUS_PLACAR = ["entrada", "intermediario", "avancado"] as const;
export type DegrauPlacar = (typeof DEGRAUS_PLACAR)[number];
export const NOME_DEGRAU: Record<DegrauPlacar, string> = { entrada: "Plano de entrada", intermediario: "Plano intermediário", avancado: "Plano avançado" };

export type Tres = Record<DegrauPlacar, string>;
export type ItemSumula = { key: string; lance: string; minuto: number; regra: "maior" | "menor"; unidade?: string; nextlevel: Tres; rivais: Record<string, Tres> };
export type RivalSumula = { key: string; nome: string; planos: Tres; fonte: string };
export type Sumula = { atualizadoEm: string; rivais: RivalSumula[]; itens: ItemSumula[] };

const t = (entrada: string, intermediario: string, avancado: string): Tres => ({ entrada, intermediario, avancado });
const todos = (v: string) => t(v, v, v);

export const SUMULA_PADRAO: Sumula = {
  atualizadoEm: "2026-11-03T15:00:00.000Z",
  rivais: [
    { key: "nuvemshop", nome: "Nuvemshop", planos: t("Essencial", "Impulso", "Escala"), fonte: "https://www.nuvemshop.com.br/planos-e-precos" },
    { key: "loja-integrada", nome: "Loja Integrada", planos: t("Crescimento", "Aceleração", "Expansão"), fonte: "https://lojaintegrada.com.br/compare/" },
    { key: "wbuy", nome: "WBuy", planos: t("Iniciante", "Turbo", "Expansão"), fonte: "https://www.wbuy.com.br/planos" },
    { key: "tray", nome: "Tray", planos: t("Lançamento", "Crescimento", "Avançado"), fonte: "https://www.tray.com.br/planos/" },
    { key: "shopify", nome: "Shopify", planos: t("Basic", "Grow", "Advanced"), fonte: "https://www.shopify.com/br/precos" },
  ],
  itens: [
    { key: "taxa", lance: "Taxa da plataforma usando o Mercado Pago", minuto: 7, regra: "menor", unidade: "%", nextlevel: todos("0"), rivais: { nuvemshop: t("2", "1", "0,7"), "loja-integrada": t("0,99", "0,9", "0,7"), wbuy: t("1,5", "1,25", "1"), tray: t("1,25", "1", "0,75"), shopify: t("2", "1", "0,6") } },
    { key: "pedidos", lance: "Pedidos por mês", minuto: 15, regra: "maior", nextlevel: todos("sem limite"), rivais: { nuvemshop: todos("sem limite"), "loja-integrada": todos(""), wbuy: todos(""), tray: t("100", "500", "1000"), shopify: todos("sem limite") } },
    { key: "produtos", lance: "Produtos ativos", minuto: 23, regra: "maior", nextlevel: t("300", "1000", "sem limite"), rivais: { nuvemshop: todos("sem limite"), "loja-integrada": t("250", "500", "sem limite"), wbuy: t("200", "500", "1000"), tray: t("100", "750", "1500"), shopify: todos("sem limite") } },
    { key: "pessoas", lance: "Pessoas no painel", minuto: 31, regra: "maior", nextlevel: t("3", "6", "12"), rivais: { nuvemshop: todos(""), "loja-integrada": t("2", "3", "10"), wbuy: t("1", "5", "10"), tray: t("1", "5", "10"), shopify: t("2", "5", "15") } },
    // Atacado nativo: Nuvemshop e Loja Integrada não têm (confirmado pelo dono em 03/11/2026, D231).
    { key: "atacado", lance: "Atacado nativo: grade, preço por quantidade, pedido mínimo", minuto: 38, regra: "maior", nextlevel: todos("sim"), rivais: { nuvemshop: todos("não"), "loja-integrada": todos("não"), wbuy: t("não", "sim", "sim"), tray: t("não", "não", "sim"), shopify: todos("não") } },
    { key: "ia", lance: "Inteligência artificial por mês (usos)", minuto: 44, regra: "maior", nextlevel: t("40", "350", "1200"), rivais: { nuvemshop: t("30", "150", "sem limite"), "loja-integrada": todos(""), wbuy: todos(""), tray: todos(""), shopify: todos("") } },
    { key: "suporte", lance: "Suporte (1 e-mail · 2 chat/WhatsApp · 3 prioritário · 4 telefone e gerente)", minuto: 52, regra: "maior", nextlevel: t("2", "3", "4"), rivais: { nuvemshop: t("1", "2", "3"), "loja-integrada": todos(""), wbuy: t("2", "2", "3"), tray: t("1", "2", "3"), shopify: t("2", "2", "3") } },
    { key: "planilha", lance: "Relatórios em planilha", minuto: 60, regra: "maior", nextlevel: todos("sim"), rivais: { nuvemshop: todos(""), "loja-integrada": todos(""), wbuy: todos(""), tray: t("não", "sim", "sim"), shopify: todos("") } },
    { key: "balcao", lance: "Propostas e pedidos do balcão", minuto: 67, regra: "maior", nextlevel: todos("sim"), rivais: { nuvemshop: todos(""), "loja-integrada": todos(""), wbuy: todos(""), tray: todos(""), shopify: todos("sim") } },
    { key: "tema", lance: "Tema pago incluso", minuto: 74, regra: "maior", nextlevel: t("não", "sim", "sim"), rivais: { nuvemshop: todos(""), "loja-integrada": todos(""), wbuy: todos(""), tray: todos(""), shopify: todos("não") } },
    { key: "migracao", lance: "Migração assistida (0 paga · 1 com desconto · 2 inclusa)", minuto: 81, regra: "maior", nextlevel: t("0", "1", "2"), rivais: { nuvemshop: todos(""), "loja-integrada": todos(""), wbuy: todos(""), tray: t("0", "0", "0"), shopify: todos("") } },
    // Shopify cobra em dólar: a mensalidade muda com o câmbio e ainda tem IOF no cartão (D233).
    { key: "reais", lance: "Mensalidade em reais, sem câmbio nem IOF", minuto: 85, regra: "maior", nextlevel: todos("sim"), rivais: { nuvemshop: todos("sim"), "loja-integrada": todos("sim"), wbuy: todos("sim"), tray: todos("sim"), shopify: todos("não") } },
    { key: "presencial", lance: "Equipe presencial no Brás (São Paulo)", minuto: 88, regra: "maior", nextlevel: todos("sim"), rivais: { nuvemshop: todos(""), "loja-integrada": todos(""), wbuy: todos(""), tray: todos(""), shopify: todos("") } },
  ],
};
