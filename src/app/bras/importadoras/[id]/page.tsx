import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Gauge, Lightbulb } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasImporter360 } from "@/lib/domain/bras/importadora-360";
import { brasBoxLiters, listImporterAccess } from "@/lib/domain/bras/importadora";
import { brasStockAge } from "@/lib/domain/bras/estoque";
import { formatBRL } from "@/lib/money";
import { AccessManager, ProfileEditor, WarehousesEditor } from "@/components/bras/importadora-forms";
import { ProdutoForm } from "@/app/importadora/produto-form";
import { MoverEstoque, PlanilhaEstoque } from "@/app/importadora/estoque-client";

export const dynamic = "force-dynamic";
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesLabel = (m: string) => `${MES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;

/** Importadora 360 (D110): ficha, saúde explicável, receita de 12 meses, oportunidades, galpões, acessos e produtos. Só o Master. */
export default async function Importadora360({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { id } = await params;
  const db = await getDb();
  const v = await brasImporter360(db, session.actor, id).catch(() => null);
  if (!v) notFound();
  const people = await listImporterAccess(db, session.actor, id);
  const i = v.importer;
  const max = Math.max(1, ...v.revenue.months.map((m) => m.salesCents));
  const tom = v.health.score >= 70 ? "text-success" : v.health.score >= 40 ? "text-warning" : "text-danger";
  return (
    <>
      <PageHeader backHref="/bras/importadoras" eyebrow="Importadora 360" title={i.name} description={`${i.legalName ?? "Razão social não informada"}${i.cnpj ? ` · CNPJ ${i.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}` : ""} · plano ${i.plan === "GRATIS" ? "Grátis" : i.plan === "PRO" ? "Pro" : "Premium"} · ${i.active ? "ativa" : "pausada"}`} />

      <div className="mb-6 grid gap-4 lg:grid-cols-[18rem_1fr]">
        <section aria-labelledby="i3-saude" className="ds-card p-5">
          <h2 id="i3-saude" className="flex items-center gap-2 text-base font-semibold"><Gauge className="size-5" aria-hidden />Saúde</h2>
          <p className={`mt-2 text-5xl font-bold tabular-nums ${tom}`}>{v.health.score}<span className="text-lg font-normal text-muted-foreground"> de 100</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Mesmos dados, mesmo número. Cada fator abaixo mostra o peso e como melhorar.</p>
        </section>
        <section aria-labelledby="i3-fat" className="ds-card p-5">
          <h2 id="i3-fat" className="sr-only">Fatores da saúde</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {v.health.factors.map((f) => (
              <li key={f.key} className="text-sm">
                <p className="flex items-center justify-between gap-2 font-semibold">{f.label}<span className="tabular-nums">{String(f.points).replace(".", ",")}/{f.weight}</span></p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden><div className="h-full rounded-full bg-[var(--ds-primary)]" style={{ width: `${(f.points / f.weight) * 100}%` }} /></div>
                <p className="mt-1 text-muted-foreground">{f.detail}</p>
                {f.points < f.weight ? <p className="text-xs">Como melhorar: {f.howTo}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_22rem]">
        <section aria-labelledby="i3-rec" className="ds-card p-5">
          <h2 id="i3-rec" className="text-base font-semibold">Vendas pagas por mês (12 meses)</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div><dt className="text-xs text-muted-foreground">Vendas pagas</dt><dd className="text-xl font-bold tabular-nums">{formatBRL(v.revenue.salesCents)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Comissão da Brás (congelada no pagamento)</dt><dd className="text-xl font-bold tabular-nums">{formatBRL(v.revenue.commissionCents)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Comissão já recebida (fechamentos)</dt><dd className="text-xl font-bold tabular-nums">{formatBRL(v.revenue.settledCents)}</dd></div>
          </dl>
          <figure className="mt-5">
            <div className="flex h-40 items-end gap-[2px] border-b border-border" role="list" aria-label="Vendas pagas por mês">
              {v.revenue.months.map((m) => (
                <div key={m.month} role="listitem" tabIndex={0} aria-label={`${mesLabel(m.month)}: ${formatBRL(m.salesCents)} em vendas, ${formatBRL(m.commissionCents)} de comissão`} className="group relative flex h-full flex-1 items-end justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]">
                  <div className="w-full max-w-6 rounded-t-[4px] bg-[var(--ds-primary)]" style={{ height: `${m.salesCents ? Math.max(2, (m.salesCents / max) * 100) : 0}%` }} />
                  <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-surface shadow group-hover:block group-focus-visible:block">{mesLabel(m.month)} · {formatBRL(m.salesCents)}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-[2px] text-[10px] text-muted-foreground" aria-hidden>{v.revenue.months.map((m) => <span key={m.month} className="flex-1 text-center">{mesLabel(m.month)}</span>)}</div>
            <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-link">Ver tabela</summary>
              <table className="mt-2 w-full text-sm"><caption className="sr-only">Vendas e comissão por mês</caption><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col">Mês</th><th scope="col">Vendas pagas</th><th scope="col">Comissão</th></tr></thead>
                <tbody>{v.revenue.months.map((m) => <tr key={m.month} className="border-t border-border"><td>{mesLabel(m.month)}</td><td className="tabular-nums">{formatBRL(m.salesCents)}</td><td className="tabular-nums">{formatBRL(m.commissionCents)}</td></tr>)}</tbody></table>
            </details>
          </figure>
        </section>
        <section aria-labelledby="i3-op" className="ds-card p-5">
          <h2 id="i3-op" className="flex items-center gap-2 text-base font-semibold"><Lightbulb className="size-5" aria-hidden />Oportunidades</h2>
          {v.opportunities.length ? <ul className="mt-3 space-y-3">{v.opportunities.map((o) => <li key={o.title} className="text-sm"><p className="font-semibold">{o.title}</p><p className="text-muted-foreground">{o.detail}</p>{o.href ? <Link href={o.href} className="inline-flex items-center gap-1 text-link underline">Abrir<ArrowRight className="size-3" aria-hidden /></Link> : null}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nada pendente agora.</p>}
          <p className="mt-4 text-xs text-muted-foreground">Ações rápidas: <Link href="/bras/pauta" className="underline">agendar gravação</Link> · <Link href={`/bras/romaneio/${i.id}`} className="underline">romaneio</Link> · <Link href="/bras/comissoes" className="underline">comissões</Link></p>
        </section>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <section aria-labelledby="i3-ac" className="ds-card p-5"><h2 id="i3-ac" className="mb-3 text-base font-semibold">Acesso ao painel da importadora</h2><AccessManager importerId={i.id} master people={people.map((p) => ({ ...p, disabledAt: p.disabledAt ? String(p.disabledAt) : null, lastLoginAt: p.lastLoginAt ? String(p.lastLoginAt) : null }))} /></section>
        <section aria-labelledby="i3-gal" className="ds-card p-5"><h2 id="i3-gal" className="mb-3 text-base font-semibold">Galpões</h2><WarehousesEditor importerId={i.id} items={v.warehouses} canEdit /></section>
      </div>

      <section aria-labelledby="i3-ficha" className="ds-card mb-6 p-5">
        <h2 id="i3-ficha" className="mb-3 text-base font-semibold">Ficha</h2>
        <ProfileEditor importerId={i.id} master value={{ legalName: i.legalName, cnpj: i.cnpj, stateRegistration: i.stateRegistration, description: i.description, origin: i.origin, pickupAddress: i.pickupAddress, categories: i.categories, contacts: i.contacts, minBoxes: i.minBoxes, minOrderCents: i.minOrderCents, paymentMethods: i.paymentMethods, prepDays: i.prepDays, exchangePolicy: i.exchangePolicy, stockMode: i.stockMode, plan: i.plan }} />
      </section>

      <section aria-labelledby="i3-prod" className="ds-card p-5">
        <h2 id="i3-prod" className="mb-3 text-base font-semibold">Produtos e estoque ({v.products.length})</h2>
        <p className="mb-3 text-sm text-muted-foreground">A equipe da Brás pode cadastrar pela importadora (onboarding assistido). Depois, ligue cada produto à descoberta em Descobertas → oferta.</p>
        <div className="mb-4"><PlanilhaEstoque importerId={i.id} modeloHref="/importadora/estoque/modelo" /></div>
        <details className="mb-4"><summary className="cursor-pointer text-sm font-semibold">Cadastrar produto</summary><div className="mt-3"><ProdutoForm importerId={i.id} warehouses={v.warehouses.map((w) => ({ id: w.id, name: w.name }))} /></div></details>
        {v.products.length ? <ul className="grid gap-3 lg:grid-cols-2">{v.products.map((p) => (
          <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="flex justify-between gap-2"><b>{p.title}</b><span className="tabular-nums font-bold">{p.stockBoxes} cx</span></p>
            <p className="text-muted-foreground">{p.sku} · {p.unitsPerBox} un./cx{brasBoxLiters(p) ? ` · ${String(brasBoxLiters(p)).replace(".", ",")} L` : ""} · {formatBRL(p.priceTiers[0]!.priceBoxCents)} a caixa · {brasStockAge(p.stockUpdatedAt ? new Date(p.stockUpdatedAt).toISOString() : null)}</p>
            <MoverEstoque importerId={i.id} productId={p.id} title={p.title} />
          </li>
        ))}</ul> : null}
      </section>
    </>
  );
}
