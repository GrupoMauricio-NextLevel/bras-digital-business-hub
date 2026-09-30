import Link from "next/link";
import { CheckCircle2, ExternalLink, Globe, Palette, ShoppingBag, Truck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getOwnStore } from "@/lib/domain/own-store";
import { getPriceBook } from "@/lib/domain/finance";
import { storeUrl } from "@/lib/store-url";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { OwnStoreActions } from "./own-store-actions";
import { buttonVariants } from "@/components/ui/button";

/** Minha loja: o fornecedor vende o próprio catálogo direto ao público, com o mesmo estoque, o mesmo Mercado Pago e a mesma plataforma de envio. */
export default async function SupplierOwnStorePage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const supplier = session.supplier!;
  const db = await getDb();
  const own = await getOwnStore(db, supplier.id);
  const book = await getPriceBook(db);
  const wl = supplier.businessModel === "WHITE_LABEL";
  const catalog = own ? await listStoreCatalog(db, own.id, { onlyActive: false }) : [];
  const active = catalog.filter((c) => c.storeProduct.active).length;
  const url = own ? storeUrl(own.slug, own.offer, own.customDomain, own.domainStatus) : null;
  const mp = Boolean(supplier.walletMpTokenEnc);
  const ship = supplier.shippingStatus !== "NOT_CONFIGURED";
  return (
    <>
      <PageHeader title="Minha loja" description={wl ? "Sua loja virtual com a sua marca, para vender direto ao público. Configure o tema ou instale um tema pago." : "Sua loja virtual no subdomínio SuperDrop, para vender direto ao público com o mesmo catálogo."} actions={own ? <StatusBadge value={own.publishedAt ? "ACTIVE" : "DRAFT"} dot /> : null} />

      <div className="mb-6 grid gap-3 md:grid-cols-3" aria-label="Como a sua loja se conecta à operação">
        <Card><CardContent className="flex items-start gap-3 pt-5 text-sm"><Wallet className="mt-0.5 size-5 shrink-0 text-accent-foreground" aria-hidden /><div><div className="flex items-center gap-2 font-semibold">Mercado Pago {mp ? <CheckCircle2 className="size-4 text-success" aria-label="Conectado" /> : null}</div><p className="text-muted-foreground">{mp ? "A mesma conta das recargas recebe os pedidos da loja (Pix)." : "Conecte em Configurações: a mesma conta recebe recargas e pedidos da loja."}</p>{!mp ? <Link href="/supplier/settings" className="mt-1 inline-block font-medium underline">Conectar agora</Link> : null}</div></CardContent></Card>
        <Card><CardContent className="flex items-start gap-3 pt-5 text-sm"><Truck className="mt-0.5 size-5 shrink-0 text-accent-foreground" aria-hidden /><div><div className="flex items-center gap-2 font-semibold">Plataforma de envio {ship ? <CheckCircle2 className="size-4 text-success" aria-label="Conectada" /> : null}</div><p className="text-muted-foreground">{ship ? `${supplier.shippingProvider} · ${supplier.shippingAccount ?? ""}` : "Conecte SuperFrete ou Melhor Envio para gerar as etiquetas dos pedidos."}</p>{!ship ? <Link href="/supplier/settings" className="mt-1 inline-block font-medium underline">Conectar agora</Link> : null}</div></CardContent></Card>
        <Card><CardContent className="flex items-start gap-3 pt-5 text-sm"><ShoppingBag className="mt-0.5 size-5 shrink-0 text-accent-foreground" aria-hidden /><div><div className="font-semibold">Estoque único</div><p className="text-muted-foreground">Vendeu na sua loja, numa loja de membro ou por pedido manual: a baixa é no estoque central, na hora, em todos os canais.</p></div></CardContent></Card>
      </div>

      {!own ? (
        <Card>
          <CardHeader><div><CardTitle>Crie a sua loja</CardTitle><CardDescription>{wl ? "Como White Label, a loja usa a sua marca e o seu domínio. É só configurar o tema (ou comprar um tema pago na Loja NextLevel)." : "Você tem direito a uma loja no subdomínio SuperDrop. Ela já nasce com o tema Starter e o seu catálogo."}</CardDescription></div></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-inside list-disc text-muted-foreground"><li>Catálogo e estoque da Central, sem cadastro duplicado.</li><li>Preços de venda ao público definidos por você (sem a regra de estoque mínimo dos membros).</li><li>Pedidos entram na sua esteira como qualquer outro; o custo é interno.</li><li>Oferta da loja: {wl ? "Loja própria (White Label)" : "Loja SuperDrop (subdomínio)"} · mensalidade da loja inclusa no seu contrato{wl ? "" : `. Referência: ${book.offers.STORE_SUBDOMAIN.name}`}.</li></ul>
            <OwnStoreActions state="create" />
          </CardContent>
        </Card>
      ) : (
        <>
          <MetricGrid className="mb-6">
            <MetricCard label="Endereço" value={<span className="text-base">{url?.replace(/^https?:\/\//, "")}</span>} icon={Globe} hint={own.publishedAt ? "Publicada" : "Ainda não publicada"} />
            <MetricCard label="Produtos na loja" value={`${active} de ${catalog.length}`} icon={ShoppingBag} hint="Ativos para o público" />
            <MetricCard label="Oferta" value={wl ? "Loja própria" : "Loja SuperDrop"} icon={Palette} hint={wl ? "Editor completo e temas pagos" : "Editor básico; temas pagos na Loja NextLevel"} />
          </MetricGrid>
          <Card>
            <CardHeader><div><CardTitle>Painel da loja</CardTitle><CardDescription>Aparência, tema, produtos e preços, pedidos e clientes da sua loja ficam no painel da loja. Você volta ao painel do fornecedor com um clique.</CardDescription></div></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <OwnStoreActions state="enter" />
              {url ? <a href={url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink /> Ver a loja</a> : null}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
