import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EC_HOME_ACERVO, type EcHomeFotoNome } from "@/lib/marcas/ecommerce-home-imagens";
import { FotoImersiva } from "@/components/imersiva/foto";

export type OfertaCapa = { foto: EcHomeFotoNome; selo: string; titulo: string; texto: string; href: string };

/**
 * Galeria de ofertas (D198): cartões com foto lado a lado; o primeiro começa aberto e o cartão sob o mouse ou o foco do
 * teclado se abre (só CSS, sem JavaScript). No celular viram uma lista rolável com todos abertos.
 */
export function OfertasCapa({ titulo, itens }: { titulo: string; itens: OfertaCapa[] }) {
  return (
    <section id="portas" aria-labelledby="ofertas-t" className="ecc-ofertas">
      <h2 id="ofertas-t" className="ecc-h2 text-center">{titulo}</h2>
      <ul className="ecc-ofertas-lista">
        {itens.map((o) => (
          <li key={o.foto} className="ecc-oferta-card">
            <Link href={o.href}>
              <FotoImersiva acervo={EC_HOME_ACERVO} nome={o.foto} alt="" sizes="(min-width: 1024px) 36rem, 80vw" className="ecc-oferta-foto" imgClassName="size-full object-cover" />
              <span className="ecc-oferta-selo">{o.selo}</span>
              <span className="ecc-oferta-corpo">
                <b>{o.titulo}</b>
                <span>{o.texto}</span>
              </span>
              <ArrowUpRight className="ecc-oferta-seta size-5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
