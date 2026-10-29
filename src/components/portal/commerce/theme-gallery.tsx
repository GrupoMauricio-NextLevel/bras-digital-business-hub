"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatBRL } from "@/lib/money";

export type GalleryThemeRow = { key: string; name: string; priceCents: number; tagline: string; family: string; familyName: string; levelName: string; niche: string };

/**
 * Vitrine de temas da home (no lugar da lista só com nomes): captura real de cada tema no computador e no celular,
 * filtro por segmento, preço e link para a demonstração. Capturas em public/temas (e2e/temas-miniaturas.mjs).
 */
/** Famílias ainda sem imagens de campanha nas lojas de demonstração (D86): o cartão avisa, em vez de parecer vazio. */
const SEM_CAMPANHA = new Set(["casa", "beauty", "conecta", "atacado"]);
/** Ordem dos filtros: primeiro as famílias com demonstração completa. */
const ORDEM = ["moda", "sport", "base", "casa", "beauty", "conecta", "atacado"];

export function ThemeGallery({ themes, initial = 6, inicial = "moda" }: { themes: GalleryThemeRow[]; initial?: number; /** Filtro aberto ao chegar (Commerce v3: Moda, que tem demonstração completa). */ inicial?: string }) {
  const familias = Array.from(new Map(themes.map((t) => [t.family, t.familyName])).entries()).sort((a, b) => ORDEM.indexOf(a[0]) - ORDEM.indexOf(b[0]));
  const [familia, setFamilia] = React.useState<string>(themes.some((t) => t.family === inicial) ? inicial : "todos");
  const [todos, setTodos] = React.useState(false);
  const lista = themes.filter((t) => familia === "todos" || t.family === familia);
  const visiveis = todos ? lista : lista.slice(0, initial);
  return (
    <div>
      <div role="group" aria-label="Filtrar temas por segmento" className="mb-8 flex flex-wrap gap-2">
        {[["todos", "Todos"] as const, ...familias].map(([k, n]) => (
          <button key={k} type="button" aria-pressed={familia === k} onClick={() => { setFamilia(k); setTodos(false); }}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${familia === k ? "border-transparent bg-foreground text-surface" : "border-border bg-surface text-foreground hover:border-foreground/40"}`}>
            {n}{k === "todos" ? ` (${themes.length})` : ""}
          </button>
        ))}
      </div>
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visiveis.map((t) => (
          <li key={t.key} className="cm-theme-card">
            <Link href={`/temas/${t.key}`} className="group block rounded-[1.25rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <div className="cm-theme-shot">
                {/* eslint-disable-next-line @next/next/no-img-element -- captura estática do tema */}
                <img className="cm-desk" src={`/temas/${t.key}-desktop-3.webp`} alt="" loading="lazy" decoding="async" width={1280} height={800} />
                {/* eslint-disable-next-line @next/next/no-img-element -- captura estática do tema */}
                <img className="cm-mob" src={`/temas/${t.key}-mobile-3.webp`} alt="" loading="lazy" decoding="async" width={390} height={820} />
                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow ${t.priceCents === 0 ? "bg-success-soft text-success" : "bg-surface text-foreground"}`}>{t.priceCents === 0 ? "Grátis" : formatBRL(t.priceCents)}</span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-[family-name:var(--nl-font-display)] text-xl font-extrabold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.niche} · {t.levelName}</p>
                  <p className="mt-1 text-[15px] text-body">{t.tagline}</p>
                  {SEM_CAMPANHA.has(t.family) ? <p className="mt-1 text-xs text-muted-foreground">Imagens de demonstração deste segmento em produção.</p> : null}
                </div>
                <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-link group-hover:underline">Ver demonstração<ArrowUpRight className="size-4" aria-hidden /></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {lista.length > initial && !todos ? <div className="mt-10 text-center"><button type="button" onClick={() => setTodos(true)} className="min-h-12 rounded-full border border-border bg-surface px-6 font-semibold text-foreground hover:border-foreground/40">Ver todos os {lista.length} temas</button></div> : null}
    </div>
  );
}
