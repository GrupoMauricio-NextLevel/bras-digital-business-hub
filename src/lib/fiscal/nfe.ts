/**
 * Chave de acesso da NF-e (44 dígitos): conferência do dígito verificador (módulo 11, pesos 2 a 9 da direita para a
 * esquerda). Sem consulta à Sefaz: só evita chave digitada errada (D114, nota no fardo).
 */
export function normalizeNfeKey(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidNfeKey(raw: string): boolean {
  const k = normalizeNfeKey(raw);
  if (k.length !== 44) return false;
  let sum = 0, w = 2;
  for (let i = 42; i >= 0; i--) { sum += Number(k[i]) * w; w = w === 9 ? 2 : w + 1; }
  const r = sum % 11;
  const dv = r < 2 ? 0 : 11 - r;
  return dv === Number(k[43]);
}

/** "3526 1047 1731 7300 0175 5500 1000 0000 0110 0000 0018" para leitura. */
export function formatNfeKey(raw: string): string {
  return normalizeNfeKey(raw).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** CNPJ do emitente (posições 7 a 20 da chave). */
export function nfeIssuerCnpj(raw: string): string {
  return normalizeNfeKey(raw).slice(6, 20);
}
