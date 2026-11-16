import Link from "next/link";
import { ArrowRight, Globe, Store } from "lucide-react";
import { CAMINHOS, NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";

/**
 * Os dois caminhos da entrada (NextLevel Business, NB1, D302/D304): site para a empresa ou loja virtual, com o mesmo
 * painel e o gerenciador do negócio nos dois. Só aparece com a chave BUSINESS_V1 ligada.
 */
export function DoisCaminhos({ signupOpen, className = "" }: { signupOpen: boolean; className?: string }) {
  const destino = (c: "site" | "loja") => (signupOpen ? `/cadastro?para=${c}` : c === "site" ? "/quero-meu-site" : "/quero-minha-loja?para=loja");
  const cartoes = [
    { c: "site" as const, Icone: Globe, itens: ["Páginas da empresa e dos serviços", "Pedidos de orçamento no painel", "Seu domínio próprio"] },
    { c: "loja" as const, Icone: Store, itens: ["Catálogo, carrinho, Pix e cartão", "Varejo e atacado na mesma loja", "Temas prontos para editar"] },
  ];
  return (
    <section aria-labelledby="caminhos-t" className={`scroll-mt-16 px-4 py-14 md:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">Por onde começar</p>
        <h2 id="caminhos-t" className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">O que o seu negócio precisa agora?</h2>
        <p className="mt-3 max-w-2xl text-body">Escolha o caminho. Nos dois, você cuida do dia a dia no <b>{NOME_GERENCIADOR.nome}</b>, o gerenciador do seu negócio: clientes, pedidos, atendimento e resultados num painel só. Dá para ligar o outro caminho depois, sem trocar de conta.</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {cartoes.map(({ c, Icone, itens }) => (
            <li key={c} className="ec-cartao flex flex-col !p-6">
              <span className="ec-icone grid size-11 place-items-center rounded-xl"><Icone className="size-5" aria-hidden /></span>
              <h3 className="mt-4 text-xl font-semibold">{CAMINHOS[c].titulo}</h3>
              <p className="mt-1 text-sm text-body">{CAMINHOS[c].descricao}</p>
              <ul className="mt-4 space-y-1.5 text-sm">{itens.map((i) => <li key={i} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--ds-link)]" />{i}</li>)}</ul>
              <Link href={destino(c)} className="mt-6 inline-flex items-center gap-2 font-semibold text-link underline underline-offset-4">
                {c === "site" ? "Quero um site para minha empresa" : "Quero minha loja virtual"}<ArrowRight className="size-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
