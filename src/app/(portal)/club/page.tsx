import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { getCatalogItem } from "@/lib/domain/nl-catalog";
import { formatBRL } from "@/lib/money";
import { groupSiteUrl } from "@/lib/host-routing";
import { MARCAS } from "@/lib/marcas-visuais";
import { AberturaMarca, FechoMarca, NivelClub, VitrineMarca } from "@/components/portal/marca-institucional";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const m = MARCAS["nextlevel-club"];
  return { title: { absolute: "NextLevel Club · vantagens em todas as marcas do grupo" }, description: m.apoio, alternates: { canonical: `${groupSiteUrl()}/club` } };
}

/** NextLevel Club (D152): a marca do programa de vantagens; Club+ e Club Total são níveis dele, com preço só quando publicados no Financeiro. */
export default async function ClubPage() {
  const db = await getDb();
  const [plus, total] = await Promise.all([getCatalogItem(db, { key: "CLUB_PLUS" }), getCatalogItem(db, { key: "CLUB_TOTAL" })]);
  const preco = (p: typeof plus) => (p?.prices.MONTHLY?.amountCents != null ? `${formatBRL(p.prices.MONTHLY.amountCents)}/mês` : null);
  return (
    <>
      <AberturaMarca slug="nextlevel-club" eyebrow="Programa de vantagens do Grupo NextLevel" foto={{ nome: "cta-moment", posicao: "62% 50%", alt: "" }} ctas={[{ href: "/login", label: "Ver meus pontos", primary: true }, { href: "#niveis", label: "Conhecer os níveis" }]} />
      <VitrineMarca slug="nextlevel-club" titulo="Como o Club funciona" />
      <section id="niveis" className="bg-canvas pb-16" aria-labelledby="niveis-t">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="niveis-t" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight md:text-4xl">Os níveis do Club</h2>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">O Club é grátis para quem usa qualquer marca do grupo. Os níveis por assinatura somam vantagens e aparecem com preço quando forem publicados.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <NivelClub tier="club-plus" titulo="Club+" preco={preco(plus)} itens={plus?.content.scope ?? ["Pontos em dobro em todas as marcas", "Desconto nos planos das marcas do grupo", "Prioridade no atendimento"]} />
            <NivelClub tier="club-total" titulo="Club Total" preco={preco(total)} itens={total?.content.scope ?? ["Plano de entrada de todas as marcas do grupo", "Pontos em triplo"]} />
          </div>
        </div>
      </section>
      <FechoMarca slug="nextlevel-club" cta={{ href: "/login", label: "Entrar no meu painel" }} />
    </>
  );
}
