import { Suspense } from "react";
import { Factory, LifeBuoy, Store, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { FilterBar, FilterChips, SearchInput } from "@/components/app/filter-bar";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { SupportEnterButton } from "@/components/support/support-enter";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { CLIENT_ROLE_LABEL, listClients, listSupportHistory } from "@/lib/domain/support";
import { PRODUCT_BRANDS, brandByCode, isBrandCode } from "@/lib/brand";
import { masterBrandFilter } from "@/lib/brand-server";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = { SUPPORT_START: "Entrou em modo suporte", SUPPORT_ACT_ENABLED: "Liberou ações em nome do cliente", SUPPORT_END: "Saiu do modo suporte" };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string; marca?: string; papel?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const sp = await searchParams;
  const marca = await masterBrandFilter(sp.marca);
  const db = await getDb();
  const [rows, history] = await Promise.all([listClients(db, session.actor, { q: sp.q, brand: marca, role: sp.papel }), listSupportHistory(db, session.actor, 12)]);
  const count = (role: string) => rows.filter((r) => r.role === role).length;
  const back = "/master/clientes" + (sp.q || sp.marca || sp.papel ? "?" + new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString() : "");
  return (
    <>
      <PageHeader eyebrow="Suporte" title="Clientes" description="Encontre qualquer lojista, fornecedor, expedição ou parceiro de todas as marcas e veja o painel exatamente como ele vê, em modo suporte registrado." />
      <OperationalPulse className="mb-5" items={[
        { label: "Lojistas", value: count("STORE_OWNER"), icon: Store, tone: "neutral", hint: "donos e equipes de loja" },
        { label: "Fornecedores", value: count("SUPPLIER_ADMIN") + count("SUPPLIER_DISPATCH"), icon: Factory, tone: "neutral", hint: "gestão e expedição" },
        { label: "Parceiros", value: count("AFFILIATE"), icon: UsersRound, tone: "neutral", hint: "programa de parceiros" },
        { label: "Com alerta", value: rows.filter((r) => r.alerts.length).length, icon: LifeBuoy, tone: rows.some((r) => r.alerts.length) ? "warning" : "success", hint: "suspensos, pendentes ou encerrados" },
      ]} />
      <Suspense>
        <FilterBar>
          <SearchInput placeholder="Nome, e-mail, loja ou fornecedor…" />
          <FilterChips param="marca" allLabel={marca && !sp.marca ? `Só ${brandByCode(marca).name}` : "Todas as marcas"} options={[{ value: "todas", label: "Todas as marcas" }, ...PRODUCT_BRANDS.map((c) => ({ value: c, label: brandByCode(c).name }))]} />
          <FilterChips param="papel" allLabel="Todos os papéis" options={Object.entries(CLIENT_ROLE_LABEL).map(([value, label]) => ({ value, label }))} />
        </FilterBar>
      </Suspense>
      <DataTable
        rows={rows}
        rowKey={(r) => r.userId}
        empty={<EmptyState title="Nenhum cliente encontrado" description="Ajuste a busca ou os filtros de marca e papel." />}
        columns={[
          { key: "name", header: "Cliente", primary: true, cell: (r) => <div className="min-w-0"><div className="font-semibold">{r.name}</div><div className="truncate text-xs text-muted-foreground">{r.email}</div></div> },
          { key: "tenant", header: "Negócio", cell: (r) => <div className="min-w-0"><div>{r.tenantName ?? "—"}</div><div className="text-xs text-muted-foreground">{CLIENT_ROLE_LABEL[r.role]}{r.role === "STORE_OWNER" && r.storeRole === "STAFF" ? " · equipe" : ""}</div></div> },
          { key: "brand", header: "Marca", cell: (r) => <span className="text-xs">{isBrandCode(r.brand) ? brandByCode(r.brand).name : r.brand}</span> },
          { key: "alerts", header: "Situação", cell: (r) => r.alerts.length ? <span className="flex flex-wrap gap-1">{r.alerts.map((a) => <Badge key={a} tone="warning">{a}</Badge>)}</span> : <Badge tone="success">Em dia</Badge> },
          { key: "last", header: "Último acesso", mobile: false, cell: (r) => <span className="text-xs text-muted-foreground">{r.lastLoginAt ? formatDateTime(r.lastLoginAt) : "nunca entrou"}</span> },
          { key: "act", header: "", className: "text-right", cell: (r) => r.disabled ? <span className="text-xs text-muted-foreground">sem acesso</span> : <SupportEnterButton userId={r.userId} name={r.name} back={back} /> },
        ]}
      />
      <section className="mt-8" aria-labelledby="hist">
        <h2 id="hist" className="mb-3 text-lg font-bold">Acessos de suporte recentes</h2>
        {history.length ? (
          <ul className="ds-card divide-y divide-border p-0">
            {history.map((h) => <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span>{ACTION_LABEL[h.action] ?? h.action}{(h.changes as Record<string, { to?: unknown }>).motivo?.to ? <span className="text-muted-foreground"> · “{String((h.changes as Record<string, { to?: unknown }>).motivo!.to)}”</span> : null}</span><span className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</span></li>)}
          </ul>
        ) : <EmptyState title="Nenhum acesso de suporte ainda" description="Cada entrada em modo suporte aparece aqui, com o motivo." />}
      </section>
    </>
  );
}
