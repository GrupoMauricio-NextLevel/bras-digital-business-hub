import Link from "next/link";
import { ArrowUpRight, Gift, LayoutTemplate, Store, Wallet } from "lucide-react";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { storeThemes, themes } from "@/db/schema";
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
export default async function TemplatesPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const lancados = THEME_CATALOG.filter(isReleased);
  const uso = await db.select({ key: themes.key, n: count() }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).groupBy(themes.key);
  const emUso = uso.reduce((s, u) => s + Number(u.n), 0);
  const maisUsado = [...uso].sort((a, b) => Number(b.n) - Number(a.n))[0];
  const nome = (k: string) => THEME_CATALOG.find((t) => t.key === k)?.name ?? k;
  return (
    <>
      <PageHeader eyebrow="NextLevel E-commerce" title="Temas" description="Os temas que o lojista escolhe para a loja. Trocar de tema nunca apaga produtos, clientes nem pedidos."
        actions={<Link href="/temas" target="_blank" className="ds-btn ds-btn--secondary">Ver como o visitante vê <ArrowUpRight className="size-4" aria-hidden /></Link>} />
      <OperationalPulse className="mb-6" items={[
        { label: "Temas à venda", value: lancados.length, icon: LayoutTemplate, tone: "neutral", hint: `${THEME_CATALOG.length - lancados.length} em preparação` },
        { label: "Grátis", value: lancados.filter((t) => t.priceCents === 0).length, icon: Gift, tone: "info", hint: "entram no plano" },
        { label: "Pagos", value: lancados.filter((t) => t.priceCents > 0).length, icon: Wallet, tone: "info", hint: "pagamento único" },
        { label: "Lojas com tema", value: emUso, icon: Store, tone: emUso ? "success" : "neutral", hint: maisUsado ? `mais usado: ${nome(maisUsado.key)}` : "nenhuma ainda" },
      ]} />
      <ThemeGallery initial={12} themes={lancados.map((t) => ({ key: t.key, name: t.name, priceCents: t.priceCents, tagline: t.tagline, family: t.family, familyName: FAMILY_INFO[t.family].name, levelName: LEVEL_INFO[t.level].goal, niche: t.niche }))} />
    </>
  );
}
