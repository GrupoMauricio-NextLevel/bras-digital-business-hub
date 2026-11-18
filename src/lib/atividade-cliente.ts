/**
 * Consultas automáticas só com gente na tela (2026-11-18). Cada consulta acorda o banco (Neon cobra por hora acordado e
 * o plano grátis acabou em 17 dias por causa de abas esquecidas abertas). Regra única para todos os "ao vivo":
 * consulta só se a aba está visível e alguém mexeu (toque, clique, tecla ou rolagem) nos últimos minutos.
 * Voltou a mexer, volta a consultar no próximo ciclo. Só no navegador.
 */
let ultimaAtividade = Date.now();
let ligado = false;

function ligar() {
  if (ligado || typeof window === "undefined") return;
  ligado = true;
  const marcar = () => { ultimaAtividade = Date.now(); };
  for (const ev of ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const) window.addEventListener(ev, marcar, { passive: true, capture: true });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") marcar(); });
}

/** Padrão: 10 minutos sem mexer = pausa. */
export const PAUSA_PADRAO_MS = 10 * 60_000;

/**
 * Pode consultar agora? `mesmoEscondida` serve para quem avisa com notificação do sistema (aba em segundo plano),
 * mas ainda assim para depois de `semAtividadeMs` sem ninguém mexer.
 */
export function podeConsultar(opts: { semAtividadeMs?: number; mesmoEscondida?: boolean } = {}): boolean {
  if (typeof document === "undefined") return false;
  ligar();
  if (!opts.mesmoEscondida && document.visibilityState !== "visible") return false;
  return Date.now() - ultimaAtividade < (opts.semAtividadeMs ?? PAUSA_PADRAO_MS);
}

/** Marca atividade agora (ex.: quando o componente que consulta acabou de abrir). */
export function marcarAtividade() { ligar(); ultimaAtividade = Date.now(); }
