import { maiorDe, srcSetDe, type Acervo } from "@/lib/imersiva/acervo";

/**
 * Foto de uma página imersiva: AVIF com WebP de reserva nas duas larguras do acervo, dimensões reservadas (sem salto de
 * layout) e a cor média como fundo enquanto carrega. `retrato`: a versão em pé entra no celular e no tablet em pé (até
 * 1023 px). Abaixo da dobra por padrão (`loading="lazy"`). Foto "em espera" (`acervoEmEspera`): lugar reservado na cor da marca.
 */
export function FotoImersiva<N extends string>({ acervo, nome, retrato, alt, sizes = "100vw", prioridade = false, className, imgClassName }: {
  acervo: Acervo<N>; nome: N; retrato?: N; alt: string; sizes?: string; prioridade?: boolean; className?: string; imgClassName?: string;
}) {
  const f = acervo.fotos[nome];
  // Foto ainda em produção: lugar reservado na cor da marca, mesma proporção, sem texto (decorativo).
  if (f.espera) return <span className={className ? `${className} im-espera` : "im-espera"} style={{ aspectRatio: `${f.w} / ${f.h}` }} data-foto-espera={nome} aria-hidden />;
  return (
    <picture className={className} style={{ backgroundColor: f.cor }}>
      {retrato ? <source media="(max-width: 1023px)" type="image/avif" srcSet={srcSetDe(acervo, retrato, "avif")} sizes="100vw" /> : null}
      {retrato ? <source media="(max-width: 1023px)" type="image/webp" srcSet={srcSetDe(acervo, retrato, "webp")} sizes="100vw" /> : null}
      <source type="image/avif" srcSet={srcSetDe(acervo, nome, "avif")} sizes={sizes} />
      <img src={maiorDe(acervo, nome)} srcSet={srcSetDe(acervo, nome, "webp")} sizes={sizes} alt={alt} width={f.w} height={f.h}
        loading={prioridade ? "eager" : "lazy"} fetchPriority={prioridade ? "high" : undefined} decoding="async" className={imgClassName} />
    </picture>
  );
}
