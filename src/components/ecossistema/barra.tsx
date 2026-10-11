"use client";
import * as React from "react";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { Drawer } from "@/components/ui/dialog";
import type { EcoBar, EcoItem } from "@/lib/domain/ecossistema/lancador";

/**
 * Barra do ecossistema (D129): o fio do grupo (uma faixa fina com a cor de cada marca, a sua mais larga) e o lançador
 * (gaveta com a sua marca, as recomendadas e todas). Só desenha o que o domínio entrega.
 */
function Item({ it }: { it: EcoItem }) {
  const body = (
    <>
      <span className="mt-1 h-8 w-1 shrink-0 rounded-full" style={{ background: it.color }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 font-semibold">{it.name}{it.current ? <span className="text-xs font-normal text-muted-foreground"> · você está aqui</span> : <ArrowUpRight className="size-3.5" aria-hidden />}</span>
        <span className="block text-sm text-muted-foreground">{it.reason ?? it.pitch}</span>
        {it.benefit ? <span className="mt-1 inline-block rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">{it.benefit}</span> : null}
      </span>
    </>
  );
  return it.current
    ? <div className="flex gap-3 rounded-lg p-2">{body}</div>
    : <a href={it.href} className="flex gap-3 rounded-lg p-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]">{body}</a>;
}

export function BarraEcossistema({ bar }: { bar: EcoBar }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mb-4 flex items-center gap-3" data-ecossistema>
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden>
        {bar.segments.map((s) => <span key={s.brand} className="h-full transition-[flex] duration-300 motion-reduce:transition-none" style={{ background: s.color, flex: s.current ? 4 : 1 }} />)}
      </div>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]" aria-haspopup="dialog">
        <LayoutGrid className="size-3.5" aria-hidden />Marcas do grupo
      </button>
      <Drawer open={open} onOpenChange={setOpen} title="Marcas do Grupo NextLevel" description="Tudo do mesmo grupo, com a mesma conta de pontos do Club.">
        <div className="space-y-5">
          <section aria-labelledby="eco-mine"><h3 id="eco-mine" className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sua marca</h3>{bar.mine.map((i) => <Item key={i.brand} it={i} />)}</section>
          {bar.recommended.length ? <section aria-labelledby="eco-rec"><h3 id="eco-rec" className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recomendadas para você</h3>{bar.recommended.map((i) => <Item key={i.brand} it={i} />)}</section> : null}
          <section aria-labelledby="eco-all"><h3 id="eco-all" className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Todas as marcas</h3>{bar.all.map((i) => <Item key={i.brand} it={i} />)}</section>
        </div>
      </Drawer>
    </div>
  );
}
