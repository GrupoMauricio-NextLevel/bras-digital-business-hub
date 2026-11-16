import { CartaFundador } from "@/components/portal/equipe/blocos";
import type { Brand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { beneficiosPorPlano, PLANOS_BENEFICIO } from "@/lib/domain/beneficios-plano";
import { OfertasCapa } from "@/components/portal/commerce/capa/ofertas";
import { Marquee } from "@/components/portal/commerce/marquee";
import { Personalize } from "@/components/portal/commerce/personalize";
import { IntegracoesFaixa, MauricioFaixa } from "@/components/portal/commerce/integracoes";
import { totalDeIntegracoes } from "@/lib/marcas/integracoes-publicas";
import { EC_HOME_ACERVO, type EcHomeFotoNome } from "@/lib/marcas/ecommerce-home-imagens";
import { JornadaMarca, type PassoMarca } from "@/components/imersiva/jornada";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import "../commerce.css";
import "../capa/capa.css";

/**
 * Recursos da NextLevel Commerce (D219): o "como funciona" completo, que saiu da home para ela ficar só com o que
 * convence (motivos, comparativo, planos, prova). Mesmas seções e textos de antes (cada frase confere com o sistema).
 */
export async function RecursosEc({ brand }: { brand: Brand }) {
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  const pv = await commercePlansView(await getDb());
  const offer = pv.offer ? { trialDays: pv.offer.trialDays } : null;
  // Limite de produtos por plano: da tabela de benefícios do Master (D247), nunca escrito à mão.
  const ben = await beneficiosPorPlano(await getDb());
  const faixaProdutos = PLANOS_BENEFICIO.map((k) => (ben[k].produtos === null ? "sem limite" : ben[k].produtos!.toLocaleString("pt-BR"))).join(", ").replace(/, ([^,]+)$/, " ou $1").replace(/^/, "até ");
  const comecar = brand.signupOpen ? (offer ? `Começar ${offer.trialDays} dias grátis` : "Criar minha loja") : "Quero minha loja";
  const passos: PassoMarca<EcHomeFotoNome>[] = [
    { key: "produto", nome: "Cadastrar", foto: "ec-jornada-1-produto", retrato: "ec-jornada-1-produto-retrato", titulo: "Cadastre como você vende.", texto: `Produtos com variações de tamanho e cor, estoque e categorias. Um a um ou por planilha, ${faixaProdutos}, conforme o plano.`, links: [{ label: "Ver os planos", href: "/planos" }] },
    { key: "loja", nome: "Montar", foto: "ec-jornada-2-loja", retrato: "ec-jornada-2-loja-retrato", titulo: "Sua vitrine, com a cara da marca.", texto: "Tema gratuito, editor visual com prévia ao vivo e domínio próprio. Enquanto não publica, só você vê.", links: [{ label: "Ver temas", href: "/temas" }, { label: "Lojas de exemplo", href: "/#exemplos" }] },
    { key: "pedido", nome: "Vender", foto: "ec-jornada-3-pedido", retrato: "ec-jornada-3-pedido-retrato", titulo: "O pagamento cai na sua conta.", texto: "Pix e cartão pelo Mercado Pago da sua loja: o dinheiro cai direto na sua conta, sem taxa da NextLevel (o Mercado Pago cobra só as taxas dele).", links: [{ label: "Dúvidas sobre pagamento", href: "/#duvidas" }] },
    { key: "envio", nome: "Enviar", foto: "ec-jornada-4-envio", retrato: "ec-jornada-4-envio-retrato", titulo: "Pedido organizado até a entrega.", texto: "Frete por regras próprias ou plataforma de envio (Melhor Envio, Frenet, Correios com contrato e outras), código de rastreio e mensagem pronta para o cliente no WhatsApp.", links: [{ label: "Ver as integrações", href: "/integracoes" }] },
    { key: "rotina", nome: "Crescer", foto: "ec-jornada-5-rotina", retrato: "ec-jornada-5-rotina-retrato", titulo: "Uma operação que cabe no seu dia.", texto: "Pós-venda, cupons, campanhas, avaliações, clientes e atendimento ao vivo no mesmo painel, com equipe de acessos separados.", links: [{ label: comecar, href: cta }] },
  ];
  const portas: { foto: EcHomeFotoNome; selo: string; titulo: string; texto: string }[] = [
    { foto: "ec-porta-zero", selo: "Do zero", titulo: "Começar do zero", texto: "Tema grátis, editor visual e produtos cadastrados um a um ou por planilha." },
    { foto: "ec-porta-instagram", selo: "Instagram e WhatsApp", titulo: "Já vendo pelo Instagram e WhatsApp", texto: "Os pedidos do WhatsApp e do Instagram entram no mesmo painel da loja." },
    { foto: "ec-porta-migrar", selo: "Migração", titulo: "Sair de outra plataforma", texto: "Traga os seus produtos por planilha e leve os endereços antigos para não perder o Google." },
    { foto: "ec-porta-fisica", selo: "Loja física", titulo: "Tenho loja física", texto: "A mesma vitrine no site, com Pix e cartão na sua conta Mercado Pago." },
  ];
  return (
    <div className="im-tema-ecommerce contents">
      <CabecalhoTech rotulo="Recursos" titulo={<>Tudo o que a sua loja faz, <em>do primeiro produto à rotina de pedidos.</em></>} texto="Cadastro, vitrine, pagamento, envio, personalização, inteligência artificial e integrações, numa plataforma só."
        dados={[{ rotulo: "Integrações", valor: String(totalDeIntegracoes()) }, { rotulo: "Taxa da plataforma", valor: "0%" }, { rotulo: "Pedidos por mês", valor: "Sem limite" }, { rotulo: "Assistente de IA", valor: "Maurício" }]} />
      <JornadaMarca acervo={EC_HOME_ACERVO} passos={passos} eyebrow="Como funciona" titulo="Da primeira foto à rotina de pedidos." rotulo="A loja que cresce, em cinco passos" />
      <OfertasCapa titulo="Comece do seu jeito" itens={portas.map((p) => ({ foto: p.foto, selo: p.selo, titulo: p.titulo, texto: p.texto, href: cta }))} />
      <Marquee />
      <section id="personalizar" aria-labelledby="pers-t" className="scroll-mt-16 bg-canvas px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Personalização</p>
          <h2 id="pers-t" className="im-h2 mt-3 mb-12 max-w-3xl text-foreground">A cara da sua marca, sem escrever código.</h2>
          <Personalize />
        </div>
      </section>
      <MauricioFaixa cta={cta} />
      <IntegracoesFaixa cta={cta} comecar={comecar} />
      <CartaFundador className="bg-surface text-foreground" />
    </div>
  );
}
