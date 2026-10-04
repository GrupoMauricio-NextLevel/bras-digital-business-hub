import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";

export default async function CommerceCatalogPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor); const names=new Map(data.stores.map(({store})=>[store.id,store.name]));
 return <><div><div className="text-[10px] tracking-[.22em] text-[var(--product-accent-text)]">CATÁLOGOS</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Produtos publicados</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Visão transversal dos catálogos próprios das lojas Commerce — não é o catálogo central de distribuição do SuperDrop.</p></div>
 <div className="mt-10 border-t border-border">{data.catalog.map((p)=><div key={`${p.storeId}:${p.productId}`} className="grid gap-2 border-b border-border py-4 text-xs md:grid-cols-[1.2fr_1fr_.6fr_.5fr]"><div><span className="text-foreground">{p.name}</span><div className="mt-1 text-[10px] text-muted-foreground">{p.sku}</div></div><div className="text-muted-foreground">{names.get(p.storeId)}</div><div className="text-foreground">{formatBRL(p.priceCents)}</div><div className={p.active?"text-[var(--product-accent-text)]":"text-muted-foreground"}>{p.active?"Publicado":"Oculto"}{p.featured?" · destaque":""}</div></div>)}{!data.catalog.length?<div className="py-12 text-sm text-muted-foreground">Nenhum produto Commerce encontrado.</div>:null}</div></>
}
