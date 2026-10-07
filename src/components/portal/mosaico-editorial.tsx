import { ImagemEmCriacao } from "@/components/portal/imagem-em-criacao";
import { Reveal } from "@/components/portal/reveal";

type Peca = { nome: string; alt: string; ratio: string; titulo: string; texto: string; posicao?: string };

/**
 * Mosaico editorial (assimétrico): uma foto grande e duas menores, cada uma com legenda curta do que acontece de verdade
 * no sistema. As fotos vêm de /public/portal/<marca>/v3 e, enquanto não existem, aparecem como "Imagem em criação".
 */
export function MosaicoEditorial({ marca, eyebrow, titulo, texto, pecas }: { marca: "superdrop" | "commerce"; eyebrow: string; titulo: string; texto: string; pecas: [Peca, Peca, Peca] }) {
  const [a, b, c] = pecas;
  const legenda = (p: Peca) => <figcaption className="mt-3"><b className="block text-base">{p.titulo}</b><span className="text-sm text-muted-foreground">{p.texto}</span></figcaption>;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Reveal>
        <p className="ds-pub-eyebrow">{eyebrow}</p>
        <h2 className="ds-pub-h2 mt-2 max-w-3xl">{titulo}</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{texto}</p>
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-[1.35fr_1fr] md:grid-rows-[auto_auto]">
        <Reveal as="article" className="md:row-span-2"><figure className="m-0"><ImagemEmCriacao marca={marca} nome={a.nome} alt={a.alt} ratio={a.ratio} posicao={a.posicao} />{legenda(a)}</figure></Reveal>
        <Reveal as="article" delay={120}><figure className="m-0"><ImagemEmCriacao marca={marca} nome={b.nome} alt={b.alt} ratio={b.ratio} posicao={b.posicao} />{legenda(b)}</figure></Reveal>
        <Reveal as="article" delay={220}><figure className="m-0"><ImagemEmCriacao marca={marca} nome={c.nome} alt={c.alt} ratio={c.ratio} posicao={c.posicao} />{legenda(c)}</figure></Reveal>
      </div>
    </div>
  );
}
