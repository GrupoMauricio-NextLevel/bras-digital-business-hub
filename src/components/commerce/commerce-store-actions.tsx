"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ExternalLink, Gift, MoreHorizontal, PauseCircle, PlayCircle, TimerReset } from "lucide-react";
import { extendCommerceTrialAction, setCommerceStoreStatusAction } from "@/app/actions/commerce-admin";
import { SupportEnterButton } from "@/components/support/support-enter";

export function CommerceStoreActions({ storeId, status, slug, canExtendTrial }: { storeId:string; status:string; slug:string; canExtendTrial:boolean }) {
  const router=useRouter(); const [open,setOpen]=React.useState(false); const [pending,start]=React.useTransition();
  const run=(fn:()=>Promise<{ok:boolean;error?:string}>)=>start(async()=>{const r=await fn(); if(!r.ok) toast.error(r.error??"Não foi possível concluir."); else {toast.success("Atualizado.");setOpen(false);router.refresh();}});
  return <div className="relative flex items-center justify-end gap-2">
    <SupportEnterButton storeId={storeId} name="o lojista" back="/commerce/stores" label="Ver como lojista" />
    <button onClick={()=>setOpen(!open)} className="flex size-9 items-center justify-center border border-border text-muted-foreground hover:text-foreground" aria-label="Ações"><MoreHorizontal className="size-4"/></button>
    {open?<div className="absolute right-0 top-11 z-20 w-56 border border-border bg-surface p-1 shadow-2xl">
      <a href={"/store/"+slug} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 px-3 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground"><ExternalLink className="size-3.5"/> Abrir loja pública</a>
      <Link href={`/commerce/temas?loja=${slug}#liberar`} className="flex h-10 items-center gap-2 px-3 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground"><Gift className="size-3.5"/> Liberar tema ou edição completa</Link>
      {canExtendTrial?<button disabled={pending} onClick={()=>run(()=>extendCommerceTrialAction(storeId,7))} className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground"><TimerReset className="size-3.5"/> +7 dias de teste</button>:null}
      {status==="SUSPENDED"?<button disabled={pending} onClick={()=>run(()=>setCommerceStoreStatusAction(storeId,"ACTIVE"))} className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs text-[var(--product-accent-text)] hover:bg-surface-hover"><PlayCircle className="size-3.5"/> Reativar loja</button>:<button disabled={pending} onClick={()=>{if(confirm("Suspender o acesso desta loja?"))run(()=>setCommerceStoreStatusAction(storeId,"SUSPENDED"))}} className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs text-warning hover:bg-surface-hover"><PauseCircle className="size-3.5"/> Suspender loja</button>}
    </div>:null}
  </div>;
}
