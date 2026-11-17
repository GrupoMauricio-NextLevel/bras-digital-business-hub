import Link from "next/link";
import { formatBRL } from "@/lib/money";
import type { pulsoDaLoja } from "@/lib/domain/fila-do-dia";

const TOM = { success: "bg-success", warning: "bg-warning", danger: "bg-danger" } as const;

/** Pulso da loja (D169): três sinais em pílulas no topo do painel. Cada um leva à tela que resolve. */
/** `semVendas` (D328): quando a abertura já mostra as vendas de hoje em destaque, a pílula de vendas não se repete. */
export function PulsoLoja({ pulso, className, semVendas = false }: { pulso: ReturnType<typeof pulsoDaLoja>; className?: string; semVendas?: boolean }) {
  const pill = "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  return (
    <ul aria-label="Pulso da loja" className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {semVendas ? null : <li><Link href="/merchant/analytics" className={pill}><span className="tabular-nums font-semibold">{formatBRL(pulso.hoje.salesCents)}</span><span className="text-muted-foreground">· {pulso.hoje.rotulo}</span></Link></li>}
      <li><Link href="/merchant/after-sales" className={pill}><span aria-hidden className={`size-1.5 rounded-full ${pulso.parados.count ? TOM.warning : TOM.success}`} />{pulso.parados.rotulo}</Link></li>
      <li><Link href="/merchant/storefront" className={pill}><span aria-hidden className={`size-1.5 rounded-full ${TOM[pulso.situacao.tom]}`} />{pulso.situacao.rotulo}</Link></li>
    </ul>
  );
}
