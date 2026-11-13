import { metadadosDaPagina } from "@/lib/seo/metadados";
import { BlocoEquipe } from "@/components/portal/equipe/blocos";
import { groupLink } from "@/lib/brand-server";
import type { Metadata } from "next";
import Link from "next/link";
import { MemberPlans } from "@/components/portal/member-plans";
import { MEMBER_FEES } from "../content";
import { brandHas } from "@/lib/brand";
import { getBrand } from "@/lib/brand-server";
import { PlacarSecao } from "@/components/placar/placar-secao";
import { DueloBlack } from "@/components/black/duelo-black";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { formatBRL } from "@/lib/money";
import { CommercePlansSection } from "@/components/portal/commerce/plans-section";
import { finFlag } from "@/lib/finance/flags";
import { FotoOpcional } from "@/components/portal/imagem-em-criacao";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/planos", { title: "Planos", description: "Planos para quem vende: assine por Pix, acesso liberado na hora, ou teste 7 dias com cupom." });

export default async function Planos() {
  const brand = await getBrand();
  const solucoes = await groupLink("/solucoes");
  const ec = brand.code === "NEXTLEVEL_COMMERCE";
  const pv = ec ? await commercePlansView(await getDb()) : null;
  const anualMin = pv ? Math.min(...pv.plans.filter((p) => !p.quote && p.annualCents).map((p) => Math.round(p.annualCents! / 12))) : 0;
  if (!brandHas(brand, "dropship") && finFlag("FIN_COMMERCE_PLANS")) return (
    <>
    {ec ? <CabecalhoTech rotulo="Planos" titulo={<>Preço claro, <em>sem taxa da plataforma</em> nas vendas.</>} texto="Sem fidelidade. Comece com dias grátis e escolha mensal ou anual. Os planos mudam pelo que entregam, não pelo quanto você vende."
      dados={[{ rotulo: "Taxa da plataforma", valor: "0%" }, ...(pv?.offer ? [{ rotulo: "Teste grátis", valor: `${pv.offer.trialDays} dias` }] : []), ...(anualMin ? [{ rotulo: "A partir de, no anual", valor: `${formatBRL(anualMin).replace(",00", "")}/mês` }] : []), { rotulo: "Fidelidade", valor: "Nenhuma" }]} /> : null}
    <div className="mx-auto max-w-6xl px-4 py-16">
      {ec ? null : <><h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Planos {brand.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Preço claro, sem fidelidade. Comece com dias grátis e escolha mensal ou anual.</p></>}
      <div className={ec ? "" : "mt-10"}><CommercePlansSection cta={brand.signupOpen ? "/cadastro" : "/quero-minha-loja"} signupOpen={brand.signupOpen} /></div>
      {ec ? <div className="-mx-4 mt-12 overflow-hidden rounded-[2rem]"><DueloBlack cta={brand.signupOpen ? "/cadastro" : "/quero-minha-loja"} /></div> : null}
      {ec ? <div className="-mx-4 mt-6 overflow-hidden rounded-[2rem]"><PlacarSecao cta={brand.signupOpen ? "/cadastro" : "/quero-minha-loja"} id="placar-planos" /></div> : null}
      <BlocoEquipe lugar="planos-ajuda" className="mt-12 rounded-3xl bg-surface" contatos mensagem="Olá! Quero ajuda para montar a minha loja.">
        <Link className="underline underline-offset-4 text-link" href={`${solucoes}/loja-pronta-essencial`}>Loja Pronta</Link>
        <Link className="underline underline-offset-4 text-link" href={`${solucoes}/migracao-lite`}>Migração</Link>
        <Link className="underline underline-offset-4 text-link" href={`${solucoes}#diagnostico`}>Diagnóstico gratuito</Link>
      </BlocoEquipe>
    </div>
    </>
  );
  if (!brandHas(brand, "dropship")) return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Planos</h1>
      <p className="mt-3 text-lg text-muted-foreground">Os planos da {brand.name} são combinados de acordo com o tamanho da sua operação: quantidade de produtos, temas e módulos. Na implantação acompanhada você recebe a proposta com valores claros, sem surpresa.</p>
      <Link href="/quero-minha-loja" className="mt-8 inline-flex h-12 items-center rounded-lg px-6 font-semibold text-band-foreground" style={{ background: brand.primaryColor }}>Quero minha loja</Link>
    </div>
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Planos</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Assine por Pix e o acesso ao plano é liberado na hora. Tem o cupom do seu fornecedor? Teste 7 dias sem cartão; depois do teste, o acesso é pausado até o pagamento.</p>
      <FotoOpcional marca="superdrop" nome="sd-planos-faixa" alt="" ratio={null} className="mt-8 aspect-[21/9] !rounded-2xl sm:aspect-[3/1]" />
      <div className="mt-10"><MemberPlans /></div>

      <h2 className="mt-14 text-2xl font-bold">Taxa por pedido</h2>
      <p className="mt-1 text-muted-foreground">Percentual sobre o valor dos produtos, sem o frete. Estorno devolve a taxa; pedidos de teste não pagam.</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">{MEMBER_FEES.map((f) => <li key={f.name} className="rounded-xl border border-border p-5"><p className="text-3xl font-extrabold tabular-nums">{f.fee}</p><h3 className="font-semibold">{f.name}</h3><p className="text-sm text-muted-foreground">{f.text}</p></li>)}</ul>
      <p className="mt-6 text-sm text-muted-foreground">Carteira e vendas da loja são somente por Pix. Descontos de 15% (semestral) e 25% (anual) valem para os serviços da Loja NextLevel.</p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/cadastro" className="inline-flex h-12 items-center rounded-lg bg-band px-6 font-semibold text-band-foreground hover:bg-band-line">Criar minha loja</Link><Link href="/login" className="inline-flex h-12 items-center rounded-lg border border-border px-6 font-semibold hover:bg-surface-muted">Área de membros</Link></div>
      <p className="mt-6 text-sm text-muted-foreground">É fornecedor? <Link href="/seja-fornecedor" className="font-semibold text-link underline">Veja a página para fornecedores</Link>.</p>
    </div>
  );
}
