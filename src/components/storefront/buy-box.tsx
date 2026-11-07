"use client";
import { StockAlertForm } from "./stock-alert-form";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, Check, Truck } from "lucide-react";
import type { PublicProduct } from "@/lib/queries/storefront";
import { linhaDoMotor, useCart } from "@/components/storefront/cart-context";
import { precoDoCarrinho } from "@/lib/finance/atacado-preco";
import { corDoPacote, degrauDoModo, escadaDePreco, gatilhosDoProduto, nomeDoPacote, atacadoAtivo } from "@/lib/finance/atacado-vitrine";
import { BarraDoMix, mixRelevante } from "./barra-do-mix";
import { SfButton } from "@/components/storefront/sf-button";
import { formatBRL } from "@/lib/money";
import { variantLabel } from "@/lib/variant-label";
import { cn } from "@/lib/utils";
import { CalcularFrete } from "./calcular-frete";
import { MatrizDoModelo } from "./matriz-do-modelo";
import { temRegraDoModelo, textoDaRegra, rotuloDaVariacao } from "@/lib/finance/atacado-modelo";

/** `parcelas`: só quando a loja aceita cartão (E-commerce, D178); o valor por parcela é indicativo, sem prometer "sem juros". */
export function BuyBox({ product, slug, shippingNote, stickyBar = false, parcelas, freeFromCents, extras = false }: { product: PublicProduct; slug: string; shippingNote?: string; stickyBar?: boolean; parcelas?: number; freeFromCents?: number | null; /** E-commerce (D213): "Comprar agora" e calcular frete. */ extras?: boolean }) {
  const cart = useCart();
  const router = useRouter();
  // Formato escolhido (AT2, D259): "unit" = peça avulsa; senão, o id da grade ou do pacote.
  // Loja de rede (SuperDrop, D216): o box segue como antes (uma grade, sem escada nem mix).
  const legado = !cart.atacadoLigado;
  const packs = product.sellsPack ? (legado ? product.packs.slice(0, 1) : product.packs) : [];
  const [mode, setMode] = React.useState<string>(product.sellsUnit ? "unit" : (packs.find((p) => p.available > 0) ?? packs[0])?.id ?? "sem-formato");
  const [variantId, setVariantId] = React.useState<string>(product.variants.find((v) => v.available > 0)?.id ?? "");
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const ctaRef = React.useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = React.useState(true);
  React.useEffect(() => {
    if (!stickyBar || !ctaRef.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(!!e?.isIntersecting), { threshold: 0.2 });
    io.observe(ctaRef.current); return () => io.disconnect();
  }, [stickyBar]);
  const pack = mode === "unit" ? undefined : packs.find((p) => p.id === mode);
  const variant = product.variants.find((v) => v.id === variantId);
  const max = mode === "unit" ? variant?.available ?? 0 : pack?.available ?? 0;
  const price = mode === "unit" ? product.priceCents : pack?.priceCents ?? 0;
  const pecasDoLote = pack ? Math.max(1, pack.totalQuantity) : 1;
  const corDaGrade = pack ? corDoPacote(pack) : null;

  // Preço real desta escolha: o carrinho atual + o que está no box, pelo motor que o pedido usa.
  const atacadoCents = mode === "unit" && atacadoAtivo(product, cart.regras) ? product.atacadoCents : null;
  const simulado = React.useMemo(() => {
    const candidata = { key: "__box__", productId: product.id, categoryId: product.categoryId, packId: pack?.id, pecasPorUnidade: pecasDoLote, quantity: qty, varejoCents: price, atacadoCents, faixas: mode === "unit" ? product.tiers : undefined };
    const r = precoDoCarrinho([...cart.linhasBase.map(linhaDoMotor), candidata], cart.regras);
    return { linha: r.linhas[r.linhas.length - 1]!, mix: r.mix };
  }, [cart.linhasBase, cart.regras, product, pack?.id, pecasDoLote, qty, price, atacadoCents, mode]);
  const unitAgora = simulado.linha.unitCents;
  const porPeca = mode === "unit" ? unitAgora : Math.round(price / pecasDoLote);
  const escada = legado ? [] : escadaDePreco(product, cart.regras, formatBRL);
  const degrauAtual = degrauDoModo(simulado.linha.modo, unitAgora, product, pack?.id);
  const mixDoProduto = mixRelevante(simulado.mix, [product.categoryId]).filter((m) => gatilhosDoProduto(product, cart.regras).includes(m.regra));
  const mostraMix = !legado && (atacadoAtivo(product, cart.regras) || packs.length > 0) && mixDoProduto.length > 0;
  const noCarrinho = cart.precificado.pecas;
  // Grade livre (AT3, D268): produto com cores ou com mínimo/múltiplo usa a matriz cor × tamanho na peça avulsa.
  const regraModelo = { minimo: product.minimoModelo ?? 0, multiplo: product.multiploModelo ?? 1 };
  const matriz = !legado && mode === "unit" && (product.variants.some((v) => v.color) || temRegraDoModelo(regraModelo));

  const add = (direto = false) => {
    if (max === 0) return toast.error("Sem estoque disponível.");
    if (mode === "unit" && !variant) return toast.error("Escolha um tamanho.");
    cart.add(mode === "unit"
      ? { productId: product.id, variantId: variant!.id, name: product.name, label: rotuloDaVariacao(variant!), unitPriceCents: price, quantity: qty, images: product.images, max, tiers: product.tiers, atacadoCents: product.atacadoCents, categoryId: product.categoryId }
      : { productId: product.id, packId: pack!.id, name: product.name, label: `${nomeDoPacote(pack!)}${corDaGrade ? ` · ${corDaGrade}` : ""} (${pack!.items.map((i) => `${i.size}:${i.quantity}`).join(" ")})`, unitPriceCents: price, quantity: qty, images: product.images, max, categoryId: product.categoryId, pecasPorUnidade: pecasDoLote });
    // Comprar agora (D213): coloca no carrinho e vai direto para o fechamento.
    if (direto) return router.push(`/store/${slug}/checkout`);
    setAdded(true);
    toast.success("Adicionado ao carrinho", { action: { label: "Ver carrinho", onClick: () => router.push(`/store/${slug}/cart`) } });
    setTimeout(() => setAdded(false), 1500);
  };

  const abas = [...(product.sellsUnit ? [{ id: "unit", rotulo: legado ? "Unidade" : "Peça avulsa", porPeca: product.priceCents }] : []), ...packs.map((pk) => ({ id: pk.id, rotulo: legado ? `Grade de ${pk.totalQuantity}` : nomeDoPacote(pk), porPeca: Math.round(pk.priceCents / Math.max(1, pk.totalQuantity)) }))];
  return (
    <div className="flex flex-col">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{product.categoryName}</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
      {legado ? (
        <div className="mt-3 flex items-baseline gap-3"><span className="text-2xl font-semibold">{formatBRL(price)}</span>{mode === "unit" ? (parcelas ? <span className="text-sm text-neutral-500">ou em até {parcelas}x no cartão</span> : null) : <span className="text-sm text-neutral-500">{pack ? `${formatBRL(Math.round(price / pack.totalQuantity))} por peça` : null}</span>}</div>
      ) : <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1" data-preco-box>
        <span className="text-2xl font-semibold tabular-nums">{formatBRL(porPeca)}</span>
        <span className="text-sm text-neutral-500">{mode === "unit" ? "a peça" : `a peça · ${formatBRL(price)} o lote de ${pecasDoLote}`}</span>
        {mode === "unit" && unitAgora < product.priceCents ? <s className="text-sm text-neutral-400 tabular-nums" aria-label={`Varejo ${formatBRL(product.priceCents)}`}>{formatBRL(product.priceCents)}</s> : null}
        {mode === "unit" && parcelas ? <span className="text-sm text-neutral-500">ou em até {parcelas}x no cartão</span> : null}
      </div>}
      {legado && mode === "unit" && product.tiers.length ? <ul className="mt-2 text-sm text-neutral-600" aria-label="Preço por quantidade">{product.tiers.map((t) => <li key={t.minQty}>A partir de {t.minQty} peças: <b>{formatBRL(t.priceCents)}</b> cada</li>)}</ul> : null}
      {escada.length > 1 ? (
        <ol className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 text-sm" aria-label="Escada de preço por peça" data-escada>
          {escada.map((d) => {
            const atual = d.chave === degrauAtual;
            return (
              <li key={d.chave} className={cn("flex items-center justify-between gap-3 px-3 py-2", atual && "bg-neutral-50")} aria-current={atual ? "true" : undefined}>
                <span className="min-w-0"><b className="font-medium">{d.rotulo}</b> <span className="text-neutral-500">{d.detalhe}</span></span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">{atual ? <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>seu preço</span> : null}<b>{formatBRL(d.porPecaCents)}</b><span className="text-xs text-neutral-500">/peça</span></span>
              </li>
            );
          })}
        </ol>
      ) : null}
      {!legado && temRegraDoModelo(regraModelo) && product.sellsUnit ? <p className="mt-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm" data-regra-modelo><b>Grade livre:</b> {textoDaRegra(regraModelo)}.</p> : null}
      {mostraMix ? <BarraDoMix className="mt-3" mix={mixDoProduto} nota={noCarrinho > 0 ? `Conta o que já está no carrinho (${noCarrinho} peça${noCarrinho === 1 ? "" : "s"}) e esta escolha. Vale qualquer produto da loja.` : "Conta esta escolha e tudo o que você colocar no carrinho, de qualquer produto da loja."} /> : null}
      <p className="mt-4 text-sm leading-relaxed text-neutral-600">{product.description}</p>

      {abas.length > 1 ? (
        <div className="mt-6 grid gap-1 rounded-lg bg-neutral-100 p-1" style={{ gridTemplateColumns: `repeat(${Math.min(abas.length, 3)}, minmax(0, 1fr))` }} role="radiogroup" aria-label="Formato de compra">
          {abas.map((a) => (
            <button key={a.id} type="button" role="radio" aria-checked={mode === a.id} onClick={() => { setMode(a.id); setQty(1); }} className={cn("rounded-md px-2 py-2 text-sm font-medium", mode === a.id ? "bg-white shadow-sm" : "text-neutral-600")}>
              <span className="block">{a.rotulo}</span>{legado ? null : <span className="block text-xs font-normal tabular-nums">{formatBRL(a.porPeca)} a peça</span>}
            </button>
          ))}
        </div>
      ) : null}

      {matriz ? <div ref={ctaRef}><MatrizDoModelo product={product} slug={slug} atacadoCents={atacadoCents} comprarAgora={extras} /></div> : mode === "unit" ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{variantLabel(product.variants.map((v) => v.size))}</span>{variant ? <span className="text-neutral-500">{variant.available > 0 ? `${variant.available} disponíveis` : "esgotado"}</span> : null}</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button key={v.id} type="button" disabled={v.available === 0} onClick={() => { setVariantId(v.id); setQty(1); }} className={cn("h-11 min-w-[52px] rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through", variantId === v.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900")}>{v.size}</button>
            ))}
          </div>
        </div>
      ) : pack ? (
        <div className="mt-6 rounded-lg border border-neutral-200 p-4">
          <div className="text-sm font-medium">{pack.name} · {pack.totalQuantity} peças{pack.kind === "PACOTE_SORTIDO" ? "" : " do mesmo modelo"}</div>
          {corDaGrade ? <div className="mt-1 text-xs text-neutral-600">{pack.kind === "PACOTE_SORTIDO" ? "Modelos e cores sortidos, a critério da loja." : pack.colorMode === "SORTIDA" ? "Cores sortidas, a critério da loja." : <>Cor: <b>{corDaGrade}</b></>}</div> : null}
          <div className="mt-2 flex flex-wrap gap-2">{pack.items.map((i) => <span key={i.variantId} className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs"><b>{i.size}</b> × {i.quantity}</span>)}</div>
          <div className="mt-2 text-xs text-neutral-500">{pack.available > 0 ? `${pack.available} ${pack.kind === "PACOTE_SORTIDO" ? "pacote(s)" : "grade(s)"} disponíveis` : "Sem estoque deste formato no momento"}</div>
        </div>
      ) : null}

      {mode === "unit" ? <StockAlertForm slug={slug} productId={product.id} soldOut={product.variants.filter((v) => v.available === 0).map((v) => ({ id: v.id, size: v.size }))} /> : null}

      {matriz ? null : <>
      {!legado && max > 0 && (qty > 1 || mode !== "unit") ? <p className="mt-6 text-sm text-neutral-600" aria-live="polite" data-total-box>Total desta escolha: <b className="tabular-nums text-neutral-900">{formatBRL(simulado.linha.totalCents)}</b>{simulado.linha.economiaCents > 0 ? <> · economia de <b className="tabular-nums">{formatBRL(simulado.linha.economiaCents)}</b></> : null}</p> : null}
      <div ref={ctaRef} className={cn("flex items-center gap-3", !legado && max > 0 && (qty > 1 || mode !== "unit") ? "mt-3" : "mt-6")}>
        <div className="flex h-11 items-center rounded-lg border border-neutral-300">
          <button type="button" className="flex h-full min-w-11 items-center justify-center disabled:opacity-40" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Menos"><Minus className="size-4" /></button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
          <button type="button" className="flex h-full min-w-11 items-center justify-center disabled:opacity-40" onClick={() => setQty(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="Mais"><Plus className="size-4" /></button>
        </div>
        <SfButton className="h-11 flex-1" onClick={() => add()} disabled={max === 0}>{added ? <><Check className="size-4" /> Adicionado</> : <><ShoppingBag className="size-4" /> {max === 0 ? "Esgotado" : "Adicionar ao carrinho"}</>}</SfButton>
      </div>
      {extras && max > 0 ? <SfButton variant="outline" className="mt-3 h-11 w-full" onClick={() => add(true)}>Comprar agora</SfButton> : null}
      {extras ? <CalcularFrete slug={slug} freeFromCents={freeFromCents} item={max === 0 ? null : mode === "unit" ? (variant ? { productId: product.id, variantId: variant.id, quantity: qty } : null) : pack ? { productId: product.id, packId: pack.id, quantity: qty } : null} /> : null}
      </>}
      {shippingNote ? <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500"><Truck className="size-4" aria-hidden /> {shippingNote}</div> : null}
      {stickyBar && !ctaVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-neutral-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden" data-sticky-buy-bar>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{product.name}</div><div className="text-sm font-semibold tabular-nums">{legado ? formatBRL(price) : <>{formatBRL(porPeca)} <span className="font-normal text-neutral-500">a peça</span></>}</div></div>
          <SfButton className="h-11 px-6" onClick={() => (matriz ? ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) : add(extras))} disabled={max === 0 && !matriz}>{max === 0 ? "Esgotado" : extras ? "Comprar agora" : "Comprar"}</SfButton>
        </div>
      ) : null}
    </div>
  );
}
