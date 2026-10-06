import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Check } from "lucide-react";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { formatBRL } from "@/lib/money";
import { publicTheme, themeShot } from "@/lib/themes/gallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const t = await publicTheme(await getDb(), key);
  if (!t) return { title: "Tema" };
  return { title: `Tema ${t.name}`, description: `${t.tagline}. Veja o tema ${t.name} funcionando em uma loja de exemplo.`, alternates: { canonical: `/temas/${t.key}` }, robots: t.released === false ? { index: false, follow: false } : undefined };
}

const has = (key: string, d: "desktop" | "mobile") => existsSync(join(process.cwd(), "public", themeShot(key, d)));

export default async function TemaPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const db = await getDb();
  const t = await publicTheme(db, key);
  if (!t) notFound();
  const brand = await getBrand();
  const pending = t.released === false;
  const buy = `/login?voltar=${encodeURIComponent(`/merchant/templates?ver=${t.key}`)}`;
  const noStore = brand.signupOpen ? { href: "/cadastro", label: "Ainda não tenho loja" } : { href: "/quero-minha-loja", label: "Ainda não tenho loja" };
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm"><Link href="/temas" className="font-medium text-body underline">Todos os temas</Link></p>
      {pending ? <p role="note" className="mt-4 inline-block rounded bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">Em aprovação: ainda não está à venda. Esta página só abre por link.</p> : null}
      <div className="mt-4 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">{t.name}</h1>
          <p className="mt-2 text-lg text-body">{t.tagline}. <span className="text-muted-foreground">Pensado para: {t.niche.toLowerCase()}.</span></p>
          <p className="mt-4 max-w-xl text-body">{t.description}</p>
          <ul className="mt-6 space-y-2">{t.features.map((f) => <li key={f} className="flex gap-2 text-foreground"><Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />{f}</li>)}</ul>
          <div className="mt-8 rounded-2xl border border-border bg-surface-muted p-5">
            {t.quote ? (
              <p className="text-foreground"><span className="text-3xl font-extrabold tabular-nums">{formatBRL(t.quote.listCents)}</span> no cartão em até {t.quote.installments}x de {formatBRL(t.quote.installmentCents)}, ou <b>{formatBRL(t.quote.pixCents)}</b> no Pix. <span className="block text-sm text-muted-foreground">Compra única, licença permanente para a sua loja. Sem mensalidade.</span></p>
            ) : <p className="text-lg font-bold">Grátis, já incluso em toda loja.</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              {t.demoReady ? <Link href={`/demo/${t.key}`} className="inline-flex h-12 items-center rounded-lg bg-band px-6 font-semibold text-band-foreground hover:bg-band">Ver demonstração</Link> : null}
              {!pending ? <Link href={buy} className="inline-flex h-12 items-center rounded-lg px-6 font-semibold text-band-foreground" style={{ background: brand.primaryColor }}>Já tenho loja: quero este tema</Link> : null}
              {!pending ? <Link href={noStore.href} className="inline-flex h-12 items-center rounded-lg border border-border px-6 font-semibold hover:bg-surface-muted">{noStore.label}</Link> : null}
            </div>
            {!pending ? <p className="mt-3 text-sm text-muted-foreground">Depois de entrar, você vê o tema com os seus produtos, paga e ele já fica instalado. Seus produtos, clientes e pedidos continuam iguais.</p> : null}
          </div>
        </div>
        <div className="relative self-start">
          {has(t.key, "desktop") ? <Image src={themeShot(t.key, "desktop")} alt={`Tema ${t.name} no computador`} width={900} height={1000} sizes="(min-width:1024px) 480px, 100vw" className="w-full rounded-xl border border-border shadow-lg" priority /> : null}
          {has(t.key, "mobile") ? <Image src={themeShot(t.key, "mobile")} alt={`Tema ${t.name} no celular`} width={390} height={844} sizes="(min-width:1024px) 160px, 30vw" className="absolute -bottom-6 right-3 w-[30%] rounded-2xl border-4 border-band-foreground shadow-xl" /> : null}
        </div>
      </div>
      <p className="mt-10 text-sm text-muted-foreground">As imagens e a demonstração usam uma loja de exemplo com produtos fictícios.</p>
    </div>
  );
}
