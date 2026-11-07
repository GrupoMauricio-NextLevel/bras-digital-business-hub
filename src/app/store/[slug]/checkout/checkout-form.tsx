"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, CreditCard, QrCode } from "lucide-react";
import { useCart } from "@/components/storefront/cart-context";
import { SfButton } from "@/components/storefront/sf-button";
import { formatBRL } from "@/lib/money";
import { BarraDoMix, mixRelevante } from "@/components/storefront/barra-do-mix";
import { AvisoGradeLivre } from "@/components/storefront/matriz-do-modelo";
import { placeStorefrontOrderAction, quoteShippingAction, previewDiscountAction, salvarCarrinhoAction } from "@/app/actions/storefront";
import type { ShippingQuote } from "@/lib/shipping/quote";
import { cn } from "@/lib/utils";
import { MAX_PARCELAS_LOJA } from "@/lib/pagamento-loja";
import { utmGuardada } from "@/components/storefront/contador-de-visitas";

const input = "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900";

/** Resumo curto do carrinho (não é segurança): muda a chave quando o carrinho muda, para nunca reaproveitar um pedido de outra compra. */
function fingerprint(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** `aceitaCartao`: loja da E-commerce (Pix e cartão parcelado, D178); sem ele, só Pix (SuperDrop). */
export function CheckoutForm({ slug, storeName, minOrderCents = 0, aceitaCartao = false, lembrete = false }: { slug: string; storeName: string; minOrderCents?: number; aceitaCartao?: boolean; lembrete?: boolean }) {
  const cart = useCart();
  const router = useRouter();
  const [f, setF] = React.useState({ name: "", email: "", phone: "", zip: "", address: "", city: "", state: "SP", marketingOptIn: false });
  // Carrinho abandonado (D186): só com o "sim" do cliente; guarda o carrinho quando o e-mail está preenchido.
  const [lembrar, setLembrar] = React.useState(false);
  const guardar = (sim: boolean, email: string) => {
    if (!lembrete || !sim || !/^\S+@\S+\.\S+$/.test(email) || !cart.lines.length) return;
    void salvarCarrinhoAction(slug, { email, name: f.name || undefined, consent: true, items: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, packId: l.packId, quantity: l.quantity })) });
  };
  const [payment, setPayment] = React.useState<"pix" | "card">("pix");
  const [pending, start] = React.useTransition();
  // Uma chave por tentativa de compra: reenviar a mesma compra devolve o mesmo pedido. Muda se o carrinho mudar.
  const [attemptId] = React.useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const zipDigits = f.zip.replace(/\D/g, "");
  const cartKey = cart.lines.map((l) => `${l.productId}:${l.variantId ?? ""}:${l.packId ?? ""}:${l.quantity}`).join("|");
  const quoteKey = zipDigits.length === 8 && cartKey ? `${zipDigits}|${cartKey}` : "";
  // Resultado da cotação guardado com a chave (CEP + carrinho) a que pertence: se a chave muda, o resultado antigo deixa de valer.
  const [quote, setQuote] = React.useState<{ key: string; options: ShippingQuote[]; error: string | null; picked: string }>({ key: "", options: [], error: null, picked: "" });
  const current = quote.key === quoteKey && quoteKey ? quote : null;
  const options = current?.options ?? [];
  const quoteError = current?.error ?? null;
  const quoting = !!quoteKey && !current;
  const serviceId = current?.picked ?? "";
  const chosen = options.find((o) => o.serviceId === serviceId) ?? null;
  const shipping = chosen?.priceCents ?? 0;
  React.useEffect(() => {
    if (!quoteKey) return;
    let alive = true;
    quoteShippingAction(slug, { zip: zipDigits, items: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, packId: l.packId, quantity: l.quantity })) }).then((r) => {
      if (!alive) return;
      setQuote(r.ok ? { key: quoteKey, options: r.data.options, error: null, picked: r.data.options[0]?.serviceId ?? "" } : { key: quoteKey, options: [], error: r.error, picked: "" });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quoteKey resume CEP e carrinho
  }, [quoteKey, slug]);
  const [codeInput, setCodeInput] = React.useState("");
  const [appliedRaw, setApplied] = React.useState<{ key: string; code: string; cents: number } | null>(null);
  const applied = appliedRaw && appliedRaw.key === cartKey ? appliedRaw : null; // trocou o carrinho: o cupom precisa ser aplicado de novo
  const discount = applied?.cents ?? 0;
  const applyCode = () => start(async () => {
    const r = await previewDiscountAction(slug, codeInput, cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, packId: l.packId, quantity: l.quantity })));
    if (r.ok) { setApplied({ key: cartKey, code: r.data.code, cents: r.data.cents }); toast.success("Cupom aplicado"); } else { setApplied(null); toast.error(r.error); }
  });
  const belowMin = minOrderCents > 0 && cart.subtotal - discount < minOrderCents;
  const setServiceId = (id: string) => setQuote((q) => ({ ...q, picked: id }));
  const base = `/store/${slug}`;

  if (cart.ready && cart.lines.length === 0) {
    return <div className="mx-auto min-h-[60vh] max-w-md px-4 py-20 text-center text-sm text-neutral-500"><h1 className="sr-only">Finalizar compra</h1>Seu carrinho está vazio. <Link href={`${base}/catalog`} className="underline">Voltar ao catálogo</Link></div>;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosen) { toast.error("Informe o CEP e escolha a forma de entrega."); return; }
    start(async () => {
      const r = await placeStorefrontOrderAction(slug, {
        customer: { name: f.name, email: f.email, phone: f.phone || undefined, marketingOptIn: f.marketingOptIn },
        shipping: { address: f.address, city: f.city, state: f.state, zip: f.zip, costCents: 0 },
        shippingServiceId: chosen.serviceId,
        items: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, packId: l.packId, quantity: l.quantity })),
        saleType: cart.lines.some((l) => l.packId) ? "WHOLESALE" : "RETAIL",
        discountCode: applied?.code,
        origem: utmGuardada(),
        idempotencyKey: `${attemptId}:${fingerprint(cart.lines.map((l) => `${l.productId}.${l.variantId}.${l.packId ?? ""}.${l.quantity}`).join("|"))}`,
        notes: payment === "card" && aceitaCartao ? "Preferência de pagamento: Cartão" : "Preferência de pagamento: Pix",
      });
      if (!r.ok) { toast.error(r.error); return; }
      cart.clear();
      if (r.data.checkoutUrl) window.location.assign(r.data.checkoutUrl);
      else router.push(`${base}/order/${r.data.orderId}`);
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Etapas da compra (D213): o cliente vê onde está e quanto falta. */}
      <ol aria-label="Etapas da compra" className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
        <li><Link href={`${base}/cart`} className="hover:text-neutral-900">1. Carrinho</Link></li><li aria-hidden>›</li>
        <li aria-current="step" className="rounded-full px-2.5 py-1" style={{ background: "color-mix(in srgb, var(--sf-primary) 10%, white)", color: "var(--sf-primary)" }}>2. Seus dados e entrega</li><li aria-hidden>›</li>
        <li>3. Pagamento seguro</li>
      </ol>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Finalizar compra</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-base font-semibold">1. Seus dados</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Nome completo" aria-label="Nome completo" autoComplete="name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={input} type="email" placeholder="E-mail" aria-label="E-mail" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} onBlur={() => guardar(lembrar, f.email)} />
              <input className={input} placeholder="WhatsApp" aria-label="WhatsApp" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">2. Entrega</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={input} placeholder="CEP" aria-label="CEP" autoComplete="postal-code" required value={f.zip} onChange={(e) => setF({ ...f, zip: e.target.value })} />
              <input className={cn(input, "sm:col-span-2")} placeholder="Endereço e número" aria-label="Endereço e número" autoComplete="street-address" required value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
              <input className={cn(input, "sm:col-span-2")} placeholder="Cidade" aria-label="Cidade" autoComplete="address-level2" required value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
              <select className={input} aria-label="Estado (UF)" autoComplete="address-level1" value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>{["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div className="mt-4" aria-live="polite" data-shipping-options>
              {quoting ? <p className="text-sm text-neutral-500">Calculando o frete…</p> : null}
              {quoteError ? <p role="alert" className="text-sm text-red-600">{quoteError}</p> : null}
              {!quoting && !quoteError && zipDigits.length !== 8 ? <p className="text-sm text-neutral-500">Digite o CEP para ver as opções de entrega.</p> : null}
              {options.length ? (
                <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium">Forma de entrega</legend>
                  {options.map((o) => (
                    <label key={o.serviceId} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm", serviceId === o.serviceId ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-300")}>
                      <span className="flex items-center gap-2"><input type="radio" name="shipping" value={o.serviceId} checked={serviceId === o.serviceId} onChange={() => setServiceId(o.serviceId)} /><span>{o.name}{o.days !== null ? <span className="block text-xs text-neutral-500">{o.kind === "PICKUP" ? "Pronto em" : "Chega em"} até {o.days} {o.days === 1 ? "dia útil" : "dias úteis"}</span> : null}</span></span>
                      <span className="font-medium tabular-nums">{o.priceCents === 0 ? "Grátis" : formatBRL(o.priceCents)}</span>
                    </label>
                  ))}
                </fieldset>
              ) : null}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">3. Pagamento</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Forma de pagamento">
              {([["pix", "Pix", "Aprovação imediata", QrCode], ...(aceitaCartao ? [["card", "Cartão de crédito", `Em até ${MAX_PARCELAS_LOJA}x no cartão`, CreditCard]] as const : [])] as const).map(([k, t, d, Icon]) => (
                <button type="button" role="radio" aria-checked={payment === k} key={k} onClick={() => setPayment(k)} className={cn("flex items-center gap-3 rounded-lg border p-4 text-left", payment === k ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-300")}><Icon className="size-5 text-neutral-500" /><div><div className="text-sm font-medium">{t}</div><div className="text-xs text-neutral-500">{d}</div></div></button>
              ))}
            </div>
            {lembrete ? <label className="mt-4 flex items-start gap-2 text-xs text-neutral-600"><input type="checkbox" className="mt-0.5" checked={lembrar} onChange={(e) => { setLembrar(e.target.checked); guardar(e.target.checked, f.email); }} /> Se eu não terminar a compra, pode me lembrar por e-mail (no máximo 2 vezes). Dá para cancelar pelo próprio e-mail.</label> : null}
            <label className="mt-4 flex items-start gap-2 text-xs text-neutral-600"><input type="checkbox" className="mt-0.5" checked={f.marketingOptIn} onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })} /> Aceito receber novidades e promoções da {storeName} por WhatsApp. Você pode revogar quando quiser.</label>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-neutral-200 p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">Resumo do pedido</h2>
          {cart.atacadoLigado && cart.linhasBase.some((l) => l.atacadoCents) ? <BarraDoMix className="mt-3" mix={mixRelevante(cart.precificado.mix, cart.linhasBase.map((l) => l.categoryId))} /> : null}
          <AvisoGradeLivre className="mt-3" />
          <ul className="mt-3 min-h-24 space-y-2 text-sm">{cart.lines.map((l) => <li key={l.key} className="flex justify-between gap-3"><span className="text-neutral-600">{l.quantity}× {l.name} <span className="text-neutral-400">({l.label.split(" (")[0]})</span></span><span className="tabular-nums">{formatBRL(l.unitPriceCents * l.quantity)}</span></li>)}</ul>
          <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between text-neutral-600"><dt>Subtotal</dt><dd className="tabular-nums">{formatBRL(cart.subtotal)}</dd></div>
            {cart.precificado.economiaCents > 0 ? <div className="flex justify-between font-medium" data-economia><dt>Você economizou com o atacado</dt><dd className="tabular-nums">{formatBRL(cart.precificado.economiaCents)}</dd></div> : null}
            {discount > 0 ? <div className="flex justify-between text-green-700"><dt>Cupom {applied?.code}</dt><dd className="tabular-nums">− {formatBRL(discount)}</dd></div> : null}
            <div className="flex justify-between text-neutral-600"><dt>Frete</dt><dd className="tabular-nums">{!chosen ? "—" : shipping === 0 ? "Grátis" : formatBRL(shipping)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(cart.subtotal - discount + shipping)}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2"><input aria-label="Cupom de desconto" placeholder="Cupom de desconto" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm" /><button type="button" onClick={applyCode} disabled={pending || codeInput.trim().length < 3} className="h-10 rounded-lg border border-neutral-300 px-4 text-sm font-medium disabled:opacity-50">Aplicar</button></div>
          {belowMin ? <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Pedido mínimo da loja: {formatBRL(minOrderCents)} em produtos. Faltam {formatBRL(minOrderCents - (cart.subtotal - discount))}.</p> : null}
          <SfButton type="submit" className="mt-5 h-12 w-full" disabled={pending || !cart.ready || !chosen || belowMin || cart.pendencias.length > 0}><Lock className="size-4" /> {pending ? "Processando…" : "Ir para o pagamento"}</SfButton>
          <p className="mt-3 text-center text-[11px] text-neutral-500">Você será levado ao ambiente seguro do Mercado Pago para concluir o pagamento ({aceitaCartao ? "Pix ou cartão" : "Pix"}).</p>
        </aside>
      </form>
    </div>
  );
}
