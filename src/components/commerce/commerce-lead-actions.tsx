"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLeadAction } from "@/app/actions/leads";

const OPTIONS=[["NEW","Novo"],["CONTACTED","Em contato"],["WON","Virou loja"],["LOST","Perdido"]] as const;
export function CommerceLeadActions({id,status}:{id:string;status:string}){
 const router=useRouter(); const [pending,start]=React.useTransition();
 return <select disabled={pending} value={status} onChange={(e)=>{const value=e.target.value as "NEW"|"CONTACTED"|"WON"|"LOST";start(async()=>{const r=await updateLeadAction(id,{status:value});if(!r.ok)toast.error(r.error);else{toast.success("Etapa atualizada.");router.refresh();}})}} className="h-9 border border-white/10 bg-[#0b0c0f] px-2 text-xs text-zinc-300 outline-none focus:border-cyan-400/50">{OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>;
}
