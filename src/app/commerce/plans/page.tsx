import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default async function CommercePlansPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor); const names=new Map(data.stores.map(({store})=>[store.id,store.name]));
 return <><div><div className="text-[10px] tracking-[.22em] text-[var(--product-accent-text)]">RECEITA RECORRENTE</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Assinaturas</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Cobranças dos planos das lojas Commerce. Este financeiro é SaaS; não é carteira operacional do SuperDrop.</p></div>
 <div className="mt-10 border-t border-border">{data.invoices.map(i=><div key={i.id} className="grid gap-2 border-b border-border py-5 text-xs md:grid-cols-[1fr_1fr_.6fr_.5fr]"><div><div className="text-foreground">{names.get(i.storeId??"")??"Loja"}</div><div className="mt-1 text-[10px] text-muted-foreground">{i.description}</div></div><div className="text-muted-foreground">{i.period??formatDate(i.createdAt)}</div><div className="font-medium text-foreground">{formatBRL(i.amountCents)}</div><div className={i.status==="PAID"?"text-[var(--product-accent-text)]":i.status==="OVERDUE"?"text-warning":"text-muted-foreground"}>{i.status}</div></div>)}{!data.invoices.length?<div className="py-12 text-sm text-muted-foreground">Nenhuma cobrança de plano Commerce encontrada.</div>:null}</div></>
}
