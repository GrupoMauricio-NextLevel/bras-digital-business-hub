/**
 * Famílias de cor dos painéis (D328): uma cor fixa por assunto, igual em todos os painéis. Servem para ícone, mini
 * gráfico, brilho e série de gráfico; nunca para dizer "bom" ou "ruim" (isso é dos estados de sistema).
 * Os valores moram em `src/design-system/themes.ts` (única fonte de cor) e viram as variáveis `--vida-*`.
 */
import { CORES_VIDA } from "@/design-system/themes";

export { CORES_VIDA };
export type FamiliaVida = keyof typeof CORES_VIDA;
