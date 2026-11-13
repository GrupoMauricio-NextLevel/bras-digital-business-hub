import { metadadosDaPagina } from "@/lib/seo/metadados";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { BlocoEquipe } from "@/components/portal/equipe/blocos";
import type { Metadata } from "next";
import { FAQ as FAQ_ALL } from "../content";
import { brandHas } from "@/lib/brand";
import { getBrand } from "@/lib/brand-server";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { beneficiosPorPlano, NOME_PLANO_BENEFICIO, PLANOS_BENEFICIO } from "@/lib/domain/beneficios-plano";
import { LIMITES_ATACADO } from "@/lib/domain/atacado";
import { faqCommerce, faqJsonLd } from "@/lib/seo/faq-commerce";
import { JsonLd } from "@/components/portal/json-ld";

export const dynamic = "force-dynamic";

/** Fatos do sistema para as perguntas da Commerce (D290): planos e oferta do Master, benefícios e limites do atacado. */
async function perguntasCommerce() {
  const db = await getDb();
  const [pv, beneficios] = await Promise.all([commercePlansView(db), beneficiosPorPlano(db)]);
  return faqCommerce({
    diasDeTeste: pv.offer?.trialDays ?? null,
    planos: PLANOS_BENEFICIO.map((key) => {
      const p = pv.plans.find((x) => x.key === key);
      const b = beneficios[key];
      return { nome: NOME_PLANO_BENEFICIO[key], mensalCents: p?.monthlyCents ?? null, taxaBps: p?.feeBps ?? null, suporte: b.suporte, migracao: b.migracao, faixasAtacado: LIMITES_ATACADO[key].faixas, produtos: b.produtos };
    }),
  });
}

export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/faq", { title: "Perguntas frequentes" });

export default async function Faq() {
  const brand = await getBrand();
  const commerce = brand.code === "NEXTLEVEL_COMMERCE";
  const FAQ = commerce ? await perguntasCommerce() : brandHas(brand, "dropship") ? FAQ_ALL : [];
  return (
    <>
    {commerce ? <JsonLd data={faqJsonLd(FAQ)} /> : null}
    {commerce ? <CabecalhoTech rotulo="Dúvidas" titulo={<>Perguntas <em>frequentes</em></>} texto="As respostas diretas sobre loja, pagamento, planos e atendimento. Não achou? A equipe responde no WhatsApp." /> : null}
    <div className="mx-auto max-w-3xl px-4 py-16">
      {brand.code === "NEXTLEVEL_COMMERCE" ? null : <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Perguntas frequentes</h1>}
      <div className="ec-perguntas mt-8 space-y-3">{FAQ.map((f) => <details key={f.q} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-muted-foreground">{f.a}</p></details>)}</div>
    </div>
    <BlocoEquipe lugar="faq" className="bg-surface" contatos mensagem={`Olá! Tenho uma dúvida sobre a ${brand.name}.`} />
    </>
  );
}
