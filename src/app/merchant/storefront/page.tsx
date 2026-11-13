import { ExternalLink, Globe } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { requireStoreAdmin } from "@/lib/require-session";
import { computeOnboarding, getStoreTheme } from "@/lib/queries/merchant";
import { buttonVariants } from "@/components/ui/button";
import { PublishToggle } from "./publish-toggle";
import { Badge } from "@/components/ui/badge";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { getDb } from "@/db/client";
import { getStoreReadiness } from "@/lib/domain/readiness";
import { lojaVirtualAgora } from "@/lib/domain/loja-agora";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";
import { DominioProprio } from "@/components/app/dominio-proprio";
import { registrosDns } from "@/lib/domain/dominio-proprio";
import { dominioDoEmail } from "@/lib/domain/email-marca";
import { EmailDaMarca } from "@/components/app/email-da-marca";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const perfil = await perfilAtual(store.id);
  const commerce = perfil.ecommerce;
  // D234: domínio próprio liberado para todo lojista Commerce; no SuperDrop, a oferta decide.
  const podeDominio = perfil.pode.customDomain;
  const { current } = await getStoreTheme(store.id);
  const onboarding = computeOnboarding(store);
  const url = `/store/${store.slug}`;
  // D212: o que falta para vender (vermelho) e o que dá confiança ao cliente (amarelo), com o atalho para resolver.
  const agoraLoja = commerce ? lojaVirtualAgora((await getStoreReadiness(await getDb(), store.id)).items) : [];
  return (
    <>
      <PageHeader title="Loja virtual" description={commerce ? "Controle a vitrine que seus clientes acessam: publicação, endereço, aparência e prontidão da operação." : "Sua storefront white label. Conteúdo, produtos e pedidos são independentes do tema."} actions={<a href={url} target="_blank" rel="noreferrer" className={buttonVariants()}><ExternalLink /> Abrir loja</a>} />
      {commerce ? <PrecisaDeVoce itens={agoraLoja} vazio="Loja pronta: nada faltando para vender." descricao="O que falta para a loja vender e passar confiança." /> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader><div><CardTitle>{commerce ? "Sua loja para o cliente" : "Pré-visualização"}</CardTitle><CardDescription>{url}</CardDescription></div>{store.publishedAt ? <Badge tone="success" dot>Publicada</Badge> : <Badge tone="warning" dot>Não publicada</Badge>}</CardHeader>
          <CardContent><div className="overflow-hidden rounded-lg border border-border bg-surface-muted"><iframe title="Pré-visualização da loja" src={url} className="h-[560px] w-full bg-white" /></div></CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader><div><CardTitle>Publicação</CardTitle><CardDescription>{commerce ? "Quando publicada, sua vitrine fica disponível para receber clientes e pedidos." : "Controle se a loja está visível para clientes."}</CardDescription></div></CardHeader>
            <CardContent><PublishToggle published={!!store.publishedAt} /></CardContent>
          </Card>
          <Card id="dominio">
            <CardHeader><div><CardTitle>Endereço e domínio próprio</CardTitle><CardDescription>{podeDominio ? "Use o domínio da sua marca, em qualquer plano." : "Domínio próprio disponível nos planos superiores."}</CardDescription></div></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2 text-muted-foreground"><Globe className="size-4 shrink-0" /> <span className="truncate">{url}</span></span><Badge tone="success">Ativo</Badge></div>
              {podeDominio ? <DominioProprio dominio={store.customDomain} status={store.domainStatus} registros={store.customDomain ? registrosDns(store.customDomain) : []} enderecoAtual={url} /> : <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">{store.customDomain ?? "Domínio próprio"}</span><StatusBadge value={store.domainStatus} /></div>}
            </CardContent>
          </Card>
          {podeDominio && store.customDomain ? (
            <Card id="email">
              <CardHeader><div><CardTitle>E-mail com o seu domínio</CardTitle><CardDescription>Passe confiança: responda clientes com @{dominioDoEmail(store.customDomain)}.</CardDescription></div></CardHeader>
              <CardContent><EmailDaMarca dominioEmail={dominioDoEmail(store.customDomain)} /></CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader><div><CardTitle>{commerce ? "Aparência ativa" : "Tema ativo"}</CardTitle><CardDescription>{commerce ? "A identidade visual não altera produtos, clientes ou pedidos." : "Troque sem perder dados."}</CardDescription></div></CardHeader>
            <CardContent className="text-sm"><div className="font-medium">{current?.theme.name ?? "Starter"}</div><div className="text-xs text-muted-foreground">Checklist da loja: {onboarding.percent}% concluído</div></CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
