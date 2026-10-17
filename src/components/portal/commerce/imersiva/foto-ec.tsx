import { EC_HOME_BASE, EC_HOME_FOTOS, type EcFotoNome } from "@/lib/marcas/ecommerce-home-imagens";

/**
 * Foto da home imersiva: AVIF com WebP de reserva nas duas larguras do manifesto, dimensões reservadas (sem salto de
 * layout) e a cor média da imagem como fundo enquanto carrega. `retrato`: a versão em pé entra no celular e no tablet em pé (até 1023 px).
 * Abaixo da dobra por padrão (`loading="lazy"`).
 */
export function FotoEc({ nome, retrato, alt, sizes = "100vw", prioridade = false, className, imgClassName }: {
  nome: EcFotoNome; retrato?: EcFotoNome; alt: string; sizes?: string; prioridade?: boolean; className?: string; imgClassName?: string;
}) {
  const f = EC_HOME_FOTOS[nome];
  const set = (n: EcFotoNome, ext: string) => EC_HOME_FOTOS[n].larguras.map((w) => `${EC_HOME_BASE}/${n}-${w}.${ext} ${w}w`).join(", ");
  return (
    <picture className={className} style={{ backgroundColor: f.cor }}>
      {retrato ? <source media="(max-width: 1023px)" type="image/avif" srcSet={set(retrato, "avif")} sizes="100vw" /> : null}
      {retrato ? <source media="(max-width: 1023px)" type="image/webp" srcSet={set(retrato, "webp")} sizes="100vw" /> : null}
      <source type="image/avif" srcSet={set(nome, "avif")} sizes={sizes} />
      <img src={`${EC_HOME_BASE}/${nome}-${f.larguras[1]}.webp`} srcSet={set(nome, "webp")} sizes={sizes} alt={alt} width={f.w} height={f.h}
        loading={prioridade ? "eager" : "lazy"} fetchPriority={prioridade ? "high" : undefined} decoding="async" className={imgClassName} />
    </picture>
  );
}
