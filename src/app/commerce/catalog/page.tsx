import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";

export default async function CommerceCatalogPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor); const names=new Map(data.stores.map(({store})=>[store.id,store.name]));
 return <><div><div className="text-[10px] tracking-[.22em] text-cyan-400">CATÁLOGOS</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Produtos publicados</h1><p className="mt-3 max-w-2xl text-sm text-zinc-500">Visão transversal dos catálogos próprios das lojas Commerce — não é o catálogo central de distribuição do SuperDrop.</p></div>
 <div className="mt-10 border-t border-white/10">{data.catalog.map((p,i)=><div key={`${p.storeId}:${p.productId}`} className="grid gap-2 border-b border-white/10 py-4 text-xs md:grid-cols-[1.2fr_1fr_.6fr_.5fr]"><div><span className="text-zinc-200">{p.name}</span><div className="mt-1 text-[10px] text-zinc-600">{p.sku}</div></div><div className="text-zinc-500">{names.get(p.storeId)}</div><div className="text-zinc-300">{formatBRL(p.priceCents)}</div><div className={p.active?"text-cyan-400":"text-zinc-600"}>{p.active?"Publicado":"Oculto"}{p.featured?" · destaque":""}</div></div>)}{!data.catalog.length?<div className="py-12 text-sm text-zinc-600">Nenhum produto Commerce encontrado.</div>:null}</div></>
}
