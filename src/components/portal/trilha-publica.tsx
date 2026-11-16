import Link from "next/link";
import { headers } from "next/headers";
import type { Brand } from "@/lib/brand";
import { THEME_CATALOG } from "@/lib/themes/catalog";
import { trilhaCommerce, trilhaJsonLd } from "@/lib/seo/paginas";
import { JsonLd } from "./json-ld";

/**
 * Trilha de navegação das páginas públicas da Commerce (D302): visível no rodapé ("Você está em: Início › Parceiros ›
 * Indique pelo CPF") e a mesma trilha em `BreadcrumbList` para o Google. A home e páginas fora da tabela não mostram nada.
 */
export async function TrilhaPublica({ brand }: { brand: Pick<Brand, "code" | "baseUrl" | "soon"> }) {
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) return null;
  const caminho = ((await headers()).get("x-nl-path") ?? "/").replace(/\/$/, "") || "/";
  const tema = /^\/temas\/([a-z0-9-]+)$/.exec(caminho)?.[1];
  const nomeTema = tema ? THEME_CATALOG.find((t) => t.key === tema)?.name : undefined;
  const elos = trilhaCommerce(caminho, nomeTema ? `Tema ${nomeTema}` : undefined);
  if (elos.length < 2) return null;
  return (
    <>
      <JsonLd data={trilhaJsonLd(brand.baseUrl, elos)} />
      <nav aria-label="Você está em" className="mb-3 text-xs">
        <span className="text-muted-foreground">Você está em: </span>
        <ol className="inline">
          {elos.map((e, i) => (
            <li key={e.caminho} className="inline">
              {i > 0 ? <span aria-hidden className="px-1">›</span> : null}
              {i === elos.length - 1 ? <span aria-current="page">{e.nome}</span> : <Link href={e.caminho} className="underline underline-offset-2">{e.nome}</Link>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
