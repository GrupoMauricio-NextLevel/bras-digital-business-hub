/**
 * Famílias de cor dos painéis (D328): uma cor fixa por assunto, igual em todos os painéis. Servem para ícone, mini
 * gráfico, brilho e série de gráfico; nunca para dizer "bom" ou "ruim" (isso é dos estados de sistema).
 * As variáveis CSS `--vida-*` em `src/design-system/vida.css` usam estes mesmos valores (o teste confere).
 */
export const CORES_VIDA = {
  dinheiro: { claro: "#1D5FD6", escuro: "#4D9BFF" },
  pedidos: { claro: "#0E7490", escuro: "#22D3EE" },
  clientes: { claro: "#6D28D9", escuro: "#A78BFA" },
  visitas: { claro: "#B45309", escuro: "#FBBF24" },
  crescimento: { claro: "#047857", escuro: "#34E89E" },
  festa: { claro: "#BE185D", escuro: "#F472B6" },
} as const;

export type FamiliaVida = keyof typeof CORES_VIDA;
