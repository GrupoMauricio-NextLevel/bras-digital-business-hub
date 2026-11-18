import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getBrand, groupLink } from "@/lib/brand-server";
import { metadadosDaPagina } from "@/lib/seo/metadados";
import { businessLigado } from "@/lib/business/modulos";
import { precosDoSites } from "@/lib/business/precos-frentes";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { getPriceBook } from "@/lib/domain/finance";
import { formatBRL } from "@/lib/money";
import { FRENTES } from "@/lib/marcas/frentes";
import { PaginaDeFrente } from "@/components/portal/frentes/pagina-de-frente";
import { PlanosFrente } from "@/components/portal/frentes/planos-frente";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return metadadosDaPagina("/sites"); }

/**
 * NextLevel Sites (ecossistema tudo em um, D336): a página do caminho Site (antes `/empresas`), no molde das frentes.
 * Preços: Sites Start da tabela do Master; Pro e Scale iguais aos planos da loja (catálogo). Só na Commerce, com BUSINESS_V1.
 */
export default async function NextLevelSites() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || !businessLigado()) notFound();
  const db = await getDb();
  const [pv, book, solucoes] = await Promise.all([commercePlansView(db), getPriceBook(db), groupLink("/solucoes")]);
  const s = precosDoSites(book, pv.plans);
  const entrar = (plano?: string) => (brand.signupOpen ? `/cadastro?para=site${plano ? `&plano=${plano}` : ""}` : "/quero-meu-site");
  const preco = (c: number | undefined) => (c ? formatBRL(c) : "Sob consulta");
  const desconto = book.frentes.segundoProdutoBps / 100;
  const teste = pv.offer?.trialDays ? `${pv.offer.trialDays} dias grátis para testar` : undefined;
  return (
    <PaginaDeFrente
      frente={FRENTES.sites}
      solucoesHref={solucoes}
      dados={[{ rotulo: "Para começar", valor: `${formatBRL(s.START.monthlyCents)}/mês` }, { rotulo: "Origem do contato", valor: "Meta, Google, Instagram" }, { rotulo: "Fidelidade", valor: "Nenhuma" }]}
      cta={{ rotulo: "Criar meu site", href: entrar() }}
      ctaSecundario={{ rotulo: "Quero ajuda para montar", href: `${solucoes}#diagnostico` }}
      planos={
        <PlanosFrente id="planos" titulo="Planos do Sites" texto="Os mesmos níveis da loja virtual. Comece pequeno e suba de nível sem trocar de conta."
          planos={[
            { nome: "Sites Start", para: "Para começar a captar", preco: preco(s.START.monthlyCents), sufixo: "/mês", nota: teste, cta: { rotulo: "Começar no Start", href: entrar("COMMERCE_START") },
              itens: ["Site da empresa com páginas e serviços", "Formulário de orçamento com a origem", "Contatos e orçamentos no painel", "Seu domínio próprio"] },
            { nome: "Sites Pro", para: "Para quem anuncia todo mês", preco: preco(s.PRO?.monthlyCents), sufixo: "/mês", destaque: true, nota: teste, cta: { rotulo: "Começar no Pro", href: entrar("COMMERCE_PRO") },
              itens: ["Tudo do Start", "Loja virtual inclusa: liga quando quiser", "Mais pessoas da equipe no painel", "Maurício escreve textos por você", "Suporte prioritário"] },
            { nome: "Sites Scale", para: "Para operações maiores", preco: preco(s.SCALE?.monthlyCents), sufixo: "/mês", nota: teste, cta: { rotulo: "Começar no Scale", href: entrar("COMMERCE_SCALE") },
              itens: ["Tudo do Pro", "NextLevel Business Essencial incluso", "Gerente de conta", "Maurício completo"] },
          ]}
          rodape={<>Já tem a loja virtual? O site sai com {desconto}% de desconto no segundo produto, direto no painel. Valores atuais da tabela da {brand.name}; podem mudar para novas contratações.</>}
        />
      }
    />
  );
}
