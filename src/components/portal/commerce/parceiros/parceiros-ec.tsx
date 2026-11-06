import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Boxes, Headset, ShieldCheck } from "lucide-react";
import type { Brand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { dadosDaCaptacao, PERFIS, PERFIL_LISTA, type PerfilCaptacao } from "@/lib/domain/captacao-parceiros";
import { formatBRL } from "@/lib/money";
import { SeloMercadoPago } from "@/components/portal/commerce/comparativo";
import { CaptacaoInterativa } from "./captacao-interativa";
import "@/components/imersiva/imersiva.css";

const faq = (saqueMinimo: string) => [
  ["Quanto custa participar?", "Nada. O cadastro é gratuito, não tem meta mensal nem taxa de manutenção. Você recebe o seu link na hora."],
  ["Quando eu ganho?", "Em toda mensalidade que a loja indicada pagar, desde a primeira (o teste grátis não conta), enquanto o cliente ficar."],
  ["Como funcionam os níveis?", "Contamos os seus clientes pagantes ativos: até 9, você ganha 20% de toda mensalidade (15% pelo CPF); com 10, 24% (19%); com 25, 28% (23%), sempre sobre a carteira inteira. O nível sobe na hora e só desce depois de 2 meses abaixo do mínimo."],
  ["Qual a diferença entre CPF e CNPJ?", "São duas frentes. Com CPF, você entra no Programa de Indicações: 15% de toda mensalidade, 19% com 10 clientes e 23% com 25. Com CNPJ, você é parceiro (criador, vendedor ou agência): 20%, 24% e 28%. Nos dois casos, saque por Pix sem anexar nota fiscal."],
  ["E a agência?", "Agência parceira é só com CNPJ e tem benefícios exclusivos, que a nossa equipe apresenta depois do cadastro."],
  ["Como recebo?", `As comissões ficam 30 dias em garantia (para cobrir estornos) e depois ficam disponíveis para saque por Pix a partir de ${saqueMinimo}, para o mesmo CPF ou CNPJ do cadastro. Não precisa de CNPJ para participar, e ninguém pede nota fiscal para te pagar.`],
  ["Tem campanha ou bônus?", "Não. A regra é a mesma o ano todo, para todo mundo: transparente e fácil de conferir no extrato."],
  ["Posso indicar a mim mesmo?", "Não. Indicação da própria loja (mesmo CPF/CNPJ ou e-mail) não gera comissão."],
  ["E se eu parar de indicar?", "Você continua recebendo a recorrência dos clientes ativos. O cadastro só fica inativo depois de 6 meses sem nenhum cliente ativo e sem nenhuma venda."],
  ["Tem garantia de ganhos?", "Não. A renda depende das lojas que você indica e de elas continuarem assinando. O simulador mostra só as regras."],
] as const;
const PAINEL = "/portal/commerce/parceiros/painel-parceiro-demo.webp";

/**
 * Página de captação de parceiros da NextLevel E-commerce (D252, PV4; base D220). Perfil inicial pela rota
 * (/parceiros, /parceiros/criadores, /parceiros/vendedores, /parceiros/agencias). Números das regras vigentes do catálogo.
 */
export async function ParceirosEc({ brand, perfil = "criador" }: { brand: Brand; perfil?: PerfilCaptacao }) {
  const db = await getDb();
  const [d, ajustes] = await Promise.all([dadosDaCaptacao(db), (await import("@/lib/domain/partners")).getPartnerSettings(db)]);
  const FAQ = faq(formatBRL(ajustes.minPayoutCents));
  const temPainel = existsSync(path.join(process.cwd(), "public", PAINEL));
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <div className="im-tema-ecommerce">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CaptacaoInterativa inicial={perfil} regras={d.regras} planos={d.planos} marca={brand.name} saqueMinimoCents={ajustes.minPayoutCents} atribuicaoDias={ajustes.attributionDays} />

      <section className="bg-surface px-4 py-16 md:py-24" aria-labelledby="facil-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Fácil de vender</p>
          <h2 id="facil-t" className="im-h2 mt-3 max-w-3xl text-foreground">O lojista entende a vantagem na primeira conversa.</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[[Banknote, "Taxa zero da plataforma", "Com o checkout do Mercado Pago, a NextLevel não cobra taxa sobre as vendas: o lojista paga só a mensalidade."], [BadgeCheck, "Mais vantajosa no custo total", `A partir de ${d.planos[0] ? formatBRL(d.planos[0].mensalCents) : "—"} por mês. O comparativo com as outras plataformas está aberto no site, com data e fonte.`], [Boxes, "Feita para o atacado", "Grade fechada e peça avulsa no mesmo produto, preço por quantidade, pedido mínimo e pedido do balcão."], [Headset, "Equipe no Brás", "Equipe NextLevel no Brás e no Canindé, perto dos lojistas: implantação, migração e suporte."]].map(([I, t, x]) => { const Icone = I as typeof Banknote; return <li key={t as string} className="ec-cartao"><span className="ec-icone"><Icone className="size-5" aria-hidden /></span><h3 className="mt-4 text-lg font-bold text-foreground">{t as string}</h3><p className="mt-2 text-sm text-body">{x as string}</p></li>; })}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-6"><Link href="/comparativo" className="inline-flex items-center gap-2 font-semibold text-link underline underline-offset-4">Ver o comparativo <ArrowRight className="size-4" aria-hidden /></Link><SeloMercadoPago /></div>
        </div>
      </section>

      {temPainel ? (
        <section className="ec-cabecalho px-4 py-16 md:py-24" aria-labelledby="painel-t">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_minmax(0,20rem)]">
            <div>
              <p className="ec-tag"><i aria-hidden />O seu escritório</p>
              <h2 id="painel-t" className="im-h2 mt-4 max-w-xl text-white">Tudo o que você precisa no celular.</h2>
              <ul className="mt-6 grid gap-3 text-white/85">
                {["O seu link e o texto pronto para o WhatsApp", "Quem está em teste, quem pagou e o que fazer para converter", "Comissões em garantia, disponíveis e saque por Pix", "O seu nível, quanto falta para o próximo e o desafio do mês"].map((t) => <li key={t} className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />{t}</li>)}
              </ul>
            </div>
            <figure className="mx-auto w-64 sm:w-72">
              <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-[#0b0c1f] bg-white shadow-2xl"><Image src={PAINEL} alt="Painel do parceiro no celular, com dados de demonstração" width={390} height={844} className="h-auto w-full" sizes="18rem" /></div>
              <figcaption className="mt-3 text-center text-xs text-white/60">Tela real do painel, com dados de demonstração.</figcaption>
            </figure>
          </div>
        </section>
      ) : null}

      <section className="bg-canvas px-4 py-16 md:py-24" aria-labelledby="passos-t">
        <div className="mx-auto max-w-6xl">
          <h2 id="passos-t" className="im-h2 max-w-3xl text-foreground">Como funciona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[["Cadastre-se grátis", "Em 4 passos rápidos: perfil, dados, um pouco sobre você e o aceite. O link sai na hora."], ["Indique", "Cada loja que entra pelo seu link ou cupom fica ligada a você."], ["Acompanhe e suba de nível", "No painel, você vê quem está em teste, o que fazer para converter e o seu nível."], ["Receba por Pix", "Depois da garantia de 30 dias, o saldo fica disponível para saque."]].map(([t, x], i) => <li key={t} className="ec-cartao"><span className="ec-icone ec-num text-sm font-semibold">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-4 font-bold text-foreground">{t}</h3><p className="mt-1 text-sm text-body">{x}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-24" aria-labelledby="faq-t">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-t" className="im-h2 text-foreground">Perguntas frequentes</h2>
          <div className="ec-perguntas mt-8 space-y-3">{FAQ.map(([q, a]) => <details key={q} className="group"><summary className="cursor-pointer list-none font-semibold text-foreground">{q}</summary><p className="mt-2 text-sm text-body">{a}</p></details>)}</div>
          <div className="mt-10 flex flex-wrap items-center gap-4"><Link href={`/parceiros/cadastro?perfil=${perfil}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-6 font-bold text-surface">Quero ser parceiro <ArrowRight className="size-4" aria-hidden /></Link><Link href="/parceiros/termos" className="text-sm font-semibold underline underline-offset-4">Termos do programa</Link><Link href="/parceiros/entrar" className="text-sm font-semibold underline underline-offset-4">Já sou parceiro</Link></div>
          <nav aria-label="Páginas por perfil" className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">{PERFIL_LISTA.map((k) => <Link key={k} href={PERFIS[k].rota} className="underline underline-offset-4 hover:text-foreground">Parceiros {k === "criador" ? "criadores" : k === "vendedor" ? "vendedores" : "agências"}</Link>)}</nav>
        </div>
      </section>
    </div>
  );
}
