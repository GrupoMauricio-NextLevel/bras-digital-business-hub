import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { formatBRL } from "@/lib/money";
import { CONCORRENTES, COLETADO_EM, melhorPlano, nextlevelComoPlataforma } from "@/lib/marcas/comparativo-ecommerce";
import { ComparativoHome } from "@/components/portal/commerce/comparativo";
import "@/components/portal/commerce/commerce.css";
import "@/components/imersiva/imersiva.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "NextLevel E-commerce ou outra plataforma? Comparativo", description: "Compare mensalidade, tarifa sobre as vendas e limites da NextLevel E-commerce com Nuvemshop, Tray, Loja Integrada e Shopify. Dados públicos com fonte e data.", alternates: { canonical: "/comparativo" } };

const pct = (bps: number | null) => (bps === null ? "não divulga" : `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
const FAIXAS = [1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000];

/** Comparativo completo (D219): custo total em seis faixas e os planos de cada plataforma, com fonte e data. */
export default async function ComparativoPage() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) notFound();
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  const pv = await commercePlansView(await getDb());
  const nl = nextlevelComoPlataforma(pv.plans);
  const comparaveis = CONCORRENTES.filter((c) => c.moeda === "BRL" && c.planos.some((p) => p.taxaBps !== null));
  const data = new Date(`${COLETADO_EM}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <div className="im-tema-ecommerce">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:pt-24">
        <p className="im-eyebrow im-eyebrow--claro">Comparativo</p>
        <h1 className="im-h2 mt-3 max-w-3xl text-foreground">NextLevel E-commerce ou outra plataforma?</h1>
        <p className="mt-4 max-w-2xl text-lg text-body">Os números públicos, lado a lado. Você vê quanto paga em cada uma conforme o quanto vende, sem letra miúda.</p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="faixas-t">
        <h2 id="faixas-t" className="text-2xl font-bold text-foreground">Custo da plataforma por mês</h2>
        <p className="mt-1 text-sm text-body">Mensalidade + tarifa sobre as vendas, no plano mais barato de cada uma para o faturamento.</p>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
          <table className="w-full min-w-[40rem] text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th scope="col" className="p-4">Vendendo por mês</th><th scope="col" className="p-4 font-bold text-foreground">NextLevel</th>{comparaveis.map((c) => <th key={c.key} scope="col" className="p-4">{c.nome}</th>)}</tr></thead>
            <tbody>{FAIXAS.map((f) => {
              const n = melhorPlano(nl, f)!; const outros = comparaveis.map((c) => melhorPlano(c, f));
              const menor = Math.min(n.totalCents, ...outros.filter(Boolean).map((o) => o!.totalCents));
              const cel = (x: { nome: string; totalCents: number } | null) => x ? <><b className={x.totalCents === menor ? "text-success" : undefined}>{formatBRL(x.totalCents)}</b> <span className="text-xs text-muted-foreground">{x.nome}</span></> : <span className="text-xs text-muted-foreground">sem plano para essa faixa</span>;
              return <tr key={f} className="border-b border-border last:border-0"><th scope="row" className="p-4 text-left font-semibold">{formatBRL(f).replace(",00", "")}</th><td className="bg-surface-muted p-4">{cel(n)}</td>{outros.map((o, i) => <td key={comparaveis[i]!.key} className="p-4">{cel(o)}</td>)}</tr>;
            })}</tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Em verde, a mais barata em cada faixa.</p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="planos-t">
        <h2 id="planos-t" className="text-2xl font-bold text-foreground">Planos de cada plataforma</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-[var(--ds-primary)] bg-surface p-6"><h3 className="text-lg font-bold">NextLevel E-commerce</h3><ul className="mt-3 space-y-1.5 text-sm">{nl.planos.map((p) => <li key={p.nome} className="flex justify-between gap-3"><span>{p.nome}</span><span className="tabular-nums">{formatBRL(p.mensalCents)}/mês + {pct(p.taxaBps)}</span></li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Sem limite de produtos e pedidos. 100% das vendas na sua conta Mercado Pago.</p></div>
          {CONCORRENTES.map((c) => (
            <div key={c.key} className="rounded-3xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold">{c.nome}</h3>
              <ul className="mt-3 space-y-1.5 text-sm">{c.planos.map((p) => <li key={p.nome} className="flex justify-between gap-3"><span>{p.nome}{p.produtos ? <span className="text-xs text-muted-foreground"> · até {p.produtos.toLocaleString("pt-BR")} produtos{p.pedidosMes ? ` e ${p.pedidosMes.toLocaleString("pt-BR")} pedidos/mês` : ""}</span> : null}</span><span className="tabular-nums">{c.moeda === "USD" ? `US$ ${(p.mensalCents / 100).toFixed(0)}` : p.mensalCents ? formatBRL(p.mensalCents) : "grátis"}/mês + {pct(p.taxaBps)}</span></li>)}</ul>
              <p className="mt-3 text-xs text-muted-foreground">{c.notas.join(" ")} <a href={c.fonte} target="_blank" rel="noreferrer nofollow" className="underline">Fonte</a></p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">Dados públicos dos sites oficiais, consultados em {data}, planos mensais. Tarifa da plataforma sobre a venda usando o próprio meio de pagamento; as taxas de cartão e Pix existem em todas e ficam fora da conta. Pedidos estimados com tíquete médio de R$ 150. Preços e regras dessas plataformas podem mudar: confira no site de cada uma. As marcas citadas não têm vínculo com a NextLevel.</p>
      </section>
      <ComparativoHome nl={nl} cta={cta} comecar={brand.signupOpen ? "Criar minha loja" : "Quero minha loja"} linkCompleto={false} />
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm"><Link href="/planos" className="font-semibold underline underline-offset-4">Ver os planos da NextLevel</Link></div>
    </div>
  );
}
