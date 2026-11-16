import Link from "next/link";
import { FileText, Globe } from "lucide-react";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { modulosDoNegocio } from "@/lib/business/modulos";
import { listarPaginas, TIPO_ROTULO } from "@/lib/business/paginas";
import { MODELOS_SITE } from "@/lib/business/modelos-site";
import { storeUrl } from "@/lib/store-url";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { AplicarModelo, ListaDePaginas, NovaPagina } from "./paginas-cliente";

export const dynamic = "force-dynamic";

/** Site → Páginas (NextLevel Business, NB2, D307): as páginas do site da empresa, com modelo pronto em um clique. */
export default async function PaginasDoSite() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const db = await getDb();
  const m = await modulosDoNegocio(db, store.id);
  if (!m.ativos.has("site")) {
    return (
      <>
        <PageHeader eyebrow={`${NOME_GERENCIADOR.nome} · Site`} title="Páginas do site" />
        <EmptyState icon={Globe} title="O site ainda não está ligado no seu plano" description="Com o site, você cria as páginas da empresa (Sobre, Serviços, Contato) e recebe pedidos de orçamento no painel." action={<Link href="/merchant/negocio/plano" className={buttonVariants()}>Ver como ligar</Link>} />
      </>
    );
  }
  const paginas = await listarPaginas(db, store.id);
  const base = storeUrl(store.slug, store.offer, store.customDomain, store.domainStatus);
  const linhas = paginas.map((p) => ({
    id: p.id, titulo: p.titulo, slug: p.slug, tipo: TIPO_ROTULO[p.tipo], noMenu: p.noMenu, arquivada: !!p.arquivadaEm,
    situacao: p.arquivadaEm ? "Arquivada" : !p.published ? "Rascunho, ainda não publicada" : p.draft ? "No ar, com mudanças por publicar" : "No ar",
    noAr: !!p.published && !p.arquivadaEm, url: `${base.replace(/\/$/, "")}/${p.slug}`,
  }));
  return (
    <>
      <PageHeader eyebrow={`${NOME_GERENCIADOR.nome} · Site`} title="Páginas do site" description="As páginas da sua empresa. O conteúdo você muda no editor; publicar coloca as mudanças no ar." actions={<Link href="/theme-editor" className={buttonVariants({ variant: "secondary" })}>Abrir o editor</Link>} />
      {linhas.length ? <ListaDePaginas linhas={linhas} /> : (
        <EmptyState icon={FileText} title="Nenhuma página ainda" description="Comece por um modelo pronto ou crie uma página em branco abaixo." />
      )}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <NovaPagina />
        <AplicarModelo modelos={Object.entries(MODELOS_SITE).map(([chave, v]) => ({ chave, nome: v.nome, descricao: v.descricao }))} />
      </div>
    </>
  );
}
