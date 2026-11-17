import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { agenciaClienteEquipe, agenciaClientes, agenciaMembros, agencias, organizations, users, type AgenciaFuncao, type AgenciaIncluso } from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";

/**
 * Agência FICTÍCIA de demonstração do Painel da Agência (D313): equipe com as funções de uma agência de conteúdo e uma
 * carteira inventada. Só no banco de demonstração (DEMO_AUTOSEED), nunca na produção. Idempotente pelo endereço.
 * Login: agencia@agencia.demo (administradora) e editor@agencia.demo (edição), senha da demonstração.
 */
const SLUG = "agencia-aurora-demo";
const EQUIPE: { chave: string; nome: string; email: string; funcao: AgenciaFuncao; todos?: boolean }[] = [
  { chave: "adm", nome: "Marina Alves", email: "agencia@agencia.demo", funcao: "ADMIN", todos: true },
  { chave: "soc1", nome: "Beatriz Rocha", email: "social1@agencia.demo", funcao: "SOCIAL_MEDIA" },
  { chave: "soc2", nome: "Júlio Matos", email: "social2@agencia.demo", funcao: "SOCIAL_MEDIA" },
  { chave: "rot", nome: "Sônia Lima", email: "roteiro@agencia.demo", funcao: "ROTEIRO", todos: true },
  { chave: "ed1", nome: "Gabriel Nunes", email: "editor@agencia.demo", funcao: "EDICAO" },
  { chave: "ed2", nome: "Gustavo Reis", email: "editor2@agencia.demo", funcao: "EDICAO" },
  { chave: "tra", nome: "André Costa", email: "trafego@agencia.demo", funcao: "TRAFEGO" },
];
type C = { nome: string; segmento: string; pacote: string; incluso: AgenciaIncluso; valor: number; dia: number; resp: string; equipe: string[]; whatsapp?: string; situacao?: "ATIVO" | "PAUSADO" };
const CLIENTES: C[] = [
  { nome: "Clínica Sorriso Leve", segmento: "Odontologia", pacote: "Mensal 8 vídeos", incluso: { videos: 8, fotos: 12, gravacoes: 2 }, valor: 2_500, dia: 10, resp: "soc1", equipe: ["ed1", "tra"], whatsapp: "11900000101" },
  { nome: "Academia Movimento", segmento: "Academia", pacote: "Mensal 12 vídeos", incluso: { videos: 12, posts: 8, gravacoes: 2 }, valor: 3_200, dia: 5, resp: "soc1", equipe: ["ed1"], whatsapp: "11900000102" },
  { nome: "Padaria Trigo de Ouro", segmento: "Alimentação", pacote: "Mensal 4 vídeos", incluso: { videos: 4, fotos: 8, gravacoes: 1 }, valor: 1_400, dia: 15, resp: "soc2", equipe: ["ed2"], whatsapp: "11900000103" },
  { nome: "Studio Bella Pele", segmento: "Estética", pacote: "Mensal 8 vídeos", incluso: { videos: 8, criativos: 4, gravacoes: 2 }, valor: 2_800, dia: 20, resp: "soc2", equipe: ["ed2", "tra"], whatsapp: "11900000104" },
  { nome: "Imobiliária Casa Certa", segmento: "Imóveis", pacote: "Mensal 6 vídeos + tráfego", incluso: { videos: 6, criativos: 6, gravacoes: 2 }, valor: 4_500, dia: 18, resp: "tra", equipe: ["ed1", "soc1"], whatsapp: "11900000105" },
  { nome: "Pet Shop Patas Felizes", segmento: "Pet", pacote: "Mensal 4 vídeos", incluso: { videos: 4, posts: 8, gravacoes: 1 }, valor: 1_200, dia: 18, resp: "soc1", equipe: ["ed2"], whatsapp: "11900000106" },
  { nome: "Escritório Prado Advocacia", segmento: "Advocacia", pacote: "Mensal 4 vídeos", incluso: { videos: 4, posts: 4, gravacoes: 1 }, valor: 1_800, dia: 25, resp: "soc2", equipe: ["ed1"], whatsapp: "11900000107" },
  { nome: "Restaurante Fogo Alto", segmento: "Restaurante", pacote: "Mensal 8 vídeos", incluso: { videos: 8, fotos: 20, gravacoes: 2 }, valor: 2_600, dia: 1, resp: "soc1", equipe: ["ed2", "tra"], whatsapp: "11900000108" },
  { nome: "Loja Ateliê Flor", segmento: "Moda", pacote: "Mensal 6 vídeos", incluso: { videos: 6, fotos: 15, gravacoes: 1 }, valor: 1_900, dia: 12, resp: "", equipe: [], whatsapp: "11900000109" },
  { nome: "Auto Center Pista", segmento: "Automotivo", pacote: "Mensal 4 vídeos", incluso: { videos: 4, gravacoes: 1 }, valor: 1_500, dia: 8, resp: "soc2", equipe: ["ed1"], situacao: "PAUSADO" },
];

export async function seedDemoAgencia(db: Database): Promise<boolean> {
  if (await db.query.agencias.findFirst({ where: eq(agencias.slug, SLUG) })) return false;
  const orgId = newId("org"); const agenciaId = newId("agc"); const passwordHash = hashPassword(DEMO_PASSWORD);
  await db.insert(organizations).values({ id: orgId, name: "Agência Aurora (demonstração)", slug: SLUG, type: "AGENCY", brand: "NEXTLEVEL_COMMERCE" });
  await db.insert(agencias).values({ id: agenciaId, organizationId: orgId, nome: "Agência Aurora (demonstração)", slug: SLUG, fundadora: true });
  const ids = new Map<string, string>();
  for (const p of EQUIPE) {
    const id = newId("usr"); ids.set(p.chave, id);
    await db.insert(users).values({ id, name: p.nome, email: p.email, role: "AGENCY", organizationId: orgId, passwordHash });
    await db.insert(agenciaMembros).values({ id: newId("agm"), agenciaId, userId: id, funcao: p.funcao, todosClientes: !!p.todos });
  }
  for (const c of CLIENTES) {
    const id = newId("agcl");
    await db.insert(agenciaClientes).values({ id, agenciaId, nome: c.nome, segmento: c.segmento, pacote: c.pacote, incluso: c.incluso, valorMensalCents: c.valor * 100, diaVencimento: c.dia, whatsapp: c.whatsapp ?? null, responsavelId: c.resp ? ids.get(c.resp)! : null, situacao: c.situacao ?? "ATIVO", inicioEm: "2026-08-01" });
    if (c.equipe.length) await db.insert(agenciaClienteEquipe).values(c.equipe.map((k) => ({ clienteId: id, userId: ids.get(k)! })));
  }
  return true;
}
