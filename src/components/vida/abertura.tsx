/**
 * Peças da abertura com vida (D331): a imagem de fundo do dono somada ao vidro roxo (mistura "screen", calma à
 * esquerda) e o anel de meta grande. Usadas no lojista, no Master e na Agência.
 */
export function FundoAbertura({ nome }: { nome: string }) {
  return <span className="vida-abertura-img" aria-hidden><picture><source srcSet={`/paineis/v1/${nome}.avif`} type="image/avif" /><img src={`/paineis/v1/${nome}.webp`} alt="" width={1584} height={672} decoding="async" fetchPriority="high" /></picture></span>;
}

/** Anel de meta (ex.: lojistas pagantes 3 de 10). Desenha uma vez; parado com "menos movimento". */
export function AnelMeta({ feito, meta, rotulo, tamanho = 132 }: { feito: number; meta: number; rotulo: string; tamanho?: number }) {
  const r = 52, pct = Math.min(1, meta > 0 ? feito / meta : 0);
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }} role="img" aria-label={`${rotulo}: ${feito} de ${meta}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="10" />
        {pct > 0 ? <circle className="vida-fatia" pathLength={1} cx="60" cy="60" r={r} fill="none" stroke="var(--vida-crescimento)" strokeWidth="10" strokeLinecap="round" style={{ strokeDasharray: `${pct} 1`, filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--vida-crescimento) 70%, transparent))" }} /> : null}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[2rem] font-bold tracking-[-.04em]" style={{ fontFamily: "var(--nl-font-display)" }}>{feito}<span className="text-base font-semibold opacity-70"> de {meta}</span></span>
      </span>
    </div>
  );
}
