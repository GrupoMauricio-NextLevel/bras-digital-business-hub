import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProdutoAgora } from "@/lib/domain/produtos-agora";

/** "Precisa de você agora" do catálogo (D211): produto a produto, com o botão que resolve. Mesmo desenho de Pedidos (D208). */
export function ProdutosAgora({ itens, base, filtrando }: { itens: ProdutoAgora[]; base: string; filtrando: boolean }) {
  return (
    <section aria-labelledby="prod-agora" className="ds-card mb-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div><h2 id="prod-agora" className="text-base font-semibold">Precisa de você agora</h2><p className="text-xs text-muted-foreground">Produtos com algo que atrapalha a venda, do mais grave ao menos grave.</p></div>
        {filtrando ? <Link href={base} className="text-xs font-semibold text-[var(--ds-link)]">Ver todos os produtos</Link> : null}
      </div>
      {itens.length ? (
        <ol className="mt-3 divide-y divide-border">
          {itens.slice(0, 6).map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${u.tom === "danger" ? "bg-danger" : u.tom === "warning" ? "bg-warning" : "bg-info"}`} />
              <Link href={`${base}/${u.id}`} className="min-w-0 flex-1 basis-56 hover:underline"><span className="block truncate text-sm font-semibold">{u.nome}</span><span className="block text-xs text-muted-foreground">{u.motivo}</span></Link>
              <Link href={`${base}/${u.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ds-link)]">{u.acao}<ArrowRight className="size-3.5" aria-hidden /></Link>
            </li>
          ))}
        </ol>
      ) : <p className="mt-3 text-sm text-muted-foreground">Nenhum produto travando venda. Catálogo em dia.</p>}
      {itens.length > 6 && !filtrando ? <Link href={`${base}?ver=atencao`} className="mt-2 inline-block text-sm font-semibold text-[var(--ds-link)]">Ver os {itens.length} produtos</Link> : null}
    </section>
  );
}
