import Link from "next/link";
import QRCode from "qrcode";
import { Megaphone, Target } from "lucide-react";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { buttonVariants } from "@/components/ui/button";
import { modulosDoNegocio } from "@/lib/business/modulos";
import { CANAIS_LINK, campanhasDaLoja, linkDaCampanha, OBJETIVOS, type CanalLink } from "@/lib/business/campanhas";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { storeUrl } from "@/lib/store-url";
import { getBrand } from "@/lib/brand-server";
import { formatBRL } from "@/lib/money";
import { CampanhaCartao, NovaCampanha } from "./captacao-cliente";

export const dynamic = "force-dynamic";

/**
 * Captação (NB4, D339): páginas de campanha prontas em poucos cliques, os links para cada lugar onde a empresa anuncia,
 * o QR para materiais impressos e os números de cada campanha (contatos, fechados e valor), vindos de Contatos e orçamentos.
 */
export default async function Captacao({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const session = await requireStoreAdmin();
  const store = session.store!; const db = await getDb();
  const m = await modulosDoNegocio(db, store.id);
  if (!m.ativos.has("site")) return <><PageHeader title="Captação" /><EmptyState icon={Megaphone} title="A captação vem com o site" description="Com o site, você cria páginas de campanha para os seus anúncios e vê quantos clientes cada uma trouxe." action={<Link href="/merchant/negocio/plano#site" className={buttonVariants()}>Ver como ligar o site</Link>} /></>;
  const { nova } = await searchParams;
  // Link do anúncio precisa do endereço completo: sem domínio próprio, o da marca + /store/<slug>.
  const rel = storeUrl(store.slug, store.offer, store.customDomain, store.domainStatus);
  const base = rel.startsWith("/") ? `${(await getBrand()).baseUrl.replace(/\/$/, "")}${rel}` : rel;
  const lista = await campanhasDaLoja(db, store.id);
  const cartoes = await Promise.all(lista.map(async (c) => {
    const links = (Object.keys(CANAIS_LINK) as CanalLink[]).filter((k) => k !== "qr").map((k) => ({ canal: k, rotulo: CANAIS_LINK[k].rotulo, url: linkDaCampanha(base, c.slug, k) }));
    const urlQr = linkDaCampanha(base, c.slug, "qr");
    const qr = await QRCode.toString(urlQr, { type: "svg", margin: 1, width: 200, color: { dark: "#1c1917", light: "#ffffff" } });
    return { ...c, url: `${base.replace(/\/$/, "")}/${c.slug}`, links, qr, urlQr };
  }));
  const tot = lista.reduce((t, c) => ({ contatos: t.contatos + c.contatos, fechados: t.fechados + c.fechados, valor: t.valor + c.valorCents }), { contatos: 0, fechados: 0, valor: 0 });
  return (
    <>
      <PageHeader eyebrow={`${NOME_GERENCIADOR.nome} · Site`} title="Captação" description="Página de campanha pronta em poucos cliques, com o link certo para cada anúncio. Cada pedido chega em Contatos e orçamentos, com a campanha de onde veio." actions={<NovaCampanha objetivos={Object.entries(OBJETIVOS).map(([k, o]) => ({ chave: k, rotulo: o.rotulo, descricao: o.descricao }))} abrir={nova === "1" || !lista.length} />} />
      {lista.length ? <OperationalPulse className="mb-5" items={[
        { label: "Campanhas no ar", value: lista.filter((c) => c.noAr).length, icon: Megaphone, tone: "info", hint: `${lista.length} no total` },
        { label: "Contatos das campanhas", value: tot.contatos, icon: Target, tone: tot.contatos ? "success" : "neutral", hint: "desde o começo" },
        { label: "Fechados", value: tot.fechados, icon: Target, tone: tot.fechados ? "success" : "neutral", hint: tot.valor ? formatBRL(tot.valor) : "marque em Contatos" },
      ]} /> : null}
      {cartoes.length ? <ul className="space-y-4" aria-label="Páginas de campanha">{cartoes.map((c) => <li key={c.id}><CampanhaCartao c={c} /></li>)}</ul>
        : <EmptyState icon={Megaphone} title="Nenhuma página de campanha ainda" description="Crie a primeira: escolha o objetivo, escreva a oferta e a página fica pronta para o anúncio." />}
    </>
  );
}
