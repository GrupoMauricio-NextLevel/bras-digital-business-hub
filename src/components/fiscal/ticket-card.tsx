import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatNfeKey } from "@/lib/fiscal/nfe";

export type TicketView = { id: string; number: number; status: string; storeName: string; storePhone: string | null; description: string; approxValueCents: number | null; priceCents: number; deadlineAt: string | null; minutesLeft: number | null; invoiceKey: string | null; resolutionNote: string | null; createdAt: string; messages: { id: string; author: string; body: string; at: string }[]; requester?: string; requesterEmail?: string };
const STATUS: Record<string, { label: string; tone: "warning" | "info" | "success" | "neutral" | "danger" }> = { ABERTO: { label: "Aberto", tone: "warning" }, EM_ATENDIMENTO: { label: "Em atendimento", tone: "info" }, RESOLVIDO: { label: "Resolvido", tone: "success" }, SEM_SOLUCAO: { label: "Sem solução", tone: "danger" }, CANCELADO: { label: "Cancelado", tone: "neutral" } };
const left = (m: number) => (m <= 0 ? "prazo vencido" : m < 60 ? `faltam ${m} min` : `faltam ${Math.floor(m / 60)} h ${m % 60} min`);
const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Cartão do chamado do Meu Contador (D117), para o cliente e para a fila do contador. */
export function TicketCard({ t, children }: { t: TicketView; children?: React.ReactNode }) {
  const open = t.status === "ABERTO" || t.status === "EM_ATENDIMENTO";
  return (
    <li className="ds-card p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="text-base font-bold">Chamado {t.number} · {t.storeName}</p>{t.requester ? <p className="text-muted-foreground">{t.requester} · {t.requesterEmail}</p> : null}</div>
        <Badge tone={STATUS[t.status]?.tone ?? "neutral"}>{STATUS[t.status]?.label ?? t.status}</Badge>
      </div>
      <p className="mt-1">{t.description}</p>
      <p className="text-muted-foreground">{t.approxValueCents ? `Valor aproximado ${formatBRL(t.approxValueCents)} · ` : ""}{t.storePhone ? `Loja ${t.storePhone} · ` : ""}aberto {when(t.createdAt)}</p>
      {open && t.minutesLeft !== null ? <p className={`mt-1 font-semibold ${t.minutesLeft < 60 ? "text-danger" : "text-warning"}`}>{left(t.minutesLeft)}{t.deadlineAt ? ` (até ${when(t.deadlineAt)})` : ""}</p> : null}
      {t.invoiceKey ? <p className="mt-1 text-success">Nota: <span className="font-mono">{formatNfeKey(t.invoiceKey)}</span></p> : null}
      {t.resolutionNote ? <p className="mt-1 text-muted-foreground">Equipe: {t.resolutionNote}</p> : null}
      {t.messages.length ? <ol className="mt-2 space-y-1 rounded-lg bg-surface-muted p-2">{t.messages.map((m) => <li key={m.id}><b>{m.author === "CONTADOR" ? "Contador" : "Cliente"}:</b> {m.body} <span className="text-xs text-muted-foreground">{when(m.at)}</span></li>)}</ol> : null}
      {t.priceCents ? <p className="mt-1 text-xs text-muted-foreground">Serviço: {formatBRL(t.priceCents)}</p> : null}
      {children}
    </li>
  );
}
