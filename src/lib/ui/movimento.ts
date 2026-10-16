/**
 * Movimento no JavaScript respeitando a preferência do sistema (D155): com "reduzir movimento", rolagens programáticas
 * são instantâneas. O CSS já desliga animações; `scrollIntoView({ behavior: "smooth" })` não obedece ao CSS, por isso este atalho.
 */
export const prefereMenosMovimento = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const comportamentoDeRolagem = (): ScrollBehavior => (prefereMenosMovimento() ? "auto" : "smooth");
