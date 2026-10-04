import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default async function CommerceOrdersPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor);
 const stores=new Map(data.stores.map(({store})=>[store.id,store.name]));
 return <><Header/><div className="mt-10 border-t border-border">
  <div className="hidden grid-cols-[.6fr_1fr_1.1fr_.7fr_.7fr] gap-4 border-b border-border py-3 text-[9px] tracking-[.18em] text-muted-foreground md:grid"><span>PEDIDO</span><span>LOJA</span><span>CLIENTE</span><span>CANAL</span><span className="text-right">TOTAL</span></div>
  {data.orders.map(o=><div key={o.id} className="grid gap-2 border-b border-border py-5 text-xs md:grid-cols-[.6fr_1fr_1.1fr_.7fr_.7fr] md:items-center">
   <div><span className="text-foreground">#{o.number}</span><div className="mt-1 text-[10px] text-muted-foreground">{formatDate(o.createdAt)}</div></div>
   <div className="text-muted-foreground">{stores.get(o.storeId)??"Loja"}</div><div className="text-muted-foreground">{o.customerName}</div>
   <div className="text-muted-foreground">{o.channel.replaceAll("_"," ")}</div><div className="font-medium text-foreground md:text-right">{formatBRL(o.totalCents)}</div>
  </div>)}
  {!data.orders.length?<div className="py-12 text-sm text-muted-foreground">Nenhuma venda Commerce encontrada.</div>:null}
 </div></>
}
function Header(){return <div><div className="text-[10px] tracking-[.22em] text-[var(--product-accent-text)]">VENDAS</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Pedidos das lojas</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Vendas originadas somente nas lojas NextLevel Commerce. Sem pagamento à Central ou fila de expedição SuperDrop.</p></div>}
