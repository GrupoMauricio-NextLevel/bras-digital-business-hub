import { metadadosDaPagina } from "@/lib/seo/metadados";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { IntegracoesCompleto } from "@/components/portal/commerce/integracoes";
import { totalDeIntegracoes } from "@/lib/marcas/integracoes-publicas";
import "@/components/portal/commerce/commerce.css";

export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/integracoes", {
  title: "Integrações",
  description: "Mercado Pago, Melhor Envio, Frenet, Correios com contrato, Google, Meta, TikTok, Tiny, Omie e mais: o que a loja conecta hoje e o que você precisa para ligar.",
});

/** Integrações da NextLevel Commerce (D192): só o que já existe, com o que o lojista faz para ligar. */
export default async function IntegracoesPage() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) notFound();
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  return (
    <>
    <CabecalhoTech rotulo="Integrações" titulo={<><em>{totalDeIntegracoes()} integrações</em> prontas para a sua loja</>} texto="Pagamento, frete, anúncios, catálogos, ERP e atendimento. Tudo se liga no painel colando um código ou um token: sem programar e sem colar script."
      dados={[{ rotulo: "Integrações", valor: String(totalDeIntegracoes()) }, { rotulo: "Grupos", valor: "7" }, { rotulo: "Programação", valor: "Zero" }]} />
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <nav aria-label="Grupos" className="flex flex-wrap gap-2 text-sm font-semibold">
        {[["pagamento", "Receber"], ["frete", "Entregar"], ["anuncios", "Anunciar"], ["catalogos", "Catálogos"], ["gestao", "Gestão"], ["atendimento", "Atender"], ["migrar", "Mudar de plataforma"]].map(([h, l]) => <a key={h} href={`#${h}`} className="ec-chip rounded-full border border-border px-3.5 py-1.5 text-foreground hover:bg-surface-muted">{l}</a>)}
      </nav>
      <div className="mt-14"><IntegracoesCompleto /></div>
      <div className="ec-painel mt-16 flex flex-wrap items-center justify-between gap-4 p-6 md:p-8">
        <p className="max-w-xl text-[#b9c6e4]">Cada serviço usa a sua própria conta (Mercado Pago, transportadora, ERP). A conexão é conferida no próprio serviço, e senhas e tokens ficam guardados criptografados.</p>
        <Link href={cta} className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">{brand.signupOpen ? "Criar minha loja" : "Quero minha loja"}</Link>
      </div>
    </div>
    </>
  );
}
