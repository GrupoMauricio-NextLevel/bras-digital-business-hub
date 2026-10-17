import type { Metadata } from "next";
import { FioCaptacao } from "@/components/ecossistema/fio-captacao";
import Link from "next/link";
import { getDb } from "@/db/client";
import { getBrand, requireBrandFeature } from "@/lib/brand-server";
import { brandHas, isClosedCommerceBrand } from "@/lib/brand";
import { BrasSignupPage } from "./bras-signup";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { listSignupSuppliers } from "@/lib/domain/store-access";
import { getPriceBook } from "@/lib/domain/finance";
import { OFFER_KEYS } from "@/lib/finance/price-book";
import { SignupForm } from "./signup-form";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { finFlag } from "@/lib/finance/flags";
import { FotoOpcional, formatosDisponiveis } from "@/components/portal/imagem-em-criacao";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  if (isClosedCommerceBrand(brand)) return { title: "Cadastro grátis de lojista", description: "Cadastre a sua empresa com CNPJ e veja preço e estoque em caixa fechada das importadoras do Brás." };
  return { title: "Criar minha loja", description: "Escolha o plano, pague por Pix e comece a vender. Com o cupom do seu fornecedor, teste 7 dias sem cartão." };
}
export const dynamic = "force-dynamic";

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ cupom?: string; plano?: string; fornecedor?: string; ref?: string; ciclo?: string; video?: string; utm_source?: string }> }) {
  const brand = await requireBrandFeature("signup");
  // Brás Digital (D92): cadastro grátis de membro com CNPJ, sem plano, loja ou fornecedor.
  if (isClosedCommerceBrand(brand)) { const q = await searchParams; return <BrasSignupPage brand={brand} videoId={q.video} source={q.utm_source} />; }
  const independent = !brandHas(brand, "dropship");
  const sp = await searchParams;
  const db = await getDb();
  const [suppliers, book] = await Promise.all([independent ? Promise.resolve([]) : listSignupSuppliers(db), getPriceBook(db)]);
  // Sem dropshipping (NextLevel E-commerce) não existe "Drop manual": só loja com endereço da marca ou com domínio próprio.
  const offers = OFFER_KEYS.filter((k) => !independent || k !== "DROP_MANUAL").map((k) => ({ key: k, name: book.offers[k].name, monthlyCents: book.offers[k].monthlyCents, setupCents: book.offers[k].setupCents }));
  const plano = (OFFER_KEYS as readonly string[]).includes(sp.plano ?? "") ? (sp.plano as (typeof OFFER_KEYS)[number]) : "STORE_SUBDOMAIN";
  // Commerce com planos (D90): Start, Pro e Scale com a oferta de entrada; Enterprise é por proposta.
  const pv = independent && finFlag("FIN_COMMERCE_PLANS") ? await commercePlansView(db) : null;
  const plans = pv?.plans.filter((p) => !p.quote && p.monthlyCents && p.annualCents).map((p) => ({ key: p.key as "COMMERCE_START", name: p.name, monthlyCents: p.monthlyCents!, annualCents: p.annualCents!, feeBps: p.feeBps ?? 0 }));
  const initialPlan = plans?.some((p) => p.key === sp.plano) ? (sp.plano as "COMMERCE_START") : undefined;
  const fornecedor = suppliers.some((s) => s.slug === sp.fornecedor) ? sp.fornecedor! : suppliers.length === 1 ? suppliers[0]!.slug : "";
  // Commerce: foto ao lado do formulário no computador; no celular, uma faixa baixa acima do formulário (Commerce v3).
  const foto = brand.code === "NEXTLEVEL_COMMERCE" && formatosDisponiveis("commerce", "cm-cadastro-lateral").length > 0;
  const content = (
    <>
      <Link href="/" aria-label={`${brand.name}, página inicial`}><BrandLogo brand={brand} className="mx-auto h-9" /></Link>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">Crie sua conta e monte a loja no seu ritmo</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">{pv ? "Escolha o plano. Você começa com dias grátis; depois, paga por Pix ou cartão." : <>Escolha o plano, pague por Pix e o acesso é liberado na hora.{independent ? "" : " Tem cupom do seu fornecedor? Teste 7 dias sem cartão."}</>}</p>
      <div className="mt-6"><FioCaptacao brandCode={brand.code} /></div>
      <SignupForm initialRef={(sp.ref ?? "").slice(0, 40) || undefined} initialCode={(sp.cupom ?? "").toUpperCase().slice(0, 24)} initialOffer={plano} initialSupplier={fornecedor} independent={independent} offers={offers} suppliers={suppliers} plans={plans} entry={pv?.offer ?? null} initialPlan={initialPlan} initialCycle={sp.ciclo === "ANNUAL" ? "ANNUAL" : "MONTHLY"} />
      <p className="mt-4 text-center text-sm text-muted-foreground">Já tem conta? <Link href="/login" className="font-semibold underline">Entrar na área de membros</Link></p>
      <NextLevelSignature compact product={brand.name} className="mt-8 justify-center text-center text-muted-foreground" />
    </>
  );
  if (!foto) return <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">{content}</main>;
  return (
    <main className="mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:px-8">
      <div className="hidden lg:sticky lg:top-10 lg:block lg:self-start"><FotoOpcional marca="commerce" nome="cm-cadastro-lateral" alt="" ratio="3 / 4" posicao="50% 45%" className="!rounded-[28px]" /></div>
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center"><FotoOpcional marca="commerce" nome="cm-cadastro-lateral" alt="" ratio={null} posicao="50% 40%" className="mb-6 h-32 w-full !rounded-2xl lg:hidden" />{content}</div>
    </main>
  );
}
