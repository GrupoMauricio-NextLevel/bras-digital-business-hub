import type { Metadata } from "next";
import { StorePage } from "@/components/storefront/store-page";

export const metadata: Metadata = { title: "Catálogo", description: "Todos os produtos da loja, com busca e categorias." };

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ category?: string; q?: string; sort?: string; produtos?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  return <StorePage slug={slug} page="collection" query={{ category: query.category, q: query.q, sort: query.sort, produtos: query.produtos }} />;
}
