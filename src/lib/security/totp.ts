import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Código de 6 dígitos que muda a cada 30 segundos (TOTP, RFC 6238, HMAC-SHA1), o mesmo dos aplicativos autenticadores
 * (Google Authenticator, Microsoft Authenticator, 1Password). Feito com `node:crypto`, sem biblioteca nova (D183).
 */
const PASSO_S = 30;
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(buf: Buffer): string {
  let bits = 0, valor = 0, out = "";
  for (const byte of buf) {
    valor = (valor << 8) | byte; bits += 8;
    while (bits >= 5) { out += ALFABETO[(valor >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALFABETO[(valor << (5 - bits)) & 31];
  return out;
}

export function deBase32(txt: string): Buffer {
  const limpo = txt.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = 0, valor = 0;
  const out: number[] = [];
  for (const c of limpo) {
    const i = ALFABETO.indexOf(c);
    if (i < 0) throw new Error("base32 inválido");
    valor = (valor << 5) | i; bits += 5;
    if (bits >= 8) { out.push((valor >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

/** Segredo novo (160 bits), em base32 para o aplicativo. */
export const novoSegredoTotp = () => base32(randomBytes(20));

export function codigoTotp(segredo: string, quando = Date.now()): string {
  const contador = Math.floor(quando / 1000 / PASSO_S);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(contador / 2 ** 32), 0);
  msg.writeUInt32BE(contador >>> 0, 4);
  const h = createHmac("sha1", deBase32(segredo)).update(msg).digest();
  const off = h[h.length - 1]! & 15;
  const n = ((h[off]! & 127) << 24) | (h[off + 1]! << 16) | (h[off + 2]! << 8) | h[off + 3]!;
  return String(n % 1_000_000).padStart(6, "0");
}

/** Aceita o passo atual e um para cada lado (relógio do celular adiantado ou atrasado em até 30 s). */
export function confereTotp(segredo: string, codigo: string, quando = Date.now()): boolean {
  const c = codigo.replace(/\D/g, "");
  if (c.length !== 6) return false;
  return [-1, 0, 1].some((d) => codigoTotp(segredo, quando + d * PASSO_S * 1000) === c);
}

/** Endereço que o aplicativo lê pelo QR. */
export function enderecoTotp(segredo: string, conta: string, emissor = "NextLevel"): string {
  return `otpauth://totp/${encodeURIComponent(`${emissor}:${conta}`)}?secret=${segredo}&issuer=${encodeURIComponent(emissor)}&algorithm=SHA1&digits=6&period=${PASSO_S}`;
}

/** Códigos de recuperação: mostrados uma vez; no banco só o hash. */
export const hashRecuperacao = (codigo: string) => createHash("sha256").update(codigo.replace(/[^a-z0-9]/gi, "").toLowerCase()).digest("hex");
export function novosCodigosDeRecuperacao(n = 8): string[] {
  return Array.from({ length: n }, () => { const s = base32(randomBytes(5)).toLowerCase(); return `${s.slice(0, 4)}-${s.slice(4, 8)}`; });
}
