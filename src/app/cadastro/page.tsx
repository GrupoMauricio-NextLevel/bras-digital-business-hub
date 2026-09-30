import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireBrandFeature } from "@/lib/brand-server";
import { Logo } from "@/components/brand/logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { listSignupSuppliers } from "@/lib/domain/store-access";
import { getPriceBook } from "@/lib/domain/finance";
import { OFFER_KEYS } from "@/lib/finance/price-book";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar minha loja", description: "Escolha o plano, pague por Pix e comece a vender. Com o cupom do seu fornecedor, teste 7 dias sem cartão." };
export const dynamic = "force-dynamic";

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ cupom?: string; plano?: string; fornecedor?: string; ref?: string }> }) {
  await requireBrandFeature("signup");
  const sp = await searchParams;
  const db = await getDb();
  const [suppliers, book] = await Promise.all([listSignupSuppliers(db), getPriceBook(db)]);
  const offers = OFFER_KEYS.map((k) => ({ key: k, name: book.offers[k].name, monthlyCents: book.offers[k].monthlyCents, setupCents: book.offers[k].setupCents }));
  const plano = (OFFER_KEYS as readonly string[]).includes(sp.plano ?? "") ? (sp.plano as (typeof OFFER_KEYS)[number]) : "STORE_SUBDOMAIN";
  const fornecedor = suppliers.some((s) => s.slug === sp.fornecedor) ? sp.fornecedor! : suppliers.length === 1 ? suppliers[0]!.slug : "";
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <Link href="/" aria-label="SuperDrop, página inicial"><Logo className="mx-auto h-9" /></Link>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">Crie sua loja em 1 minuto</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Escolha o plano, pague por Pix e o acesso é liberado na hora. Tem cupom do seu fornecedor? Teste 7 dias sem cartão.</p>
      <SignupForm initialRef={(sp.ref ?? "").slice(0, 40) || undefined} initialCode={(sp.cupom ?? "").toUpperCase().slice(0, 24)} initialOffer={plano} initialSupplier={fornecedor} offers={offers} suppliers={suppliers} />
      <p className="mt-4 text-center text-sm text-muted-foreground">Já tem conta? <Link href="/login" className="font-semibold underline">Entrar na área de membros</Link></p>
      <NextLevelSignature compact className="mt-8 justify-center text-center text-muted-foreground" />
    </main>
  );
}
