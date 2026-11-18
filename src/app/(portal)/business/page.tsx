import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getBrand, groupLink } from "@/lib/brand-server";
import { metadadosDaPagina } from "@/lib/seo/metadados";
import { businessLigado } from "@/lib/business/modulos";
import { comDesconto, niveisDoBusiness } from "@/lib/business/precos-frentes";
import { getPriceBook } from "@/lib/domain/finance";
import { formatBRL } from "@/lib/money";
import { FRENTES } from "@/lib/marcas/frentes";
import { PaginaDeFrente } from "@/components/portal/frentes/pagina-de-frente";
import { PlanosFrente } from "@/components/portal/frentes/planos-frente";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return metadadosDaPagina("/business"); }

/**
 * NextLevel Business (ecossistema tudo em um, D336): a página do sistema de gestão, no molde das frentes. Vendido por
 * proposta até o primeiro pagante: os níveis aparecem como "a partir de" (tabela do Master) com "falar com a gente".
 * Só fala do que já funciona; o que está chegando aparece como "em breve".
 */
export default async function NextLevelBusiness() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || !businessLigado()) notFound();
  const db = await getDb();
  const [book, solucoes] = await Promise.all([getPriceBook(db), groupLink("/solucoes")]);
  const niveis = niveisDoBusiness(book);
  const falar = "/quero-minha-loja?para=business";
  const cliente = book.frentes.businessClienteBps / 100;
  const itens: Record<string, string[]> = {
    ESSENCIAL: ["Funil de clientes e contatos com origem", "Atendimento do site e da loja", "Equipe com acessos e registro", "Em breve: portal do cliente sem limite"],
    PROFISSIONAL: ["Tudo do Essencial", "Equipes de venda e atendimento com responsáveis", "Resultados dos anúncios ao lado do funil", "Em breve: projetos, tarefas e contratos"],
    AVANCADO: ["Tudo do Profissional", "Mais pessoas da equipe no mesmo painel", "Implantação com a equipe NextLevel", "Em breve: caixa da loja física"],
  };
  return (
    <PaginaDeFrente
      frente={FRENTES.business}
      solucoesHref={solucoes}
      dados={[{ rotulo: "A partir de", valor: `${formatBRL(niveis[0]!.monthlyCents)}/mês` }, { rotulo: "Equipe", valor: "Inclusa no nível" }, { rotulo: "No plano Scale", valor: "Essencial incluso" }]}
      cta={{ rotulo: "Quero conhecer o Business", href: falar }}
      ctaSecundario={{ rotulo: "Ver Sites e Loja virtual", href: "/sites" }}
      planos={
        <PlanosFrente id="niveis" titulo="Níveis do NextLevel Business" texto="Preço por empresa, em reais, com a equipe inclusa. Nada de cobrar por cliente no portal."
          planos={niveis.map((n, i) => ({
            nome: `Business ${n.nome}`, para: n.para, preco: formatBRL(n.monthlyCents), sufixo: "/mês",
            nota: `Até ${n.pessoas} pessoas da equipe · clientes da NextLevel: ${formatBRL(comDesconto(n.monthlyCents, book.frentes.businessClienteBps))}/mês`,
            itens: itens[n.chave] ?? [], destaque: i === 1, cta: { rotulo: "Falar com a gente", href: falar },
          }))}
          rodape={<>Quem tem Sites ou Loja virtual paga {cliente}% menos. Os planos Scale de Sites e de Loja virtual já trazem o Business Essencial. Contratação com a equipe, com demonstração antes. Valores atuais da tabela da {brand.name}; podem mudar para novas contratações.</>}
        />
      }
    />
  );
}
