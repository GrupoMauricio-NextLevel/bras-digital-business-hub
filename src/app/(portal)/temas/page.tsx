import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "@/db/client";
import { formatBRL } from "@/lib/money";
import { publicThemes, themeShot } from "@/lib/themes/gallery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Temas para a sua loja", description: "Escolha o visual da sua loja virtual. Veja cada tema funcionando em uma loja de exemplo antes de comprar e instale com 1 clique.", alternates: { canonical: "/temas" } };

const has = (key: string) => existsSync(join(process.cwd(), "public", themeShot(key, "desktop")));

export default async function Temas() {
  const themes = await publicThemes(await getDb());
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">Temas para a sua loja</h1>
      <p className="mt-3 max-w-2xl text-lg text-neutral-700">Veja cada tema funcionando em uma loja de exemplo, no computador e no celular. Quem já tem loja vê o tema com os próprios produtos e instala com 1 clique. Compra única, sem mensalidade.</p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Temas">
        {themes.map((t) => (
          <li key={t.key} className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <Link href={`/temas/${t.key}`} className="relative block aspect-[16/11] overflow-hidden bg-neutral-100" aria-label={`Detalhes do tema ${t.name}`}>
              {has(t.key) ? <Image src={themeShot(t.key, "desktop")} alt={`Prévia do tema ${t.name} em uma loja de exemplo`} fill sizes="(min-width:1024px) 384px, (min-width:640px) 50vw, 100vw" className="object-cover object-top" /> : <span className="flex h-full items-center justify-center text-sm text-neutral-600">Prévia em preparo</span>}
            </Link>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-bold">{t.name}</h2><p className="text-sm text-neutral-700">{t.niche}</p></div>
                <p className="text-right text-lg font-extrabold tabular-nums">{t.priceCents === 0 ? "Grátis" : formatBRL(t.priceCents)}</p>
              </div>
              <p className="flex-1 text-sm text-neutral-700">{t.tagline}.</p>
              <div className="flex flex-wrap gap-2">
                {t.demoReady ? <Link href={`/demo/${t.key}`} className="inline-flex h-11 items-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-700">Ver demonstração</Link> : null}
                <Link href={`/temas/${t.key}`} className="inline-flex h-11 items-center rounded-lg border border-neutral-300 px-5 text-sm font-semibold hover:bg-neutral-50">Detalhes</Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-neutral-600">Os produtos das lojas de exemplo são fictícios. Trocar de tema não apaga produtos, clientes nem pedidos.</p>
    </div>
  );
}
