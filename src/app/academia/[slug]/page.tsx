import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck, Camera, Clock, MapPin, MessageCircle, Check } from "lucide-react";
import { getDb } from "@/db/client";
import { diasDisponiveis, paginaDaAcademia } from "@/lib/domain/business/academia";
import { linkWhatsapp } from "@/lib/domain/agora-ecommerce";
import { FormExperimental } from "./form-experimental";
import { ContarVisita } from "./contar-visita";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await paginaDaAcademia(await getDb(), (await params).slug);
  if (!p) return { title: "Academia não encontrada" };
  const onde = [p.config.bairro, p.config.cidade].filter(Boolean).join(", ");
  return { title: `${p.nome}${onde ? ` · Academia em ${onde}` : ""}`, description: p.config.sobre || p.config.chamada };
}

/** Página pública da academia (NextLevel Business, A1, D307): convite para a aula experimental, com a origem gravada. */
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const p = await paginaDaAcademia(await getDb(), slug);
  if (!p) notFound();
  const c = p.config;
  const onde = [c.bairro, c.cidade].filter(Boolean).join(" · ");
  const whats = linkWhatsapp(p.whatsapp, `Oi! Vi a página da ${p.nome} e quero saber mais.`);
  const insta = p.instagram ? `https://instagram.com/${p.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "")}` : null;
  const dias = diasDisponiveis(c);
  const meta = { utm: um(sp.utm_source), campanha: um(sp.utm_campaign), indicacao: um(sp.ind) };

  return (
    <div className="min-h-dvh bg-[#f6f7f4] text-[#14161a]">
      <ContarVisita slug={p.slug} utm={meta.utm} />
      <header className="bg-[#101418] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo enviado pela academia, tamanho pequeno */}
            {p.logoUrl ? <img src={p.logoUrl} alt="" className="size-10 rounded-lg object-cover" /> : <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-[#c8f031] text-lg font-black text-[#101418]">{p.nome.slice(0, 1)}</span>}
            <div className="min-w-0"><p className="truncate font-bold leading-tight">{p.nome}</p>{onde ? <p className="truncate text-xs text-white/70">{onde}</p> : null}</div>
          </div>
          {whats ? <a href={whats} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10"><MessageCircle className="size-4" aria-hidden />WhatsApp</a> : null}
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-14 pt-6 md:grid-cols-[1.1fr_1fr] md:items-start md:pb-20 md:pt-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#c8f031] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#101418]"><CalendarCheck className="size-3.5" aria-hidden />Aula experimental</p>
            <h1 className="mt-4 text-balance text-3xl font-black leading-tight sm:text-4xl md:text-5xl">{c.chamada}</h1>
            {c.sobre ? <p className="mt-4 max-w-prose text-base text-white/80">{c.sobre}</p> : null}
            {c.modalidades.length ? (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Modalidades">
                {c.modalidades.map((m) => <li key={m} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">{m}</li>)}
              </ul>
            ) : null}
            {c.destaques.length ? (
              <ul className="mt-6 grid gap-2 text-sm text-white/85">
                {c.destaques.map((d) => <li key={d} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#c8f031]" aria-hidden />{d}</li>)}
              </ul>
            ) : null}
          </div>
          <section id="agendar" aria-labelledby="agendar-t" className="rounded-2xl bg-white p-5 text-[#14161a] shadow-xl sm:p-6">
            <h2 id="agendar-t" className="text-xl font-bold">Agende sua aula experimental</h2>
            <p className="mt-1 text-sm text-[#4a5160]">Escolha o dia. A academia confirma pelo WhatsApp.</p>
            <FormExperimental slug={p.slug} nome={p.nome} modalidades={c.modalidades} dias={dias} meta={meta} whatsapp={p.whatsapp} />
          </section>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:grid-cols-3">
        {c.horarios ? <Info icone={<Clock className="size-5" aria-hidden />} titulo="Horários" texto={c.horarios} /> : null}
        {p.endereco || onde ? <Info icone={<MapPin className="size-5" aria-hidden />} titulo="Onde estamos" texto={p.endereco || onde} /> : null}
        {insta ? (
          <a href={insta} target="_blank" rel="noopener" className="rounded-2xl border border-[#dfe3da] bg-white p-5 hover:border-[#14161a]">
            <span className="flex items-center gap-2 font-semibold"><Camera className="size-5" aria-hidden />Instagram</span>
            <span className="mt-1 block text-sm text-[#4a5160]">Veja os treinos e o dia a dia da academia.</span>
          </a>
        ) : null}
      </main>
      <footer className="px-4 pb-10 text-center text-xs text-[#4a5160]">Página feita com NextLevel Business</footer>
    </div>
  );
}

function Info({ icone, titulo, texto }: { icone: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe3da] bg-white p-5">
      <p className="flex items-center gap-2 font-semibold">{icone}{titulo}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-[#4a5160]">{texto}</p>
    </div>
  );
}
