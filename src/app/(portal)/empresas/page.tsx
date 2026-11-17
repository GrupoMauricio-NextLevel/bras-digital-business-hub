import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { metadadosDaPagina } from "@/lib/seo/metadados";
import { businessLigado } from "@/lib/business/modulos";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { getPriceBook } from "@/lib/domain/finance";
import { formatBRL } from "@/lib/money";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { BlocoEquipe } from "@/components/portal/equipe/blocos";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return metadadosDaPagina("/empresas"); }

/**
 * Site para empresas (NextLevel Business, NB8, D310): o caminho Site, o que vem nele e os pacotes, com preços do sistema
 * (planos do catálogo e adicionais da tabela do Master). Só existe com a chave BUSINESS_V1 e na marca Commerce.
 * Só fala do que já funciona; nada de promessa de resultado.
 */
export default async function ParaEmpresas() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || !businessLigado()) notFound();
  const db = await getDb();
  const [pv, book] = await Promise.all([commercePlansView(db), getPriceBook(db)]);
  const mensais = pv.plans.filter((p) => !p.quote && p.monthlyCents).map((p) => p.monthlyCents!);
  const aPartirDe = mensais.length ? Math.min(...mensais) : null;
  const entrar = brand.signupOpen ? "/cadastro?para=site" : "/quero-meu-site";
  const VEM = [
    ["Site da empresa", "Início, Sobre, Serviços e Contato prontos para trocar os textos, no seu domínio."],
    ["Serviços com pedido de orçamento", "Cada serviço com resumo, foto e “a partir de” ou “sob orçamento”."],
    ["Formulário com a origem do pedido", "Você vê se o contato veio de anúncio da Meta, do Google, do Instagram ou direto."],
    ["Contatos e orçamentos", "Assuma, responda pelo WhatsApp e marque orçamento enviado, fechou ou perdeu."],
    ["Painel do negócio", "O dia a dia: o que precisa de você, clientes, pedidos e financeiro."],
    ["Modelos por tipo de negócio", "Empresa de serviços (vidraçaria, manutenção, instalação) e academia ou estúdio."],
  ] as const;
  return (
    <>
      <CabecalhoTech rotulo={brand.name} titulo={<>Site para a sua empresa <em>captar clientes</em></>}
        texto="Páginas da empresa e dos seus anúncios, pedidos de orçamento com a origem de cada contato e o painel do negócio num lugar só. Quando quiser vender online, liga a loja virtual na mesma conta."
        dados={[{ rotulo: "Para começar", valor: aPartirDe ? `${formatBRL(aPartirDe)}/mês` : "Plano do site" }, { rotulo: "Loja virtual", valor: "Já no plano" }, { rotulo: "Fidelidade", valor: "Nenhuma" }]} />
      <section aria-labelledby="vem-t" className="px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 id="vem-t" className="text-3xl font-semibold tracking-tight">O que vem no caminho Site</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VEM.map(([t, d]) => <li key={t} className="ec-cartao !p-5"><Check className="size-5 text-[var(--ds-link)]" aria-hidden /><b className="mt-3 block">{t}</b><span className="mt-1 block text-sm text-body">{d}</span></li>)}
          </ul>
        </div>
      </section>
      <section aria-labelledby="pacotes-t" className="bg-surface px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 id="pacotes-t" className="text-3xl font-semibold tracking-tight">Pacotes</h2>
          <p className="mt-3 max-w-2xl text-body">Os planos são os mesmos da loja virtual (Start, Pro e Scale) e trazem o painel do negócio. Quem começa pelo site liga a loja quando quiser, sem cobrança nova. Quem já tem a loja pode contratar o site da empresa.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="ec-cartao !p-6">
              <p className="text-sm text-muted-foreground">Para quem vende por orçamento</p>
              <h3 className="mt-1 text-xl font-semibold">Site para captar clientes</h3>
              <p className="mt-2 text-sm text-body">{aPartirDe ? <>Plano a partir de <b>{formatBRL(aPartirDe)}/mês</b>.</> : "Plano conforme a tabela de planos."} A loja virtual já vem no plano: é só ligar quando quiser.</p>
              <Link href={entrar} className="mt-5 inline-flex font-semibold text-link underline underline-offset-4">Quero um site para minha empresa</Link>
            </div>
            <div className="ec-cartao !p-6">
              <p className="text-sm text-muted-foreground">Para quem vende online</p>
              <h3 className="mt-1 text-xl font-semibold">Loja virtual</h3>
              <p className="mt-2 text-sm text-body">Os planos de loja de hoje. Site da empresa depois: <b>+ {formatBRL(book.addons.MODULO_SITE.monthlyCents)}/mês</b>.</p>
              <Link href="/planos" className="mt-5 inline-flex font-semibold text-link underline underline-offset-4">Ver os planos de loja virtual</Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Valores atuais da tabela da {brand.name}; podem mudar para novas contratações. Sem fidelidade.</p>
        </div>
      </section>
      <BlocoEquipe lugar="quero-minha-loja" className="bg-surface" />
    </>
  );
}
