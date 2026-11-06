"use client";
import { useCartOptional } from "./cart-context";
import { aPartirDe } from "@/lib/finance/atacado-vitrine";
import { formatBRL } from "@/lib/money";
import type { PublicProduct } from "@/lib/queries/storefront";

/** Card da vitrine (AT2, D259): selo do formato e "a partir de R$ X a peça no atacado", com as regras da loja. */
function useAtacado(product: PublicProduct) {
  const ctx = useCartOptional();
  return ctx?.atacadoLigado ? aPartirDe(product, ctx.regras) : null;
}

export function SeloDoCard({ product }: { product: PublicProduct }) {
  const a = useAtacado(product);
  // Sem atacado (ou loja de rede), o selo antigo continua igual.
  const selo = a?.selo ?? (product.sellsPack ? "Grade 12" : null);
  return selo ? <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-900 shadow-sm" data-selo-atacado>{selo}</span> : null;
}

export function PrecoDoCard({ product }: { product: PublicProduct }) {
  const a = useAtacado(product);
  return (
    <>
      <div className="text-sm font-semibold">{formatBRL(product.priceCents)}</div>
      {a ? <div className="text-xs text-neutral-600" data-a-partir-de>a partir de <b className="tabular-nums text-neutral-900">{formatBRL(a.porPecaCents)}</b> a peça no atacado</div> : null}
    </>
  );
}
