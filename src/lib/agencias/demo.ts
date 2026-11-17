import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, notInArray, or, isNull, lt } from "drizzle-orm";
import type { Database } from "@/db/client";
import { agenciaClientes, agenciaFaturas, agenciaMembros, agenciaOportunidades, agenciaPecaEventos, agenciaPecas, agenciaSolicitacoes, agencias, organizations, users } from "@/db/schema";
import { povoarAgenciaDemo } from "@/db/demo-agencia";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { escopoDaAgencia } from "./acesso";
import { ETAPA_ROTULO, escolherResponsavel, prazoDaEtapa, proximaEtapa, situacaoInicial } from "./fluxo";
import { hojeEmSaoPaulo } from "./clientes";
import { equipeDoCliente } from "./producao";

/**
 * Modo demonstração da agência (D326): uma chave no início do painel. Ligar cria (uma vez) uma agência-sandbox separada,
 * com equipe, carteira, produção, cobranças, comercial, campanhas e conversas inventados, e abre o painel dela sem novo
 * login (conta do grupo, D141). Desligar volta para a agência real. Os dados reais nunca são tocados; o sandbox nunca
 * manda e-mail para fora (endereços `.invalid`). Enquanto alguém usa o sandbox, a produção anda sozinha (movimentarDemo).
 */
const DOMINIO = "demonstracao.invalid";

async function sandboxDe(db: Database, agenciaId: string) {
  return (await db.query.agencias.findFirst({ where: eq(agencias.demoDeId, agenciaId) })) ?? null;
}

/** Perfil de quem está logado dentro de uma agência (mesmo grupo de contas). */
async function perfilNoGrupo(db: Database, userId: string, organizationId: string) {
  const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!me?.groupId) return null;
  return (await db.query.users.findFirst({ where: and(eq(users.groupId, me.groupId), eq(users.organizationId, organizationId), eq(users.role, "AGENCY"), isNull(users.disabledAt)) })) ?? null;
}

async function ligarAoGrupo(db: Database, me: typeof users.$inferSelect, outroId: string, now: Date) {
  const groupId = me.groupId ?? me.id;
  await db.update(users).set({ groupId, groupLinkedAt: now.toISOString() }).where(inArray(users.id, [me.id, outroId]));
}

/** Liga: devolve o perfil da agência de demonstração para abrir (cria o sandbox na primeira vez). */
export async function ligarModoDemo(db: Database, actor: Actor, now = new Date()) {
  const { agencia, membro } = await escopoDaAgencia(db, actor);
  if (agencia.demoDeId) throw new DomainError("JA_DEMO", "Você já está no modo demonstração.");
  if (membro.funcao !== "ADMIN") throw new ForbiddenError("O modo demonstração é do administrador da agência.");
  const me = (await db.query.users.findFirst({ where: eq(users.id, actor.userId) }))!;
  let sb = await sandboxDe(db, agencia.id);
  if (!sb) {
    const rand = randomBytes(4).toString("hex"); const orgId = newId("org"); const agenciaId = newId("agc");
    const nome = `${agencia.nome} · demonstração`;
    await db.insert(organizations).values({ id: orgId, name: nome, slug: `${agencia.slug}-demo-${rand}`, type: "AGENCY", brand: "NEXTLEVEL_COMMERCE" });
    await db.insert(agencias).values({ id: agenciaId, organizationId: orgId, nome, slug: `${agencia.slug}-demo-${rand}`, demoDeId: agencia.id, demoMovidoEm: now.toISOString(),
      razaoSocial: `${agencia.nome} (demonstração)`, documento: "11.222.333/0001-81", cidadeForo: agencia.cidadeForo ?? "São Paulo/SP",
      captacao: { ligada: true, titulo: "Seu negócio com vídeo todo mês", texto: "Roteiro, gravação, edição e publicação. Conte o que você precisa e a equipe responde.", servicos: ["Vídeos para Reels", "Social media", "Tráfego pago"], whatsapp: null } });
    const ids = await povoarAgenciaDemo(db, { agenciaId, orgId, passwordHash: hashPassword(randomBytes(24).toString("base64url")), emailDe: (p) => `${p.chave}.${rand}@${DOMINIO}`, admin: { nome: me.name, email: `admin.${rand}@${DOMINIO}` } });
    await ligarAoGrupo(db, me, ids.get("adm")!, now);
    await recordAudit(db, actor, { action: "AGENCIA_MODO_DEMO_CRIADO", entityType: "agencia", entityId: agencia.id, after: { sandbox: agenciaId } }, { force: true });
    sb = (await sandboxDe(db, agencia.id))!;
  }
  let perfil = await perfilNoGrupo(db, actor.userId, sb.organizationId);
  if (!perfil) {
    // Outro administrador da agência real: ganha o próprio perfil de administrador no sandbox.
    const id = newId("usr");
    await db.insert(users).values({ id, name: me.name, email: `admin.${randomBytes(4).toString("hex")}@${DOMINIO}`, role: "AGENCY", organizationId: sb.organizationId, passwordHash: hashPassword(randomBytes(24).toString("base64url")) });
    await db.insert(agenciaMembros).values({ id: newId("agm"), agenciaId: sb.id, userId: id, funcao: "ADMIN", todosClientes: true });
    await ligarAoGrupo(db, me, id, now);
    perfil = (await db.query.users.findFirst({ where: eq(users.id, id) }))!;
  }
  return { perfilId: perfil.id };
}

/** Desliga: devolve o perfil da agência real para voltar. */
export async function desligarModoDemo(db: Database, actor: Actor) {
  const { agencia } = await escopoDaAgencia(db, actor);
  if (!agencia.demoDeId) throw new DomainError("NAO_DEMO", "O modo demonstração já está desligado.");
  const real = await db.query.agencias.findFirst({ where: eq(agencias.id, agencia.demoDeId) });
  const perfil = real ? await perfilNoGrupo(db, actor.userId, real.organizationId) : null;
  if (!perfil) throw new DomainError("SEM_PERFIL", "Não achamos o seu perfil na agência real. Saia e entre de novo com o seu e-mail.");
  return { perfilId: perfil.id };
}

const NOMES_LEADS = ["Ótica Visão Clara", "Doceria Mel & Cia", "Barbearia Navalha", "Floricultura Primavera", "Clínica Bem Viver", "Pizzaria Forno a Lenha"];
const PEDIDOS = ["Podemos gravar no sábado de manhã?", "Ideia: vídeo com os bastidores da equipe", "Quando sai o próximo vídeo?", "Queria trocar a música do último vídeo", "Dá para fazer um vídeo de promoção para o fim do mês?"];

/**
 * "Tudo em movimento" (D326): no sandbox, a cada visita depois de 1 minuto, até 3 conteúdos avançam uma etapa (com o nome
 * de quem fez), e às vezes chega um pedido de cliente, um contato pelo site ou o pagamento de uma cobrança. Nada disso
 * acontece fora do sandbox.
 */
export async function movimentarDemo(db: Database, agenciaId: string, agora = new Date()) {
  const a = await db.query.agencias.findFirst({ where: eq(agencias.id, agenciaId), columns: { id: true, demoDeId: true, demoMovidoEm: true, prazosEtapas: true } });
  if (!a?.demoDeId) return { movidas: 0 };
  const limite = new Date(agora.getTime() - 60_000).toISOString();
  const trava = await db.update(agencias).set({ demoMovidoEm: agora.toISOString() }).where(and(eq(agencias.id, a.id), or(isNull(agencias.demoMovidoEm), lt(agencias.demoMovidoEm, limite)))).returning({ id: agencias.id });
  if (!trava.length) return { movidas: 0 };
  const hoje = hojeEmSaoPaulo(agora);
  const pecas = await db.select().from(agenciaPecas).where(and(eq(agenciaPecas.agenciaId, a.id), notInArray(agenciaPecas.etapa, ["CONCLUIDO"]))).orderBy(asc(agenciaPecas.updatedAt)).limit(3);
  let movidas = 0;
  for (const p of pecas) {
    const c = await db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, p.clienteId), columns: { exigeAprovacao: true, responsavelId: true } });
    const proxima = proximaEtapa(p.etapa, { tipo: p.tipo, exigeAprovacao: c?.exigeAprovacao ?? true });
    if (!proxima) continue;
    const equipe = await equipeDoCliente(db, p.clienteId);
    const responsavelId = escolherResponsavel(proxima, equipe, c?.responsavelId ?? null);
    const autor = equipe.find((x) => x.userId === p.responsavelId) ?? equipe[0];
    await db.update(agenciaPecas).set({
      etapa: proxima, situacao: situacaoInicial(proxima), responsavelId, prazo: prazoDaEtapa(proxima, hoje, a.prazosEtapas), updatedAt: agora.toISOString(),
      linkBrutos: p.linkBrutos ?? "https://drive.google.com/demonstracao-brutos", linkVersao: p.linkVersao ?? (["REVISAO", "APROVACAO", "AGENDAMENTO", "PUBLICADO"].includes(proxima) ? "https://drive.google.com/demonstracao-v1" : null),
      linkPublicacao: proxima === "PUBLICADO" ? "https://instagram.com/p/demonstracao" : p.linkPublicacao, publicadoEm: proxima === "PUBLICADO" ? agora.toISOString() : p.publicadoEm,
    }).where(eq(agenciaPecas.id, p.id));
    const nome = equipe.find((x) => x.userId === responsavelId)?.nome;
    await db.insert(agenciaPecaEventos).values({ id: newId("agpe"), pecaId: p.id, agenciaId: a.id, tipo: "ETAPA", mensagem: `Etapa ${ETAPA_ROTULO[p.etapa]} concluída → ${ETAPA_ROTULO[proxima]}${nome ? `, com ${nome}` : ""}.`, autorId: autor?.userId ?? null, autorNome: autor?.nome ?? "Equipe", destinoId: responsavelId });
    movidas++;
  }
  const sorte = Math.floor(agora.getTime() / 60_000) % 4;
  const clientes = await db.select({ id: agenciaClientes.id }).from(agenciaClientes).where(and(eq(agenciaClientes.agenciaId, a.id), eq(agenciaClientes.situacao, "ATIVO")));
  if (sorte === 0 && clientes.length) {
    const c = clientes[Math.floor(Math.random() * clientes.length)]!;
    await db.insert(agenciaSolicitacoes).values({ id: newId("agso"), agenciaId: a.id, clienteId: c.id, tipo: "PEDIDO", texto: PEDIDOS[Math.floor(Math.random() * PEDIDOS.length)]!, autorEmail: `cliente@${DOMINIO}` });
  } else if (sorte === 1) {
    await db.insert(agenciaOportunidades).values({ id: newId("agop"), agenciaId: a.id, empresa: `${NOMES_LEADS[Math.floor(Math.random() * NOMES_LEADS.length)]} (demonstração)`, contatoNome: "Contato do site", origem: "ANUNCIO", canal: "meta-pago", utmCampaign: "demonstracao", etapa: "PROSPECCAO", servicos: "Vídeos para Reels" });
  } else if (sorte === 2) {
    const f = await db.query.agenciaFaturas.findFirst({ where: and(eq(agenciaFaturas.agenciaId, a.id), eq(agenciaFaturas.situacao, "ABERTA")) });
    if (f) await db.update(agenciaFaturas).set({ situacao: "PAGA", pagoEm: agora.toISOString(), pagoComo: "MANUAL", observacao: "Pix (demonstração)" }).where(eq(agenciaFaturas.id, f.id));
  }
  return { movidas };
}

/** A agência é um sandbox de demonstração? (faixa no painel) */
export const ehDemo = (a: { demoDeId: string | null }) => !!a.demoDeId;
