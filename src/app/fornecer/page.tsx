import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Lock } from "lucide-react";
import { getBrand } from "@/lib/brand-server";
import { brandByCode, isClosedCommerceBrand } from "@/lib/brand";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { FornecedorForm } from "@/components/portal/bras/fornecedor-form";
import { TexturaDeFundo } from "@/components/portal/imagem-em-criacao";
import "@/components/portal/bras/bras.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quero fornecer", description: "Cadastro grátis de importadoras, distribuidores e atacadistas na rede de abastecimento do Brás Digital Club." };

/** Cadastro do fornecedor (D160): importadora, distribuidor ou atacadista, começando pelo Canindé. Só no endereço da Brás. */
export default async function FornecerPage() {
  const brand = await getBrand();
  if (!isClosedCommerceBrand(brand)) redirect(`${brandByCode("BRAS_DIGITAL").baseUrl}/fornecer`);
  if (!brand.signupOpen) redirect("/");
  return (
    <main className="bd-home grid min-h-dvh lg:grid-cols-[1fr_minmax(0,36rem)]">
      <section className="bd-dark relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between" aria-label="Por que fornecer no Brás Digital Club">
        <div aria-hidden className="bd-caixas pointer-events-none absolute inset-0" />
        <TexturaDeFundo marca="bras" nome="bd-importadora-balcao" opacidade={0.45} />
        <Link href="/" aria-label={`${brand.name}, página inicial`} className="relative"><BrandLogo brand={brand} tone="on-dark" className="h-10" /></Link>
        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-pulso)]">Para fornecedores</p>
          <h2 className="bd-display mt-3 text-5xl text-white">Receba pedidos de quem <span className="bd-accent">procura o que você vende.</span></h2>
          <ul className="mt-8 space-y-3 text-lg text-[var(--bd-tinta-clara)]">
            {["Importadoras, distribuidores e atacadistas", "Começando pelo Canindé", "Compradores com CNPJ conferido", "Cadastro grátis, com aprovação da equipe"].map((t) => <li key={t} className="flex items-center gap-3"><BadgeCheck className="size-5 text-[var(--bd-pulso)]" aria-hidden />{t}</li>)}
          </ul>
        </div>
        <NextLevelSignature compact product={brand.name} className="relative text-[var(--bd-tinta-suave)]" />
      </section>
      <div className="flex flex-col justify-center px-4 py-10 sm:px-10">
        <Link href="/" aria-label={`${brand.name}, página inicial`} className="lg:hidden"><BrandLogo brand={brand} className="h-10" /></Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight lg:mt-0">Cadastro de fornecedor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Importadora, distribuidor ou atacadista que vende para quem compra para revender.</p>
        <div className="mt-6"><FornecedorForm /></div>
        <p className="mt-6 text-center text-sm text-muted-foreground"><Lock className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />Já tem cadastro? <Link href="/login" className="font-semibold text-foreground underline">Entrar no painel</Link> · Quer comprar? <Link href="/cadastro" className="font-semibold text-foreground underline">Cadastro de comprador</Link></p>
      </div>
    </main>
  );
}
