import { DEMO_BRAS_ACCOUNTS } from "@/db/demo-bras";

/**
 * Estúdio de gravação (D144): só no ambiente de demonstração. Lista de quem dá para "ser" na gravação e o roteiro de aulas
 * sugerido para o YouTube. O modo gravação mora em `gravacao-server.ts`.
 */

export type DemoLogin = { email: string; who: string; shows: string };
export const DEMO_LOGINS: { group: string; items: DemoLogin[] }[] = [
  { group: "Grupo NextLevel (Master)", items: [
    { email: "master@nextlevel.demo", who: "Dono (Master)", shows: "Tudo: marcas, clientes, financeiro, preços, central de qualidade" },
    { email: DEMO_BRAS_ACCOUNTS.comercial, who: "Equipe: Comercial", shows: "Torre do Ecossistema, oportunidades, CRM e clientes" },
    { email: DEMO_BRAS_ACCOUNTS.suporte, who: "Equipe: Suporte", shows: "Clientes e suporte, pedidos, erros, Meu Contador" },
    { email: DEMO_BRAS_ACCOUNTS.financeiro, who: "Equipe: Financeiro", shows: "Financeiro, preços, ofertas, experimentos" },
    { email: DEMO_BRAS_ACCOUNTS.contador, who: "Contador parceiro", shows: "Só a fila do Meu Contador" },
  ] },
  { group: "SuperDrop", items: [
    { email: "megatron@superdrop.demo", who: "Fornecedor Mega Tron", shows: "Esteira ao vivo, produtos, estoque, lojistas, faturas" },
    { email: "expedicao@megatron.demo", who: "Expedição Mega Tron", shows: "Fila de separação, etiquetas e enviados" },
    { email: "loja@mrssports.demo", who: "Lojista MRS Sports", shows: "Loja com pedidos em todas as etapas, saldo e recargas" },
    { email: "dono@mantosshop.demo", who: "Lojista Mantos Shop", shows: "Outra loja da rede, para comparar" },
    { email: "parceira@demo.superdrop.com.br", who: "Parceira Camila", shows: "Links, cupons, indicados e comissões" },
  ] },
  { group: "NextLevel Commerce", items: [
    { email: "completo@commerce.demo", who: "Loja Commerce completa", shows: "Catálogo, pedidos, cupons, campanhas, equipe e assinatura" },
    { email: "lojista@commerce.demo", who: "Loja Commerce simples", shows: "Loja começando, primeiros passos" },
    { email: "equipe@commerce.demo", who: "Equipe da loja", shows: "O que a equipe vê (sem financeiro)" },
  ] },
  { group: "Brás Digital Club", items: [
    { email: DEMO_BRAS_ACCOUNTS.membro, who: "Membro Ana (plano Ouro)", shows: "Descobertas, pedidos de caixas, fretes, Club e Meu Contador" },
    { email: DEMO_BRAS_ACCOUNTS.membro2, who: "Membro Carlos", shows: "Membro novo, sem plano" },
    { email: DEMO_BRAS_ACCOUNTS.importadora, who: "Importadora Aurora (dono)", shows: "Pedidos, produtos em caixa, estoque, chamar transportadora" },
    { email: DEMO_BRAS_ACCOUNTS.importadoraBalcao, who: "Importadora: balcão", shows: "Só separar e entregar no balcão" },
  ] },
  { group: "NextLevel Cargas", items: [
    { email: DEMO_BRAS_ACCOUNTS.transportadora, who: "Transportadora Rota Ouro", shows: "Cargas, reputação Ouro, extrato, link do motorista" },
    { email: DEMO_BRAS_ACCOUNTS.onibus, who: "Ônibus de excursão", shows: "Rotas, viagens, fardos e entregas" },
  ] },
];

export type Aula = { n: number; title: string; email: string; start: string; steps: string[] };
/** Roteiro sugerido: uma aula por tarefa real, na ordem em que um cliente novo aprende. */
export const AULAS: { serie: string; aulas: Aula[] }[] = [
  { serie: "Master: comandar o grupo", aulas: [
    { n: 1, title: "Tour pelo Master", email: "master@nextlevel.demo", start: "/master", steps: ["Dashboard e resumo do dia", "Lojas, fornecedores e pedidos da rede", "Erros do sistema e integridade"] },
    { n: 2, title: "Atender um cliente pelo modo suporte", email: "master@nextlevel.demo", start: "/master/clientes", steps: ["Achar o cliente", "Entrar em modo suporte (só olhando)", "Liberar agir em nome do cliente e sair"] },
    { n: 3, title: "Preços, ofertas e experimentos", email: "master@nextlevel.demo", start: "/master/financeiro/precos", steps: ["Preços do grupo", "Proposta de preço e porta de entrada", "Criar um experimento"] },
    { n: 4, title: "Montar a equipe com funções", email: "master@nextlevel.demo", start: "/master/equipe", steps: ["Cadastrar uma pessoa", "Mostrar o que cada função enxerga (entre como Comercial)"] },
  ] },
  { serie: "SuperDrop: vender sem estoque", aulas: [
    { n: 5, title: "Fornecedor: a esteira do dia", email: "megatron@superdrop.demo", start: "/supplier", steps: ["Pedidos chegando", "Horário de corte e ondas", "Faturas da NextLevel"] },
    { n: 6, title: "Expedição: separar e etiquetar", email: "expedicao@megatron.demo", start: "/supplier/dispatch", steps: ["Fila de separação", "Imprimir etiquetas", "Marcar como enviado"] },
    { n: 7, title: "Lojista: a primeira venda", email: "loja@mrssports.demo", start: "/merchant/orders", steps: ["Simular uma venda", "Saldo e recarga por Pix (simulada)", "Acompanhar até a entrega"] },
    { n: 8, title: "Lojista: loja bonita sem programar", email: "loja@mrssports.demo", start: "/merchant/storefront", steps: ["Editor do tema", "Campanhas e cupons", "Ver a vitrine"] },
    { n: 9, title: "Parceiro: indicar e ganhar", email: "parceira@demo.superdrop.com.br", start: "/partner", steps: ["Criar link e cupom", "Indicados e comissões"] },
  ] },
  { serie: "NextLevel Commerce: a sua loja virtual", aulas: [
    { n: 10, title: "Catálogo e categorias", email: "completo@commerce.demo", start: "/merchant/catalogo", steps: ["Cadastrar produto com variações", "Categorias", "Importar por planilha"] },
    { n: 11, title: "Aparência da loja", email: "completo@commerce.demo", start: "/theme-editor", steps: ["Escolher tema", "Banners e seções", "Publicar"] },
    { n: 12, title: "Pedidos, clientes e financeiro", email: "completo@commerce.demo", start: "/merchant/orders", steps: ["Pedido do pagamento à entrega", "Clientes", "Assinatura e taxa"] },
  ] },
  { serie: "Brás Digital Club: comprar do Brás sem viajar", aulas: [
    { n: 13, title: "Membro: descobrir e pedir caixas", email: DEMO_BRAS_ACCOUNTS.membro, start: "/meu-bras", steps: ["Descobertas com vídeo", "Pedir caixas com transportadora", "Acompanhar o pedido"] },
    { n: 14, title: "Importadora: do pedido ao balcão", email: DEMO_BRAS_ACCOUNTS.importadora, start: "/importadora", steps: ["Pedidos do dia", "Produtos e estoque em caixas", "Chamar a transportadora"] },
    { n: 15, title: "Transportadora: aceitar e entregar", email: DEMO_BRAS_ACCOUNTS.transportadora, start: "/transportadora", steps: ["Chamadas para responder", "Link do motorista", "Reputação Ouro e extrato"] },
    { n: 16, title: "Ônibus de excursão: rota, viagem e fardos", email: DEMO_BRAS_ACCOUNTS.onibus, start: "/transportadora/rotas", steps: ["Rota e preços por fardo", "Abrir viagem", "Aceitar, coletar e entregar fardo"] },
    { n: 17, title: "Club e Meu Contador", email: DEMO_BRAS_ACCOUNTS.membro, start: "/meu-bras/club", steps: ["Pontos e níveis", "Indicar e ganhar", "Pedir a nota no Meu Contador"] },
  ] },
];

/** Endereço interno seguro para começar uma aula (nada de endereço de fora). */
export const safeStart = (p: string) => (/^\/[a-z0-9/_-]*$/i.test(p) && !p.startsWith("//") ? p : "/");
