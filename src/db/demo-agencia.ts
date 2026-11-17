import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { agenciaCampanhas, agenciaMensagens, agenciaSolicitacoes, agenciaFaturas, agenciaOportunidades, agenciaCiclos, agenciaClienteEquipe, agenciaClientes, agenciaMembros, agenciaPecaEventos, agenciaPecas, agencias, organizations, users, type AgenciaFuncao, type AgenciaIncluso, type PecaEtapa } from "./schema";
import { escolherResponsavel, mesAnterior, prazoDaEtapa, situacaoInicial } from "@/lib/agencias/fluxo";
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
  { chave: "ges", nome: "Rafael Prado", email: "gestor@agencia.demo", funcao: "GESTOR", todos: true },
  { chave: "fil", nome: "Felipe Duarte", email: "filmmaker@agencia.demo", funcao: "GRAVACAO" },
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
  // Agência recém-criada, sem nada (D316): mostra os primeiros passos de uma conta nova. Login: nova@agencia.demo.
  if (!(await db.query.agencias.findFirst({ where: eq(agencias.slug, "agencia-nova-demo") }))) {
    const org = newId("org"); const ag = newId("agc"); const u = newId("usr");
    await db.insert(organizations).values({ id: org, name: "Agência Nova (demonstração)", slug: "agencia-nova-demo", type: "AGENCY", brand: "NEXTLEVEL_COMMERCE" });
    await db.insert(agencias).values({ id: ag, organizationId: org, nome: "Agência Nova (demonstração)", slug: "agencia-nova-demo" });
    await db.insert(users).values({ id: u, name: "Nina Souza", email: "nova@agencia.demo", role: "AGENCY", organizationId: org, passwordHash: hashPassword(DEMO_PASSWORD) });
    await db.insert(agenciaMembros).values({ id: newId("agm"), agenciaId: ag, userId: u, funcao: "ADMIN", todosClientes: true });
  }
  if (await db.query.agencias.findFirst({ where: eq(agencias.slug, SLUG) })) return false;
  const orgId = newId("org"); const agenciaId = "agc_aurorademo"; /* fixo: o e2e do portal (D320) calcula o código */ const passwordHash = hashPassword(DEMO_PASSWORD);
  await db.insert(organizations).values({ id: orgId, name: "Agência Aurora (demonstração)", slug: SLUG, type: "AGENCY", brand: "NEXTLEVEL_COMMERCE" });
  await db.insert(agencias).values({ id: agenciaId, organizationId: orgId, nome: "Agência Aurora (demonstração)", slug: SLUG, fundadora: true, razaoSocial: "Aurora Comunicação Ltda (demonstração)", documento: "11.222.333/0001-81", cidadeForo: "São Paulo/SP", captacao: { ligada: true, titulo: "Seu negócio com vídeo todo mês", texto: "Roteiro, gravação, edição e publicação. Conte o que você precisa e a equipe responde.", servicos: ["Vídeos para Reels", "Social media", "Tráfego pago", "Fotos"], whatsapp: null } });
  await povoarAgenciaDemo(db, { agenciaId, orgId, passwordHash, emailDe: (p) => p.email });
  return true;
}

/** Peças fictícias do mês em todas as etapas (D314): algumas atrasadas e uma herdada do mês anterior. */
const ETAPAS_DEMO: PecaEtapa[] = ["PUBLICADO", "PUBLICADO", "CONCLUIDO", "EDICAO", "AGENDAMENTO", "REVISAO", "APROVACAO", "CAPTACAO", "ROTEIRO", "EDICAO", "PLANEJAMENTO", "ROTEIRO"];
async function pecasDemo(db: Database, agenciaId: string, clienteId: string, c: C, equipe: { userId: string; funcao: AgenciaFuncao }[], resp: string | null) {
  const hoje = new Date().toISOString().slice(0, 10); const mes = hoje.slice(0, 7);
  const dia = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  const cicloId = newId("agci");
  await db.insert(agenciaCiclos).values({ id: cicloId, agenciaId, clienteId, mes, contratado: c.incluso });
  const n = c.incluso.videos ?? 0;
  for (let i = 0; i < n; i++) {
    const etapa = ETAPAS_DEMO[i % ETAPAS_DEMO.length]!;
    const pecaId = newId("agpc");
    const atrasada = etapa === "EDICAO" && i === 3;
    await db.insert(agenciaPecas).values({
      id: pecaId, agenciaId, clienteId, cicloId, tipo: "VIDEO", titulo: `${["Bastidores", "Depoimento", "Antes e depois", "Dica rápida", "Tour", "Pergunta do cliente"][i % 6]} ${i + 1}`,
      etapa, situacao: etapa === "EDICAO" ? "EDITANDO" : situacaoInicial(etapa), responsavelId: etapa === "CONCLUIDO" ? null : escolherResponsavel(etapa, equipe, resp),
      prazo: atrasada ? dia(-2) : prazoDaEtapa(etapa, hoje), roteiro: ["PLANEJAMENTO", "ROTEIRO"].includes(etapa) ? null : "Abertura com gancho, problema, solução, chamada para o WhatsApp.",
      linkBrutos: ["PLANEJAMENTO", "ROTEIRO", "CAPTACAO"].includes(etapa) ? null : "https://drive.google.com/demonstracao-brutos", linkVersao: ["REVISAO", "APROVACAO", "AGENDAMENTO", "PUBLICADO", "CONCLUIDO"].includes(etapa) ? "https://drive.google.com/demonstracao-v1" : null,
      versao: ["REVISAO", "APROVACAO", "AGENDAMENTO", "PUBLICADO", "CONCLUIDO"].includes(etapa) ? 1 : 0, linkPublicacao: ["PUBLICADO", "CONCLUIDO"].includes(etapa) ? "https://instagram.com/p/demonstracao" : null,
      publicadoEm: ["PUBLICADO", "CONCLUIDO"].includes(etapa) ? new Date(Date.now() - (i + 1) * 86_400_000).toISOString() : null,
    });
    await db.insert(agenciaPecaEventos).values({ id: newId("agpe"), pecaId, agenciaId, tipo: "CRIADA", mensagem: "Planejada pelo pacote do mês (demonstração).", autorNome: "Demonstração" });
  }
  if (c.nome.startsWith("Clínica")) {
    const anterior = newId("agci");
    await db.insert(agenciaCiclos).values({ id: anterior, agenciaId, clienteId, mes: mesAnterior(mes), contratado: c.incluso });
    const pecaId = newId("agpc");
    await db.insert(agenciaPecas).values({ id: pecaId, agenciaId, clienteId, cicloId: anterior, tipo: "VIDEO", titulo: "Vídeo do mês passado", etapa: "EDICAO", situacao: "AJUSTES", responsavelId: escolherResponsavel("EDICAO", equipe, resp), prazo: dia(-5), linkBrutos: "https://drive.google.com/demonstracao-brutos" });
    await db.insert(agenciaPecaEventos).values({ id: newId("agpe"), pecaId, agenciaId, tipo: "AJUSTE", mensagem: "Ajuste pedido pelo cliente: trocar a música (demonstração).", autorNome: "Demonstração" });
  }
}

/**
 * Povoa uma agência com a equipe, a carteira, a produção, as cobranças e o comercial fictícios (D313), mais campanhas,
 * conversas e metas (D326). Usado pela demonstração local e pelo Modo demonstração da agência real (sandbox separado).
 */
export async function povoarAgenciaDemo(db: Database, o: { agenciaId: string; orgId: string; passwordHash: string; emailDe: (p: { chave: string; email: string }) => string; admin?: { nome: string; email: string } }) {
  const { agenciaId, orgId, passwordHash } = o;
  const ids = new Map<string, string>();
  for (const p of EQUIPE) {
    const id = newId("usr"); ids.set(p.chave, id);
    await db.insert(users).values({ id, name: p.chave === "adm" && o.admin ? o.admin.nome : p.nome, email: p.chave === "adm" && o.admin ? o.admin.email : o.emailDe(p), role: "AGENCY", organizationId: orgId, passwordHash });
    await db.insert(agenciaMembros).values({ id: newId("agm"), agenciaId, userId: id, funcao: p.funcao, todosClientes: !!p.todos });
  }
  // Funil comercial fictício (D317).
  const dia = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  await db.insert(agenciaOportunidades).values([
    { id: newId("agop"), agenciaId, empresa: "Vidraçaria Brilho (demonstração)", segmento: "Vidraçaria", origem: "INDICACAO", servicos: "Mensal 12 vídeos", valorPropostoCents: 300_000, etapa: "PROPOSTA", responsavelId: ids.get("adm")!, proximaAtividade: "Ligar para fechar a proposta", proximaAtividadeEm: dia(0) },
    { id: newId("agop"), agenciaId, empresa: "Clínica Vida Plena (demonstração)", segmento: "Saúde", origem: "INSTAGRAM", servicos: "8 vídeos + tráfego", valorPropostoCents: 420_000, etapa: "REUNIAO", responsavelId: ids.get("adm")!, proximaAtividade: "Reunião de apresentação", proximaAtividadeEm: dia(2) },
    { id: newId("agop"), agenciaId, empresa: "Hamburgueria Brasa (demonstração)", segmento: "Restaurante", origem: "PROSPECCAO_ATIVA", servicos: "Social media", valorPropostoCents: 180_000, etapa: "CONTATO", responsavelId: ids.get("adm")!, proximaAtividade: "Mandar portfólio", proximaAtividadeEm: dia(-1) },
    { id: newId("agop"), agenciaId, empresa: "Escola Saber (demonstração)", segmento: "Educação", origem: "SITE", etapa: "PROSPECCAO", responsavelId: ids.get("adm")! },
  ]);
  for (const c of CLIENTES) {
    const id = newId("agcl");
    await db.insert(agenciaClientes).values({ id, agenciaId, nome: c.nome, segmento: c.segmento, pacote: c.pacote, incluso: c.incluso, valorMensalCents: c.valor * 100, diaVencimento: c.dia, whatsapp: c.whatsapp ?? null, email: c.nome === "Clínica Sorriso Leve" ? "contato@sorrisoleve.demo" : null, documento: c.nome === "Clínica Sorriso Leve" ? "11.111.111/0001-11" : null, responsavelId: c.resp ? ids.get(c.resp)! : null, situacao: c.situacao ?? "ATIVO", inicioEm: "2026-08-01" });
    const equipe = [...new Set([...c.equipe, "rot", "ges", "fil", ...(c.resp ? [c.resp] : [])])];
    await db.insert(agenciaClienteEquipe).values(equipe.map((k) => ({ clienteId: id, userId: ids.get(k)! })));
    // Cobrança do mês fictícia (D318): metade paga, uma atrasada conforme o dia do vencimento.
    if (c.situacao !== "PAUSADO") {
      const mesAtual = new Date().toISOString().slice(0, 7); const venc = `${mesAtual}-${String(c.dia).padStart(2, "0")}`; const hojeD = new Date().toISOString().slice(0, 10);
      const paga = venc < hojeD && CLIENTES.indexOf(c) % 3 !== 1;
      await db.insert(agenciaFaturas).values({ id: newId("agft"), agenciaId, clienteId: id, competencia: mesAtual, descricao: `Mensalidade do mês · ${c.pacote}`, valorCents: c.valor * 100, vencimento: venc, situacao: paga ? "PAGA" : "ABERTA", pagoEm: paga ? new Date().toISOString() : null, pagoComo: paga ? "MANUAL" : null, observacao: paga ? "Pix (demonstração)" : null });
    }
    if (c.situacao !== "PAUSADO") await pecasDemo(db, agenciaId, id, c, equipe.map((k) => ({ userId: ids.get(k)!, funcao: EQUIPE.find((p) => p.chave === k)!.funcao })), c.resp ? ids.get(c.resp)! : null);
  }
  await extrasDemo(db, agenciaId, ids);
  return ids;
}

/** Campanhas, conversas do portal e metas do mês (D326): o resto do painel também em uso. */
async function extrasDemo(db: Database, agenciaId: string, ids: Map<string, string>) {
  const clientes = await db.select({ id: agenciaClientes.id, nome: agenciaClientes.nome }).from(agenciaClientes).where(eq(agenciaClientes.agenciaId, agenciaId));
  const de = (nome: string) => clientes.find((c) => c.nome === nome)?.id;
  const agora = Date.now(); const atras = (h: number) => new Date(agora - h * 3_600_000).toISOString();
  const campanhas = [
    { cliente: "Imobiliária Casa Certa", nome: "Lançamento Jardim Sul", situacao: "NO_AR" as const, verba: 300_000, inv: 182_000, res: 64, rot: "contatos" },
    { cliente: "Studio Bella Pele", nome: "Limpeza de pele novembro", situacao: "NO_AR" as const, verba: 120_000, inv: 54_000, res: 41, rot: "mensagens" },
    { cliente: "Restaurante Fogo Alto", nome: "Almoço executivo", situacao: "PAUSADA" as const, verba: 80_000, inv: 40_000, res: 22, rot: "reservas" },
    { cliente: "Clínica Sorriso Leve", nome: "Clareamento dental", situacao: "PLANEJADA" as const, verba: 150_000, inv: 0, res: 0, rot: "agendamentos" },
  ];
  for (const k of campanhas) {
    const clienteId = de(k.cliente); if (!clienteId) continue;
    await db.insert(agenciaCampanhas).values({ id: newId("agcp"), agenciaId, clienteId, nome: k.nome, plataforma: "META", objetivo: "Mensagens no WhatsApp", situacao: k.situacao, verbaMensalCents: k.verba, investidoCents: k.inv, resultados: k.res, rotuloResultado: k.rot, responsavelId: ids.get("tra") ?? null, atualizadoNumerosEm: k.inv ? atras(30) : null });
  }
  const conversas = [
    { cliente: "Academia Movimento", tipo: "PEDIDO" as const, texto: "Dá para gravar a aula de spinning na sexta?", situacao: "ABERTA" as const, h: 2 },
    { cliente: "Padaria Trigo de Ouro", tipo: "IDEIA" as const, texto: "Vídeo do pão de queijo saindo do forno às 7h", situacao: "EM_ANDAMENTO" as const, h: 20, resposta: "Ótima ideia! Encaixamos na gravação da semana que vem." },
    { cliente: "Pet Shop Patas Felizes", tipo: "DUVIDA" as const, texto: "Quando sai o vídeo do banho e tosa?", situacao: "RESPONDIDA" as const, h: 50, resposta: "Sai na quinta, já está na edição." },
  ];
  for (const c of conversas) {
    const clienteId = de(c.cliente); if (!clienteId) continue;
    const sid = newId("agso");
    await db.insert(agenciaSolicitacoes).values({ id: sid, agenciaId, clienteId, tipo: c.tipo, texto: c.texto, autorEmail: "cliente@demonstracao.invalid", situacao: c.situacao, resposta: c.resposta ?? null, respondidaEm: c.resposta ? atras(c.h - 1) : null, createdAt: atras(c.h) });
    if (c.resposta) await db.insert(agenciaMensagens).values({ id: newId("agmg"), solicitacaoId: sid, agenciaId, autor: "AGENCIA", autorNome: "Rafael Prado", texto: c.resposta, createdAt: atras(c.h - 1) });
  }
  const mes = new Date().toISOString().slice(0, 7);
  await db.update(agencias).set({ metas: { [mes]: { entregas: 60, novosClientes: 3, receitaCents: 2_500_000 } } }).where(eq(agencias.id, agenciaId));
}
