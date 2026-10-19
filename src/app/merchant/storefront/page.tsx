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

export default async function StorefrontPage() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const commerce = (await perfilAtual(store.id)).ecommerce;
  const { current } = await getStoreTheme(store.id);
  const onboarding = computeOnboarding(store);
  const url = `/store/${store.slug}`;
  return (
    <>
      <PageHeader title="Loja virtual" description={commerce ? "Controle a vitrine que seus clientes acessam: publicação, endereço, aparência e prontidão da operação." : "Sua storefront white label. Conteúdo, produtos e pedidos são independentes do tema."} actions={<a href={url} target="_blank" rel="noreferrer" className={buttonVariants()}><ExternalLink /> Abrir loja</a>} />
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
          <Card>
            <CardHeader><div><CardTitle>Endereço</CardTitle><CardDescription>Domínio próprio disponível nos planos superiores.</CardDescription></div></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-muted-foreground"><Globe className="size-4" /> {url}</span><Badge tone="success">Ativo</Badge></div>
              <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">{store.customDomain ?? "Domínio próprio"}</span><StatusBadge value={store.domainStatus} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div><CardTitle>{commerce ? "Aparência ativa" : "Tema ativo"}</CardTitle><CardDescription>{commerce ? "A identidade visual não altera produtos, clientes ou pedidos." : "Troque sem perder dados."}</CardDescription></div></CardHeader>
            <CardContent className="text-sm"><div className="font-medium">{current?.theme.name ?? "Starter"}</div><div className="text-xs text-muted-foreground">Checklist da loja: {onboarding.percent}% concluído</div></CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
