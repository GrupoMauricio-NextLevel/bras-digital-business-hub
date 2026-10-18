/**
 * SuperDrop (fase C do plano `docs/prompts/aplicacao-imersiva-todas-marcas.md`, D167): fonte única das cores públicas do
 * SuperDrop. Mesmos valores que já estavam espalhados na home v4 (marinho tirado das fotos do pacote e o verde da marca de
 * `brand-palette.ts`); nada muda na tela. A logo continua a de `public/brand/v2/superdrop` até a decisão do dono.
 */
export const SD = {
  code: "SUPERDROP",
  name: "SuperDrop",
  cores: { marinho: "#0D1B34", marinho2: "#16284A", verde: "#2D9E3B", verdeClaro: "#62C268", verdeTexto: "#03721D", papel: "#FBF8F1", claro: "#F4F7F2", suave: "#C5CEDC" },
} as const;

/** Variáveis `--sd-*` para a peça imersiva (`.im-tema-superdrop`) e para quem precisar das cores da marca no CSS. */
export function sdCssVars(): Record<string, string> {
  const c = SD.cores;
  return { "--sd-marinho": c.marinho, "--sd-marinho-2": c.marinho2, "--sd-verde": c.verde, "--sd-verde-claro": c.verdeClaro, "--sd-verde-texto": c.verdeTexto, "--sd-papel": c.papel, "--sd-claro": c.claro, "--sd-suave": c.suave };
}
