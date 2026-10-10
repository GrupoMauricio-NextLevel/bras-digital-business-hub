import type { ImporterRequest } from "@/lib/domain/bras/importadora";
import { BRAS_REQUEST_LABEL } from "@/lib/domain/bras/catalogo";
import { PedidoAcoes } from "./pedido-acoes";

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Pedido na visão da importadora: o que retirar e para onde enviar (D92). Nada do comprador além do envio. */
export function PedidoCard({ r, can, showAddress = true }: { r: ImporterRequest; can: { disponibilidade: boolean; balcao: boolean }; showAddress?: boolean }) {
  return (
    <li className="ds-card p-4">
      <p className="flex flex-wrap items-center justify-between gap-2 font-semibold"><span className="tabular-nums">Pedido {r.number}</span><span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs">{BRAS_REQUEST_LABEL[r.status]}{r.separatedAt && r.status !== "PICKED_UP" ? " · separado" : ""}</span></p>
      <p className="mt-1 text-lg font-bold">{r.boxes} caixa(s) · {r.productTitle}</p>
      <p className="text-sm text-muted-foreground">{r.unitsPerBox} unidades por caixa · recebido em {quando(r.createdAt)}</p>
      <p className="mt-2 text-sm">Transportadora: <b>{r.carrier}</b> · destino <b>{r.shipCity}/{r.shipState}</b></p>
      {showAddress ? <p className="text-sm text-muted-foreground">Enviar para {r.shipName}, {r.shipAddress}, {r.shipCity}/{r.shipState}, CEP {r.shipZip.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</p> : null}
      {r.availabilityConfirmedAt && (r.status === "NEW" || r.status === "CONFIRMED") ? <p className="mt-1 text-sm text-success">Caixas conferidas</p> : null}
      {r.pickedUpAt ? <p className="mt-1 text-sm text-success">Entregue em {quando(r.pickedUpAt)}</p> : null}
      <PedidoAcoes id={r.id} status={r.status} available={!!r.availabilityConfirmedAt} separated={!!r.separatedAt} can={can} />
    </li>
  );
}
