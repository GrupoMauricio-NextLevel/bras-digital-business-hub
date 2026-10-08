import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { partnerCatalog, PARTNER_KIND_LABEL } from "@/lib/domain/corporate-sales";
import { getBaseUrl } from "@/lib/base-url";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { FAMILY_LABEL, priceLines } from "@/lib/finance/catalog-labels";
import { CopyButton } from "../partner-client";

export const dynamic = "force-dynamic";

export default async function PartnerCatalogo() {
  const s = await requireRole("AFFILIATE");
  const db = await getDb();
  const items = await partnerCatalog(db, s.actor);
  const base = await getBaseUrl();
  return (
    <>
      <PageHeader title="Catálogo comercial" description="Produtos que a NextLevel liberou para você vender, com preço público, desconto permitido, sua comissão e o benefício ao cliente. Valores e regras são definidos pelo Master." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => {
          const p = priceLines({ kind: i.kind, prices: i.prices, meta: {} });
          const link = `${base}${i.link}`;
          return (
            <article key={i.key} className="ds-card flex flex-col p-5">
              <Badge tone="outline">{FAMILY_LABEL[i.family]}</Badge>
              <h2 className="mt-2 font-semibold">{i.name}</h2>
              <p className="text-sm text-muted-foreground">{i.tagline}</p>
              <p className="mt-2 text-lg font-bold tabular-nums">{p.main}</p>
              <ul className="text-xs text-muted-foreground">{p.details.slice(0, 2).map((d) => <li key={d}>{d}</li>)}</ul>
              <div className="mt-3 rounded-md bg-surface-muted p-3 text-sm">
                {i.rule ? <p><strong>Sua comissão:</strong> {i.rule.firstBps / 100}%{i.rule.recurringBps ? ` + ${i.rule.recurringBps / 100}% por ${i.rule.recurringMonths} meses` : ""} · carência {i.rule.holdDays} dias</p> : <p>Sem comissão definida para este produto.</p>}
                {i.annualRule ? <p><strong>No anual:</strong> {i.annualRule.firstBps / 100}% (pagamento único)</p> : null}
                {i.rule?.benefit ? <p><strong>Benefício ao cliente:</strong> {i.rule.benefit}</p> : null}
                <p><strong>Desconto que você pode dar:</strong> {i.partnerDiscountMaxBps ? `até ${i.partnerDiscountMaxBps / 100}% (não acumula com Pix nem com o anual)` : "nenhum"}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-3"><CopyButton text={link} label="Copiar link rastreável" /></div>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Seu tipo de parceiro define as regras aplicadas. Tipos: {Object.values(PARTNER_KIND_LABEL).join(", ")}. Verba de anúncio, imposto, taxa de gateway e estornos nunca entram na base de comissão.</p>
    </>
  );
}
