"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { MockWindow } from "./mock-window";
import { cn } from "@/lib/utils";

type PanelKey = "master" | "supplier" | "dispatch" | "lite";
const PANELS: { key: PanelKey; label: string; title: string; text: string; bullets: string[]; url: string }[] = [
  { key: "master", label: "NextLevel", title: "Torre de controle da rede", text: "Enxergue todo o negócio: receita, saúde de cada loja, pedidos de serviço e o que precisa de atenção agora.", bullets: ["Fila de atenção por gravidade", "Receita recorrente, taxas e serviços", "Orçamentos e conversa com quem contratou"], url: "app.superdrop.com.br/master" },
  { key: "supplier", label: "Fornecedor", title: "Esteira e gestão do fornecedor", text: "Receba os pedidos já pagos, com etiqueta anexada, respeitando o horário de corte e sem planilha.", bullets: ["Esteira ao vivo em quatro etapas", "Recargas por Pix por membro", "Equipe de expedição com acesso limitado"], url: "app.superdrop.com.br/supplier" },
  { key: "dispatch", label: "Expedição", title: "Tela da expedição", text: "Botões grandes, alto contraste e nenhum valor à vista. Feita para tablet, no balcão de separação.", bullets: ["Ondas de separação com lista por produto", "Todas as etiquetas em um só PDF", "Um funcionário por pedido"], url: "app.superdrop.com.br/supplier/dispatch" },
  { key: "lite", label: "Membro", title: "Painel do membro", text: "Saldo em destaque, recarga por Pix, catálogo do fornecedor e acompanhamento de cada pedido.", bullets: ["Recarga por Pix com confirmação automática", "Etiquetas e pós-venda no mesmo lugar", "Loja NextLevel com serviços e upgrades"], url: "app.superdrop.com.br/merchant" },
];

const kpi = "rounded-lg border border-border bg-surface p-2.5";
function Screen({ k }: { k: PanelKey }) {
  return (
    <div className="space-y-3 bg-background p-3 text-foreground sm:p-4" aria-hidden>
      {k === "master" ? <>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Receita do mês", "R$ 894,00"], ["Pedidos", "39"], ["Fornecedores", "2"], ["Alertas", "3"]].map(([l, v]) => <div key={l} className={kpi}><p className="text-[10px] uppercase text-muted-foreground">{l}</p><p className="text-lg font-bold tabular-nums">{v}</p></div>)}</div>
        <div className={cn(kpi, "space-y-1.5")}><p className="text-[11px] font-semibold">Fila de atenção</p>{[["danger", "Recarga vencida há 3 dias"], ["warning", "2 pedidos de serviço aguardando orçamento"], ["info", "Loja pronta para o plano Loja Própria"]].map(([t, x]) => <p key={x} className="flex items-center gap-2 rounded bg-surface-muted px-2 py-1.5 text-[11px]"><span className={cn("size-2 rounded-full", t === "danger" ? "bg-danger" : t === "warning" ? "bg-warning" : "bg-info")} />{x}</p>)}</div>
      </> : null}
      {k === "supplier" ? <>
        <div className="grid grid-cols-3 gap-2">{[["Prontos", "12"], ["Em separação", "5"], ["Enviados hoje", "31"]].map(([l, v]) => <div key={l} className={kpi}><p className="text-[10px] uppercase text-muted-foreground">{l}</p><p className="text-lg font-bold tabular-nums">{v}</p></div>)}</div>
        <div className="flex items-center justify-between rounded-lg bg-info-soft px-3 py-2 text-[11px] font-semibold text-info"><span>Corte de hoje: 15:00</span><span>faltam 01:42</span></div>
        <div className={cn(kpi, "space-y-1.5")}>{["#1042 · 2 itens", "#1043 · 1 item", "#1047 · 3 itens"].map((x, i) => <p key={x} className="flex items-center justify-between rounded bg-surface-muted px-2 py-1.5 text-[11px]"><span className="font-medium">{x}</span><span className="text-muted-foreground">{i === 0 ? "Em separação" : "Pronto para separar"}</span></p>)}</div>
      </> : null}
      {k === "dispatch" ? <>
        <div className="rounded-xl bg-primary px-4 py-3 text-center text-base font-bold text-primary-foreground">Próximo pedido</div>
        <div className="space-y-2">{[["Camisa Tailandesa 01 · M", 5], ["Camisa Tailandesa 02 · G", 4], ["Camisa Tailandesa 03 · P", 3]].map(([n, q]) => <div key={String(n)} className="flex items-center gap-3 rounded-xl border-2 border-border bg-surface px-3 py-3 text-sm"><span className="size-6 rounded border-2 border-border-strong" /><span className="flex-1 font-semibold">{n}</span><span className="text-lg font-extrabold tabular-nums">{q}</span></div>)}</div>
        <div className="rounded-xl border-2 border-primary px-4 py-3 text-center text-sm font-bold text-primary">Imprimir etiquetas da onda</div>
      </> : null}
      {k === "lite" ? <>
        <div className="rounded-xl bg-primary p-4 text-primary-foreground"><p className="text-[11px] opacity-90">Saldo para pedidos</p><p className="text-3xl font-extrabold tabular-nums">R$ 340,00</p><span className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-neutral-900">Recarregar por Pix</span></div>
        <div className="grid grid-cols-2 gap-2">{[["Para pagar", "2 pedidos"], ["Aguardando etiqueta", "3 pedidos"]].map(([l, v]) => <div key={l} className={kpi}><p className="text-[10px] uppercase text-muted-foreground">{l}</p><p className="text-sm font-bold">{v}</p></div>)}</div>
        <div className="rounded-lg border border-accent/30 bg-accent-soft p-2.5 text-[11px]"><p className="font-semibold text-accent-foreground">Recomendado para você</p><p className="text-muted-foreground">Banners de campanha ajudam a divulgar a loja.</p></div>
      </> : null}
    </div>
  );
}

export function PanelsShowcase() {
  const [i, setI] = React.useState(0);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : PANELS.length - 1)) % PANELS.length; setI(n); refs.current[n]?.focus();
  };
  const p = PANELS[i]!;
  return (
    <div>
      <div role="tablist" aria-label="Painéis" className="mb-8 inline-flex flex-wrap gap-1 rounded-xl bg-neutral-200/70 p-1" onKeyDown={onKey}>
        {PANELS.map((x, n) => <button key={x.key} ref={(el) => { refs.current[n] = el; }} role="tab" id={`pn-tab-${x.key}`} aria-selected={n === i} aria-controls="pn-panel" tabIndex={n === i ? 0 : -1} onClick={() => setI(n)} className={cn("rounded-lg px-4 py-2 text-sm font-semibold transition-colors", n === i ? "bg-white shadow-sm" : "text-neutral-600 hover:text-neutral-900")}>{x.label}</button>)}
      </div>
      <div id="pn-panel" role="tabpanel" aria-labelledby={`pn-tab-${p.key}`} className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <h3 className="nl-title">{p.title}</h3>
          <p className="mt-3 text-neutral-600">{p.text}</p>
          <ul className="mt-5 space-y-2.5">{p.bullets.map((b) => <li key={b} className="flex gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-[#0d803e]" aria-hidden />{b}</li>)}</ul>
        </div>
        <MockWindow title={p.url} panel={p.key === "dispatch" ? "dispatch" : p.key}><Screen k={p.key} /></MockWindow>
      </div>
      <p className="mt-4 text-xs text-neutral-600">Telas com dados simulados.</p>
    </div>
  );
}
