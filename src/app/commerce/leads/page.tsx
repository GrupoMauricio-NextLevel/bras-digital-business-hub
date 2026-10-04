import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatDate } from "@/lib/utils";
import { CommerceLeadActions } from "@/components/commerce/commerce-lead-actions";

export default async function CommerceLeadsPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor);
 return <><div><div className="text-[10px] tracking-[.22em] text-cyan-400">AQUISIÇÃO</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Interessados</h1><p className="mt-3 max-w-2xl text-sm text-zinc-400">Pessoas e empresas interessadas em abrir uma loja na NextLevel Commerce.</p></div>
 <div className="mt-10 border-t border-white/10">{data.leads.map(l=><div key={l.id} className="grid gap-2 border-b border-white/10 py-5 text-xs md:grid-cols-[1fr_1fr_.7fr_.65fr]"><div><div className="text-sm font-medium text-zinc-200">{l.name}</div><div className="mt-1 text-zinc-400">{l.email}</div></div><div className="text-zinc-400">{l.storeName??"Loja ainda sem nome"}</div><div className="text-zinc-400">{l.segment??"Segmento não informado"}</div><div><CommerceLeadActions id={l.id} status={l.status}/><div className="mt-1 text-[10px] text-zinc-700">{formatDate(l.createdAt)}</div></div></div>)}{!data.leads.length?<div className="py-12 text-sm text-zinc-400">Nenhum interessado Commerce ainda.</div>:null}</div></>
}
