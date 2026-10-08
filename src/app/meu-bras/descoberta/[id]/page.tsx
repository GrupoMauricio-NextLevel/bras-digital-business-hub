import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, Flame, Lock, MessageCircle, Package, ShoppingBag, Star } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { listBrasFeed } from "@/lib/domain/bras/catalogo";
import { brasAccessFor, type BrasAccess } from "@/lib/domain/bras/descobertas";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { BrasVideoCard, BrasWidePlayer } from "@/components/portal/bras/video-card";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SECOES = [
  ["trend", "Tendência", "Por que o produto está em alta agora."],
  ["competition", "Concorrência", "Quantos vendem e como vendem."],
  ["risks", "Riscos e cuidados", "O que pode dar errado e como evitar."],
  ["howToSell", "Como anunciar", "Título, fotos e preço de entrada."],
] as const;

/** Como liberar a análise (D95): assinatura, volume de compra no período, ou os dois. Nunca bloqueia a compra. */
function ComoLiberar({ access, company }: { access: BrasAccess; company: string }) {
  const s = access.settings;
  const falta = s.volumeThresholdCents !== null ? Math.max(0, s.volumeThresholdCents - access.volumeCents) : null;
  const pct = s.volumeThresholdCents ? Math.min(100, Math.round((access.volumeCents / s.volumeThresholdCents) * 100)) : 0;
  const assinar = brasWhatsappUrl(`Olá! Sou da ${company}, membro da Brás Digital. Quero assinar a Análise Brás.`);
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
      <p className="flex items-center gap-2 font-bold"><Lock className="size-4" aria-hidden />Análise completa para assinantes</p>
      <ul className="space-y-3 text-sm">
        {s.monthlyPriceCents !== null ? (
          <li>
            <b>Assinatura Análise Brás:</b> <span className="tabular-nums">{formatBRL(s.monthlyPriceCents)}</span> por mês, com todas as análises, alertas de novas descobertas e o histórico.
            {assinar ? <a href={assinar} target="_blank" rel="noreferrer" className="mt-2 flex w-fit items-center gap-2 font-semibold text-link underline"><MessageCircle className="size-4" aria-hidden />Quero assinar</a> : null}
          </li>
        ) : null}
        {s.volumeThresholdCents !== null ? (
          <li>
            <b>Ou compre e libere:</b> com <span className="tabular-nums">{formatBRL(s.volumeThresholdCents)}</span> em pedidos pagos nos últimos {s.volumeWindowDays} dias, a análise fica liberada.
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Quanto falta para liberar pela compra"><span className="block h-full bg-[var(--bd-laranja,#b34d00)]" style={{ width: `${pct}%` }} /></span>
            <span className="mt-1 block text-xs text-muted-foreground tabular-nums">Você já tem {formatBRL(access.volumeCents)}. {falta ? `Faltam ${formatBRL(falta)}.` : ""}</span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export default async function Descoberta({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const access = await brasAccessFor(db, session);
  if (access.level === "VISITOR") redirect("/meu-bras/empresa");
  const { id } = await params;
  const d = (await listBrasFeed(db, access.level, 500)).find((v) => v.id === id);
  if (!d) notFound();
  const member = await getBrasMemberByUser(db, session.user.id);
  const company = member?.companyName ?? session.user.name;
  const a = d.analysis;
  const consultar = brasWhatsappUrl(`Olá! Sou da ${company}, membro da Brás Digital. Quero saber o preço e as caixas de: ${d.title}.`);
  return (
    <>
      <PageHeader eyebrow="Descoberta" title={d.title} backHref="/meu-bras/videos" description={d.summary ?? undefined}
        badge={d.trendSignal ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bd-laranja,#b34d00)] px-2.5 py-1 text-xs font-bold text-white"><Flame className="size-3.5" aria-hidden />{d.trendSignal}</span> : undefined} />
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr_20rem]">
        <div className="mx-auto w-full max-w-[16rem]">
          <BrasVideoCard tone="light" youtubeId={d.youtubeId} title={d.title} trendSignal={d.trendSignal} offer={d.offer} buy={{ href: d.offer && d.offer.boxesAvailable !== 0 ? `/meu-bras/pedir/${d.id}` : "#oferta", label: d.offer && d.offer.boxesAvailable !== 0 ? "Quero comprar" : "Ver oferta", note: "Preço em preparação" }} />
        </div>

        <section aria-labelledby="ds-analise" className="space-y-4">
          <h2 id="ds-analise" className="text-xl font-bold">Análise de mercado</h2>
          {d.member?.verdict || d.member?.score != null ? (
            <div className="ds-card flex items-start gap-3 p-4">
              {d.member?.score != null ? <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--bd-navy,#101b34)] text-white"><Star className="size-4 fill-current text-[#fb8342]" aria-hidden /><b className="tabular-nums">{d.member.score}/10</b></span> : null}
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">Veredito</p><p className="text-lg font-bold leading-snug">{d.member?.verdict ?? "Em análise"}</p></div>
            </div>
          ) : <p className="ds-card p-4 text-sm text-muted-foreground">A análise desta descoberta está sendo preparada.</p>}

          {a ? (
            <>
              {a.analysisYoutubeId ? <BrasWidePlayer youtubeId={a.analysisYoutubeId} title={`Análise: ${d.title}`} label="Análise completa" /> : null}
              {a.margin ? (
                <div className="ds-card grid gap-3 p-4 sm:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">Custo por unidade</p><p className="text-lg font-bold tabular-nums">{formatBRL(a.margin.unitCostCents)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Preço no Mercado Livre</p><p className="text-lg font-bold tabular-nums">{formatBRL(a.data!.salePriceMinCents!)} a {formatBRL(a.data!.salePriceMaxCents!)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Margem bruta estimada</p><p className="text-lg font-bold tabular-nums">{a.margin.minPct}% a {a.margin.maxPct}%</p></div>
                  <p className="text-xs text-muted-foreground sm:col-span-3">Estimativa antes de taxas do marketplace, frete e impostos. Não é garantia de venda nem de resultado.</p>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {SECOES.map(([k, t, dica]) => a.data?.[k] ? <div key={k} className="ds-card p-4"><h3 className="font-bold">{t}</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{a.data[k]}</p></div> : <div key={k} className="ds-card p-4 text-sm text-muted-foreground"><h3 className="font-bold text-foreground">{t}</h3><p className="mt-1">{dica} Em preparação.</p></div>)}
              </div>
              {access.reason === "OPEN" ? <p className="text-xs text-muted-foreground"><BadgeCheck className="mr-1 inline size-4 align-text-bottom" aria-hidden />Fase de lançamento: a análise completa está liberada para todos os membros.</p> : access.reason === "VOLUME" ? <p className="text-xs text-muted-foreground"><BadgeCheck className="mr-1 inline size-4 align-text-bottom" aria-hidden />Liberada pelas suas compras nos últimos {access.settings.volumeWindowDays} dias.</p> : access.grantUntil ? <p className="text-xs text-muted-foreground"><BadgeCheck className="mr-1 inline size-4 align-text-bottom" aria-hidden />Sua assinatura vale até {formatDate(access.grantUntil, { day: "2-digit", month: "long", year: "numeric" })}.</p> : null}
            </>
          ) : (
            <>
              {d.member?.teaserYoutubeId ? <BrasWidePlayer youtubeId={d.member.teaserYoutubeId} title={`Trecho da análise: ${d.title}`} label="Trecho da análise" /> : null}
              <ul className="grid gap-2 sm:grid-cols-2" aria-label="O que tem na análise completa">
                {[["Custo, preço no Mercado Livre e margem estimada"], ...SECOES.map(([, t]) => [t])].map(([t]) => <li key={t} className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-sm"><Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />{t}</li>)}
              </ul>
              <ComoLiberar access={access} company={company} />
            </>
          )}
        </section>

        <aside id="oferta" aria-labelledby="ds-oferta" className="ds-card h-fit space-y-3 p-4 lg:sticky lg:top-20">
          <h2 id="ds-oferta" className="font-bold">Comprar em caixa fechada</h2>
          {d.offer ? (
            <>
              <p className="text-2xl font-extrabold tabular-nums">{formatBRL(d.offer.priceBoxCents)}<span className="ml-1 text-sm font-semibold text-muted-foreground">a caixa</span></p>
              <p className="text-sm text-muted-foreground">{d.offer.unitsPerBox} unidades por caixa · {formatBRL(Math.round(d.offer.priceBoxCents / d.offer.unitsPerBox))} por unidade</p>
              <p className="flex items-center gap-2 text-sm font-semibold"><Package className="size-4" aria-hidden />{d.offer.boxesAvailable == null ? "Caixas: a equipe confirma" : d.offer.boxesAvailable === 0 ? "Sem caixas no momento" : `${d.offer.boxesAvailable} caixa(s) disponíve${d.offer.boxesAvailable === 1 ? "l" : "is"}`}</p>
              <p className="flex items-start gap-2 text-sm"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />Importadora parceira verificada. O nome e o local de retirada aparecem quando o pedido for confirmado.</p>
              {d.offer.boxesAvailable !== 0 ? <Link href={`/meu-bras/pedir/${d.id}`} className="bd-btn bd-btn--fogo w-full"><ShoppingBag className="size-5" aria-hidden />Quero comprar</Link>
                : consultar ? <a href={consultar} target="_blank" rel="noreferrer" className="bd-btn bd-btn--fogo w-full">Avise quando chegar</a> : null}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">O preço da caixa desta descoberta está sendo fechado com a importadora.</p>
              {consultar ? <a href={consultar} target="_blank" rel="noreferrer" className="bd-btn bd-btn--fogo w-full"><MessageCircle className="size-5" aria-hidden />Consultar a equipe</a> : null}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
