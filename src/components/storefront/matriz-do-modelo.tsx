"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { PublicProduct } from "@/lib/queries/storefront";
import { linhaDoMotor, useCart } from "@/components/storefront/cart-context";
import { precoDoCarrinho } from "@/lib/finance/atacado-preco";
import { conferirModelo, rotuloDaVariacao, temRegraDoModelo } from "@/lib/finance/atacado-modelo";
import { SfButton } from "@/components/storefront/sf-button";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Grade livre (AT3, D268): o comprador monta a própria grade numa matriz cor × tamanho. O contador soma o que já está no
 * carrinho e mostra quanto falta para o mínimo do modelo ou para fechar o múltiplo. O preço vem do mesmo motor do pedido.
 */
export function MatrizDoModelo({ product, slug, atacadoCents, comprarAgora }: { product: PublicProduct; slug: string; atacadoCents: number | null; comprarAgora?: boolean }) {
  const cart = useCart();
  const router = useRouter();
  const [qtd, setQtd] = React.useState<Record<string, number>>({});
  const [added, setAdded] = React.useState(false);
  const regra = { minimo: product.minimoModelo, multiplo: product.multiploModelo };
  const cores = [...new Set(product.variants.map((v) => v.color ?? ""))];
  const total = Object.values(qtd).reduce((t, q) => t + q, 0);
  const noCarrinho = cart.linhasBase.filter((l) => l.productId === product.id && !l.packId).reduce((t, l) => t + l.quantity, 0);
  const conf = temRegraDoModelo(regra) ? conferirModelo(regra, noCarrinho + total) : null;
  const escolhidas = product.variants.filter((v) => (qtd[v.id] ?? 0) > 0);

  const simulado = React.useMemo(() => {
    const candidatas = escolhidas.map((v) => ({ key: `__m_${v.id}`, productId: product.id, categoryId: product.categoryId, quantity: qtd[v.id]!, varejoCents: product.priceCents, atacadoCents, faixas: product.tiers }));
    const r = precoDoCarrinho([...cart.linhasBase.map(linhaDoMotor), ...candidatas], cart.regras);
    const minhas = r.linhas.slice(r.linhas.length - candidatas.length);
    return { totalCents: minhas.reduce((t, l) => t + l.totalCents, 0), economiaCents: minhas.reduce((t, l) => t + l.economiaCents, 0), porPeca: minhas[0]?.unitCents ?? product.priceCents };
  }, [escolhidas, qtd, cart.linhasBase, cart.regras, product, atacadoCents]);

  const mudar = (id: string, n: number, max: number) => setQtd((q) => ({ ...q, [id]: Math.max(0, Math.min(max, n)) }));
  const pode = total > 0 && (!conf || conf.ok);
  const adicionar = (direto = false) => {
    if (!pode) return;
    cart.addMany(escolhidas.map((v) => ({ productId: product.id, variantId: v.id, name: product.name, label: rotuloDaVariacao(v), unitPriceCents: product.priceCents, quantity: qtd[v.id]!, images: product.images, max: v.available, tiers: product.tiers, atacadoCents: product.atacadoCents, categoryId: product.categoryId })));
    if (direto) return router.push(`/store/${slug}/checkout`);
    setQtd({});
    setAdded(true);
    toast.success(`${total} peça${total === 1 ? "" : "s"} no carrinho`, { action: { label: "Ver carrinho", onClick: () => router.push(`/store/${slug}/cart`) } });
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mt-6" data-matriz>
      <div className="grid gap-3">
        {cores.map((cor) => (
          <fieldset key={cor || "unica"} className="rounded-xl border border-neutral-200 p-3">
            <legend className="px-1 text-sm font-medium">{cor || "Tamanhos"}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {product.variants.filter((v) => (v.color ?? "") === cor).map((v) => {
                const n = qtd[v.id] ?? 0;
                const nome = `${cor ? `${cor}, ` : ""}tamanho ${v.size}`;
                const esgotado = v.available === 0;
                return (
                  <div key={v.id} className={cn("flex items-center justify-between gap-1 rounded-lg border px-2 py-1.5", n > 0 ? "border-neutral-900" : "border-neutral-200", esgotado && "opacity-50")}>
                    <span className={cn("min-w-8 text-sm font-semibold", esgotado && "line-through")}>{v.size}</span>
                    {esgotado ? <span className="text-xs text-neutral-500">esgotado</span> : (
                      <span className="flex items-center">
                        <button type="button" className="grid size-9 place-items-center rounded-md disabled:opacity-30" onClick={() => mudar(v.id, n - 1, v.available)} disabled={n === 0} aria-label={`Menos ${nome}`}><Minus className="size-4" /></button>
                        <input type="number" inputMode="numeric" min={0} max={v.available} value={n || ""} placeholder="0" onChange={(e) => mudar(v.id, Number(e.target.value) || 0, v.available)} aria-label={`Peças de ${nome}`} className="h-9 w-10 rounded-md border border-neutral-200 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                        <button type="button" className="grid size-9 place-items-center rounded-md disabled:opacity-30" onClick={() => mudar(v.id, n + 1, v.available)} disabled={n >= v.available} aria-label={`Mais ${nome}`}><Plus className="size-4" /></button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm" aria-live="polite" data-total-matriz>
        <p><b className="tabular-nums">{total}</b> peça{total === 1 ? "" : "s"} escolhida{total === 1 ? "" : "s"}{noCarrinho ? <> · {noCarrinho} já no carrinho</> : null}{total ? <> · <b className="tabular-nums">{formatBRL(simulado.totalCents)}</b> ({formatBRL(simulado.porPeca)} a peça){simulado.economiaCents > 0 ? <> · economia de <b className="tabular-nums">{formatBRL(simulado.economiaCents)}</b></> : null}</> : null}</p>
        {conf ? <p className={cn("mt-1 font-medium", conf.ok ? "text-emerald-700" : "text-neutral-700")}>{conf.ok ? (total + noCarrinho > 0 ? "Grade fechada: pode adicionar." : null) : conf.mensagem}</p> : null}
        {conf && total + noCarrinho > 0 && conf.ok === false && regra.minimo > 1 ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-label="Peças até o mínimo do modelo" aria-valuemin={0} aria-valuemax={regra.minimo} aria-valuenow={Math.min(regra.minimo, total + noCarrinho)}><div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(((total + noCarrinho) / regra.minimo) * 100))}%`, background: "var(--sf-accent)" }} /></div>
        ) : null}
      </div>
      <SfButton className="mt-3 h-11 w-full" onClick={() => adicionar()} disabled={!pode}>{added ? <><Check className="size-4" /> Adicionado</> : <><ShoppingBag className="size-4" /> {total ? `Adicionar ${total} peça${total === 1 ? "" : "s"}` : "Escolha as quantidades"}</>}</SfButton>
      {comprarAgora ? <SfButton variant="outline" className="mt-3 h-11 w-full" onClick={() => adicionar(true)} disabled={!pode}>Comprar agora</SfButton> : null}
    </div>
  );
}

/** Carrinho e checkout: modelos que ainda não fecham o mínimo ou o múltiplo (o pedido só sai quando fecham). */
export function AvisoGradeLivre({ className }: { className?: string }) {
  const cart = useCart();
  if (!cart.pendencias.length) return null;
  const nome = (id: string) => cart.lines.find((l) => l.productId === id)?.name ?? "Produto";
  return (
    <div role="alert" className={cn("rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950", className)} data-aviso-grade-livre>
      <p className="font-semibold">Complete a grade para fechar o pedido</p>
      <ul className="mt-1 list-disc pl-5">{cart.pendencias.map((p) => <li key={p.productId}><b>{nome(p.productId)}</b>: {p.mensagem}.</li>)}</ul>
    </div>
  );
}
