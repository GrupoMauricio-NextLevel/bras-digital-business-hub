import { Bus, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { Badge } from "@/components/ui/badge";
import { freightCatalogFor, myFreights } from "@/lib/domain/frete/painel";
import { myReferrals } from "@/lib/domain/club/indicacoes";
import { lastBrasShipping } from "@/lib/domain/bras/catalogo";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { FreightCard } from "@/components/frete/freight-card";
import { ReferCarrierForm } from "@/components/frete/frete-forms";
import { ReserveParcelsForm } from "@/components/cargas/excursao-forms";
import { excursionOptions } from "@/lib/domain/cargas/excursao";
import { getExcursionRules } from "@/lib/domain/cargas/regras-excursao";
import { listMyBrasRequests } from "@/lib/domain/bras/catalogo";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

const REF_STATUS = { CONVIDADO: "Convite enviado", CADASTROU: "Entrou no catálogo", ATIVOU: "Primeira entrega feita", RECORRENTE: "Usando sempre", RECUSADA: "Não aceita", EXPIRADA: "Expirou" } as const;
const wa = (phone: string) => `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}`;

/**
 * Fretes (D113): o painel único de frete do cliente. Transportadora e ônibus com a mesma linha do tempo, o catálogo da
 * NextLevel Cargas por estado e a indicação da transportadora ou do ônibus que ele já usa.
 */
const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function Fretes({ searchParams }: { searchParams: Promise<{ ver?: string; uf?: string; cidade?: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const sp = await searchParams;
  const ver = sp.ver === "catalogo" ? "catalogo" : sp.ver === "indicar" ? "indicar" : sp.ver === "onibus" ? "onibus" : "fretes";
  const [freights, last, refs] = await Promise.all([myFreights(db, session.actor), lastBrasShipping(db, session.actor), myReferrals(db, session.actor)]);
  const uf = (BRAS_UFS as readonly string[]).includes(sp.uf ?? "") ? sp.uf! : last?.shipState ?? "SP";
  const catalog = ver === "catalogo" ? await freightCatalogFor(db, uf) : [];
  const cidade = (sp.cidade ?? last?.shipCity ?? "").slice(0, 80);
  const [trips, exRules, myReqs] = ver === "onibus" ? await Promise.all([excursionOptions(db, { uf, city: cidade || undefined }), getExcursionRules(db), listMyBrasRequests(db, session.actor)]) : [[], null, []];
  const tripsUf = ver === "onibus" && cidade && !trips.length ? await excursionOptions(db, { uf }) : [];
  const andamento = freights.filter((f) => f.status !== "ENTREGUE" && f.status !== "CANCELADO");
  const encerrados = freights.filter((f) => !andamento.includes(f));
  return (
    <>
      <PageHeader eyebrow="Meu Brás · NextLevel Cargas" title="Fretes" description="Tudo o que está vindo do Brás para você, de transportadora ou de ônibus de excursão, num lugar só." />
      <LinkTabs label="Seções" active={ver} items={[{ key: "fretes", label: `Meus fretes (${andamento.length})`, href: "/meu-bras/fretes" }, { key: "onibus", label: "Mandar pelo ônibus", href: `/meu-bras/fretes?ver=onibus&uf=${uf}` }, { key: "catalogo", label: "Transportadoras e ônibus", href: `/meu-bras/fretes?ver=catalogo&uf=${uf}` }, { key: "indicar", label: "Indicar a minha", href: "/meu-bras/fretes?ver=indicar" }]} />
      {ver === "fretes" ? (
        <div className="mt-6 space-y-8">
          {andamento.length ? <ul className="grid gap-3 lg:grid-cols-2">{andamento.map((f) => <FreightCard key={f.id} f={f} receiptHref={`/meu-bras/pedidos/${f.requestId}/retirada`} />)}</ul>
            : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum frete em andamento. No próximo pedido, escolha a transportadora ou o ônibus no catálogo e acompanhe aqui.</p>}
          {encerrados.length ? <details><summary className="cursor-pointer text-base font-bold">Entregues e cancelados ({encerrados.length})</summary><ul className="mt-3 grid gap-3 lg:grid-cols-2">{encerrados.slice(0, 40).map((f) => <FreightCard key={f.id} f={f} />)}</ul></details> : null}
        </div>
      ) : ver === "onibus" ? (
        <div className="mt-6">
          <form className="mb-4 flex flex-wrap items-end gap-2" action="/meu-bras/fretes">
            <input type="hidden" name="ver" value="onibus" />
            <label className="flex flex-col text-sm font-medium">Cidade<input name="cidade" defaultValue={cidade} maxLength={80} className="ds-input mt-1 w-48" placeholder="Ex.: Belo Horizonte" /></label>
            <label className="flex flex-col text-sm font-medium">UF<select name="uf" defaultValue={uf} className="ds-input mt-1 w-24">{BRAS_UFS.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
            <button type="submit" className="ds-btn ds-btn--secondary">Achar ônibus</button>
            <a href="/meu-bras/fretes/etiquetas" className="ds-btn ds-btn--quiet">Imprimir minhas etiquetas</a>
          </form>
          {(trips.length ? trips : tripsUf).length ? (
            <>
              {!trips.length && tripsUf.length ? <p className="mb-3 text-sm text-muted-foreground">Nenhum ônibus para {cidade}. Estes atendem outras cidades de {uf}:</p> : null}
              <ul className="space-y-3">{(trips.length ? trips : tripsUf).map((t) => (
                <li key={t.tripId} className="ds-card p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-base font-bold"><Bus className="size-5 text-[var(--brand-primary)]" aria-hidden />{t.carrierName}{t.groupCompany ? <Badge tone="brand">Empresa do grupo</Badge> : null}</p>
                      <p className="text-muted-foreground">{t.routeName} · viagem {t.number}</p>
                    </div>
                    <Badge tone={t.full ? "warning" : "success"}>{t.full ? "Lotado: lista de espera" : `${Math.max(0, t.capacityUnits - t.usedUnits)} espaços livres`}</Badge>
                  </div>
                  <p className="mt-2">Sai do Brás: <b>{fmt(t.departAt)}</b>{t.arriveCityAt ? <> · chega: <b>{fmt(t.arriveCityAt)}</b></> : null}</p>
                  <p className="text-muted-foreground">Atende: {[t.origin, ...t.cities].join(", ")} · retirada: {t.cityPoint}</p>
                  <p className="text-muted-foreground">Fardinho P {formatBRL(t.prices.P)} · Fardo M {formatBRL(t.prices.M)} · Fardo G {formatBRL(t.prices.G)}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted" role="meter" aria-label="Ocupação do bagageiro" aria-valuemin={0} aria-valuemax={t.capacityUnits} aria-valuenow={t.usedUnits}><div className="h-full bg-[var(--brand-primary)]" style={{ width: `${Math.min(100, Math.round((t.usedUnits / Math.max(1, t.capacityUnits)) * 100))}%` }} /></div>
                  <details className="mt-3"><summary className="cursor-pointer font-semibold text-link">{t.full ? "Entrar na lista de espera" : "Reservar espaço neste ônibus"}</summary>
                    <div className="mt-3"><ReserveParcelsForm trip={{ tripId: t.tripId, number: t.number, carrierName: t.carrierName, departAt: t.departAt, brasPoint: t.brasPoint, prices: t.prices, full: t.full }} sizes={exRules!.sizes} requests={myReqs.filter((r) => r.status === "CONFIRMED" || r.status === "PAID").map((r) => ({ id: r.id, label: `Pedido ${r.number} · ${r.productTitle}` }))} /></div>
                  </details>
                </li>
              ))}</ul>
            </>
          ) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum ônibus de excursão com viagem aberta para {cidade ? `${cidade}/` : ""}{uf}. Indique o ônibus que você já usa: quando ele entrar, as viagens aparecem aqui.</p>}
        </div>
      ) : ver === "catalogo" ? (
        <div className="mt-6">
          <form className="mb-4 flex flex-wrap items-end gap-2" action="/meu-bras/fretes">
            <input type="hidden" name="ver" value="catalogo" />
            <label className="flex flex-col text-sm font-medium">Entregar em<select name="uf" defaultValue={uf} className="ds-input mt-1 w-28">{BRAS_UFS.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
            <button type="submit" className="ds-btn ds-btn--secondary">Ver</button>
          </form>
          {catalog.length ? <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{catalog.map((c) => (
            <li key={c.id} className={`ds-card p-4 text-sm ${c.ufs.includes(uf) ? "" : "border-dashed"}`}>
              <p className="flex items-center gap-2 text-base font-semibold">{c.operation === "EXCURSAO" ? <Bus className="size-5 text-[var(--brand-primary)]" aria-hidden /> : <Truck className="size-5 text-[var(--brand-primary)]" aria-hidden />}{c.name}</p>
              <p className="mt-1 flex flex-wrap gap-1">{c.operation === "EXCURSAO" ? <Badge tone="neutral">Ônibus de excursão</Badge> : <Badge tone="neutral">Transportadora</Badge>}{c.docsOk ? <Badge tone="success" icon={<ShieldCheck className="size-3" aria-hidden />}>Documentação em dia</Badge> : null}{c.insurance ? <Badge tone="success">Seguro de carga</Badge> : null}{c.groupCompany ? <Badge tone="brand">Empresa do grupo</Badge> : null}</p>
              <p className="mt-2 text-muted-foreground">{c.ufs.includes(uf) ? `Atende ${uf}` : `Não atende ${uf}`} · {c.ufs.join(", ")}</p>
              <p className="text-muted-foreground">{c.rateNotes ? `Frete: ${c.rateNotes}` : "Frete combinado com a transportadora"}</p>
              <a href={wa(c.phone)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-link underline"><MessageCircle className="size-4" aria-hidden />Falar com {c.contactName}</a>
            </li>
          ))}</ul> : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhuma transportadora no catálogo ainda. Indique a sua.</p>}
          <p className="mt-4 text-xs text-muted-foreground">Ordem: quem atende o seu estado, documentação conferida e nome. Nenhuma transportadora paga para aparecer na frente sem o selo &quot;patrocinado&quot;.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section aria-labelledby="ind-t" className="ds-card p-4">
            <h2 id="ind-t" className="mb-1 text-base font-semibold">Minha transportadora ou ônibus não está aqui</h2>
            <p className="mb-3 text-sm text-muted-foreground">Indique a que você já usa. Ela recebe o convite pelo WhatsApp e, quando entrar, aparece para você escolher no pedido.</p>
            <ReferCarrierForm defaultUf={uf as (typeof BRAS_UFS)[number]} />
          </section>
          <section aria-labelledby="ind-l" className="ds-card p-4">
            <h2 id="ind-l" className="mb-3 text-base font-semibold">Minhas indicações ({refs.length})</h2>
            {refs.length ? <ul className="space-y-2 text-sm">{refs.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"><span><b>{r.name}</b> <span className="text-muted-foreground">· {r.kind === "ONIBUS" ? "ônibus" : "transportadora"}{r.city ? ` · ${r.city}/${r.uf}` : ""}</span></span><Badge tone={r.status === "ATIVOU" || r.status === "RECORRENTE" ? "success" : r.status === "CADASTROU" ? "info" : "neutral"}>{REF_STATUS[r.status]}</Badge></li>)}</ul>
              : <p className="text-sm text-muted-foreground">Nenhuma indicação ainda. Os pontos do Brás Digital Club por indicação chegam em breve.</p>}
          </section>
        </div>
      )}
    </>
  );
}
