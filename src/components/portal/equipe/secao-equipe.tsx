import type * as React from "react";
import type { BrandCode } from "@/lib/brand";
import { FotoImersiva } from "@/components/imersiva/foto";
import { EQUIPE_ACERVO } from "@/lib/marcas/equipe-imagens";
import { AVATAR_CEO, CEO, EQUIPE_ALT, secaoEquipeDaMarca } from "@/lib/marcas/equipe";
import { fraseDoCeo } from "@/lib/marcas/equipe-usos";

/**
 * "Quem está por trás" (D179): foto real da equipe na sede, o fato dito do jeito da marca e o CEO com rosto e nome.
 * Herda as cores da página onde entra (cada marca tem a sua paleta); `children` recebe links próprios da marca.
 */
export function SecaoEquipe({ code, nomeDaMarca, className = "", children }: { code: BrandCode; nomeDaMarca: string; className?: string; children?: React.ReactNode }) {
  const s = secaoEquipeDaMarca(code, nomeDaMarca);
  return (
    <section aria-labelledby="equipe-t" className={`scroll-mt-16 px-4 py-16 md:py-24 ${className}`}>
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <figure className="m-0">
          <FotoImersiva acervo={EQUIPE_ACERVO} nome={s.foto} alt={EQUIPE_ALT[s.foto]} sizes="(min-width: 768px) 36rem, 100vw" className="block overflow-hidden rounded-2xl" imgClassName="block h-auto w-full" />
          <figcaption className="mt-2 text-sm opacity-70">Equipe NextLevel na nossa sede, em São Paulo.</figcaption>
        </figure>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">Quem está por trás</p>
          <h2 id="equipe-t" className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{s.titulo}</h2>
          <p className="mt-4 text-lg leading-relaxed opacity-85">{s.texto}</p>
          <blockquote className="mt-5 border-l-2 border-current/25 pl-4 text-lg italic leading-relaxed opacity-90"><p>“{fraseDoCeo(code)}”</p></blockquote>
          <div className="mt-6 flex items-center gap-4">
            <picture className="shrink-0">
              <source type="image/avif" srcSet={`${AVATAR_CEO}-96.avif 96w, ${AVATAR_CEO}-192.avif 192w`} sizes="56px" />
              <img src={`${AVATAR_CEO}-192.webp`} srcSet={`${AVATAR_CEO}-96.webp 96w, ${AVATAR_CEO}-192.webp 192w`} sizes="56px" width={56} height={56} alt="" loading="lazy" decoding="async" className="size-14 rounded-full object-cover" />
            </picture>
            <p className="leading-snug"><span className="block font-semibold">{CEO.nome}</span><span className="block text-sm opacity-75">{CEO.cargo}</span></p>
          </div>
          {children ? <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
