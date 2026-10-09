import Link from "next/link";
import { BadgeCheck, Lock, PlayCircle } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bdVideos } from "@/db/schema";
import type { Brand } from "@/lib/brand";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { BrasSignupForm } from "@/components/portal/bras/bras-signup-form";
import "@/components/portal/bras/bras.css";
import { TexturaDeFundo } from "@/components/portal/imagem-em-criacao";

/** Cadastro do membro comprador da Brás Digital (D92). Veio de um vídeo ("Quero comprar")? Mostra qual produto vai destravar. */
export async function BrasSignupPage({ brand, videoId, source }: { brand: Brand; videoId?: string; source?: string }) {
  const video = videoId && /^bdv_[a-z0-9]{6,40}$/.test(videoId)
    ? await (await getDb()).query.bdVideos.findFirst({ where: eq(bdVideos.id, videoId), columns: { title: true, youtubeId: true, active: true } })
    : null;
  return (
    <main className="bd-home grid min-h-dvh lg:grid-cols-[1fr_minmax(0,32rem)]">
      <section className="bd-dark relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between" aria-label="Por que se cadastrar">
        <div aria-hidden className="bd-caixas pointer-events-none absolute inset-0" />
        <TexturaDeFundo marca="bras" nome="bd-cadastro-lateral" opacidade={0.55} />
        <Link href="/" aria-label={`${brand.name}, página inicial`} className="relative"><BrandLogo brand={brand} tone="on-dark" className="h-9" /></Link>
        <div className="relative">
          <h2 className="bd-display text-5xl text-white">Cadastre a empresa. <span className="bd-accent">Veja o preço da caixa.</span></h2>
          <ul className="mt-8 space-y-3 text-lg text-[var(--bd-tinta-clara)]">
            {["Grátis para novos membros", "Só CNPJ, sem papelada", "Preço e estoque liberados na hora", "Seus dados não vão para a importadora"].map((t) => <li key={t} className="flex items-center gap-3"><BadgeCheck className="size-5 text-[var(--bd-laranja-claro)]" aria-hidden />{t}</li>)}
          </ul>
        </div>
        <NextLevelSignature compact className="relative text-[var(--bd-tinta-suave)]" />
      </section>
      <div className="flex flex-col justify-center px-4 py-10 sm:px-10">
        <Link href="/" aria-label={`${brand.name}, página inicial`} className="lg:hidden"><BrandLogo brand={brand} className="h-9" /></Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight lg:mt-0">Cadastro grátis de lojista</h1>
        <p className="mt-1 text-sm text-muted-foreground">Para empresas que compram em caixa fechada para revender.</p>
        {video?.active ? (
          <p className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-3 text-sm">
            <PlayCircle className="size-5 shrink-0 text-[var(--bd-laranja)]" aria-hidden />
            <span>Depois do cadastro você vê o preço e as caixas de <b>{video.title}</b>.</span>
          </p>
        ) : null}
        <div className="mt-6"><BrasSignupForm videoId={video?.active ? videoId : undefined} source={source} /></div>
        <p className="mt-6 text-center text-sm text-muted-foreground"><Lock className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />Já é membro? <Link href="/login" className="font-semibold text-foreground underline">Entrar na área do cliente</Link></p>
      </div>
    </main>
  );
}
