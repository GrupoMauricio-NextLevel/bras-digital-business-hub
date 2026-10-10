import { Building2, EyeOff, Package, ShieldCheck, ShoppingCart, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getHouseBrandOverview } from "@/lib/domain/house-brand";
import { ECOSYSTEM } from "@/lib/ecosystem";
import { MEGATRON, formatCnpj, formatDateBr } from "@/lib/house-brand";
import { EnsureHouseBrandButton, HouseBrandAdminForm } from "./house-brand-forms";

/** Regras de sigilo da marca da casa (docs/MEGATRON.md). "ativa" = já garantida pelo sistema hoje. */
const SECRECY: { rule: string; status: "ativa" | "próxima etapa" }[] = [
  { rule: "O cliente compra da Mega Tron: vendedor, CNPJ e nota fiscal são da Mega Tron.", status: "ativa" },
  { rule: "A equipe da Mega Tron só enxerga o próprio catálogo e os próprios pedidos (escopo por fornecedor).", status: "ativa" },
  { rule: "Cada importadora vê a Mega Tron como compradora, nunca o cliente final.", status: "próxima etapa" },
  { rule: "Qual importadora fornece cada produto fica só neste painel (vínculo de origem sigiloso).", status: "próxima etapa" },
  { rule: "Etiqueta e declaração com remetente Mega Tron; conteúdo gravado nas importadoras sem marca, fachada ou metadados.", status: "próxima etapa" },
];

export default async function MegaTronMasterPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const overview = await getHouseBrandOverview(await getDb());

  if (!overview) {
    return (
      <>
        <PageHeader title="Mega Tron Master" badge={<Badge tone="brand">Marca da casa</Badge>} description={MEGATRON.legalName} />
        <EmptyState icon={Building2} title="A Mega Tron ainda não está no banco" description="O deploy cria a empresa automaticamente. Se preferir não esperar, cadastre agora com a ficha oficial." action={<EnsureHouseBrandButton />} />
      </>
    );
  }

  const { org, supplier, areas, team, productCount, orderCount } = overview;
  const ficha: [string, string][] = [
    ["Razão social", org.legalName ?? "—"],
    ["Nome fantasia", org.tradeName ?? "—"],
    ["CNPJ", org.taxId ? formatCnpj(org.taxId) : "—"],
    [`Inscrição estadual (${org.stateRegistrationUf ?? "—"})`, org.stateRegistration ?? "—"],
    ["Abertura", org.foundedOn ? formatDateBr(org.foundedOn) : "—"],
    ["Situação cadastral", org.registrationStatus ?? "—"],
    ["Atividade principal", org.mainActivity ?? "—"],
    ["Localização", [org.city, org.state].filter(Boolean).join(" - ") || "—"],
  ];

  return (
    <>
      <PageHeader
        title="Mega Tron Master"
        badge={<Badge tone="brand">Marca da casa</Badge>}
        description="A mesa de operações da Mega Tron: o que só o grupo enxerga. A operação diária acontece no painel da Mega Tron dentro do Brás Digital."
      />

      <MetricGrid className="mb-6">
        <MetricCard label="Produtos" value={productCount} icon={Package} />
        <MetricCard label="Pedidos" value={orderCount} icon={ShoppingCart} />
        <MetricCard label="Acessos da equipe" value={team.length} icon={UsersRound} />
        <MetricCard label="Taxa da plataforma" value={`${supplier?.platformFeePercent ?? 0}%`} hint="Empresa do grupo" icon={ShieldCheck} />
      </MetricGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>Ficha cadastral</CardTitle><CardDescription>Dados que aparecem como vendedor para os clientes.</CardDescription></div></CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              {ficha.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><CardTitle>Dois painéis, uma empresa</CardTitle><CardDescription>Ligados pela mesma organização; cada um mostra só o que precisa.</CardDescription></div></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">Mega Tron Master</span><Badge tone="info">Você está aqui</Badge></div>
              <p className="mt-1 text-muted-foreground">Só o grupo. Ficha, equipe, margens e, nas próximas etapas, de qual importadora vem cada produto.</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">Mega Tron no {ECOSYSTEM.BRAS_DIGITAL.label}</span><Badge tone="neutral">Importadora</Badge></div>
              <p className="mt-1 text-muted-foreground">A equipe entra com o acesso abaixo e opera catálogo, estoque, pedidos e expedição da Mega Tron. Não vê as importadoras de origem.</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {areas.map((a) => <Badge key={a.area} tone={a.status === "ACTIVE" ? "success" : "warning"} dot>{ECOSYSTEM[a.area].label}</Badge>)}
              {supplier ? <Badge tone="outline">Fornecedor: {supplier.slug}</Badge> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><div><CardTitle>Equipe da Mega Tron</CardTitle><CardDescription>Cada acesso opera a Mega Tron no Brás Digital e no SuperDrop. A senha temporária aparece uma única vez.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4">
            {team.length ? (
              <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                {team.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="min-w-0"><div className="truncate font-medium">{u.name}</div><div className="truncate text-muted-foreground">{u.email}</div></div>
                    <div className="flex flex-wrap gap-1.5">
                      {u.areas.map((a) => <Badge key={a} tone="outline">{ECOSYSTEM[a].label}</Badge>)}
                      {u.mustChangePassword ? <Badge tone="warning">Aguardando 1º acesso</Badge> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Nenhum acesso criado ainda.</p>}
            <HouseBrandAdminForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><div><CardTitle className="flex items-center gap-2"><EyeOff className="size-4" aria-hidden /> Sigilo entre importadoras e clientes</CardTitle><CardDescription>O que já é garantido pelo sistema e o que vem a seguir (docs/MEGATRON.md).</CardDescription></div></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {SECRECY.map((s) => (
                <li key={s.rule} className="flex items-start justify-between gap-3">
                  <span>{s.rule}</span>
                  <Badge tone={s.status === "ativa" ? "success" : "neutral"} className="shrink-0">{s.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
