"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarVendaJuntoAction } from "@/app/actions/orders";

/** "Compre junto" e dias de produção (D186): até 4 produtos para mostrar junto deste na loja. */
export function VendaJuntoForm({ productId, opcoes, escolhidos, dias }: { productId: string; opcoes: { id: string; name: string }[]; escolhidos: string[]; dias: number }) {
  const [sel, setSel] = React.useState<string[]>(escolhidos);
  const [prod, setProd] = React.useState(String(dias));
  const [pending, start] = React.useTransition();
  const cheio = sel.length >= 4;
  return (
    <section aria-labelledby="venda-junto-t" className="ds-card mt-6">
      <h2 id="venda-junto-t" className="text-base font-semibold">Compre junto e prazo de produção</h2>
      <p className="mt-1 text-sm text-muted-foreground">Escolha até 4 produtos para aparecer junto deste na página do produto. Sem escolha, a loja mostra os da mesma categoria.</p>
      {opcoes.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Cadastre outros produtos para escolher.</p> : (
        <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Produtos para mostrar junto</legend>
          {opcoes.map((o) => {
            const on = sel.includes(o.id);
            return <label key={o.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} disabled={!on && cheio} onChange={(e) => setSel(e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id))} />{o.name}</label>;
          })}
        </fieldset>
      )}
      <label className="mt-4 block max-w-xs text-sm font-medium">Dias de produção (0 = pronta entrega)<Input className="mt-1" type="number" min={0} max={60} inputMode="numeric" value={prod} onChange={(e) => setProd(e.target.value)} /></label>
      <p className="mt-1 text-xs text-muted-foreground">Somados ao prazo do frete na previsão de entrega que o cliente vê.</p>
      <Button className="mt-4" loading={pending} onClick={() => start(async () => { const r = await salvarVendaJuntoAction(productId, { relatedIds: sel, productionDays: Number(prod) || 0 }); if (r.ok) toast.success("Salvo"); else toast.error(r.error); })}>Salvar</Button>
    </section>
  );
}
