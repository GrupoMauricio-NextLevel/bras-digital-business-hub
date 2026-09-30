import type { Metadata } from "next";
import { FAQ as FAQ_ALL } from "../content";
import { brandHas } from "@/lib/brand";
import { getBrand } from "@/lib/brand-server";

const FAQ_COMMERCE = [
  { q: "O que é a NextLevel Commerce?", a: "Uma plataforma de lojas virtuais da NextLevel Marketing, feita para quem vende moda no Brasil: temas bonitos, Pix e cartão, pedidos organizados e uma equipe que ajuda na implantação." },
  { q: "Como abro a minha loja?", a: "Deixe seus dados em \"Quero minha loja\". A equipe fala com você pelo WhatsApp, importa os seus produtos por planilha, escolhe o tema com você e publica a loja." },
  { q: "Como recebo dos clientes?", a: "Pelo Mercado Pago, com Pix como padrão e cartão em até 6x. O pagamento é conferido automaticamente." },
  { q: "Posso ter meu domínio e minha marca?", a: "Sim, no plano de loja própria você usa o seu domínio, sua logo e suas cores." },
  { q: "E o atacado, influenciadores e live?", a: "Estão em construção e chegam em etapas. Quem entra agora acompanha a evolução e ajuda a priorizar." },
];

export const metadata: Metadata = { title: "Perguntas frequentes" };

export default async function Faq() {
  const brand = await getBrand();
  const FAQ = brandHas(brand, "dropship") ? FAQ_ALL : FAQ_COMMERCE;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Perguntas frequentes</h1>
      <div className="mt-8 space-y-3">{FAQ.map((f) => <details key={f.q} className="rounded-xl border border-neutral-200 p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-neutral-600">{f.a}</p></details>)}</div>
    </div>
  );
}
