import { BlocoEquipe } from "@/components/portal/equipe/blocos";
import type { Metadata } from "next";
import { requireBrandFeature } from "@/lib/brand-server";
import { FotoOpcional } from "@/components/portal/imagem-em-criacao";
import { FLOW, MEMBER_FEES } from "../content";

export const metadata: Metadata = { title: "Como funciona", description: "Do pedido do cliente à entrega: o que cada papel faz na plataforma." };

/** Cena de cada passo (lote C da auditoria de imagens): publicar, vender e enviar. Passo sem cena fica só com o texto. */
const PASSO_FOTO: Record<number, { nome: string; alt: string }> = {
  0: { nome: "sd-passo-publica", alt: "Fornecedor fotografa um produto na bancada do estoque com o celular." },
  1: { nome: "sd-passo-vende", alt: "Lojista trabalhando em casa no notebook recebe o aviso de uma venda no celular." },
  3: { nome: "sd-passo-envia", alt: "Mãos fecham uma caixa de papelão com fita verde e colam a etiqueta de envio." },
};

export default async function ComoFunciona() {
  await requireBrandFeature("dropship");
  return (
    <>
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Como funciona</h1>
      <p className="mt-3 text-lg text-muted-foreground">Cada pessoa vê só o que precisa para fazer o seu trabalho.</p>
      <ol className="mt-10 space-y-4">
        {FLOW.map((s, i) => {
          const foto = PASSO_FOTO[i];
          return <li key={s.title} className="flex flex-wrap gap-4 rounded-xl border border-border p-5 sm:flex-nowrap sm:items-center"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-band font-bold text-reflection">{i + 1}</span><div className="min-w-0 flex-1"><h2 className="font-semibold">{s.title}</h2><p className="text-muted-foreground">{s.text}</p></div>{foto ? <FotoOpcional marca="commerce" nome={foto.nome} alt={foto.alt} ratio="4 / 3" priority={i === 0} className="w-full !rounded-lg sm:w-56 sm:shrink-0" /> : null}</li>;
        })}
      </ol>
      <h2 className="mt-14 font-[family-name:var(--nl-font-display)] text-2xl font-extrabold">Taxa por pedido do membro</h2>
      <p className="mt-2 text-muted-foreground">Percentual sobre o valor dos produtos, sem o frete. Estorno devolve a taxa; pedidos de teste não pagam.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">{MEMBER_FEES.map((f) => <li key={f.name} className="rounded-xl border border-border p-5"><p className="text-3xl font-extrabold tabular-nums">{f.fee}</p><h3 className="mt-1 font-semibold">{f.name}</h3><p className="text-sm text-muted-foreground">{f.text}</p></li>)}</ul>
    </div>
    <BlocoEquipe lugar="como-funciona" className="bg-surface" />
    </>
  );
}
