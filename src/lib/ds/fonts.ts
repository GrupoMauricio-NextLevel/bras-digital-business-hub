/** Famílias oferecidas nos temas. Só fontes já embutidas no sistema ou do sistema operacional: nada carrega de terceiros. */
export type FontChoice = { key: string; label: string; stack: string; sample: string };

export const FONT_CHOICES: FontChoice[] = [
  { key: "moderna", label: "Moderna", stack: "var(--nl-font-text), ui-sans-serif, system-ui, sans-serif", sample: "Camisa Tailandesa 25/26" },
  { key: "display", label: "Destaque", stack: "var(--nl-font-display), var(--nl-font-text), ui-sans-serif, sans-serif", sample: "Camisa Tailandesa 25/26" },
  { key: "elegante", label: "Elegante", stack: "Georgia, 'Times New Roman', ui-serif, serif", sample: "Camisa Tailandesa 25/26" },
  { key: "editorial", label: "Editorial", stack: "'Iowan Old Style', 'Palatino Linotype', Palatino, ui-serif, serif", sample: "Camisa Tailandesa 25/26" },
  { key: "condensada", label: "Condensada", stack: "'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', ui-sans-serif, sans-serif", sample: "CAMISA TAILANDESA 25/26" },
  { key: "tecnica", label: "Técnica", stack: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace", sample: "Camisa Tailandesa 25/26" },
];

export const fontStack = (key: string | undefined) => (FONT_CHOICES.find((f) => f.key === key) ?? FONT_CHOICES[0]!).stack;
