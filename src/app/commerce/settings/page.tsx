import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getBrandHub } from "@/lib/domain/commerce-hub";

export default async function CommerceSettingsPage(){
 const session=await requireRole("NEXTLEVEL_MASTER"); const hub=await getBrandHub(await getDb(),session.actor);
 return <><div><div className="text-[10px] tracking-[.22em] text-[var(--product-accent-text)]">PLATAFORMA</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Saúde da Commerce</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Infraestrutura necessária para operar a marca, receber assinaturas e manter as lojas no ar.</p></div>
 <div className="mt-10 border-t border-border">{hub.checks.map(c=><div key={c.key} className="grid gap-3 border-b border-border py-5 md:grid-cols-[24px_1fr_.25fr]"><span className={c.ok?"mt-1 size-2 bg-primary":"mt-1 size-2 bg-warning"}/><div><div className="text-sm font-medium text-foreground">{c.label}</div><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{c.hint}</p></div><div className={c.ok?"text-xs text-[var(--product-accent-text)]":"text-xs text-warning"}>{c.ok?"OK":c.severity==="blocker"?"BLOQUEIA":"RECOMENDADO"}</div></div>)}</div></>
}
