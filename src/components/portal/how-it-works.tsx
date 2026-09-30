"use client";
import * as React from "react";
import { Boxes, CreditCard, FileText, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { MockWindow } from "./mock-window";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "catalog", title: "Catálogo do fornecedor", text: "O fornecedor cadastra produtos, tamanhos e estoque. O membro escolhe o que vender e define o próprio preço.", icon: Boxes },
  { key: "sale", title: "Venda na loja do membro", text: "O cliente compra na loja do membro. O pedido chega já com os dados de envio.", icon: ShoppingBag },
  { key: "pix", title: "Custo pago por Pix", text: "O membro recarrega o saldo por Pix. O custo de cada pedido sai do saldo, sem cartão.", icon: CreditCard },
  { key: "label", title: "Etiqueta anexada", text: "O membro gera a etiqueta na transportadora e anexa o PDF ao pedido. A expedição imprime em lote.", icon: FileText },
  { key: "ship", title: "Separação e envio", text: "O fornecedor separa o pedido no horário de corte, envia com a etiqueta que você anexou e o status muda sozinho no seu painel.", icon: Truck },
] as const;

function Mock({ step }: { step: (typeof STEPS)[number]["key"] }) {
  const row = "flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-xs";
  return (
    <div className="space-y-2 bg-background p-4" aria-hidden>
      {step === "catalog" ? <>
        <p className="text-xs font-semibold text-muted-foreground">Catálogo ativo</p>
        {["Camisa Tailandesa 01", "Camisa Tailandesa 02", "Camisa Tailandesa 03"].map((n, i) => <div key={n} className={row}><span className="font-medium">{n}</span><span className="tabular-nums text-muted-foreground">Sugestão R$ 120,00</span><span className={cn("rounded-full px-2 py-0.5 font-semibold", i < 2 ? "bg-success-soft text-success" : "bg-surface-muted text-muted-foreground")}>{i < 2 ? "Na sua loja" : "Ativar"}</span></div>)}
      </> : null}
      {step === "sale" ? <>
        <p className="text-xs font-semibold text-muted-foreground">Pedido #1046</p>
        <div className={row}><span className="font-medium">Camisa Tailandesa 02 · G</span><span className="tabular-nums">R$ 120,00</span></div>
        <div className={row}><span className="text-muted-foreground">Frete (pago pelo cliente)</span><span className="tabular-nums">R$ 18,90</span></div>
        <div className={cn(row, "border-success/30 bg-success-soft")}><span className="font-semibold text-success">Pagamento confirmado</span><span className="font-semibold tabular-nums">R$ 138,90</span></div>
      </> : null}
      {step === "pix" ? <>
        <p className="text-xs font-semibold text-muted-foreground">Saldo e recargas</p>
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
          <div className="grid size-16 shrink-0 grid-cols-5 gap-0.5 rounded bg-white p-1 ring-1 ring-border">{Array.from({ length: 25 }).map((_, i) => <span key={i} className={cn("rounded-[1px]", [0, 1, 3, 4, 5, 9, 10, 12, 14, 15, 19, 20, 21, 23, 24, 7, 17].includes(i) ? "bg-neutral-900" : "bg-white")} />)}</div>
          <div className="text-xs"><p className="font-semibold">Pix de R$ 400,00</p><p className="text-muted-foreground">Expira em 30 minutos</p><p className="mt-1 font-semibold text-success">Confirmação automática</p></div>
        </div>
        <div className={row}><span>Custo do pedido #1046</span><span className="tabular-nums font-semibold">− R$ 80,00</span></div>
      </> : null}
      {step === "label" ? <>
        <p className="text-xs font-semibold text-muted-foreground">Etiquetas</p>
        <div className={row}><span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" />etiqueta-1046.pdf</span><span className="rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success">Anexada</span></div>
        <div className={row}><span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" />etiqueta-1047.pdf</span><span className="rounded-full bg-warning-soft px-2 py-0.5 font-semibold text-warning">Conferir</span></div>
        <div className="rounded-md border border-dashed border-border-strong p-3 text-center text-xs text-muted-foreground">Solte o PDF da etiqueta aqui</div>
      </> : null}
      {step === "ship" ? <>
        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><PackageCheck className="size-4" /> Onda de separação · 12 pedidos</p>
        {[["Camisa Tailandesa 01 · M", 5], ["Camisa Tailandesa 02 · G", 4], ["Camisa Tailandesa 03 · P", 3]].map(([n, q]) => <div key={String(n)} className={row}><span className="font-medium">{n}</span><span className="tabular-nums font-semibold">{q} un.</span></div>)}
        <div className={cn(row, "border-info/30 bg-info-soft")}><span className="font-semibold text-info">Etiquetas em um só PDF</span><span className="font-semibold">Imprimir</span></div>
      </> : null}
    </div>
  );
}

/** Cinco passos, com a tela correspondente do produto ao lado. Padrão de abas acessível (setas do teclado). */
export function HowItWorks() {
  const [i, setI] = React.useState(0);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault(); const n = (i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : STEPS.length - 1)) % STEPS.length; setI(n); refs.current[n]?.focus();
  };
  const step = STEPS[i]!;
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div role="tablist" aria-label="Etapas do fluxo" aria-orientation="vertical" className="space-y-2" onKeyDown={onKey}>
        {STEPS.map((s, n) => { const Icon = s.icon; const on = n === i; return (
          <button key={s.key} ref={(el) => { refs.current[n] = el; }} role="tab" id={`hiw-tab-${s.key}`} aria-selected={on} aria-controls="hiw-panel" tabIndex={on ? 0 : -1} onClick={() => setI(n)}
            className={cn("flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all", on ? "border-neutral-900 bg-white shadow-md" : "border-neutral-200 bg-white/60 hover:bg-white")}>
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors", on ? "bg-[#0f1c16] text-[#22c55e]" : "bg-neutral-100 text-neutral-600")}><Icon className="size-5" aria-hidden /></span>
            <span><span className="block text-xs font-semibold text-neutral-600">Passo {n + 1}</span><span className="block font-semibold">{s.title}</span><span className={cn("mt-1 block text-sm text-neutral-600", !on && "hidden sm:block sm:line-clamp-1")}>{s.text}</span></span>
          </button>
        ); })}
      </div>
      <div id="hiw-panel" role="tabpanel" aria-labelledby={`hiw-tab-${step.key}`} className="lg:sticky lg:top-24">
        <MockWindow title={`SuperDrop · ${step.title}`} panel={step.key === "ship" ? "supplier" : "lite"} className="min-h-72"><Mock step={step.key} /></MockWindow>
      </div>
    </div>
  );
}
