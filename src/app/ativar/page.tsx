import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Gift } from "lucide-react";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { activationPage, isEcoBrand } from "@/lib/domain/ecossistema/ativacao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ativar", robots: { index: false } };

/**
 * Página de ativação (D130): quem vem de outra marca do grupo (lançador "Marcas do grupo") cai aqui, na marca de destino,
 * com a ponte "de onde você vem → o que ganha aqui", números reais da rede e o benefício de entrada. Sem dado pessoal.
 */
export default async function AtivarPage({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
  const brand = await getBrand();
  const to = isEcoBrand(brand.code) ? brand.code : "SUPERDROP";
  const p = await activationPage(await getDb(), to, (await searchParams).de);
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-6"><BrandLogo brand={{ code: brand.code, name: brand.name }} variant="assinatura-completa" className="h-12" priority /></div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parte do Grupo NextLevel</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{p.title}</h1>
      {p.bridge ? <p className="mt-3 text-lg">{p.bridge}</p> : null}
      <ul className="mt-5 space-y-2">{p.points.map((t) => <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />{t}</li>)}</ul>
      {p.numbers.length ? <dl className="mt-6 flex flex-wrap gap-6">{p.numbers.map((n) => <div key={n.label}><dt className="sr-only">{n.label}</dt><dd><span className="block text-2xl font-bold tabular-nums">{n.value.toLocaleString("pt-BR")}</span><span className="text-sm text-muted-foreground">{n.label}</span></dd></div>)}</dl> : null}
      {p.benefit ? <p className="mt-6 flex items-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm text-success"><Gift className="size-4 shrink-0" aria-hidden />{p.benefit}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={p.ctaHref} className="ds-btn ds-btn--lg">{p.ctaLabel}</Link>
        <Link href="/" className="ds-btn ds-btn--secondary ds-btn--lg">Conhecer a {p.name}</Link>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Os pontos do Club valem em todas as marcas do grupo. Sem fidelidade: cancele quando quiser.</p>
      <div className="mt-10"><NextLevelSignature product={p.name} /></div>
    </main>
  );
}
