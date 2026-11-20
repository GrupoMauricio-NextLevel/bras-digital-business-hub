/**
 * Estúdio de gravação (D144): só no ambiente de demonstração. Lista de quem dá para "ser" na gravação e o roteiro de aulas
 * sugerido para o YouTube. O modo gravação mora em `gravacao-server.ts`.
 */

export type DemoLogin = { email: string; who: string; shows: string };
export const DEMO_LOGINS: { group: string; items: DemoLogin[] }[] = [
  { group: "Grupo NextLevel (Master)", items: [
    { email: "master@nextlevel.demo", who: "Dono (Master)", shows: "Tudo: marcas, clientes, financeiro, preços, central de qualidade" },
    { email: "comercial@nextlevel.demo", who: "Equipe: Comercial", shows: "Torre do Ecossistema, oportunidades, CRM e clientes" },
    { email: "suporte@nextlevel.demo", who: "Equipe: Suporte", shows: "Clientes e suporte, pedidos, erros, Meu Contador" },
    { email: "financeiro@nextlevel.demo", who: "Equipe: Financeiro", shows: "Financeiro, preços, ofertas, experimentos" },
    { email: "contador@nextlevel.demo", who: "Contador parceiro", shows: "Só a fila do Meu Contador" },
  ] },
  { group: "NextLevel Commerce", items: [
    { email: "completo@commerce.demo", who: "Loja Commerce completa", shows: "Catálogo, pedidos, cupons, campanhas, equipe e assinatura" },
    { email: "lojista@commerce.demo", who: "Loja Commerce simples", shows: "Loja começando, primeiros passos" },
    { email: "equipe@commerce.demo", who: "Equipe da loja", shows: "O que a equipe vê (sem financeiro)" },
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
  { serie: "NextLevel Commerce: a sua loja virtual", aulas: [
    { n: 10, title: "Catálogo e categorias", email: "completo@commerce.demo", start: "/merchant/catalogo", steps: ["Cadastrar produto com variações", "Categorias", "Importar por planilha"] },
    { n: 11, title: "Aparência da loja", email: "completo@commerce.demo", start: "/theme-editor", steps: ["Escolher tema", "Banners e seções", "Publicar"] },
    { n: 12, title: "Pedidos, clientes e financeiro", email: "completo@commerce.demo", start: "/merchant/orders", steps: ["Pedido do pagamento à entrega", "Clientes", "Assinatura e taxa"] },
  ] },
];

/** Endereço interno seguro para começar uma aula (nada de endereço de fora). */
export const safeStart = (p: string) => (/^\/[a-z0-9/_-]*$/i.test(p) && !p.startsWith("//") ? p : "/");
