import Link from "next/link";
import { Globe } from "lucide-react";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { modulosDoNegocio } from "@/lib/business/modulos";
import { listarServicos } from "@/lib/business/servicos";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { ServicosCliente } from "./servicos-cliente";

export const dynamic = "force-dynamic";

/** Site → Serviços (NextLevel Business, NB2, D307): o que a empresa oferece; aparece na seção "Serviços" do site. */
export default async function ServicosDoSite() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const db = await getDb();
  if (!(await modulosDoNegocio(db, store.id)).ativos.has("site")) {
    return (
      <>
        <PageHeader eyebrow={`${NOME_GERENCIADOR.nome} · Site`} title="Serviços" />
        <EmptyState icon={Globe} title="O site ainda não está ligado no seu plano" description="Com o site, os seus serviços aparecem nas páginas da empresa com o botão de pedir orçamento." action={<Link href="/merchant/services" className={buttonVariants()}>Ver como ligar</Link>} />
      </>
    );
  }
  const servicos = (await listarServicos(db, store.id)).map((s) => ({ id: s.id, nome: s.nome, resumo: s.resumo ?? "", precoAPartirCents: s.precoAPartirCents, ativo: s.ativo, imagemUrl: s.imagemUrl ?? "" }));
  return (
    <>
      <PageHeader eyebrow={`${NOME_GERENCIADOR.nome} · Site`} title="Serviços" description="O que a sua empresa oferece. Aparecem na seção “Serviços” das páginas, com o botão de pedir orçamento pelo WhatsApp." />
      <ServicosCliente servicos={servicos} temWhatsapp={!!store.whatsapp} />
    </>
  );
}
