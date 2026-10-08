import { themeAreaCss, type ThemeKey } from "@/design-system/themes";
import { brandAreaCssVars } from "@/lib/brand-palette";

/**
 * Cor de uma área com marca própria, independente do endereço (Estúdio da Brás aberto pelo Master, Meu Brás).
 * Fica no layout da área: entra e sai com ela, então voltar ao Master devolve a cor do Master.
 */
export function AreaTheme({ theme, brand }: { theme: ThemeKey; brand: string }) {
  return <style dangerouslySetInnerHTML={{ __html: themeAreaCss(theme) + brandAreaCssVars(brand) }} />;
}
