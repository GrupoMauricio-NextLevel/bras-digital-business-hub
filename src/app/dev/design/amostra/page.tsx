import { notFound } from "next/navigation";
import { AlertTriangle, Inbox, Package, Printer, Search, ShoppingBag, Store, Wallet } from "lucide-react";
import { THEME_KEYS, THEME_INPUTS, themePreviewCss, themeColors, type ThemeKey } from "@/design-system/themes";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Amostra do sistema de design", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROWS = [
  { id: "1042", who: "Marina Souza de Albuquerque Menezes", total: "R$ 1.249,90", st: "PAID" },
  { id: "1043", who: "Carlos Almeida", total: "R$ 79,90", st: "PENDING" },
  { id: "1044", who: "Joana Pires", total: "R$ 342,00", st: "CANCELED" },
];

function Sample({ theme, mode }: { theme: ThemeKey; mode: "light" | "dark" }) {
  const c = themeColors(theme, mode);
  return (
    <section data-ds-preview={`${theme}-${mode}`} className="space-y-6 rounded-3xl border border-[var(--ds-line)] bg-[var(--ds-canvas)] p-5 text-[var(--ds-text)]" aria-label={`${THEME_INPUTS[theme].label}, ${mode === "light" ? "claro" : "escuro"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-[var(--ds-ink)]">{THEME_INPUTS[theme].label} · {mode === "light" ? "Claro" : "Escuro"}</h2>
        <div className="flex gap-1.5" aria-hidden>{[c.canvas, c.surface, c.primary, c.accent, c.reflection, c.band].map((x) => <span key={x} className="size-6 rounded-full border border-[var(--ds-line)]" style={{ background: x }} />)}</div>
      </div>

      <PageHeader eyebrow="Visão geral" title="Título da página operacional" description="Descrição curta do que a tela faz, com no máximo duas linhas de leitura." actions={<><Button variant="secondary"><Search />Buscar</Button><Button><Package />Ação principal</Button></>} />

      <div className="ds-kpis">
        <MetricCard label="Vendas · 30 dias" value="R$ 48.829,64" icon={Wallet} delta={12.4} hint="vs. 30 dias anteriores" />
        <MetricCard label="Pedidos" value="59" icon={ShoppingBag} delta={-3.1} />
        <MetricCard label="Atenção" value="2" tone="danger" icon={AlertTriangle} hint="mais de 24h" />
        <MetricCard label="Sem variação" value="—" />
      </div>

      <div className="ds-grid ds-grid--main">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2" aria-label="Botões">
            <Button>Primário</Button><Button variant="secondary">Secundário</Button><Button variant="ghost">Discreto</Button><Button variant="danger">Excluir</Button>
            <Button size="sm">Pequeno</Button><Button disabled>Desativado</Button><Button loading>Carregando</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Pílulas de estado">
            <Badge>Neutro</Badge><Badge tone="brand">Marca</Badge><Badge tone="success">Sucesso</Badge><Badge tone="warning">Atenção</Badge><Badge tone="danger">Erro</Badge><Badge tone="info">Info</Badge><Badge tone="outline">Contorno</Badge>
          </div>
          <div className="ds-seg" role="tablist" aria-label="Abas"><button role="tab" aria-selected="true">Todos</button><button role="tab" aria-selected="false">Pendente <span className="ds-count">12</span></button><button role="tab" aria-selected="false">Enviado</button></div>
          <DataTable rows={ROWS} rowKey={(r) => r.id} columns={[
            { key: "id", header: "Pedido", primary: true, cell: (r) => <span className="font-bold">#{r.id}</span> },
            { key: "who", header: "Cliente", cell: (r) => <span className="line-clamp-1">{r.who}</span> },
            { key: "total", header: "Total", className: "text-right", cell: (r) => <span className="font-bold tabular-nums">{r.total}</span> },
            { key: "st", header: "Situação", cell: (r) => <StatusBadge value={r.st} /> },
          ]} />
        </div>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Campos</CardTitle></CardHeader><CardContent className="space-y-3">
            <FormField label="Nome" htmlFor={`n-${theme}-${mode}`} hint="Texto de ajuda curto."><Input id={`n-${theme}-${mode}`} defaultValue="Casa Aurora" /></FormField>
            <FormField label="E-mail" htmlFor={`e-${theme}-${mode}`} error="Informe um e-mail válido."><Input id={`e-${theme}-${mode}`} defaultValue="isso-nao-e-email" aria-invalid /></FormField>
            <FormField label="Categoria" htmlFor={`c-${theme}-${mode}`}><Select id={`c-${theme}-${mode}`}><option>Moda</option></Select></FormField>
            <FormField label="Desativado" htmlFor={`d-${theme}-${mode}`}><Input id={`d-${theme}-${mode}`} disabled defaultValue="Não editável" /></FormField>
            <FormField label="Observação" htmlFor={`o-${theme}-${mode}`}><Textarea id={`o-${theme}-${mode}`} defaultValue="" placeholder="Opcional" /></FormField>
          </CardContent></Card>
          <div className="ds-side" style={{ position: "relative", height: "auto", borderRadius: "var(--ds-r-card)" }} aria-label="Exemplo de menu lateral">
            <div className="ds-nav"><nav className="ds-nav-inner"><a className="ds-item" aria-current="page" href="#"><Store className="size-[18px]" aria-hidden /><span className="ds-item-label">Item ativo</span></a><a className="ds-item" href="#"><Inbox className="size-[18px]" aria-hidden /><span className="ds-item-label">Item comum</span><em className="ds-badge">3</em></a><button className="ds-navgroup" aria-expanded="false"><Printer className="size-[18px]" aria-hidden /><span className="ds-item-label">Grupo</span></button></nav></div>
          </div>
        </div>
      </div>

      <div className="ds-grid ds-grid--2">
        <EmptyState title="Estado vazio" description="Explica o que aparecerá aqui e oferece a ação existente." action={<Button size="sm">Criar o primeiro</Button>} />
        <div className="space-y-3"><ErrorState title="Estado de erro" description="Mensagem em português claro, sem código técnico." /><div className="space-y-2" aria-label="Carregando"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-16" /></div></div>
      </div>

      <div className="ds-hero"><div className="ds-hero-stage" aria-hidden><span className="ds-blade ds-blade--c" /><span className="ds-blade ds-blade--a" /><span className="ds-blade ds-blade--b" /></div>
        <p className="ds-eyebrow">Superfície de vidro</p><h3 className="max-w-[18ch] text-2xl font-extrabold text-[var(--ds-ink)]">Identidade do produto</h3><p className="ds-lede">Lâminas decorativas com aresta de luz, sem informação.</p></div>

      <div className="ds-warm ds-card"><h3 className="ds-warm-title font-bold">Superfície de destaque quente</h3><p className="text-sm">Usada só para personalização; nunca para alerta ou ação financeira.</p></div>

      <div className="rounded-3xl p-5" style={{ background: "var(--ds-band)", color: "var(--ds-band-fg)" }}><p className="font-extrabold">Faixa escura de destaque</p><p className="text-sm" style={{ color: "var(--ds-band-muted)" }}>Texto secundário sobre a faixa.</p><div className="mt-3 flex gap-2"><a className="ds-pub-btn ds-pub-btn--sm" href="#">Chamada</a><a className="ds-pub-btn ds-pub-btn--ghost ds-pub-btn--sm" style={{ color: "var(--ds-band-fg)", borderColor: "var(--ds-band-line)" }} href="#">Secundária</a></div></div>
    </section>
  );
}

export default async function SamplePage({ searchParams }: { searchParams: Promise<{ tema?: string; modo?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") notFound();
  const { tema = "todos", modo = "ambos" } = await searchParams;
  const themes = THEME_KEYS.filter((k) => tema === "todos" ? ["nextlevel", "commerce", "superdrop"].includes(k) : k === tema);
  const modes = (modo === "light" || modo === "dark" ? [modo] : ["light", "dark"]) as ("light" | "dark")[];
  return (
    <div className="space-y-6 bg-canvas p-4">
      <style dangerouslySetInnerHTML={{ __html: themePreviewCss() }} />
      {themes.flatMap((t) => modes.map((m) => <Sample key={`${t}-${m}`} theme={t} mode={m} />))}
    </div>
  );
}
