import { formatBRL } from "@/lib/money";

/**
 * Telas do painel da Commerce em HTML, com os nomes que o painel de loja tem hoje (Início, Pedidos, Clientes, Catálogo, Loja virtual,
 * Editor do tema; canais Loja virtual, WhatsApp e Instagram). Dados de demonstração. Preços em centavos isolados da cobrança.
 */
const NAV = ["Início", "Pedidos", "Clientes", "Catálogo", "Loja virtual", "Editor do tema"];
const ROWS = [
  { n: "#1042", who: "Marina S.", canal: "Loja virtual", cents: 18990, st: "Pago", tone: "bg-success-soft text-success" },
  { n: "#1041", who: "Carlos A.", canal: "WhatsApp", cents: 7990, st: "Aguardando pagamento", tone: "bg-warning-soft text-warning" },
  { n: "#1040", who: "Joana P.", canal: "Loja virtual", cents: 28990, st: "Enviado", tone: "bg-sky-100 text-sky-900" },
  { n: "#1039", who: "Rafael M.", canal: "Instagram", cents: 12990, st: "Pago", tone: "bg-success-soft text-success" },
  { n: "#1038", who: "Bia T.", canal: "Loja virtual", cents: 34990, st: "Enviado", tone: "bg-sky-100 text-sky-900" },
];

export function OrdersPanel({ className = "", side = true }: { className?: string; side?: boolean }) {
  return (
    <div className={`flex h-full min-h-[22rem] bg-canvas text-[13px] text-foreground ${className}`} aria-hidden>
      <aside className={`${side ? "hidden sm:block" : "hidden"} w-40 shrink-0 border-r border-border bg-surface-muted p-3`}>
        <p className="mb-3 flex items-center gap-2 font-bold"><span className="inline-block size-6 rounded-md bg-band" />Sua loja</p>
        <ul className="space-y-1">{NAV.map((n) => <li key={n} className={`rounded-md px-2 py-1.5 ${n === "Pedidos" ? "bg-surface font-semibold shadow-sm" : "text-muted-foreground"}`}>{n}</li>)}</ul>
      </aside>
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-center justify-between"><p className="text-lg font-extrabold">Pedidos</p><span className="rounded-md bg-band px-3 py-1.5 text-[12px] font-semibold text-band-foreground">+ Novo pedido</span></div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">{["Todos", "Aguardando pagamento", "Pagos", "Enviados"].map((t, i) => <span key={t} className={`rounded-full border px-2.5 py-1 ${i === 0 ? "border-foreground bg-band text-band-foreground" : "border-border bg-surface"}`}>{t}</span>)}</div>
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full">
            <thead className="text-left text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Pedido</th><th className="py-2">Canal</th><th className="py-2 text-right">Total</th><th className="px-3 py-2">Situação</th></tr></thead>
            <tbody>{ROWS.map((r) => <tr key={r.n} className="border-t border-border"><td className="px-3 py-2"><b className="tabular-nums">{r.n}</b><span className="block text-[11px] text-muted-foreground">{r.who}</span></td><td className="py-2 text-body">{r.canal}</td><td className="py-2 text-right tabular-nums">{formatBRL(r.cents)}</td><td className="px-3 py-2"><span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${r.tone}`}>{r.st}</span></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Versão compacta, em cartões, para telas estreitas. */
export function OrdersCards() {
  return (
    <ul className="space-y-2 text-[13px]" aria-hidden>
      {ROWS.slice(0, 3).map((r) => (
        <li key={r.n} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-foreground">
          <span><b className="tabular-nums">{r.n}</b> · {r.who}<span className="block text-[11px] text-muted-foreground">{r.canal}</span></span>
          <span className="text-right"><span className="block font-bold tabular-nums">{formatBRL(r.cents)}</span><span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${r.tone}`}>{r.st}</span></span>
        </li>
      ))}
    </ul>
  );
}

export function PayScreen() {
  return (
    <div className="space-y-3 bg-surface p-4 pt-8 text-[13px] text-foreground" aria-hidden>
      <p className="font-extrabold">Pagamento</p>
      <div className="rounded-xl border-2 border-foreground p-3"><div className="flex items-center justify-between"><b>Pix</b><span className="font-bold tabular-nums">{formatBRL(18990)}</span></div><p className="text-[11px] text-muted-foreground">Confirmação automática</p>
        <div className="mx-auto mt-3 grid size-28 grid-cols-9 gap-px rounded-md bg-surface p-1.5 ring-1 ring-border">{Array.from({ length: 81 }).map((_, i) => <i key={i} className={`${[0, 1, 2, 9, 11, 18, 19, 20, 6, 7, 8, 15, 17, 24, 25, 26, 54, 55, 56, 63, 65, 72, 73, 74, 31, 40, 43, 49, 52, 58, 61, 68, 70, 77, 79].includes(i) ? "bg-band" : i % 7 === 3 ? "bg-band" : "bg-surface-muted"}`} />)}</div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border p-3"><b>Cartão</b><span className="text-muted-foreground">até 6x</span></div>
      <p className="rounded-lg bg-success-soft px-3 py-2 text-[12px] font-semibold text-success">Pagamento confirmado. Pedido #1042 liberado.</p>
    </div>
  );
}

export function SalesPanel() {
  const states = [["SP", 82], ["MG", 54], ["RJ", 47], ["PR", 31], ["BA", 22]] as const;
  const hours = [2, 3, 2, 4, 6, 8, 9, 7, 5, 6, 10, 8];
  return (
    <div className="bg-canvas p-4 text-[13px] text-foreground" aria-hidden>
      <p className="text-lg font-extrabold">Análise de vendas</p>
      <p className="text-[12px] text-muted-foreground">Últimos 30 dias</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-3"><b>Vendas por estado</b><ul className="mt-3 space-y-2">{states.map(([uf, v]) => <li key={uf} className="flex items-center gap-2"><span className="w-6 font-semibold">{uf}</span><span className="h-3 rounded-sm bg-band" style={{ width: `${v}%` }} /><span className="tabular-nums text-muted-foreground">{v}</span></li>)}</ul></div>
        <div className="rounded-lg border border-border bg-surface p-3"><b>Horários com mais compras</b><div className="mt-3 flex h-24 items-end gap-1">{hours.map((h, i) => <span key={i} className="flex-1 rounded-t-sm bg-primary" style={{ height: `${h * 10}%` }} />)}</div><div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>6h</span><span>12h</span><span>18h</span><span>0h</span></div></div>
      </div>
    </div>
  );
}
