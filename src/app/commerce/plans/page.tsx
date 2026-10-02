import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default async function CommercePlansPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor); const names=new Map(data.stores.map(({store})=>[store.id,store.name]));
 return <><div><div className="text-[10px] tracking-[.22em] text-cyan-400">RECEITA RECORRENTE</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Assinaturas</h1><p className="mt-3 max-w-2xl text-sm text-zinc-500">Cobranças dos planos das lojas Commerce. Este financeiro é SaaS; não é carteira operacional do SuperDrop.</p></div>
 <div className="mt-10 border-t border-white/10">{data.invoices.map(i=><div key={i.id} className="grid gap-2 border-b border-white/10 py-5 text-xs md:grid-cols-[1fr_1fr_.6fr_.5fr]"><div><div className="text-zinc-200">{names.get(i.storeId??"")??"Loja"}</div><div className="mt-1 text-[10px] text-zinc-600">{i.description}</div></div><div className="text-zinc-500">{i.period??formatDate(i.createdAt)}</div><div className="font-medium text-zinc-200">{formatBRL(i.amountCents)}</div><div className={i.status==="PAID"?"text-cyan-400":i.status==="OVERDUE"?"text-amber-400":"text-zinc-500"}>{i.status}</div></div>)}{!data.invoices.length?<div className="py-12 text-sm text-zinc-600">Nenhuma cobrança de plano Commerce encontrada.</div>:null}</div></>
}
