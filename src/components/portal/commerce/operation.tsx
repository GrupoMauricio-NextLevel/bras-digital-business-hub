import { formatBRL } from "@/lib/money";

/** Trechos de tela do painel com dados de demonstração. Ilustram tarefas que o painel já faz. */
const frame = "overflow-hidden rounded-lg border border-[#14213d]/15 bg-white text-[13px] text-neutral-900";
const cap = "border-t border-neutral-200 bg-[#f5f1e8] px-3 py-1.5 text-[11px] font-medium text-neutral-700";

export function OrdersSnippet() {
  const rows = [
    { n: "#1042", who: "Marina S.", total: 18990, st: "Pago", tone: "bg-emerald-100 text-emerald-900" },
    { n: "#1041", who: "Carlos A.", total: 7990, st: "Aguardando pagamento", tone: "bg-amber-100 text-amber-900" },
    { n: "#1040", who: "Joana P.", total: 28990, st: "Enviado", tone: "bg-sky-100 text-sky-900" },
    { n: "#1039", who: "Rafael M.", total: 12990, st: "Pago", tone: "bg-emerald-100 text-emerald-900" },
  ];
  return (
    <figure className={frame}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5"><b>Pedidos</b><span className="text-neutral-600">Hoje</span></div>
      <table className="w-full">
        <caption className="sr-only">Pedidos recentes (demonstração)</caption>
        <thead className="text-left text-[11px] uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-2 font-semibold">Pedido</th><th className="px-2 py-2 font-semibold">Cliente</th><th className="px-2 py-2 text-right font-semibold">Total</th><th className="px-4 py-2 font-semibold">Situação</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.n} className="border-t border-neutral-100"><td className="px-4 py-2.5 font-semibold tabular-nums">{r.n}</td><td className="px-2 py-2.5">{r.who}</td><td className="px-2 py-2.5 text-right tabular-nums">{formatBRL(r.total)}</td><td className="px-4 py-2.5"><span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${r.tone}`}>{r.st}</span></td></tr>)}</tbody>
      </table>
      <figcaption className={cap}>Dados de demonstração</figcaption>
    </figure>
  );
}

export function SalesSnippet() {
  const states = [["SP", 82], ["MG", 54], ["RJ", 47], ["PR", 31], ["BA", 22]] as const;
  const hours = [2, 3, 2, 4, 6, 8, 9, 7, 5, 6, 10, 8];
  return (
    <figure className={frame}>
      <div className="grid gap-5 p-4 sm:grid-cols-2">
        <div>
          <b>Vendas por estado</b>
          <ul className="mt-3 space-y-2">{states.map(([uf, v]) => <li key={uf} className="flex items-center gap-2"><span className="w-6 font-semibold">{uf}</span><span className="h-3 rounded-sm bg-[#14213d]" style={{ width: `${v}%` }} aria-hidden /><span className="tabular-nums text-neutral-700">{v}</span></li>)}</ul>
        </div>
        <div>
          <b>Horários com mais compras</b>
          <div className="mt-3 flex h-24 items-end gap-1" role="img" aria-label="Gráfico de barras: compras ao longo do dia; maior concentração no fim da tarde e à noite">{hours.map((h, i) => <span key={i} className="flex-1 rounded-t-sm bg-[#f2b600]" style={{ height: `${h * 10}%` }} />)}</div>
          <div className="mt-1 flex justify-between text-[11px] text-neutral-600" aria-hidden><span>6h</span><span>12h</span><span>18h</span><span>0h</span></div>
        </div>
      </div>
      <figcaption className={cap}>Dados de demonstração</figcaption>
    </figure>
  );
}

export function PaymentSnippet() {
  return (
    <figure className={frame}>
      <div className="space-y-3 p-4">
        <b>Como você quer pagar?</b>
        <div className="flex items-center justify-between rounded-md border-2 border-[#14213d] p-3"><span><b>Pix</b><span className="block text-neutral-600">Confirmação automática</span></span><span className="font-bold tabular-nums">{formatBRL(18990)}</span></div>
        <div className="flex items-center justify-between rounded-md border border-neutral-300 p-3"><span><b>Cartão de crédito</b><span className="block text-neutral-600">Em até 6x</span></span><span className="tabular-nums text-neutral-700">6x {formatBRL(3165)}</span></div>
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-[12px] font-semibold text-emerald-900">Pagamento confirmado: o pedido #1042 foi liberado para envio.</p>
      </div>
      <figcaption className={cap}>Dados de demonstração</figcaption>
    </figure>
  );
}
