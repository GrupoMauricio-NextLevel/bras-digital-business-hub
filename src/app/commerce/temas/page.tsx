import Link from "next/link";
import { ArrowUpRight, Gift, LayoutTemplate, Store, Wallet } from "lucide-react";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { organizations, stores, storeThemes, themes } from "@/db/schema";
import { Select } from "@/components/ui/input";
import { LiberarTema } from "@/components/master/liberar-tema";
import { temasParaLiberar } from "@/lib/themes/liberar-equipe";
import { hasStorefront } from "@/lib/themes/license";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { ThemeGallery } from "@/components/portal/commerce/theme-gallery";
import { isReleased, THEME_CATALOG } from "@/lib/themes/catalog";
import { FAMILY_INFO, LEVEL_INFO } from "@/lib/themes/levels";

export const dynamic = "force-dynamic";

/**
 * Temas (D218): a mesma vitrine que o visitante vê na página pública (capturas reais no computador e no celular, filtro
 * por segmento e link para a demonstração), com os números que importam ao dono. Sem termos técnicos do motor de temas.
 */
export default async function CommerceTemasPage({ searchParams }: { searchParams: Promise<{ loja?: string }> }) {
  await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  // Liberar tema para uma loja (D329): a equipe escolhe a loja e libera sem custo ou com o pagamento recebido por fora.
  const { loja } = await searchParams;
  // Só lojas da NextLevel Commerce (o SuperDrop está fora desta tela).
  const lojas = (await db.select({ id: stores.id, slug: stores.slug, name: stores.name, offer: stores.offer, showcase: stores.showcaseTheme }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(organizations.brand, "NEXTLEVEL_COMMERCE")).orderBy(stores.name))
    .filter((l) => !l.showcase && hasStorefront(l));
  const escolhida = lojas.find((l) => l.slug === loja) ?? null;
  const liberar = escolhida ? await temasParaLiberar(db, escolhida.id) : null;
  const lancados = THEME_CATALOG.filter(isReleased);
  const uso = await db.select({ key: themes.key, n: count() }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).groupBy(themes.key);
  const emUso = uso.reduce((s, u) => s + Number(u.n), 0);
  const maisUsado = [...uso].sort((a, b) => Number(b.n) - Number(a.n))[0];
  const nome = (k: string) => THEME_CATALOG.find((t) => t.key === k)?.name ?? k;
  return (
    <>
      <PageHeader eyebrow="NextLevel Commerce" title="Temas" description="Os temas que o lojista escolhe para a loja. Trocar de tema nunca apaga produtos, clientes nem pedidos."
        actions={<Link href="/temas" target="_blank" className="ds-btn ds-btn--secondary">Ver como o visitante vê <ArrowUpRight className="size-4" aria-hidden /></Link>} />
      <OperationalPulse className="mb-6" items={[
        { label: "Temas à venda", value: lancados.length, icon: LayoutTemplate, tone: "neutral", hint: `${THEME_CATALOG.length - lancados.length} em preparação` },
        { label: "Grátis", value: lancados.filter((t) => t.priceCents === 0).length, icon: Gift, tone: "info", hint: "entram no plano" },
        { label: "Pagos", value: lancados.filter((t) => t.priceCents > 0).length, icon: Wallet, tone: "info", hint: "pagamento único" },
        { label: "Lojas com tema", value: emUso, icon: Store, tone: emUso ? "success" : "neutral", hint: maisUsado ? `mais usado: ${nome(maisUsado.key)}` : "nenhuma ainda" },
      ]} />
      <section id="liberar" className="mb-8 scroll-mt-24 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold">Liberar tema para uma loja</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha a loja e libere um tema pago sem custo (cortesia) ou registre o pagamento que o cliente fez por fora (entra no caixa). Também libera a Edição completa do editor.</p>
        <form method="get" action="/commerce/temas#liberar" className="mt-3 flex max-w-xl flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1"><label htmlFor="lt-loja" className="mb-1 block text-xs font-medium">Loja</label>
            <Select id="lt-loja" name="loja" defaultValue={escolhida?.slug ?? ""}>
              <option value="" disabled>Escolha a loja…</option>
              {lojas.map((l) => <option key={l.id} value={l.slug}>{l.name} (/{l.slug})</option>)}
            </Select>
          </div>
          <button type="submit" className="ds-btn ds-btn--secondary">Escolher</button>
        </form>
        {escolhida && liberar ? (
          <div className="mt-4 max-w-xl border-t border-border pt-4">
            <p className="mb-3 text-sm">Loja: <span className="font-semibold">{escolhida.name}</span> · tema ativo: <span className="font-medium">{nome(liberar.ativo)}</span>{liberar.editorCompleto ? " · Edição completa liberada" : ""}</p>
            <LiberarTema key={escolhida.id} via="master" storeId={escolhida.id} temas={liberar.temas} editorCompleto={liberar.editorCompleto} />
          </div>
        ) : null}
      </section>
      <ThemeGallery initial={12} themes={lancados.map((t) => ({ key: t.key, name: t.name, priceCents: t.priceCents, tagline: t.tagline, family: t.family, familyName: FAMILY_INFO[t.family].name, levelName: LEVEL_INFO[t.level].goal, niche: t.niche }))} />
    </>
  );
}
