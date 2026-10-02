/**
 * Contas de demonstração (seed) têm senha conhecida (demo1234). Fora do modo de demonstração elas nunca podem entrar,
 * mesmo que existam no banco: o login as trata como senha errada e uma sessão antiga delas deixa de valer.
 */
export function isDemoAccountEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  return e.endsWith(".demo") || e.endsWith("@demo.superdrop.com.br");
}
