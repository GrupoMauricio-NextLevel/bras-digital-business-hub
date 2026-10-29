import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Building2, Headset, Link2, Repeat, ShieldCheck, Wallet } from "lucide-react";
import type { Brand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { ganhoTexto, regrasDoParceiro } from "@/lib/domain/parceiros-ec";
import { formatBRL } from "@/lib/money";
import { SeloMercadoPago } from "@/components/portal/commerce/comparativo";
import { SimuladorParceiro } from "./simulador";
import "@/components/imersiva/imersiva.css";

const FAQ = [
  ["Quanto custa participar?", "Nada. O cadastro é gratuito e você recebe o seu link na hora."],
  ["Quando eu ganho?", "Quando a loja que você indicou paga a primeira mensalidade (o teste grátis não conta). Depois, a cada mensalidade paga, no prazo da sua regra."],
  ["Como viro agência parceira?", "Cadastre-se como parceiro e peça o selo de agência no seu painel, com o site ou Instagram da agência. A equipe NextLevel avalia em até 2 dias úteis."],
  ["Como recebo?", "As comissões ficam em garantia por alguns dias (para cobrir estornos) e depois ficam disponíveis para saque por Pix, no seu painel."],
  ["Posso indicar a mim mesmo?", "Não. Indicação da própria loja (mesmo CPF/CNPJ ou e-mail) não gera comissão."],
  ["Tem garantia de ganhos?", "Não. A renda depende das lojas que você indica e de elas continuarem assinando. O simulador mostra só as regras."],
] as const;

/**
 * Programa de Parceiros da NextLevel E-commerce (D220): página dedicada, com agências em destaque. Porcentagens das
 * regras vigentes do catálogo (Master); planos e preços do Master. Módulo próprio, pronto para a Soluções depois.
 */
export async function ParceirosEc({ brand }: { brand: Brand }) {
  const db = await getDb();
  const [ind, ag, pv] = await Promise.all([regrasDoParceiro(db, "AFFILIATE"), regrasDoParceiro(db, "AGENCY"), commercePlansView(db)]);
  const planos = pv.plans.filter((p) => !p.quote && p.monthlyCents).map((p) => ({ nome: p.name.replace(/^Commerce\s+/i, ""), mensalCents: p.monthlyCents! }));
  const cadastro = "/parceiros/cadastro";
  const prazo = (m: number) => (m >= 120 ? "enquanto o cliente ficar" : `por ${m} meses`);
  const exemplo = planos[1] ?? planos[0];
  return (
    <div className="im-tema-ecommerce">
      <section className="ec-cabecalho px-4 !pb-20 md:!pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="ec-tag"><i aria-hidden />Programa de Parceiros {brand.name}</p>
          <h1 className="ec-cabecalho-titulo mt-6 max-w-4xl">Indique lojas virtuais e ganhe <em>{ganhoTexto(ind.primeiraBps)}</em> na primeira mensalidade e <em>{ganhoTexto(ind.recorrenteBps)}</em> todo mês.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">Agências parceiras ganham <b className="text-white">{ganhoTexto(ag.primeiraBps)} + {ganhoTexto(ag.recorrenteBps)}</b> {prazo(ag.meses)}. E você indica uma plataforma fácil de recomendar: taxa zero da plataforma nas vendas com o Mercado Pago e um preço que vence a concorrência.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#12133a]">Quero ser parceiro <ArrowRight className="size-4" aria-hidden /></Link>
            <a href="#agencias" className="font-semibold underline underline-offset-4">Sou agência</a>
          </div>
          <div className="mt-10"><SeloMercadoPago escuro /></div>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-24" aria-labelledby="modelos-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Dois jeitos de ganhar</p>
          <h2 id="modelos-t" className="im-h2 mt-3 max-w-3xl text-foreground">Escolha como você quer crescer com a gente.</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="ec-cartao !p-8">
              <Link2 className="size-8 text-[var(--im-acao,var(--ds-primary))]" aria-hidden />
              <h3 className="mt-4 text-2xl font-extrabold text-foreground">Indicador</h3>
              <p className="mt-1 text-body">Para quem tem audiência ou indica de vez em quando: criadores, consultores, lojistas.</p>
              <p className="mt-6 font-[family-name:var(--nl-font-display)] text-5xl font-extrabold text-foreground">{ganhoTexto(ind.primeiraBps)} <span className="text-2xl text-muted-foreground">+ {ganhoTexto(ind.recorrenteBps)}</span></p>
              <p className="mt-1 text-sm text-body">da 1ª mensalidade, depois todo mês {prazo(ind.meses)}</p>
              {exemplo ? <p className="mt-4 rounded-2xl bg-surface-muted px-4 py-3 text-sm">Ex.: loja no {exemplo.nome} ({formatBRL(exemplo.mensalCents)}): <b>{formatBRL(Math.round(exemplo.mensalCents * ind.primeiraBps / 10_000))}</b> na 1ª e <b>{formatBRL(Math.round(exemplo.mensalCents * ind.recorrenteBps / 10_000))}</b> por mês depois.</p> : null}
              <Link href={cadastro} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 font-bold text-surface">Começar como indicador <ArrowRight className="size-4" aria-hidden /></Link>
            </article>
            <article id="agencias" className="ec-painel relative scroll-mt-20 p-8 text-white">
              <span className="absolute right-6 top-6 rounded-full bg-emerald-400 px-3 py-1 text-xs font-extrabold text-[#0b2a1d]">Mais ganhos</span>
              <Building2 className="size-8 text-emerald-300" aria-hidden />
              <h3 className="mt-4 text-2xl font-extrabold">Agência parceira</h3>
              <p className="mt-1 text-white/80">Para agências de marketing, social media e consultorias que cuidam de várias marcas.</p>
              <p className="mt-6 font-[family-name:var(--nl-font-display)] text-5xl font-extrabold">{ganhoTexto(ag.primeiraBps)} <span className="text-2xl text-white/70">+ {ganhoTexto(ag.recorrenteBps)}</span></p>
              <p className="mt-1 text-sm text-white/80">da 1ª mensalidade, depois todo mês {prazo(ag.meses)}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {[["Recorrência sem prazo enquanto o cliente ficar", Repeat], ["Selo de agência parceira no painel", BadgeCheck], ["Atendimento prioritário da equipe NextLevel para os seus clientes", Headset], ["Painel para acompanhar cada cliente e o que fazer para converter", Wallet]].map(([t, I]) => { const Icone = I as typeof Repeat; return <li key={t as string} className="flex gap-2"><Icone className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />{t as string}</li>; })}
              </ul>
              <Link href={cadastro} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 font-bold text-[#241263]">Cadastrar minha agência <ArrowRight className="size-4" aria-hidden /></Link>
              <p className="mt-3 text-xs text-white/70">Cadastre-se e peça o selo de agência no painel. A equipe aprova em até 2 dias úteis.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-canvas px-4 py-16 md:py-24" aria-labelledby="sim-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Simulador</p>
          <h2 id="sim-t" className="im-h2 mt-3 max-w-3xl text-foreground">Quanto a sua carteira pode render.</h2>
          <div className="mt-10"><SimuladorParceiro planos={planos} indicador={ind} agencia={ag} /></div>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-24" aria-labelledby="facil-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Fácil de recomendar</p>
          <h2 id="facil-t" className="im-h2 mt-3 max-w-3xl text-foreground">O seu cliente entende a vantagem na primeira conversa.</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[[Banknote, "Taxa zero da plataforma", "Com o checkout do Mercado Pago, parceiro oficial, a NextLevel não cobra taxa sobre as vendas: o lojista paga só a mensalidade."], [BadgeCheck, "Preço que vence a concorrência", `A partir de ${planos[0] ? formatBRL(planos[0].mensalCents) : "—"} por mês, no custo total, mais vantajosa que Nuvemshop, Loja Integrada, WBuy e Tray em todos os planos.`], [ShieldCheck, "Sem fidelidade e com teste", "O cliente testa antes e cancela quando quiser: menos objeção para você."], [Headset, "Vivência de rua no atacado", "Equipe NextLevel no Brás e no Canindé, perto dos lojistas: implantação, migração e suporte."]].map(([I, t, d]) => { const Icone = I as typeof Banknote; return <li key={t as string} className="ec-cartao"><span className="ec-icone"><Icone className="size-5" aria-hidden /></span><h3 className="mt-4 text-lg font-bold text-foreground">{t as string}</h3><p className="mt-2 text-sm text-body">{d as string}</p></li>; })}
          </ul>
          <Link href="/comparativo" className="mt-8 inline-flex items-center gap-2 font-semibold text-link underline underline-offset-4">Ver o comparativo com as outras plataformas <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </section>

      <section className="bg-canvas px-4 py-16 md:py-24" aria-labelledby="passos-t">
        <div className="mx-auto max-w-6xl">
          <h2 id="passos-t" className="im-h2 max-w-3xl text-foreground">Como funciona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[["Cadastre-se grátis", "Em 2 minutos você recebe o seu link e o texto pronto para o WhatsApp."], ["Indique", "Cada loja que entra pelo seu link fica ligada a você."], ["Acompanhe", "No painel, você vê quem está em teste e o que fazer para converter."], ["Receba por Pix", "Depois da garantia, o saldo fica disponível para saque."]].map(([t, d], i) => <li key={t} className="ec-cartao"><span className="ec-icone ec-num text-sm font-semibold">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-4 font-bold text-foreground">{t}</h3><p className="mt-1 text-sm text-body">{d}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-24" aria-labelledby="faq-t">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-t" className="im-h2 text-foreground">Perguntas frequentes</h2>
          <div className="ec-perguntas mt-8 space-y-3">{FAQ.map(([q, a]) => <details key={q} className="group"><summary className="cursor-pointer list-none font-semibold text-foreground">{q}</summary><p className="mt-2 text-sm text-body">{a}</p></details>)}</div>
          <div className="mt-10 flex flex-wrap items-center gap-4"><Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-6 font-bold text-surface">Quero ser parceiro <ArrowRight className="size-4" aria-hidden /></Link><Link href="/parceiros/termos" className="text-sm font-semibold underline underline-offset-4">Termos do programa</Link><Link href="/parceiros/entrar" className="text-sm font-semibold underline underline-offset-4">Já sou parceiro</Link></div>
        </div>
      </section>
    </div>
  );
}
