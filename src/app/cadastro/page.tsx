import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireBrandFeature } from "@/lib/brand-server";
import { brandHas } from "@/lib/brand";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { listSignupSuppliers } from "@/lib/domain/store-access";
import { getPriceBook } from "@/lib/domain/finance";
import { OFFER_KEYS } from "@/lib/finance/price-book";
import { SignupForm } from "./signup-form";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { finFlag } from "@/lib/finance/flags";

export const metadata: Metadata = { title: "Criar minha loja", description: "Escolha o plano, pague por Pix e comece a vender. Com o cupom do seu fornecedor, teste 7 dias sem cartão." };
export const dynamic = "force-dynamic";

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ cupom?: string; plano?: string; fornecedor?: string; ref?: string; ciclo?: string }> }) {
  const brand = await requireBrandFeature("signup");
  const independent = !brandHas(brand, "dropship");
  const sp = await searchParams;
  const db = await getDb();
  const [suppliers, book] = await Promise.all([independent ? Promise.resolve([]) : listSignupSuppliers(db), getPriceBook(db)]);
  // Sem dropshipping (NextLevel Commerce) não existe "Drop manual": só loja com endereço da marca ou com domínio próprio.
  const offers = OFFER_KEYS.filter((k) => !independent || k !== "DROP_MANUAL").map((k) => ({ key: k, name: book.offers[k].name, monthlyCents: book.offers[k].monthlyCents, setupCents: book.offers[k].setupCents }));
  const plano = (OFFER_KEYS as readonly string[]).includes(sp.plano ?? "") ? (sp.plano as (typeof OFFER_KEYS)[number]) : "STORE_SUBDOMAIN";
  // Commerce com planos (D90): Start, Pro e Scale com a oferta de entrada; Enterprise é por proposta.
  const pv = independent && finFlag("FIN_COMMERCE_PLANS") ? await commercePlansView(db) : null;
  const plans = pv?.plans.filter((p) => !p.quote && p.monthlyCents && p.annualCents).map((p) => ({ key: p.key as "COMMERCE_START", name: p.name, monthlyCents: p.monthlyCents!, annualCents: p.annualCents!, feeBps: p.feeBps ?? 0 }));
  const initialPlan = plans?.some((p) => p.key === sp.plano) ? (sp.plano as "COMMERCE_START") : undefined;
  const fornecedor = suppliers.some((s) => s.slug === sp.fornecedor) ? sp.fornecedor! : suppliers.length === 1 ? suppliers[0]!.slug : "";
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <Link href="/" aria-label={`${brand.name}, página inicial`}><BrandLogo brand={brand} className="mx-auto h-9" /></Link>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">Crie sua loja em 1 minuto</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">{pv ? "Escolha o plano. Clientes novos começam com dias grátis; depois, pagamento por Pix ou cartão." : <>Escolha o plano, pague por Pix e o acesso é liberado na hora.{independent ? "" : " Tem cupom do seu fornecedor? Teste 7 dias sem cartão."}</>}</p>
      <SignupForm initialRef={(sp.ref ?? "").slice(0, 40) || undefined} initialCode={(sp.cupom ?? "").toUpperCase().slice(0, 24)} initialOffer={plano} initialSupplier={fornecedor} independent={independent} offers={offers} suppliers={suppliers} plans={plans} entry={pv?.offer ?? null} initialPlan={initialPlan} initialCycle={sp.ciclo === "ANNUAL" ? "ANNUAL" : "MONTHLY"} />
      <p className="mt-4 text-center text-sm text-muted-foreground">Já tem conta? <Link href="/login" className="font-semibold underline">Entrar na área de membros</Link></p>
      <NextLevelSignature compact className="mt-8 justify-center text-center text-muted-foreground" />
    </main>
  );
}
