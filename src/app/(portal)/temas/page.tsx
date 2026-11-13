import { metadadosDaPagina } from "@/lib/seo/metadados";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";

import { formatBRL } from "@/lib/money";
import { publicThemes, themeShot } from "@/lib/themes/gallery";
import { FAMILY_INFO, LEVEL_INFO, LEVELS, type ThemeFamily } from "@/lib/themes/levels";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/temas", { title: "Temas para a sua loja", description: "Escolha o visual da sua loja virtual. Veja cada tema funcionando em uma loja de exemplo antes de comprar e instale com 1 clique.", alternates: { canonical: "/temas" } });

const has = (key: string) => existsSync(join(process.cwd(), "public", themeShot(key, "desktop")));

const chip = (on: boolean) => `ec-chip inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium ${on ? "border-foreground bg-foreground text-background" : "border-border hover:bg-surface-muted"}`;

export default async function Temas({ searchParams }: { searchParams: Promise<{ nivel?: string; familia?: string }> }) {
  const q = await searchParams;
  const all = await publicThemes(await getDb());
  const nivel = Number(q.nivel) || 0; const familia = (q.familia ?? "") as ThemeFamily | "";
  const themes = all.filter((t) => (!nivel || t.level === nivel) && (!familia || t.family === familia));
  const families = [...new Set(all.map((t) => t.family))];
  const href = (n: number, f: string) => { const sp = new URLSearchParams(); if (n) sp.set("nivel", String(n)); if (f) sp.set("familia", f); const s = sp.toString(); return s ? `/temas?${s}` : "/temas"; };
  const ec = (await getBrand()).code === "NEXTLEVEL_COMMERCE";
  const intro = "Veja cada tema funcionando em uma loja de exemplo, no computador e no celular. Quem já tem loja vê o tema com os próprios produtos e instala com 1 clique. Compra única, sem mensalidade.";
  return (
    <>
    {ec ? <CabecalhoTech rotulo="Temas" titulo={<>Temas que vendem pela <em>primeira impressão.</em></>} texto={intro}
      dados={[{ rotulo: "Temas", valor: String(all.length) }, { rotulo: "Grátis", valor: String(all.filter((t) => t.priceCents === 0).length) }, { rotulo: "Segmentos", valor: String(families.length) }, { rotulo: "Instalação", valor: "1 clique" }]} /> : null}
    <div className="mx-auto max-w-6xl px-4 py-14">
      {ec ? null : <><h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">Temas para a sua loja</h1>
      <p className="mt-3 max-w-2xl text-lg text-body">{intro}</p></>}
      <nav aria-label="Filtrar temas" className={ec ? "space-y-3" : "mt-8 space-y-3"}>
        <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-sm font-semibold">Nível</span>
          <Link href={href(0, familia)} className={chip(!nivel)} aria-current={!nivel ? "page" : undefined}>Todos</Link>
          {LEVELS.map((l) => <Link key={l} href={href(l, familia)} className={chip(nivel === l)} aria-current={nivel === l ? "page" : undefined}>{LEVEL_INFO[l].short} · {LEVEL_INFO[l].name}</Link>)}
        </div>
        <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-sm font-semibold">Família</span>
          <Link href={href(nivel, "")} className={chip(!familia)} aria-current={!familia ? "page" : undefined}>Todas</Link>
          {families.map((f) => <Link key={f} href={href(nivel, f)} className={chip(familia === f)} aria-current={familia === f ? "page" : undefined}>{FAMILY_INFO[f].name}</Link>)}
        </div>
      </nav>
      {themes.length === 0 ? <p className="mt-10 rounded-xl border border-dashed border-border p-8 text-center text-body">Nenhum tema à venda com esse filtro ainda. <Link href="/temas" className="font-semibold underline">Ver todos</Link></p> : null}
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Temas">
        {themes.map((t) => (
          <li key={t.key} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <Link href={`/temas/${t.key}`} className="relative block aspect-[16/11] overflow-hidden bg-surface-muted" aria-label={`Detalhes do tema ${t.name}`}>
              {has(t.key) ? <Image src={themeShot(t.key, "desktop")} alt={`Prévia do tema ${t.name} em uma loja de exemplo`} fill sizes="(min-width:1024px) 384px, (min-width:640px) 50vw, 100vw" className="object-cover object-top" /> : <span className="flex h-full items-center justify-center text-sm text-muted-foreground">Prévia em preparo</span>}
            </Link>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="sr-only">{t.name}</h2>{t.logo ? <Image src={t.logo} alt={t.name} width={120} height={36} className="h-9 w-auto" /> : <p aria-hidden className="text-xl font-bold">{t.name}</p>}<p className="mt-1 text-sm text-body">{t.niche}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{LEVEL_INFO[t.level].short} · {LEVEL_INFO[t.level].name} · Família {FAMILY_INFO[t.family].name}</p></div>
                <p className="text-right text-lg font-extrabold tabular-nums">{t.priceCents === 0 ? "Grátis" : formatBRL(t.priceCents)}</p>
              </div>
              <p className="flex-1 text-sm text-body">{t.tagline}.</p>
              <div className="flex flex-wrap gap-2">
                {t.demoReady ? <Link href={`/demo/${t.key}`} className="inline-flex h-11 items-center rounded-lg bg-band px-5 text-sm font-semibold text-band-foreground hover:bg-band">Ver demonstração</Link> : null}
                <Link href={`/temas/${t.key}`} className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold hover:bg-surface-muted">Detalhes</Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">Os produtos das lojas de exemplo são fictícios. Trocar de tema não apaga produtos, clientes nem pedidos.</p>
    </div>
    </>
  );
}
