import { SecaoImersiva } from "@/components/imersiva/secao-imersiva";
import type { PassoMarca } from "@/components/imersiva/jornada";
import { SD_HOME_ACERVO, type SdHomeFotoNome } from "@/lib/marcas/superdrop-home-imagens";
import { sdCssVars } from "@/lib/marcas/superdrop";

/**
 * Jornada imersiva do SuperDrop (D167): da escolha do produto à entrega, com o fornecedor (Central) separando e enviando.
 * Mesmas promessas da home v4 (catálogo dos fornecedores, pagamento na conta da loja, Central separa com a etiqueta, esteira
 * no painel). O SuperDrop tem clientes: fica na prévia até as fotos chegarem e o dono decidir a logo (`superdrop-home-imagens.ts`).
 */
const PASSOS: PassoMarca<SdHomeFotoNome>[] = [
  { key: "escolhe", nome: "Escolher", foto: "sd-jornada-1-escolhe", retrato: "sd-jornada-1-escolhe-retrato", titulo: "Você escolhe os produtos.", texto: "Ative itens do catálogo dos fornecedores parceiros e defina o seu preço de venda.", links: [{ label: "Criar minha loja", href: "/cadastro" }] },
  { key: "divulga", nome: "Divulgar", foto: "sd-jornada-2-divulga", retrato: "sd-jornada-2-divulga-retrato", titulo: "Sua loja com cara de marca.", texto: "Tema grátis e editor visual, sem programar. Mande o link da loja para as suas clientes.", links: [{ label: "Ver temas", href: "/temas" }] },
  { key: "vende", nome: "Vender", foto: "sd-jornada-3-vende", retrato: "sd-jornada-3-vende-retrato", titulo: "O pagamento cai na sua conta.", texto: "O cliente paga na sua loja, o dinheiro vai para a conta Mercado Pago da loja e o pedido nasce sozinho.", links: [{ label: "Perguntas frequentes", href: "/faq" }] },
  { key: "separa", nome: "Enviar", foto: "sd-jornada-4-separa", retrato: "sd-jornada-4-separa-retrato", titulo: "O fornecedor separa e envia.", texto: "Com a etiqueta do pedido em mãos, a Central separa, embala e despacha no horário de corte.", links: [{ label: "Como funciona", href: "#como-funciona" }] },
  { key: "entrega", nome: "Acompanhar", foto: "sd-jornada-5-entrega", retrato: "sd-jornada-5-entrega-retrato", titulo: "Você acompanha até a entrega.", texto: "Cada etapa aparece na esteira do seu painel, do pagamento ao envio.", links: [{ label: "Criar minha loja", href: "/cadastro" }] },
];

export function ImersivaSuperDrop({ previa }: { previa: boolean }) {
  return (
    <div style={sdCssVars()} className="contents">
      <SecaoImersiva tema="im-tema-superdrop" acervo={SD_HOME_ACERVO} previa={previa} portasClassName="bg-canvas text-foreground"
        jornada={{ passos: PASSOS, eyebrow: "Como funciona", titulo: "Você vende. O fornecedor envia.", rotulo: "Do produto à entrega, em cinco passos" }}
        portas={{ eyebrow: "Por onde começar", titulo: "Cada um tem o seu lugar na rede.", texto: "Escolha o seu ponto de partida. Sem estoque e sem fidelidade.", itens: [
          { foto: "sd-porta-comecar", titulo: "Quero começar a vender", texto: "Sua loja no ar com os produtos dos fornecedores parceiros.", href: "/cadastro" },
          { foto: "sd-porta-revender", titulo: "Já revendo para clientes", texto: "Os pedidos que chegam pelo WhatsApp entram no mesmo painel da loja.", href: "/cadastro" },
          { foto: "sd-porta-central", titulo: "Sou fornecedor", texto: "Uma rede de lojas vendendo o seu estoque, com pedido pago e etiqueta.", href: "/seja-fornecedor", cta: "Quero ser fornecedor" },
          { foto: "sd-porta-parceiro", titulo: "Quero indicar lojas", texto: "Programa de parceiros com link próprio e painel de indicações.", href: "/parceiros", cta: "Ver o programa" },
        ] }} />
    </div>
  );
}
