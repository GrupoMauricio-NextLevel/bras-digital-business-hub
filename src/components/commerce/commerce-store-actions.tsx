"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, LogIn, MoreHorizontal, PauseCircle, PlayCircle, TimerReset } from "lucide-react";
import { enterCommerceStoreAction, extendCommerceTrialAction, setCommerceStoreStatusAction } from "@/app/actions/commerce-admin";

export function CommerceStoreActions({ storeId, status, slug, canExtendTrial }: { storeId:string; status:string; slug:string; canExtendTrial:boolean }) {
  const router=useRouter(); const [open,setOpen]=React.useState(false); const [pending,start]=React.useTransition();
  const run=(fn:()=>Promise<{ok:boolean;error?:string}>)=>start(async()=>{const r=await fn(); if(!r.ok) toast.error(r.error??"Não foi possível concluir."); else {toast.success("Atualizado.");setOpen(false);router.refresh();}});
  return <div className="relative flex items-center justify-end gap-2">
    <form action={enterCommerceStoreAction.bind(null,storeId)}><button disabled={pending} className="inline-flex h-9 items-center gap-2 border border-cyan-400/30 px-3 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/10"><LogIn className="size-3.5"/> Entrar como lojista</button></form>
    <button onClick={()=>setOpen(!open)} className="flex size-9 items-center justify-center border border-white/10 text-zinc-400 hover:text-zinc-200" aria-label="Ações"><MoreHorizontal className="size-4"/></button>
    {open?<div className="absolute right-0 top-11 z-20 w-56 border border-white/10 bg-[#101216] p-1 shadow-2xl">
      <a href={"/store/"+slug} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 px-3 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"><ExternalLink className="size-3.5"/> Abrir loja pública</a>
      {canExtendTrial?<button disabled={pending} onClick={()=>run(()=>extendCommerceTrialAction(storeId,7))} className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs text-zinc-400 hover:bg-white/5 hover:text-white"><TimerReset className="size-3.5"/> +7 dias de teste</button>:null}
      {status==="SUSPENDED"?<button disabled={pending} onClick={()=>run(()=>setCommerceStoreStatusAction(storeId,"ACTIVE"))} className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs text-cyan-300 hover:bg-white/5"><PlayCircle className="size-3.5"/> Reativar loja</button>:<button disabled={pending} onClick={()=>{if(confirm("Suspender o acesso desta loja?"))run(()=>setCommerceStoreStatusAction(storeId,"SUSPENDED"))}} className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs text-amber-300 hover:bg-white/5"><PauseCircle className="size-3.5"/> Suspender loja</button>}
    </div>:null}
  </div>;
}
