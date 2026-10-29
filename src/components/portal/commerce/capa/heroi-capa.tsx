import Link from "next/link";
import { ArrowDown, ShieldCheck } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { EC_HOME_ACERVO } from "@/lib/marcas/ecommerce-home-imagens";
import { FotoImersiva } from "@/components/imersiva/foto";
import { CabecalhoSobreHeroi } from "@/components/portal/superdrop/cabecalho-sobre-heroi";

/**
 * Primeira dobra da capa (D198, referência de herói de oferta): fundo marinho que acende em azul na base, título enorme
 * centralizado com a oferta num selo inclinado, preço de entrada real (do catálogo Master), um botão branco e a garantia
 * logo abaixo. Nas laterais, duas fotos do acervo flutuando com avisos de pedido (demonstração). Sem número inventado.
 */
export function HeroiCapaEc({ cta, signupOpen, offer, aPartirDeCents }: { cta: string; signupOpen: boolean; offer: { trialDays: number; firstPeriodCents: number | null } | null; aPartirDeCents: number | null }) {
  const botao = signupOpen ? "Criar minha loja" : "Quero minha loja";
  return (
    <section id="inicio" data-heroi-escuro="commerce" className="ecc-heroi" aria-labelledby="titulo">
      <CabecalhoSobreHeroi alvo="inicio" />
      <div aria-hidden className="ecc-heroi-luz" />
      <div aria-hidden className="ecc-flutua ecc-flutua--esq">
        <FotoImersiva acervo={EC_HOME_ACERVO} nome="ec-jornada-1-produto-retrato" alt="" sizes="16rem" prioridade className="ecc-foto" imgClassName="size-full object-cover" />
        <p className="ecc-aviso ecc-aviso--baixo"><span className="ecc-ponto" />Pedido #1042 pago por Pix<b>{formatBRL(18990)}</b></p>
      </div>
      <div aria-hidden className="ecc-flutua ecc-flutua--dir">
        <FotoImersiva acervo={EC_HOME_ACERVO} nome="ec-jornada-4-envio-retrato" alt="" sizes="16rem" prioridade className="ecc-foto" imgClassName="size-full object-cover" />
        <p className="ecc-aviso ecc-aviso--alto">Etiqueta gerada<b>Rastreio enviado no WhatsApp</b></p>
      </div>

      <div className="ecc-heroi-texto">
        <p className="ecc-selo-topo">NextLevel E-commerce · do Brás, com foco no atacado</p>
        <h1 id="titulo" className="ecc-titulo">
          Sua loja virtual
          <span className="ecc-titulo-linha">
            {offer && signupOpen ? <span className="ecc-oferta"><small>COM</small>{offer.trialDays} dias grátis</span> : <span className="ecc-oferta">no ar hoje</span>}
          </span>
        </h1>
        <p className="ecc-sub">
          {aPartirDeCents ? <>Planos a partir de <b>{formatBRL(aPartirDeCents)}/mês</b> no anual. </> : null}
          <b>Taxa zero</b> nas vendas com o Mercado Pago, nosso parceiro oficial: Pix e cartão caem direto na sua conta.
        </p>
        <Link href={cta} className="ecc-cta">{botao}</Link>
        <p className="ecc-garantia"><ShieldCheck className="size-4" aria-hidden />Sem fidelidade: cancele quando quiser{offer?.firstPeriodCents != null && signupOpen ? <> · 1º mês por {formatBRL(offer.firstPeriodCents)}</> : null}</p>
        <a href="#planos" className="ecc-ver-planos">Ver planos <ArrowDown className="size-4" aria-hidden /></a>
      </div>
      <p className="ecc-nota">Fotos ilustrativas; avisos de pedido de demonstração.</p>
    </section>
  );
}
