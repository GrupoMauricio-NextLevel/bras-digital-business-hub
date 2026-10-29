import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ItemAgora } from "@/lib/domain/loja-agora";

/**
 * Bloco único "Precisa de você agora" (D212): o mesmo desenho em todas as telas do lojista. Cada linha: bolinha da
 * urgência, o que é, por quê e o botão que resolve. Itens sem `href` são só aviso (a solução está na própria tela).
 */
export function PrecisaDeVoce({ itens, vazio, descricao = "Do mais urgente ao menos urgente.", limite = 6, verTodos, extra, acoes }: {
  itens: (ItemAgora & { extra?: React.ReactNode })[]; vazio: string; descricao?: string; limite?: number; verTodos?: string; extra?: React.ReactNode; acoes?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="precisa-t" className="ds-card mb-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div><h2 id="precisa-t" className="text-base font-semibold">Precisa de você agora</h2><p className="text-xs text-muted-foreground">{descricao}</p></div>
        {acoes}
      </div>
      {itens.length ? (
        <ol className="mt-3 divide-y divide-border">
          {itens.slice(0, limite).map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${u.tom === "danger" ? "bg-danger" : u.tom === "warning" ? "bg-warning" : "bg-info"}`} />
              {u.href ? <Link href={u.href} className="min-w-0 flex-1 basis-56 hover:underline"><span className="block text-sm font-semibold">{u.titulo}</span><span className="block text-xs text-muted-foreground">{u.detalhe}</span></Link>
                : <span className="min-w-0 flex-1 basis-56"><span className="block text-sm font-semibold">{u.titulo}</span><span className="block text-xs text-muted-foreground">{u.detalhe}</span></span>}
              {u.extra}
              {u.href && u.acao ? <Link href={u.href} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ds-link)]">{u.acao}<ArrowRight className="size-3.5" aria-hidden /></Link> : null}
            </li>
          ))}
        </ol>
      ) : <p className="mt-3 text-sm text-muted-foreground">{vazio}</p>}
      {itens.length > limite && verTodos ? <Link href={verTodos} className="mt-2 inline-block text-sm font-semibold text-[var(--ds-link)]">Ver os {itens.length}</Link> : null}
      {extra}
    </section>
  );
}
