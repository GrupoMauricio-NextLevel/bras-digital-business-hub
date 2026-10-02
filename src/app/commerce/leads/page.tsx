import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatDate } from "@/lib/utils";

const LABEL:Record<string,string>={NEW:"Novo",CONTACTED:"Em contato",WON:"Virou loja",LOST:"Perdido"};
export default async function CommerceLeadsPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor);
 return <><div><div className="text-[10px] tracking-[.22em] text-cyan-400">AQUISIÇÃO</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Interessados</h1><p className="mt-3 max-w-2xl text-sm text-zinc-500">Pessoas e empresas interessadas em abrir uma loja na NextLevel Commerce.</p></div>
 <div className="mt-10 border-t border-white/10">{data.leads.map(l=><div key={l.id} className="grid gap-2 border-b border-white/10 py-5 text-xs md:grid-cols-[1fr_1fr_.7fr_.5fr]"><div><div className="text-sm font-medium text-zinc-200">{l.name}</div><div className="mt-1 text-zinc-600">{l.email}</div></div><div className="text-zinc-400">{l.storeName??"Loja ainda sem nome"}</div><div className="text-zinc-500">{l.segment??"Segmento não informado"}</div><div><span className={l.status==="NEW"?"text-cyan-400":"text-zinc-400"}>{LABEL[l.status]??l.status}</span><div className="mt-1 text-[10px] text-zinc-700">{formatDate(l.createdAt)}</div></div></div>)}{!data.leads.length?<div className="py-12 text-sm text-zinc-600">Nenhum interessado Commerce ainda.</div>:null}</div></>
}
