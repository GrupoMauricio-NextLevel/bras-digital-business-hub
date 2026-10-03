import { rateLimit } from "@/lib/rate-limit";

/**
 * Freia tentativas de adivinhar senha (documentos 03 §18 e 10 §18): no máximo 20 tentativas por endereço (IP) e 8 por e-mail
 * a cada 15 minutos. O IP tem folga maior porque um escritório inteiro pode sair pelo mesmo endereço. O limitador é em
 * memória, por instância (src/lib/rate-limit.ts): reduz o abuso, mas não substitui um armazenamento compartilhado se houver várias instâncias.
 */
export const LOGIN_WINDOW_MS = 15 * 60_000;
export function allowLoginAttempt(ip: string, email: string, now = Date.now()): boolean {
  const byIp = rateLimit(`login-ip:${ip}`, 20, LOGIN_WINDOW_MS, now);
  const byMail = rateLimit(`login-mail:${email.trim().toLowerCase()}`, 8, LOGIN_WINDOW_MS, now);
  return byIp && byMail;
}
