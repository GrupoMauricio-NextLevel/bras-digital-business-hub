import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { formatBRL } from "@/lib/money";
import { brandFunnels, FUNNEL_BRANDS, type BrandFunnel, type FunnelCount } from "@/lib/domain/precos/funil";
import { surveyResults, type SurveyResult } from "@/lib/domain/precos/questionario";
import { BeneficiosConfig, EcoExtrasConfig, QuestionarioConfig } from "@/components/descoberta/questionario-preco";
import { getBenefitsSettings } from "@/lib/domain/beneficios/painel";
import { getEcoSettings } from "@/lib/domain/ecossistema/lancador";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

const pctTxt = (v: number | null) => (v === null ? "ainda não deu tempo" : `${v}%`);
const monthLabel = (ym: string) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });

/** Barras horizontais simples: o número fica sempre escrito ao lado (a barra só reforça). */
function Bars({ items, label }: { items: FunnelCount[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul aria-label={label} className="space-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2">
          <span className="truncate text-muted-foreground">{i.label}</span>
          <span className="h-2.5 rounded-full bg-muted" aria-hidden><span className="block h-full rounded-full bg-primary" style={{ width: `${(i.count / max) * 100}%` }} /></span>
          <span className="tabular-nums font-semibold">{i.count}</span>
        </li>
      ))}
    </ul>
  );
}

function Marca({ f }: { f: BrandFunnel }) {
  const id = f.brand.toLowerCase();
  const paying = f.stages.at(-1)!;
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="ds-card mb-6 p-4">
      <h2 id={`h-${id}`} className="text-lg font-bold">{f.label}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{f.total} {f.unit} no total · {paying.count} ({paying.pctOfFirst}%) chegaram a “{paying.label.toLowerCase()}”.</p>
      {f.total === 0 ? <p className="text-sm text-muted-foreground">Ainda não há cadastros nesta marca.</p> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Funil: do cadastro ao pagamento</h3>
            <ol className="space-y-2 text-sm">
              {f.stages.map((s, i) => (
                <li key={s.key}>
                  <div className="flex flex-wrap justify-between gap-2"><span>{i + 1}. {s.label}</span><span className="tabular-nums font-semibold">{s.count} · {s.pctOfFirst}%</span></div>
                  <span className="mt-1 block h-2.5 rounded-full bg-muted" aria-hidden><span className="block h-full rounded-full bg-primary" style={{ width: `${s.pctOfFirst}%` }} /></span>
                  {s.medianDaysFromPrev !== null && <span className="text-xs text-muted-foreground">metade chega em até {s.medianDaysFromPrev.toLocaleString("pt-BR")} dia(s) depois da etapa anterior</span>}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Cadastros por semana (últimas 8)</h3>
            <Bars items={f.weekly.map((w) => ({ label: `semana de ${w.label}`, count: w.count }))} label={`Cadastros por semana em ${f.label}`} />
          </div>
          <div className="lg:col-span-2">
            <h3 className="mb-2 text-sm font-semibold">Coortes por mês de entrada</h3>
            <p className="mb-2 text-xs text-muted-foreground">Retenção = {f.activity} 30, 60 ou 90 (só conta quem já tem esse tempo de casa).</p>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <caption className="sr-only">Coortes de {f.label}</caption>
              <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Entrada</th><th scope="col" className="p-2 text-right">Entraram</th><th scope="col" className="p-2 text-right">30 dias</th><th scope="col" className="p-2 text-right">60 dias</th><th scope="col" className="p-2 text-right">90 dias</th><th scope="col" className="p-2 text-right">{f.revenueLabel}</th></tr></thead>
              <tbody>{f.cohorts.map((c) => (
                <tr key={c.month} className="border-b border-border last:border-0">
                  <th scope="row" className="p-2 text-left font-medium">{monthLabel(c.month)}</th>
                  <td className="p-2 text-right tabular-nums">{c.entered}</td>
                  <td className="p-2 text-right tabular-nums">{pctTxt(c.d30)}</td>
                  <td className="p-2 text-right tabular-nums">{pctTxt(c.d60)}</td>
                  <td className="p-2 text-right tabular-nums">{pctTxt(c.d90)}</td>
                  <td className="p-2 text-right tabular-nums">{formatBRL(c.revenuePerClientCents)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
          {f.bands && <div><h3 className="mb-2 text-sm font-semibold">{f.unit === "membros" ? "Compras pagas" : f.unit === "transportadoras" ? "Fretes entregues" : "Vendas pagas"} nos últimos 30 dias</h3><Bars items={f.bands} label={`Faixas de ${f.label}`} /></div>}
          <div><h3 className="mb-2 text-sm font-semibold">De onde vieram</h3><Bars items={f.origins} label={`Origem em ${f.label}`} /></div>
          {f.usage.length > 0 && (
            <div className="lg:col-span-2">
              <h3 className="mb-2 text-sm font-semibold">O que quem paga usa (candidatos a recurso de plano)</h3>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <caption className="sr-only">Uso de recursos em {f.label}</caption>
                <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Recurso</th><th scope="col" className="p-2 text-right">Quem paga</th><th scope="col" className="p-2 text-right">Quem não paga</th></tr></thead>
                <tbody>{f.usage.map((u) => <tr key={u.feature} className="border-b border-border last:border-0"><th scope="row" className="p-2 text-left font-medium">{u.feature}</th><td className="p-2 text-right tabular-nums">{u.payingPct === null ? "—" : `${u.payingPct}%`}</td><td className="p-2 text-right tabular-nums">{u.freePct === null ? "—" : `${u.freePct}%`}</td></tr>)}</tbody>
              </table></div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Resultado({ r, min }: { r: SurveyResult; min: number }) {
  return (
    <li className="rounded-lg border border-border p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><b>{r.label}</b><span className="text-muted-foreground">{r.responses} resposta(s) · {r.dismissed} “agora não”</span></div>
      {r.shown && r.medians ? (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">Barato demais</dt><dd className="font-semibold tabular-nums">{formatBRL(r.medians.tooCheap)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Pechincha</dt><dd className="font-semibold tabular-nums">{formatBRL(r.medians.bargain)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Caro, mas pagaria</dt><dd className="font-semibold tabular-nums">{formatBRL(r.medians.expensive)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Caro demais</dt><dd className="font-semibold tabular-nums">{formatBRL(r.medians.tooExpensive)}</dd></div>
          <div className="col-span-2 sm:col-span-4"><dt className="sr-only">Leitura</dt><dd>Faixa aceitável (metade das respostas): <b>{formatBRL(r.medians.bargain)} a {formatBRL(r.medians.expensive)}</b> por mês · <b>{r.veryDisappointedPct}%</b> ficariam muito decepcionados sem o produto (40% ou mais indica que ele faz falta).</dd></div>
        </dl>
      ) : <p className="mt-1 text-muted-foreground">O resultado aparece a partir de {min} respostas, para ninguém ser identificado.</p>}
    </li>
  );
}

/**
 * Descoberta (D124, fase P1/P2 do prompt de público e preço): funil por marca, só com números agregados. Nenhum nome,
 * documento, e-mail ou telefone aparece aqui. A mesma conta roda em `npx tsx scripts/funil-marcas.ts`.
 */
export default async function DescobertaPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [funnels, survey, benefits] = await Promise.all([brandFunnels(db, s.actor), surveyResults(db, s.actor), getBenefitsSettings(db)]);
  const eco = await getEcoSettings(db);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Descoberta: funil por marca" description="Quantos se cadastram, quantos ativam, quantos pagam e quanto tempo leva, por marca. Só números somados: nenhum dado pessoal." />
      <FinNav active="descoberta" />
      <nav aria-label="Marcas" className="mb-4 flex flex-wrap gap-2 text-sm">{funnels.map((f) => <a key={f.brand} href={`#${f.brand.toLowerCase()}`} className="ds-pill ds-pill--outline">{f.label}</a>)}<a href="#questionario" className="ds-pill ds-pill--outline">Questionário de preço</a></nav>
      {funnels.map((f) => <Marca key={f.brand} f={f} />)}
      <section id="beneficios" aria-labelledby="h-b" className="ds-card mb-6 p-4">
        <h2 id="h-b" className="text-lg font-bold">Benefícios gamificados nos painéis</h2>
        <p className="mb-4 text-sm text-muted-foreground">Carteira de pontos (em pontos e em reais), trilha de primeiros passos com comemoração, medidor do teste e simulador “quanto cada plano custaria para você”, no topo dos painéis do lojista, do Meu Brás e da transportadora. {benefits.brands.length ? "Ligado em " + benefits.brands.length + " marca(s)." : "Desligado em todas as marcas."}</p>
        <BeneficiosConfig value={benefits.brands} brands={FUNNEL_BRANDS.map((b) => ({ brand: b.brand, label: b.label }))} />
      </section>
      <section id="ecossistema" aria-labelledby="h-e" className="ds-card mb-6 p-4">
        <h2 id="h-e" className="text-lg font-bold">Barra do ecossistema nos painéis</h2>
        <p className="mb-4 text-sm text-muted-foreground">O fio do grupo (faixa com a cor de cada marca) e o botão “Marcas do grupo” com as marcas recomendadas para o perfil de cada cliente e o benefício de entrada. Só nos painéis de cliente; nunca na vitrine, expedição, balcão ou pagamento. {eco.brands.length ? "Ligada em " + eco.brands.length + " marca(s)." : "Desligada em todas as marcas."}</p>
        <BeneficiosConfig kind="ecossistema" value={eco.brands} brands={FUNNEL_BRANDS.map((b) => ({ brand: b.brand, label: b.label }))} />
        <EcoExtrasConfig value={{ capture: eco.capture, emailFooter: eco.emailFooter, publicPages: eco.publicPages }} />
      </section>
      <section id="questionario" aria-labelledby="h-q" className="ds-card mb-6 p-4">
        <h2 id="h-q" className="text-lg font-bold">Questionário de preço nos painéis</h2>
        <p className="mb-4 text-sm text-muted-foreground">5 perguntas opcionais e anônimas para lojistas, membros da Brás e transportadoras: quatro sobre o preço (barato demais, pechincha, caro mas pagaria, caro demais) e uma sobre o quanto o produto faria falta. {survey.settings.enabled ? "Está ligado." : "Está desligado: ninguém vê até você ligar."}</p>
        <QuestionarioConfig value={survey.settings} brands={FUNNEL_BRANDS.map((b) => ({ brand: b.brand, label: b.label }))} />
        <h3 className="mb-2 mt-6 text-sm font-semibold">Resultado somado por marca</h3>
        <ul className="grid gap-3 lg:grid-cols-2">{survey.results.map((r) => <Resultado key={r.brand} r={r} min={survey.settings.minResponsesToShow} />)}</ul>
      </section>
    </>
  );
}
