import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { CommerceStoreActions } from "@/components/commerce/commerce-store-actions";

export default async function CommerceStoresPage() {
  const session=await requireRole("NEXTLEVEL_MASTER"); const data=await getCommerceConsole(await getDb(),session.actor);
  return <><Header eyebrow="PORTFÓLIO" title="Lojas" text="Cada operação digital da NextLevel Commerce, sem fornecedores ou redes do SuperDrop."/>
    <div className="mt-10 border-t border-border">
      <div className="hidden grid-cols-[1.25fr_.55fr_.55fr_.75fr_auto] gap-4 border-b border-border py-3 text-[9px] tracking-[.18em] text-muted-foreground md:grid"><span>LOJA</span><span>PUBLICAÇÃO</span><span>ACESSO</span><span>DOMÍNIO</span><span className="text-right">GESTÃO</span></div>
      {data.stores.map(({store,access})=><div key={store.id} className="grid gap-3 border-b border-border py-5 md:grid-cols-[1.25fr_.55fr_.55fr_.75fr_auto] md:items-center">
        <div><div className="text-sm font-medium text-foreground">{store.name}</div><div className="mt-1 text-xs text-muted-foreground">/{store.slug}</div></div>
        <div className="text-xs text-muted-foreground">{store.publishedAt?"Publicada":"Rascunho"}</div>
        <div className="text-xs text-muted-foreground">{access.state}{access.daysLeft!==null?` · ${access.daysLeft}d`:""}</div>
        <div className="text-xs text-muted-foreground">{store.domainStatus==="CONNECTED"?(store.customDomain??"Conectado"):"Sem domínio próprio"}</div>
        <CommerceStoreActions storeId={store.id} status={store.status} slug={store.slug} canExtendTrial={access.state==="TRIAL" || access.state==="BLOCKED"} />
      </div>)}
      {!data.stores.length?<Empty/>:null}
    </div></>;
}
function Header({eyebrow,title,text}:{eyebrow:string;title:string;text:string}){return <div><div className="text-[10px] tracking-[.22em] text-[var(--product-accent-text)]">{eyebrow}</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">{title}</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">{text}</p></div>}
function Empty(){return <div className="py-12 text-sm text-muted-foreground">Nenhum registro Commerce encontrado.</div>}
