import { PageHeader } from "@/components/app/page-header";
import { ContentGrid } from "@/components/shared/content-grid";
import { requireAreaRole } from "@/lib/require-session";
import { getSupplierContent } from "@/lib/queries/supplier";
import { getDb } from "@/db/client";
import { networks } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function MerchantContentPage() {
  const session = await requireAreaRole("SUPERDROP", "MERCHANT_OWNER");
  const network = await (await getDb()).query.networks.findFirst({ where: eq(networks.id, session.store!.networkId) });
  const items = network ? await getSupplierContent(network.supplierId) : [];
  return (
    <>
      <PageHeader title="Conteúdo" description="Fotos, stories, banners, reels e campanhas prontos, fornecidos pela Central para você divulgar." />
      <ContentGrid items={items} />
    </>
  );
}
