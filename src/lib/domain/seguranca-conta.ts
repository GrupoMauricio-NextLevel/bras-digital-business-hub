import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { users, type User } from "@/db/schema";
import { decryptSecret, encryptSecret, signToken, verifyToken } from "@/lib/security/crypto";
import { confereTotp, enderecoTotp, hashRecuperacao, novosCodigosDeRecuperacao, novoSegredoTotp } from "@/lib/security/totp";
import { DomainError } from "./errors";

/**
 * Segurança da conta (W0, D183): sair dos outros aparelhos, último acesso e verificação em duas etapas (código do
 * aplicativo autenticador). Na W0 as duas etapas valem para a equipe do Master; o lojista ganha na W6.
 */

/** Soma 1 na versão das sessões: todas as sessões abertas com a versão antiga deixam de valer. Devolve a nova versão. */
export async function sairDosOutrosAparelhos(db: Database, userId: string): Promise<number> {
  const [r] = await db.update(users).set({ sessionVersion: sql`${users.sessionVersion} + 1` }).where(eq(users.id, userId)).returning({ v: users.sessionVersion });
  if (!r) throw new DomainError("NOT_FOUND", "Conta não encontrada.");
  return r.v;
}

/** A sessão vale só com a versão atual da conta. Cookie antigo, sem versão, conta como 0. */
export const versaoDaSessaoValida = (versaoDoCookie: number | undefined, versaoDaConta: number) => (versaoDoCookie ?? 0) === versaoDaConta;

/** Quem pode ligar as duas etapas agora. Na W0, só a equipe do Master. */
export const podeUsarDuasEtapas = (u: Pick<User, "role">) => u.role === "NEXTLEVEL_MASTER";
export const temDuasEtapas = (u: Pick<User, "totpEnabledAt">) => !!u.totpEnabledAt;

/** Começa a ativação: gera o segredo (guardado criptografado, ainda desligado) e devolve o endereço para o QR. */
export async function iniciarDuasEtapas(db: Database, user: User): Promise<{ segredo: string; endereco: string }> {
  if (!podeUsarDuasEtapas(user)) throw new DomainError("FORBIDDEN", "A verificação em duas etapas ainda não está disponível para esta conta.");
  if (temDuasEtapas(user)) throw new DomainError("ALREADY", "A verificação em duas etapas já está ligada.");
  const segredo = novoSegredoTotp();
  await db.update(users).set({ totpSecret: encryptSecret(segredo) }).where(eq(users.id, user.id));
  return { segredo, endereco: enderecoTotp(segredo, user.email) };
}

/** Confirma com o primeiro código do aplicativo, liga e devolve os códigos de recuperação (mostrados uma vez só). */
export async function confirmarDuasEtapas(db: Database, user: User, codigo: string, agora = new Date()): Promise<string[]> {
  if (!podeUsarDuasEtapas(user)) throw new DomainError("FORBIDDEN", "A verificação em duas etapas ainda não está disponível para esta conta.");
  const fresh = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  const segredo = decryptSecret(fresh?.totpSecret);
  if (!fresh || !segredo) throw new DomainError("NOT_STARTED", "Comece pela leitura do QR no aplicativo.");
  if (fresh.totpEnabledAt) throw new DomainError("ALREADY", "A verificação em duas etapas já está ligada.");
  if (!confereTotp(segredo, codigo, agora.getTime())) throw new DomainError("INVALID_CODE", "Código incorreto. Confira o horário do celular e tente o código novo.");
  const codigos = novosCodigosDeRecuperacao();
  await db.update(users).set({ totpEnabledAt: agora.toISOString(), totpRecovery: codigos.map(hashRecuperacao) }).where(eq(users.id, user.id));
  return codigos;
}

/**
 * Confere o código da segunda etapa: o do aplicativo ou um de recuperação (que é gasto). Conta sem duas etapas ligadas
 * nunca passa por aqui.
 */
export async function conferirSegundaEtapa(db: Database, userId: string, codigo: string, agora = new Date()): Promise<boolean> {
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const segredo = decryptSecret(u?.totpSecret);
  if (!u?.totpEnabledAt || !segredo) return false;
  if (confereTotp(segredo, codigo, agora.getTime())) return true;
  const h = hashRecuperacao(codigo);
  const lista = u.totpRecovery ?? [];
  if (!/[a-z]/i.test(codigo) || !lista.includes(h)) return false;
  await db.update(users).set({ totpRecovery: lista.filter((x) => x !== h) }).where(eq(users.id, userId));
  return true;
}

/** Desliga, pedindo um código válido (do aplicativo ou de recuperação). */
export async function desligarDuasEtapas(db: Database, user: User, codigo: string, agora = new Date()) {
  if (!(await conferirSegundaEtapa(db, user.id, codigo, agora))) throw new DomainError("INVALID_CODE", "Código incorreto.");
  await db.update(users).set({ totpSecret: null, totpEnabledAt: null, totpRecovery: null }).where(eq(users.id, user.id));
}

/** Bilhete entre a senha e o código: vale 5 minutos e só para a segunda etapa desta conta. */
const BILHETE = "login-segunda-etapa";
export const bilheteSegundaEtapa = (userId: string, agora = Date.now()) => signToken(BILHETE, { uid: userId, exp: agora + 5 * 60_000 });
export const lerBilheteSegundaEtapa = (t: string | undefined) => verifyToken<{ uid: string; exp: number }>(BILHETE, t)?.uid ?? null;

/** Duas etapas obrigatórias para o Master (variável MASTER_2FA_OBRIGATORIO=1, ligada depois que o dono ativar). */
export const duasEtapasObrigatorias = (u: Pick<User, "role" | "totpEnabledAt">) => process.env.MASTER_2FA_OBRIGATORIO === "1" && podeUsarDuasEtapas(u) && !temDuasEtapas(u);
