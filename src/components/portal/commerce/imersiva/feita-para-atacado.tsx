import { Boxes, FileText, Layers, ShoppingBag } from "lucide-react";
import { formatBRL } from "@/lib/money";

/**
 * Feita para o atacado (D220): o que a plataforma já faz para quem vende no Brás e no Canindé. Grade fechada (ex.: 12 peças)
 * e unidade no mesmo produto, preço por quantidade, pedido mínimo, propostas e pedidos manuais (`/merchant/atacado`,
 * `product_packs`, `store_price_tiers`). À direita, a caixa de compra da loja reproduzida com valores de exemplo.
 */
const RECURSOS = [
  { icon: Layers, titulo: "Grade fechada e unidade no mesmo produto", texto: "Venda a grade de 12 (ou a que você montar, com a quantidade de cada tamanho) e a peça avulsa na mesma página." },
  { icon: Boxes, titulo: "Preço por quantidade", texto: "A partir de N peças do mesmo modelo, o preço cai sozinho. Os tamanhos se somam." },
  { icon: ShoppingBag, titulo: "Pedido mínimo da loja", texto: "Defina o valor mínimo do pedido para vender só no atacado, ou deixe livre para atender o varejo também." },
  { icon: FileText, titulo: "Propostas e pedidos do balcão", texto: "Monte a proposta para o cliente do WhatsApp ou lance o pedido do balcão: as regras de atacado valem em tudo." },
];
/** Atacado nativo na concorrência (D231: Nuvemshop e Loja Integrada não têm, confirmado pelo dono; WBuy, Tray e Shopify pelos sites). */
const ATAQUE: [string, string, boolean][] = [["NextLevel", "Todos os planos, desde R$ 57", true], ["Nuvemshop", "Não tem", false], ["Loja Integrada", "Não tem", false], ["WBuy", "Só a partir de R$ 149", false], ["Tray", "Só no plano de R$ 449", false], ["Shopify", "Só no plano Plus, em dólar", false]];
const GRADE = [["P", 2], ["M", 4], ["G", 4], ["GG", 2]] as const;
const FAIXAS = [[6, 3990], [12, 3490], [36, 2990]] as const;

export function FeitaParaAtacado() {
  return (
    <section id="atacado" aria-labelledby="atacado-t" className="scroll-mt-16 bg-surface px-4 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <p className="im-eyebrow im-eyebrow--claro">Feita para o atacado</p>
          <h2 id="atacado-t" className="im-h2 mt-4 text-foreground">Grade de 12, pacote e preço por quantidade em todos os planos. Nos outros, não tem ou custa caro.</h2>
          <p className="mt-4 max-w-2xl text-lg text-body">A loja entende as formas do atacado desde o primeiro dia, em todos os planos, sem aplicativo extra.</p>
          <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2" aria-label="Atacado nativo na concorrência">
            {ATAQUE.map(([nome, texto, nosso]) => (
              <li key={nome} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 ${nosso ? "bg-[var(--im-acao,var(--ds-primary))] font-semibold text-white" : "bg-canvas text-body ring-1 ring-border"}`}><span>{nome}</span><span className={nosso ? "ec-mono" : "ec-mono text-muted-foreground"}>{texto}</span></li>
            ))}
          </ul>
          <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {RECURSOS.map((r) => (
              <li key={r.titulo}>
                <span className="ec-icone"><r.icon className="size-5" aria-hidden /></span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{r.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{r.texto}</p>
              </li>
            ))}
          </ul>
        </div>
        <figure className="ec-cartao p-6 shadow-[0_30px_70px_-40px_rgb(16_26_51/0.45)] md:p-8">
          <figcaption className="ec-mono text-muted-foreground">Na sua loja · exemplo</figcaption>
          <p className="mt-3 text-sm text-muted-foreground">Moda feminina</p>
          <p className="text-xl font-semibold text-foreground">Vestido midi canelado</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{formatBRL(41880)} <span className="text-sm font-medium text-muted-foreground">a grade · {formatBRL(3490)} a peça</span></p>
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 text-sm font-medium" aria-hidden>
            <span className="rounded-lg py-2 text-center text-muted-foreground">Unidade</span>
            <span className="rounded-lg bg-canvas py-2 text-center text-foreground shadow-sm">Grade de 12</span>
          </div>
          <div className="mt-4 rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">Grade 12 peças do mesmo modelo</p>
            <p className="mt-2 flex flex-wrap gap-2">{GRADE.map(([t, q]) => <span key={t} className="rounded-md bg-surface px-2.5 py-1 text-xs text-foreground"><b>{t}</b> × {q}</span>)}</p>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-body" aria-label="Preço por quantidade, exemplo">
            {FAIXAS.map(([q, c]) => <li key={q} className="flex justify-between"><span>A partir de {q} peças</span><b className="tabular-nums text-foreground">{formatBRL(c)} cada</b></li>)}
          </ul>
          <p className="mt-5 rounded-xl bg-[var(--im-acao,var(--ds-primary))] py-3 text-center font-semibold text-white">Comprar grade</p>
          <p className="mt-3 text-center text-xs text-muted-foreground">Pedido mínimo da loja: {formatBRL(30000)}</p>
        </figure>
      </div>
    </section>
  );
}
