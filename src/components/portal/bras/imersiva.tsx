import { SecaoImersiva } from "@/components/imersiva/secao-imersiva";
import type { PassoMarca } from "@/components/imersiva/jornada";
import { BD_HOME_ACERVO, type BdHomeFotoNome } from "@/lib/marcas/bras-home-imagens";

/**
 * Jornada imersiva do Brás Digital Club (D167): a compra da Dona Cida, do vídeo à caixa na loja dela. Cada frase vem do que a
 * home e o sistema já fazem (descobertas com análise, pedido em caixa fechada confirmado pela equipe, retirada com código no
 * balcão, transportadora ou ônibus de excursão). Fica na prévia até as fotos chegarem (`bras-home-imagens.ts`).
 */
const PASSOS: PassoMarca<BdHomeFotoNome>[] = [
  { key: "descobre", nome: "Descobrir", foto: "bd-jornada-1-descobre", retrato: "bd-jornada-1-descobre-retrato", titulo: "Veja o que está girando.", texto: "Cada descoberta tem vídeo e análise de mercado. Como membro, você vê o veredito, o preço da caixa e as caixas disponíveis.", links: [{ label: "Ver descobertas", href: "#videos" }] },
  { key: "escolhe", nome: "Pedir", foto: "bd-jornada-2-escolhe", retrato: "bd-jornada-2-escolhe-retrato", titulo: "Peça em caixa fechada, do celular.", texto: "Escolha quantas caixas quer pelo sistema. A equipe do Brás Digital Club confirma o pedido e o pagamento com você.", links: [{ label: "Cadastrar minha empresa", href: "/cadastro" }] },
  { key: "separa", nome: "Separar", foto: "bd-jornada-3-separa", retrato: "bd-jornada-3-separa-retrato", titulo: "A importadora separa no Brás.", texto: "Importadoras, distribuidores e atacadistas aprovados pela equipe recebem o pedido e deixam as caixas prontas para a retirada.", links: [{ label: "Como funciona", href: "#como-funciona" }] },
  { key: "embarca", nome: "Retirar", foto: "bd-jornada-4-embarca", retrato: "bd-jornada-4-embarca-retrato", titulo: "Retirada com código no balcão.", texto: "A transportadora ou o ônibus de excursão retira com o código do pedido; sem o código certo, a carga não sai. Quem retira recebe só o endereço de envio.", links: [{ label: "Dúvidas", href: "#duvidas" }] },
  { key: "chega", nome: "Receber", foto: "bd-jornada-5-chega", retrato: "bd-jornada-5-chega-retrato", titulo: "A caixa chega na sua cidade.", texto: "Você acompanha o pedido no painel e repõe a loja sem precisar viajar para comprar.", links: [{ label: "Cadastrar minha empresa", href: "/cadastro" }] },
];

export function ImersivaBras({ previa }: { previa: boolean }) {
  return (
    <SecaoImersiva tema="im-tema-bras" acervo={BD_HOME_ACERVO} previa={previa} portasClassName="bd-papel"
      jornada={{ passos: PASSOS, eyebrow: "Como funciona", titulo: "Do vídeo à caixa na sua loja.", rotulo: "A compra no Brás, em cinco passos" }}
      portas={{ eyebrow: "Por onde começar", titulo: "Quem abastece e quem compra, no mesmo clube.", texto: "Escolha o seu ponto de partida. Comprar é grátis para empresas com CNPJ conferido.", itens: [
        { foto: "bd-porta-lojista", titulo: "Tenho loja e compro no Brás", texto: "Preço de caixa fechada e pedido pelo sistema, sem perder o dia de viagem.", href: "/cadastro" },
        { foto: "bd-porta-revenda", titulo: "Vendo em marketplace", texto: "Compre o que a análise mostra que está girando e reponha sem sair de casa.", href: "/cadastro" },
        { foto: "bd-porta-importadora", titulo: "Sou importadora ou atacadista", texto: "Receba pedidos de compradores com CNPJ conferido, com os dados deles protegidos.", href: "/fornecer", cta: "Quero fornecer" },
        { foto: "bd-porta-transporte", titulo: "Mando pelo ônibus de excursão", texto: "Peça as caixas pelo sistema e a retirada sai com o código do pedido.", href: "/cadastro" },
      ] }} />
  );
}
