import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listCatalog } from "@/lib/domain/nl-catalog";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { FAMILY_LABEL, KIND_LABEL, PHASE_LABEL, priceLines, STATUS_LABEL } from "@/lib/finance/catalog-labels";
import { CATALOG_FAMILIES } from "@/db/schema";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

export default async function CatalogoMaster() {
  await requireRole("NEXTLEVEL_MASTER");
  const items = await listCatalog(await getDb(), { includeUnpublished: true });
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Catálogo e preços" description="Fonte única dos produtos e preços da NextLevel. Preço muda só por nova versão (com senha e motivo); pausar não afeta quem já comprou. Os painéis dos clientes e parceiros só leem o que está publicado aqui." />
      <FinNav active="catalogo" />
      {CATALOG_FAMILIES.filter((f) => items.some((i) => i.family === f)).map((f) => (
        <section key={f} className="mb-8">
          <SectionTitle title={FAMILY_LABEL[f]} />
          <DataTable rows={items.filter((i) => i.family === f)} rowKey={(i) => i.id} rowHref={(i) => `/master/financeiro/catalogo/${i.key}`} columns={[
            { key: "name", header: "Produto", primary: true, cell: (i) => <div><div className="font-semibold">{i.name}</div><div className="text-xs text-muted-foreground">{i.key} · {KIND_LABEL[i.kind]} · {PHASE_LABEL[i.phase]}</div></div> },
            { key: "price", header: "Preço vigente", cell: (i) => { const p = priceLines(i); return <div><div className="font-semibold tabular-nums">{p.main}</div><div className="text-xs text-muted-foreground">{p.details[1] ?? p.details[0] ?? ""}</div></div>; } },
            { key: "status", header: "Situação", cell: (i) => <Badge tone={i.status === "PUBLISHED" ? "success" : i.status === "PAUSED" ? "warning" : "neutral"}>{STATUS_LABEL[i.status]}</Badge> },
            { key: "gw", header: "Gateway", mobile: false, cell: (i) => i.gateway === "PAGARME" ? "Pagar.me" : i.gateway === "MERCADOPAGO" ? "Mercado Pago" : "Regra global" },
          ]} />
        </section>
      ))}
      <p className="text-sm text-muted-foreground">Os preços do SuperDrop (fornecedores e lojas de membros) continuam em <Link className="font-semibold text-link underline" href="/master/financeiro/operacao?tab=rules">Financeiro SuperDrop → Regras e preços</Link>, agora com cada alteração gravada na auditoria. Veja <Link className="font-semibold text-link underline" href="/master/financeiro/superdrop">o racional do SuperDrop</Link>.</p>
    </>
  );
}
