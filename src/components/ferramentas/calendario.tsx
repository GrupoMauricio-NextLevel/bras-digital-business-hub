import { calendarioComercial } from "@/lib/ferramentas/calculadoras";
import { formatDate } from "@/lib/utils";

/** Calendário do varejo (D188): as próximas datas e quando começar a preparar a loja. */
export function CalendarioComercial({ className = "", agora = new Date() }: { className?: string; agora?: Date }) {
  const hoje = agora.toISOString().slice(0, 10);
  const datas = [...calendarioComercial(agora.getUTCFullYear()), ...calendarioComercial(agora.getUTCFullYear() + 1)].filter((d) => d.data >= hoje).slice(0, 6);
  return (
    <section aria-labelledby="calendario-t" className={`ds-card ${className}`}>
      <h2 id="calendario-t" className="text-lg font-semibold">Calendário do varejo</h2>
      <p className="mt-1 text-sm text-muted-foreground">As próximas datas que mais vendem e quando começar a preparar produtos, fotos e campanha.</p>
      <ul className="mt-3 divide-y divide-border rounded-lg border border-border text-sm">
        {datas.map((d) => {
          const preparar = new Date(new Date(`${d.data}T12:00:00Z`).getTime() - d.prepararDias * 86_400_000).toISOString();
          const jaEhHora = preparar.slice(0, 10) <= hoje;
          return <li key={`${d.nome}-${d.data}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"><span><span className="font-medium">{d.nome}</span> · {formatDate(`${d.data}T12:00:00Z`)}</span><span className={jaEhHora ? "font-semibold text-warning" : "text-muted-foreground"}>{jaEhHora ? "Hora de preparar" : `Preparar a partir de ${formatDate(preparar)}`}</span></li>;
        })}
      </ul>
    </section>
  );
}
