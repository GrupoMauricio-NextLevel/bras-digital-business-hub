import Link from "next/link";
import type { ProdutoAgora } from "@/lib/domain/produtos-agora";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";

/** "Precisa de você agora" do catálogo (D211), no bloco único das telas do lojista (D212). */
export function ProdutosAgora({ itens, base, filtrando }: { itens: ProdutoAgora[]; base: string; filtrando: boolean }) {
  return (
    <PrecisaDeVoce
      itens={itens.map((u) => ({ id: u.id, titulo: u.nome, detalhe: u.motivo, tom: u.tom, href: `${base}/${u.id}`, acao: u.acao }))}
      vazio="Nenhum produto travando venda. Catálogo em dia." descricao="Produtos com algo que atrapalha a venda, do mais grave ao menos grave."
      verTodos={filtrando ? undefined : `${base}?ver=atencao`}
      acoes={filtrando ? <Link href={base} className="text-xs font-semibold text-[var(--ds-link)]">Ver todos os produtos</Link> : null}
    />
  );
}
