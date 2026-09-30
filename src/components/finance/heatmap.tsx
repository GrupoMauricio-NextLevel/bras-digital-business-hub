const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Mapa de calor de pedidos por dia da semana e hora. A cor e o número (na leitura por tecnologia assistiva) mostram a mesma informação. */
export function Heatmap({ grid, max, peak }: { grid: number[][]; max: number; peak: { weekday: number; hour: number; orders: number } | null }) {
  if (max === 0) return <p className="text-sm text-muted-foreground">Sem pedidos no período.</p>;
  return (
    <div>
      {peak ? <p className="mb-3 text-sm">Pico: <b>{WEEKDAYS[peak.weekday]}, {String(peak.hour).padStart(2, "0")}h</b> ({peak.orders} pedido(s)). Horário de Brasília.</p> : null}
      <div className="nl-scroll relative overflow-x-auto" tabIndex={0} role="region" aria-label="Mapa de calor de pedidos por dia e hora">
        <table className="text-[11px]" aria-label="Pedidos por dia da semana e hora">
          <thead><tr><th className="pr-2 text-left font-normal text-muted-foreground"><span className="sr-only">Dia</span></th>{Array.from({ length: 24 }, (_, h) => <th key={h} scope="col" className="w-6 font-normal text-muted-foreground">{h % 3 === 0 ? h : <span className="sr-only">{h}</span>}</th>)}</tr></thead>
          <tbody>{grid.map((row, d) => (
            <tr key={d}><th scope="row" className="pr-2 text-left font-normal text-muted-foreground">{WEEKDAYS[d]}</th>{row.map((n, h) => (
              <td key={h} className="p-0.5"><span title={`${WEEKDAYS[d]} ${h}h: ${n} pedido(s)`} className="block size-5 rounded-sm bg-accent" style={{ opacity: n === 0 ? 0.08 : 0.25 + 0.75 * (n / max) }}><span className="sr-only">{n}</span></span></td>
            ))}</tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
