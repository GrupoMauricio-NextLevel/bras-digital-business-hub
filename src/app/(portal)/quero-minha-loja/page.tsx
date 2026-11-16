import { metadadosDaPagina } from "@/lib/seo/metadados";
import { BlocoEquipe } from "@/components/portal/equipe/blocos";
import type { Metadata } from "next";
import Link from "next/link";
import { getBrand } from "@/lib/brand-server";
import { supportContacts } from "@/lib/support";
import { LeadForm } from "./lead-form";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { businessLigado } from "@/lib/business/modulos";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";


export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  if (brand.code === "NEXTLEVEL_COMMERCE") return metadadosDaPagina("/quero-minha-loja");
  return { title: "Quero minha loja", description: `Deixe seus dados e a equipe da ${brand.name} ajuda você a abrir a sua loja virtual.` };
}

export default async function QueroMinhaLoja({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const brand = await getBrand();
  const { para } = await searchParams;
  const c = supportContacts();
  const whats = c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Quero abrir a minha loja na ${brand.name}.`)}`) : null;
  // D218: duas colunas no padrão da home (o que acontece depois + formulário em cartão). Texto da marca vem de getBrand().
  const PASSOS: [string, string][] = [
    ["Você conta sobre o seu negócio", "Leva um minuto. Só nome, e-mail e WhatsApp são obrigatórios."],
    ["A equipe chama no WhatsApp", "Uma pessoa de verdade entende o que você vende e indica o plano certo."],
    ["Sua loja no ar", "Você monta sozinho com o editor ou a equipe monta com você."],
  ];
  const ec = brand.code === "NEXTLEVEL_COMMERCE" && !brand.soon;
  // NextLevel Business (NB1, D306): com a chave ligada, a entrada pergunta o caminho (site para a empresa ou loja virtual).
  const doisCaminhos = ec && businessLigado();
  const site = doisCaminhos && para === "site";
  if (doisCaminhos) PASSOS.splice(2, 1, [site ? "Seu site no ar" : "Seu site ou sua loja no ar", `Você monta sozinho com o editor ou a equipe monta com você. Em qualquer caminho, você cuida do negócio no ${NOME_GERENCIADOR.nome}.`]);
  return (
    <>
    {ec ? <CabecalhoTech rotulo={brand.name} titulo={site ? <>Quero um <em>site para minha empresa</em></> : doisCaminhos && para !== "loja" ? <>Quero meu <em>site ou loja virtual</em></> : <>Quero minha <em>loja virtual</em></>} texto={`Conte um pouco sobre o seu negócio. A equipe da ${brand.name} fala com você pelo WhatsApp para combinar a implantação.`}
      dados={[{ rotulo: "Para preencher", valor: "1 min" }, { rotulo: "Taxa da plataforma", valor: "0%" }, { rotulo: "Fidelidade", valor: "Nenhuma" }]} /> : null}
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16 lg:py-20">
      <div>
        {ec ? <p className="im-eyebrow im-eyebrow--claro">O que acontece depois</p> : <><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--ds-link)]">{brand.name}</p>
        <h1 className="mt-3 font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">{brand.soon ? brand.soon.leadTitle : "Quero minha loja"}</h1></>}
        <p className={ec ? "hidden" : "mt-4 max-w-xl text-lg text-body"}>{brand.soon ? `O ${brand.name} ainda está sendo construído. Conte um pouco sobre o seu negócio e a equipe avisa quando abrir.` : `Conte um pouco sobre o seu negócio. A equipe da ${brand.name} fala com você pelo WhatsApp para combinar a implantação.`}</p>
        {brand.soon ? null : (
          <ol className={ec ? "mt-6 space-y-6" : "mt-10 space-y-6"} aria-label="O que acontece depois">
            {PASSOS.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className={ec ? "ec-icone ec-num shrink-0 text-sm font-semibold" : "grid size-10 shrink-0 place-items-center rounded-full bg-[var(--ds-primary)] text-sm font-extrabold text-[var(--ds-primary-contrast)]"}>{ec ? String(i + 1).padStart(2, "0") : i + 1}</span>
                <span><b className="block text-base">{t}</b><span className="text-sm text-body">{d}</span></span>
              </li>
            ))}
          </ol>
        )}
        {brand.soon ? null : <ul className="mt-10 flex flex-wrap gap-2 text-sm" aria-label="Garantias">{["Sem fidelidade", "Pix e cartão direto na sua conta", "Equipe de verdade em São Paulo"].map((g) => <li key={g} className="ec-chip rounded-full border border-border px-3 py-1.5 font-semibold">{g}</li>)}</ul>}
      </div>
      <div className={ec ? "ec-cartao h-fit !p-6 shadow-[0_30px_70px_-40px_rgb(16_26_51/0.45)] sm:!p-8" : "ds-card h-fit p-6 sm:p-8"}>
        <h2 className="text-lg font-bold">Seus dados</h2>
        <LeadForm brandName={brand.name} accent={brand.primaryColor} perguntarCaminho={doisCaminhos} caminhoInicial={para === "site" || para === "loja" ? para : undefined} />
        <p className="mt-6 text-sm text-muted-foreground">Prefere conversar agora? {whats ? <a className="font-semibold underline" href={whats} target="_blank" rel="noreferrer">Chame no WhatsApp</a> : c.email ? <a className="font-semibold underline" href={`mailto:${c.email}`}>{c.email}</a> : "Fale com a equipe pelos canais do rodapé."} Já tem conta? <Link href="/login" className="font-semibold underline">Entrar</Link></p>
      </div>
    </div>
    {brand.soon ? null : <BlocoEquipe lugar="quero-minha-loja" className="bg-surface" />}
    </>
  );
}
