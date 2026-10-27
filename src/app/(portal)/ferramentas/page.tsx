import type { Metadata } from "next";
import Link from "next/link";
import { getBrand } from "@/lib/brand-server";
import { CalcFreteGratis, CalcPreco } from "@/components/ferramentas/calculadoras";

export const metadata: Metadata = { title: "Calculadoras para quem vende online", description: "Calcule o preço com margem e a partir de qual valor oferecer frete grátis. Grátis, sem cadastro." };

/** Calculadoras públicas (W5, D188, decisão 5 de D182): preço com margem e frete grátis. Sem cadastro e sem promessa. */
export default async function FerramentasPublicas() {
  const brand = await getBrand();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Calculadoras para quem vende online</h1>
      <p className="mt-3 max-w-2xl text-lg text-body">Duas contas que todo lojista faz: quanto cobrar para sobrar a margem certa e a partir de qual valor dá para oferecer frete grátis. Grátis e sem cadastro; os resultados dependem só dos números que você digitar.</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2"><CalcPreco /><CalcFreteGratis /></div>
      <p className="mt-10 text-body">Na {brand.name}, estas e outras ferramentas ficam dentro do painel da sua loja. <Link href="/quero-minha-loja" className="font-semibold underline underline-offset-2">Quero minha loja</Link></p>
    </div>
  );
}
