import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatDate } from "@/lib/utils";
import { CommerceLeadActions } from "@/components/commerce/commerce-lead-actions";

export default async function CommerceLeadsPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor);
 return <><div><div className="text-[10px] tracking-[.22em] text-[var(--product-accent-text)]">AQUISIÇÃO</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Interessados</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Pessoas e empresas interessadas em abrir uma loja na NextLevel Commerce.</p></div>
 <div className="mt-10 border-t border-border">{data.leads.map(l=><div key={l.id} className="grid gap-2 border-b border-border py-5 text-xs md:grid-cols-[1fr_1fr_.7fr_.65fr]"><div><div className="text-sm font-medium text-foreground">{l.name}</div><div className="mt-1 text-muted-foreground">{l.email}</div></div><div className="text-muted-foreground">{l.storeName??"Loja ainda sem nome"}</div><div className="text-muted-foreground">{l.segment??"Segmento não informado"}</div><div><CommerceLeadActions id={l.id} status={l.status}/><div className="mt-1 text-[10px] text-subtle-foreground">{formatDate(l.createdAt)}</div></div></div>)}{!data.leads.length?<div className="py-12 text-sm text-muted-foreground">Nenhum interessado Commerce ainda.</div>:null}</div></>
}
