import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { IntegracoesCompleto } from "@/components/portal/commerce/integracoes";
import { totalDeIntegracoes } from "@/lib/marcas/integracoes-publicas";
import "@/components/portal/commerce/commerce.css";

export const metadata: Metadata = {
  title: "Integrações",
  description: "Mercado Pago, Melhor Envio, Frenet, Correios com contrato, Google, Meta, TikTok, Tiny, Omie e mais: o que a loja conecta hoje e o que você precisa para ligar.",
};

/** Integrações da NextLevel E-commerce (D192): só o que já existe, com o que o lojista faz para ligar. */
export default async function IntegracoesPage() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) notFound();
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-link">Integrações</p>
      <h1 className="mt-3 max-w-3xl font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">{totalDeIntegracoes()} integrações prontas para a sua loja</h1>
      <p className="mt-4 max-w-2xl text-lg text-body">Pagamento, frete, anúncios, catálogos, ERP e atendimento. Tudo se liga no painel colando um código ou um token: sem programar e sem colar script.</p>
      <nav aria-label="Grupos" className="mt-8 flex flex-wrap gap-2 text-sm font-semibold">
        {[["pagamento", "Receber"], ["frete", "Entregar"], ["anuncios", "Anunciar"], ["catalogos", "Catálogos"], ["gestao", "Gestão"], ["atendimento", "Atender"], ["migrar", "Mudar de plataforma"]].map(([h, l]) => <a key={h} href={`#${h}`} className="rounded-full border border-border px-3.5 py-1.5 text-foreground hover:bg-surface-muted">{l}</a>)}
      </nav>
      <div className="mt-14"><IntegracoesCompleto /></div>
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6">
        <p className="max-w-xl text-body">Cada serviço usa a sua própria conta (Mercado Pago, transportadora, ERP). A conexão é conferida no próprio serviço, e senhas e tokens ficam guardados criptografados.</p>
        <Link href={cta} className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">{brand.signupOpen ? "Criar minha loja" : "Quero minha loja"}</Link>
      </div>
    </div>
  );
}
