import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe, Handshake, LayoutDashboard, Store } from "lucide-react";
import { FRENTES, type ChaveFrente } from "@/lib/marcas/frentes";

type Linha = { chave: ChaveFrente; estado: "ligado" | "ligar" | "servico"; detalhe: string; acao: { rotulo: string; href: string } | null };

/** Estado de cada frente no painel (regra pura, testada). */
export function linhasDoEcossistema(m: { temSite: boolean; temLoja: boolean; temBusiness: boolean; formato: "SITE" | "LOJA" }): Linha[] {
  return [
    { chave: "commerce", estado: m.temLoja ? "ligado" : "ligar", detalhe: m.temLoja ? "Catálogo, carrinho, Pix e cartão no seu endereço." : "Venda online na mesma conta: liga no Plano do negócio.", acao: m.temLoja ? { rotulo: "Minha loja", href: "/merchant/storefront" } : { rotulo: "Ligar a loja virtual", href: "/merchant/negocio/plano#loja" } },
    { chave: "sites", estado: m.temSite ? "ligado" : "ligar", detalhe: m.temSite ? "Páginas, serviços e pedidos de orçamento com a origem." : "Site da empresa com desconto no segundo produto.", acao: m.temSite ? { rotulo: "Páginas do site", href: "/merchant/site/paginas" } : { rotulo: "Ver o site", href: "/merchant/negocio/plano#site" } },
    { chave: "business", estado: m.temBusiness ? "ligado" : "ligar", detalhe: m.temBusiness ? "Business Essencial: funil, atendimento e equipe." : "Funil de clientes, atendimento e equipe para quem cresceu.", acao: m.temBusiness ? { rotulo: "Clientes", href: "/merchant/crm" } : { rotulo: "Conhecer o Business", href: "/merchant/negocio/plano#business" } },
    { chave: "solucoes", estado: "servico", detalhe: "A equipe NextLevel monta, anuncia e cuida com você.", acao: { rotulo: "Pedir para a equipe", href: "/merchant/services" } },
  ];
}

const ICONES = { Store, Globe, LayoutDashboard, Handshake } as const;

/**
 * Cartão "Seu ecossistema NextLevel" (D336) na visão geral do Meu negócio: as quatro frentes, o que está ligado e o
 * próximo passo de cada uma, com um clique. Só com o NextLevel Business ligado na conta (`BUSINESS_V1`).
 */
export function CartaoEcossistema(props: Parameters<typeof linhasDoEcossistema>[0]) {
  const linhas = linhasDoEcossistema(props);
  return (
    <section aria-labelledby="eco-t" className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Uma conta, quatro portas</p>
          <h2 id="eco-t" className="mt-1 text-lg font-semibold">Seu ecossistema NextLevel</h2>
        </div>
        <Link href="/merchant/negocio/plano" className="text-sm font-semibold text-link underline underline-offset-4">Plano do negócio</Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {linhas.map((l) => {
          const f = FRENTES[l.chave]; const Icone = ICONES[f.icone];
          return (
            <li key={l.chave} className="flex flex-col rounded-xl border border-border p-4">
              <span className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-[var(--ds-link)]/10 text-[var(--ds-link)]"><Icone className="size-4" aria-hidden /></span>
                <b className="text-sm">{f.nome}</b>
              </span>
              <span className={`mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${l.estado === "ligado" ? "bg-success-soft text-success" : l.estado === "servico" ? "bg-surface-muted text-muted-foreground" : "bg-warning-soft text-warning"}`}>
                {l.estado === "ligado" ? <><CheckCircle2 className="size-3" aria-hidden />Ligado</> : l.estado === "servico" ? "Serviço da agência" : "Disponível"}
              </span>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{l.detalhe}</p>
              {l.acao ? <Link href={l.acao.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-link underline underline-offset-4">{l.acao.rotulo}<ArrowRight className="size-3.5" aria-hidden /></Link> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
