import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getBrandHub } from "@/lib/domain/commerce-hub";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CommercePage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [hub, consoleData] = await Promise.all([getBrandHub(db, session.actor), getCommerceConsole(db, session.actor)]);
  const k = consoleData.kpis;
  const blockers = hub.checks.filter((c) => c.severity === "blocker" && !c.ok);

  return (
    <>
      <div className="max-w-4xl">
        <div className="text-[10px] font-semibold tracking-[0.26em] text-[var(--product-accent-text)]">NEXTLEVEL COMMERCE · CONTROL ROOM</div>
        <h1 className="mt-3 text-[clamp(2.2rem,6vw,5.5rem)] font-semibold leading-[.92] tracking-[-0.065em] text-foreground">Lojas digitais,<br/><span className="text-muted-foreground">como um negócio.</span></h1>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Aqui entram somente as operações da Commerce: lojas, assinaturas, vendas, catálogo e aquisição. Distribuição, fornecedores e saldo do SuperDrop não fazem parte deste console.</p>
      </div>

      <section className="mt-12 border-y border-border">
        <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-5 md:divide-y-0">
          {[
            ["LOJAS", String(k.stores), `${k.published} publicadas`],
            ["ASSINANTES", String(k.paying), `${k.trial} em teste`],
            ["VENDAS · MÊS", formatBRL(k.salesMonthCents), `${k.ordersMonth} pedidos pagos`],
            ["RECEITA SaaS", formatBRL(k.planRevenueMonthCents), "planos pagos no mês"],
            ["LEADS", String(k.leadsNew), `${k.leadsTotal} no funil`],
          ].map(([label,value,hint]) => <div key={label} className="min-h-[132px] px-4 py-5 md:px-5"><div className="text-[9px] font-semibold tracking-[.18em] text-muted-foreground">{label}</div><div className="mt-3 text-2xl font-medium tracking-[-.04em] text-foreground md:text-3xl">{value}</div><div className="mt-2 text-[11px] text-muted-foreground">{hint}</div></div>)}
        </div>
      </section>

      <div className="mt-12 grid gap-12 xl:grid-cols-[1.5fr_.8fr]">
        <section>
          <div className="flex items-end justify-between border-b border-border pb-4"><div><div className="text-[10px] tracking-[.2em] text-muted-foreground">PORTFÓLIO</div><h2 className="mt-1 text-xl font-medium">Lojas em operação</h2></div><Link href="/commerce/stores" className="text-xs text-[var(--product-accent-text)]">Ver todas →</Link></div>
          <div className="divide-y divide-border">
            {consoleData.stores.slice(0,6).map(({store,access}) => <Link href="/commerce/stores" key={store.id} className="group grid grid-cols-[1fr_auto] gap-4 py-5 md:grid-cols-[1.2fr_.7fr_.5fr_auto]">
              <div><div className="text-sm font-medium text-foreground group-hover:text-[var(--product-accent-text)]">{store.name}</div><div className="mt-1 text-xs text-muted-foreground">/{store.slug}</div></div>
              <div className="hidden text-xs text-muted-foreground md:block">{store.publishedAt?"Publicada":"Rascunho"}</div>
              <div className="hidden text-xs text-muted-foreground md:block">{access.state}</div>
              <ArrowUpRight className="size-4 text-subtle-foreground group-hover:text-[var(--product-accent-text)]"/>
            </Link>)}
            {!consoleData.stores.length?<div className="py-10 text-sm text-muted-foreground">Nenhuma loja Commerce ainda.</div>:null}
          </div>
        </section>

        <section>
          <div className="border-b border-border pb-4"><div className="text-[10px] tracking-[.2em] text-muted-foreground">PLATAFORMA</div><h2 className="mt-1 text-xl font-medium">Prontidão</h2></div>
          <div className="py-5">
            <div className="flex items-baseline gap-3"><span className={blockers.length?"text-4xl font-medium text-warning":"text-4xl font-medium text-[var(--product-accent-text)]"}>{blockers.length}</span><span className="text-sm text-muted-foreground">bloqueios para lançamento</span></div>
            <div className="mt-6 divide-y divide-border border-t border-border">
              {hub.checks.slice(0,5).map((c)=><div key={c.key} className="flex gap-3 py-4"><span className={c.ok?"mt-1 size-1.5 shrink-0 bg-success":"mt-1 size-1.5 shrink-0 bg-warning"}/><div><div className="text-xs font-medium text-foreground">{c.label}</div><div className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{c.hint}</div></div></div>)}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
