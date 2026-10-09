import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Flame, Lock, UserRound } from "lucide-react";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { getPublicBrasVideo, listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { BrasVideoCard } from "@/components/portal/bras/video-card";
import { ShareButton } from "@/components/portal/bras/share-button";
import "@/components/portal/bras/bras.css";

export const dynamic = "force-dynamic";

/** Texto de compartilhamento sem nenhum dado comercial (sem preço, importadora, veredito ou análise). */
const descricao = (summary: string | null) => summary ?? "Descoberta da Brás Digital: veja a análise de mercado e o preço da caixa com o cadastro grátis de empresa.";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const brand = await getBrand();
  if (!isClosedCommerceBrand(brand) || brand.soon) return {};
  const v = await getPublicBrasVideo(await getDb(), (await params).id);
  if (!v) return { title: "Descoberta não encontrada", robots: { index: false, follow: false } };
  const img = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  return {
    title: v.title, description: descricao(v.summary), robots: { index: false, follow: false },
    openGraph: { title: `${v.title} · ${brand.name}`, description: descricao(v.summary), images: [{ url: img, width: 480, height: 360 }], type: "video.other" },
    twitter: { card: "summary_large_image", title: v.title, description: descricao(v.summary), images: [img] },
  };
}

/**
 * Página de uma descoberta para o link da descrição do Shorts (D101): o vídeo, o gancho e o sinal de tendência; o que o
 * membro vê aparece trancado. Botões para o cadastro (com a descoberta, conta na origem) e para quem já é membro.
 */
export default async function Descoberta({ params }: { params: Promise<{ id: string }> }) {
  const brand = await getBrand();
  if (!isClosedCommerceBrand(brand) || brand.soon) notFound();
  const { id } = await params;
  const db = await getDb();
  const v = await getPublicBrasVideo(db, id);
  if (!v) notFound();
  const outras = (await listPublicBrasVideos(db, 8)).filter((o) => o.id !== v.id).slice(0, 4);
  const cadastro = `/cadastro?video=${v.id}`;
  return (
    <div className="bd-home">
      <section className="bd-dark relative overflow-hidden px-4 pb-16 pt-10 md:pb-24 md:pt-16" aria-labelledby="d-t">
        <div aria-hidden className="bd-caixas pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-5xl items-start gap-10 md:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="mx-auto w-full max-w-[20rem]"><BrasVideoCard youtubeId={v.youtubeId} title={v.title} trendSignal={v.trendSignal} buy={{ href: cadastro, label: "Ver análise e preço" }} /></div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-laranja-claro)]">Descoberta da Brás Digital</p>
            <h1 id="d-t" className="bd-display bd-h2 mt-3 text-white">{v.title}</h1>
            {v.trendSignal ? <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#fb8342] px-3 py-1 text-sm font-bold text-[#101b34]"><Flame className="size-4" aria-hidden />{v.trendSignal}</p> : null}
            {v.summary ? <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--bd-tinta-suave)]">{v.summary}</p> : null}
            <div className="mt-8 rounded-[1.5rem] bg-white/[0.06] p-5 ring-1 ring-white/10">
              <p className="font-bold text-white">Para membros, com o cadastro grátis de empresa:</p>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--bd-tinta-clara)] sm:grid-cols-2">
                {["Veredito e nota da análise", "Preço da caixa", "Caixas disponíveis", "Análise de mercado"].map((t) => <li key={t} className="flex items-center gap-2"><Lock className="size-4 shrink-0 text-[var(--bd-laranja-claro)]" aria-hidden />{t}</li>)}
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={cadastro} className="bd-btn bd-btn--fogo bd-btn--lg">Ver análise e preço <ArrowRight className="size-5" aria-hidden /></Link>
              <Link href={`/meu-bras/descoberta/${v.id}`} className="bd-btn bd-btn--linha bd-btn--lg"><UserRound className="size-5" aria-hidden />Já sou membro</Link>
            </div>
            <div className="mt-6"><ShareButton path={`/d/${v.id}`} title={v.title} /></div>
            <p className="mt-6 text-sm text-[var(--bd-tinta-suave)]">Cadastro grátis com CNPJ, acesso na hora. Caixa fechada, a partir de uma caixa. A análise é opinião e dados, nunca promessa de ganho.</p>
          </div>
        </div>
      </section>
      {outras.length ? (
        <section aria-labelledby="d-outras" className="bd-papel px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 id="d-outras" className="bd-display text-3xl">Outras descobertas</h2>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {outras.map((o) => <li key={o.id}><BrasVideoCard youtubeId={o.youtubeId} title={o.title} trendSignal={o.trendSignal} buy={{ href: `/d/${o.id}`, label: "Ver descoberta" }} /></li>)}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
