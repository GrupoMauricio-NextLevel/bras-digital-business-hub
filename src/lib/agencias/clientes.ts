import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { AGENCIA_CLIENTE_SITUACOES, agenciaClienteEquipe, agenciaClientes, agenciaMembros, users, type AgenciaClienteSituacao, type AgenciaIncluso } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { escopoDaAgencia, pode, podeVerCliente, type Membro } from "./acesso";

/**
 * Carteira de clientes da agência (D313, fase AG2): cada cliente com o contrato do mês (valor, vencimento, o que está
 * incluso), o responsável e a equipe. Valores e documento só para quem pode ver valores. Importação por planilha.
 */
export const SITUACAO_CLIENTE_ROTULO: Record<AgenciaClienteSituacao, string> = { ATIVO: "Ativo", PAUSADO: "Pausado", ENCERRADO: "Encerrado" };
export const INCLUSO_ROTULO: Record<keyof AgenciaIncluso, [string, string]> = { videos: ["vídeo", "vídeos"], fotos: ["foto", "fotos"], posts: ["post", "posts"], criativos: ["criativo", "criativos"], gravacoes: ["gravação", "gravações"] };
/** "8 vídeos · 12 fotos" */
export const inclusoTexto = (i: AgenciaIncluso) => (Object.keys(INCLUSO_ROTULO) as (keyof AgenciaIncluso)[]).filter((k) => (i[k] ?? 0) > 0).map((k) => `${i[k]} ${INCLUSO_ROTULO[k][i[k] === 1 ? 0 : 1]}`).join(" · ");
/** "(11) 98888-7777" a partir dos dígitos (com ou sem 55 na frente). */
export function telefoneTexto(d: string | null | undefined): string {
  const n = (d ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return n;
}
export const MOTIVOS_ENCERRAMENTO = ["Preço", "Falta de resultado", "Fechou ou pausou o negócio", "Foi para outra agência", "Passou a fazer internamente", "Outro"] as const;

const so = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");
const vazio = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
const qtd = z.number().int().min(0).max(999).optional();
const inclusoSchema = z.object({ videos: qtd, fotos: qtd, posts: qtd, criativos: qtd, gravacoes: qtd });

export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do cliente").max(120),
  segmento: z.string().trim().max(80).optional().nullable(),
  contatoNome: z.string().trim().max(120).optional().nullable(),
  whatsapp: z.string().trim().max(20).optional().nullable(),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("E-mail inválido")]).optional().nullable(),
  documento: z.string().trim().max(20).optional().nullable(),
  pacote: z.string().trim().max(80).optional().nullable(),
  incluso: inclusoSchema.optional(),
  valorMensalCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  diaVencimento: z.number().int().min(1, "Vencimento entre os dias 1 e 28").max(28, "Vencimento entre os dias 1 e 28").optional().nullable(),
  inicioEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  responsavelId: z.string().optional().nullable(),
  observacoes: z.string().trim().max(2000).optional().nullable(),
});
export type ClienteInput = z.input<typeof clienteSchema>;

function validarDocumento(doc: string | null) {
  if (doc && doc.length !== 11 && doc.length !== 14) throw new DomainError("DOCUMENTO", "CPF com 11 dígitos ou CNPJ com 14.");
}
function limparIncluso(i: AgenciaIncluso | undefined): AgenciaIncluso {
  return Object.fromEntries(Object.entries(i ?? {}).filter(([, v]) => typeof v === "number" && v > 0)) as AgenciaIncluso;
}

async function equipesDe(db: Database, ids: string[]) {
  if (!ids.length) return new Map<string, string[]>();
  const rows = await db.select().from(agenciaClienteEquipe).where(inArray(agenciaClienteEquipe.clienteId, ids));
  const m = new Map<string, string[]>();
  for (const r of rows) m.set(r.clienteId, [...(m.get(r.clienteId) ?? []), r.userId]);
  return m;
}

async function responsavelValido(db: Database, agenciaId: string, userId: string | null | undefined) {
  if (!userId) return null;
  const m = await db.select({ id: agenciaMembros.userId }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId))
    .where(and(eq(agenciaMembros.agenciaId, agenciaId), eq(agenciaMembros.userId, userId), isNull(users.disabledAt)));
  if (!m.length) throw new DomainError("RESPONSAVEL", "O responsável precisa ser alguém ativo da equipe.");
  return userId;
}

type Linha = typeof agenciaClientes.$inferSelect;
/** O que a pessoa pode ver do cliente: sem permissão de valores, some valor, vencimento e documento. */
function visao(c: Linha, m: Membro, equipe: string[]) {
  const valores = pode.verValores(m);
  return { ...c, equipe, valorMensalCents: valores ? c.valorMensalCents : null, diaVencimento: valores ? c.diaVencimento : null, documento: valores || pode.editarClientes(m) ? c.documento : null, verValores: valores };
}

export async function listarClientes(db: Database, actor: Actor, filtro: { situacao?: AgenciaClienteSituacao } = {}) {
  const { membro } = await escopoDaAgencia(db, actor);
  const rows = await db.select().from(agenciaClientes)
    .where(and(eq(agenciaClientes.agenciaId, membro.agenciaId), filtro.situacao ? eq(agenciaClientes.situacao, filtro.situacao) : undefined))
    .orderBy(asc(agenciaClientes.nome));
  const eq_ = await equipesDe(db, rows.map((r) => r.id));
  return rows.filter((c) => podeVerCliente(membro, c, eq_.get(c.id) ?? [])).map((c) => visao(c, membro, eq_.get(c.id) ?? []));
}

async function clienteVisivel(db: Database, actor: Actor, id: string) {
  const { membro, agencia } = await escopoDaAgencia(db, actor);
  const c = await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, id), eq(agenciaClientes.agenciaId, membro.agenciaId)) });
  if (!c) throw new NotFoundError("Cliente não encontrado.");
  const equipe = (await equipesDe(db, [c.id])).get(c.id) ?? [];
  if (!podeVerCliente(membro, c, equipe)) throw new NotFoundError("Cliente não encontrado.");
  return { c, membro, agencia, equipe };
}

export async function fichaDoCliente(db: Database, actor: Actor, id: string) {
  const { c, membro, equipe } = await clienteVisivel(db, actor, id);
  return { ...visao(c, membro, equipe), podeEditar: pode.editarClientes(membro), podeEditarContrato: pode.editarContrato(membro) };
}

export async function criarCliente(db: Database, actor: Actor, raw: ClienteInput) {
  const { membro } = await escopoDaAgencia(db, actor);
  if (!pode.editarClientes(membro)) throw new ForbiddenError("Sua função não cadastra clientes.");
  const d = clienteSchema.parse(raw);
  const documento = so(d.documento) || null; validarDocumento(documento);
  const contrato = pode.editarContrato(membro);
  const id = newId("agcl");
  await db.insert(agenciaClientes).values({
    id, agenciaId: membro.agenciaId, nome: d.nome, segmento: vazio(d.segmento), contatoNome: vazio(d.contatoNome), whatsapp: so(d.whatsapp) || null, email: vazio(d.email),
    documento, pacote: vazio(d.pacote), incluso: limparIncluso(d.incluso), valorMensalCents: contrato ? (d.valorMensalCents ?? null) : null, diaVencimento: contrato ? (d.diaVencimento ?? null) : null,
    inicioEm: vazio(d.inicioEm), responsavelId: await responsavelValido(db, membro.agenciaId, d.responsavelId), observacoes: vazio(d.observacoes),
  });
  await recordAudit(db, actor, { action: "AGENCIA_CLIENTE_CRIADO", entityType: "agencia_cliente", entityId: id, after: { nome: d.nome } }, { force: true });
  return { id };
}

/** Atualiza a ficha. Campos do contrato (valor e vencimento) só para quem edita contrato; os outros, para quem edita clientes. */
export async function atualizarCliente(db: Database, actor: Actor, id: string, raw: Partial<ClienteInput>) {
  const { c, membro } = await clienteVisivel(db, actor, id);
  const d = clienteSchema.partial().parse(raw);
  const ficha = Object.keys(d).some((k) => k !== "valorMensalCents" && k !== "diaVencimento");
  const contrato = "valorMensalCents" in d || "diaVencimento" in d;
  if (ficha && !pode.editarClientes(membro)) throw new ForbiddenError("Sua função não altera a ficha do cliente.");
  if (contrato && !pode.editarContrato(membro)) throw new ForbiddenError("Só o administrador e o financeiro mudam valor e vencimento.");
  const patch: Partial<Linha> = {};
  if (d.nome !== undefined) patch.nome = d.nome;
  for (const k of ["segmento", "contatoNome", "email", "pacote", "observacoes", "inicioEm"] as const) if (d[k] !== undefined) patch[k] = vazio(d[k]);
  if (d.whatsapp !== undefined) patch.whatsapp = so(d.whatsapp) || null;
  if (d.documento !== undefined) { patch.documento = so(d.documento) || null; validarDocumento(patch.documento); }
  if (d.incluso !== undefined) patch.incluso = limparIncluso(d.incluso);
  if (d.valorMensalCents !== undefined) patch.valorMensalCents = d.valorMensalCents;
  if (d.diaVencimento !== undefined) patch.diaVencimento = d.diaVencimento;
  if (d.responsavelId !== undefined) patch.responsavelId = await responsavelValido(db, membro.agenciaId, d.responsavelId);
  if (!Object.keys(patch).length) return;
  await db.update(agenciaClientes).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(agenciaClientes.id, c.id));
  const antes = Object.fromEntries(Object.keys(patch).map((k) => [k, (c as Record<string, unknown>)[k] ?? null]));
  await recordAudit(db, actor, { action: "AGENCIA_CLIENTE_ATUALIZADO", entityType: "agencia_cliente", entityId: c.id, before: antes, after: patch as Record<string, unknown> });
}

/** Pausar, reativar ou encerrar (com motivo). Encerrar é o fim do contrato; a ficha e o histórico ficam. */
export async function mudarSituacaoDoCliente(db: Database, actor: Actor, id: string, raw: { situacao: AgenciaClienteSituacao; motivo?: string | null }) {
  const { c, membro } = await clienteVisivel(db, actor, id);
  if (!pode.editarClientes(membro)) throw new ForbiddenError("Sua função não muda a situação do cliente.");
  const d = z.object({ situacao: z.enum(AGENCIA_CLIENTE_SITUACOES), motivo: z.enum(MOTIVOS_ENCERRAMENTO).optional().nullable() }).parse(raw);
  if (d.situacao === "ENCERRADO" && !d.motivo) throw new DomainError("MOTIVO", "Escolha o motivo do encerramento.");
  const agora = new Date().toISOString();
  const patch = d.situacao === "ENCERRADO" ? { situacao: d.situacao, motivoEncerramento: d.motivo!, encerradoEm: agora } : { situacao: d.situacao, motivoEncerramento: null, encerradoEm: null };
  await db.update(agenciaClientes).set({ ...patch, updatedAt: agora }).where(eq(agenciaClientes.id, c.id));
  await recordAudit(db, actor, { action: "AGENCIA_CLIENTE_SITUACAO", entityType: "agencia_cliente", entityId: c.id, before: { situacao: c.situacao }, after: { situacao: d.situacao, motivo: d.motivo ?? null } });
}

/** Quem da agência trabalha no cliente (roteiro, edição, social media, tráfego...). Substitui a lista inteira. */
export async function definirEquipeDoCliente(db: Database, actor: Actor, id: string, userIds: string[]) {
  const { c, membro } = await clienteVisivel(db, actor, id);
  if (!pode.editarClientes(membro)) throw new ForbiddenError("Sua função não monta a equipe do cliente.");
  const ids = [...new Set(z.array(z.string().min(1)).max(30).parse(userIds))];
  for (const u of ids) await responsavelValido(db, membro.agenciaId, u);
  await db.transaction(async (tx) => {
    await tx.delete(agenciaClienteEquipe).where(eq(agenciaClienteEquipe.clienteId, c.id));
    if (ids.length) await tx.insert(agenciaClienteEquipe).values(ids.map((userId) => ({ clienteId: c.id, userId })));
  });
  await recordAudit(db, actor, { action: "AGENCIA_CLIENTE_EQUIPE", entityType: "agencia_cliente", entityId: c.id, after: { equipe: ids } }, { force: true });
}

// ---------------------------------------------------------------------------
// Importação por planilha (copiar e colar do Excel/Google Planilhas, ou CSV)
// ---------------------------------------------------------------------------
export type ClienteImportado = { linha: number; nome: string; segmento: string | null; contatoNome: string | null; whatsapp: string | null; email: string | null; documento: string | null; pacote: string | null; valorMensalCents: number | null; diaVencimento: number | null; incluso: AgenciaIncluso; responsavel: string | null };
const COLUNAS: [keyof Omit<ClienteImportado, "linha" | "incluso"> | keyof AgenciaIncluso, RegExp][] = [
  ["nome", /^(cliente|nome|empresa|razao social|nome do cliente)$/], ["segmento", /^(segmento|ramo|nicho|area)$/], ["contatoNome", /^(contato|responsavel do cliente|pessoa de contato)$/],
  ["whatsapp", /^(whatsapp|telefone|celular|fone|zap)$/], ["email", /^(e-?mail)$/], ["documento", /^(cnpj|cpf|documento|cpf\/cnpj|cnpj\/cpf)$/], ["pacote", /^(pacote|plano|servico)$/],
  ["valorMensalCents", /^(valor|mensalidade|valor mensal|preco|fee)$/], ["diaVencimento", /^(vencimento|dia|dia do vencimento|dia de vencimento)$/],
  ["videos", /^(videos|video|reels)$/], ["fotos", /^(fotos|foto)$/], ["posts", /^(posts|post|artes)$/], ["criativos", /^(criativos|anuncios)$/], ["gravacoes", /^(gravacoes|gravacao|diarias)$/],
  ["responsavel", /^(responsavel|atendimento|quem cuida|social media)$/],
];
const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** Valor em reais escrito de qualquer jeito ("R$ 2.500,00", "2500", "2.500") para centavos. */
export function reaisParaCentavos(v: string): number | null {
  const t = v.replace(/[R$\s]/gi, "");
  if (!t) return null;
  const n = /,\d{1,2}$/.test(t) ? Number(t.replace(/\./g, "").replace(",", ".")) : /\.\d{1,2}$/.test(t) && !/\.\d{3}$/.test(t) ? Number(t) : Number(t.replace(/[.,]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

function separar(linha: string, sep: string): string[] {
  const out: string[] = []; let atual = ""; let aspas = false;
  for (const ch of linha) {
    if (ch === '"') aspas = !aspas;
    else if (ch === sep && !aspas) { out.push(atual); atual = ""; }
    else atual += ch;
  }
  out.push(atual);
  return out.map((x) => x.trim());
}

/** Regra pura (testada): lê a planilha colada. A primeira linha tem os títulos; aceita tabulação, ponto e vírgula ou vírgula. */
export function lerPlanilhaDeClientes(texto: string): { clientes: ClienteImportado[]; erros: { linha: number; motivo: string }[] } {
  const linhas = texto.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (linhas.length < 2) return { clientes: [], erros: [{ linha: 1, motivo: "Cole a planilha com a linha de títulos e pelo menos um cliente." }] };
  if (linhas.length > 501) return { clientes: [], erros: [{ linha: 1, motivo: "Até 500 clientes por vez." }] };
  const cab = linhas[0]!;
  const sep = cab.includes("\t") ? "\t" : cab.includes(";") ? ";" : ",";
  const titulos = separar(cab, sep).map(normal);
  const idx = new Map<string, number>();
  titulos.forEach((t, i) => { const c = COLUNAS.find(([, re]) => re.test(t)); if (c && !idx.has(c[0])) idx.set(c[0], i); });
  if (!idx.has("nome")) return { clientes: [], erros: [{ linha: 1, motivo: "Não achei a coluna do nome do cliente (use o título \"Cliente\" ou \"Nome\")." }] };
  const clientes: ClienteImportado[] = []; const erros: { linha: number; motivo: string }[] = [];
  linhas.slice(1).forEach((l, i) => {
    const n = i + 2; const cel = separar(l, sep);
    const get = (k: string) => { const j = idx.get(k); return j === undefined ? "" : (cel[j] ?? "").trim(); };
    const nome = get("nome");
    if (nome.length < 2) { erros.push({ linha: n, motivo: "sem nome do cliente" }); return; }
    const doc = so(get("documento"));
    if (doc && doc.length !== 11 && doc.length !== 14) { erros.push({ linha: n, motivo: `${nome}: CPF/CNPJ inválido` }); return; }
    const email = get("email").toLowerCase();
    if (email && !z.string().email().safeParse(email).success) { erros.push({ linha: n, motivo: `${nome}: e-mail inválido` }); return; }
    const valorTxt = get("valorMensalCents"); const valor = valorTxt ? reaisParaCentavos(valorTxt) : null;
    if (valorTxt && valor === null) { erros.push({ linha: n, motivo: `${nome}: valor não entendido (${valorTxt})` }); return; }
    const diaTxt = so(get("diaVencimento")); const dia = diaTxt ? Number(diaTxt) : null;
    if (dia !== null && (dia < 1 || dia > 28)) { erros.push({ linha: n, motivo: `${nome}: vencimento precisa ser um dia de 1 a 28` }); return; }
    const incluso: AgenciaIncluso = {};
    for (const k of ["videos", "fotos", "posts", "criativos", "gravacoes"] as const) { const v = Number(so(get(k))); if (v > 0 && v < 1000) incluso[k] = v; }
    clientes.push({ linha: n, nome: nome.slice(0, 120), segmento: get("segmento") || null, contatoNome: get("contatoNome") || null, whatsapp: so(get("whatsapp")) || null, email: email || null, documento: doc || null, pacote: get("pacote") || null, valorMensalCents: valor, diaVencimento: dia, incluso, responsavel: get("responsavel") || null });
  });
  return { clientes, erros };
}

/**
 * Importa a carteira (só o administrador). `confirmar: false` só mostra o que vai entrar. Cliente com o mesmo nome já
 * na carteira é pulado (não duplica ao colar de novo). O responsável é achado pelo e-mail ou pelo primeiro nome.
 */
export async function importarClientes(db: Database, actor: Actor, texto: string, opts: { confirmar: boolean }) {
  const { membro } = await escopoDaAgencia(db, actor);
  if (!pode.importar(membro)) throw new ForbiddenError("Só o administrador da agência importa a carteira.");
  const lido = lerPlanilhaDeClientes(z.string().max(500_000).parse(texto));
  const existentes = new Set((await db.select({ nome: agenciaClientes.nome }).from(agenciaClientes).where(eq(agenciaClientes.agenciaId, membro.agenciaId))).map((c) => normal(c.nome)));
  const equipe = await db.select({ id: users.id, nome: users.name, email: users.email }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId)).where(and(eq(agenciaMembros.agenciaId, membro.agenciaId), isNull(users.disabledAt)));
  const acharResp = (r: string | null) => {
    if (!r) return null; const t = normal(r);
    return (equipe.find((p) => p.email === t) ?? equipe.find((p) => normal(p.nome) === t) ?? (equipe.filter((p) => normal(p.nome).split(" ")[0] === t.split(" ")[0]).length === 1 ? equipe.find((p) => normal(p.nome).split(" ")[0] === t.split(" ")[0]) : undefined))?.id ?? null;
  };
  const vistos = new Set<string>(); const novos: ClienteImportado[] = []; const repetidos: string[] = [];
  for (const c of lido.clientes) { const k = normal(c.nome); if (existentes.has(k) || vistos.has(k)) repetidos.push(c.nome); else { vistos.add(k); novos.push(c); } }
  const semResponsavel = novos.filter((c) => c.responsavel && !acharResp(c.responsavel)).map((c) => `${c.nome} (${c.responsavel})`);
  const resumo = { novos: novos.length, repetidos, erros: lido.erros, semResponsavel, previa: novos.slice(0, 8).map((c) => ({ nome: c.nome, pacote: c.pacote, valorMensalCents: c.valorMensalCents, diaVencimento: c.diaVencimento })) };
  if (!opts.confirmar || !novos.length) return { ...resumo, importados: 0 };
  await db.insert(agenciaClientes).values(novos.map((c) => ({
    id: newId("agcl"), agenciaId: membro.agenciaId, nome: c.nome, segmento: c.segmento, contatoNome: c.contatoNome, whatsapp: c.whatsapp, email: c.email, documento: c.documento,
    pacote: c.pacote, incluso: c.incluso, valorMensalCents: c.valorMensalCents, diaVencimento: c.diaVencimento, responsavelId: acharResp(c.responsavel),
  })));
  await recordAudit(db, actor, { action: "AGENCIA_CLIENTES_IMPORTADOS", entityType: "agencia", entityId: membro.agenciaId, after: { quantidade: novos.length } }, { force: true });
  return { ...resumo, importados: novos.length };
}

// ---------------------------------------------------------------------------
// Cockpit (tela Hoje)
// ---------------------------------------------------------------------------
/** Regra pura (testada): a próxima data de vencimento (AAAA-MM-DD) a partir de hoje, para um dia do mês de 1 a 28. */
export function proximoVencimento(dia: number, hoje: string): string {
  const [a, m, d] = hoje.split("-").map(Number) as [number, number, number];
  const [ano, mes] = d <= dia ? [a, m] : m === 12 ? [a + 1, 1] : [a, m + 1];
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}
const diasEntre = (de: string, ate: string) => Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);
export const hojeEmSaoPaulo = (agora = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);

/** O que o dono da agência vê de manhã: carteira, dinheiro contratado, vencimentos da semana, pendências e carga da equipe. */
export async function cockpitDaAgencia(db: Database, actor: Actor, hoje = hojeEmSaoPaulo()) {
  const { membro, agencia } = await escopoDaAgencia(db, actor);
  const clientes = await listarClientes(db, actor);
  const valores = pode.verValores(membro);
  const ativos = clientes.filter((c) => c.situacao === "ATIVO");
  const mes = hoje.slice(0, 7);
  const vencimentos = valores ? ativos.filter((c) => c.diaVencimento && c.valorMensalCents)
    .map((c) => { const data = proximoVencimento(c.diaVencimento!, hoje); return { id: c.id, nome: c.nome, data, emDias: diasEntre(hoje, data), valorCents: c.valorMensalCents! }; })
    .filter((v) => v.emDias <= 7).sort((x, y) => x.emDias - y.emDias || x.nome.localeCompare(y.nome)) : [];
  const equipe = await db.select({ id: users.id, nome: users.name, funcao: agenciaMembros.funcao }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId)).where(and(eq(agenciaMembros.agenciaId, membro.agenciaId), isNull(users.disabledAt))).orderBy(asc(users.name));
  const carga = equipe.map((p) => ({ ...p, clientes: ativos.filter((c) => c.responsavelId === p.id || c.equipe.includes(p.id)).length, responsavel: ativos.filter((c) => c.responsavelId === p.id).length }));
  return {
    agencia: { nome: agencia.nome, situacao: agencia.situacao, fundadora: agencia.fundadora },
    funcao: membro.funcao, verValores: valores, verCarteiraToda: pode.verTodosClientes(membro),
    ativos: ativos.length, pausados: clientes.filter((c) => c.situacao === "PAUSADO").length,
    encerradosNoMes: clientes.filter((c) => c.situacao === "ENCERRADO" && (c.encerradoEm ?? "").slice(0, 7) === mes).length,
    receitaContratadaCents: valores ? ativos.reduce((s, c) => s + (c.valorMensalCents ?? 0), 0) : null,
    ticketMedioCents: valores && ativos.some((c) => c.valorMensalCents) ? Math.round(ativos.reduce((s, c) => s + (c.valorMensalCents ?? 0), 0) / ativos.filter((c) => c.valorMensalCents).length) : null,
    vencimentos, aReceber7DiasCents: valores ? vencimentos.reduce((s, v) => s + v.valorCents, 0) : null,
    pendencias: {
      semResponsavel: ativos.filter((c) => !c.responsavelId).map((c) => ({ id: c.id, nome: c.nome })),
      semContrato: valores ? ativos.filter((c) => !c.valorMensalCents || !c.diaVencimento).map((c) => ({ id: c.id, nome: c.nome })) : [],
      semContato: ativos.filter((c) => !c.whatsapp && !c.email).map((c) => ({ id: c.id, nome: c.nome })),
    },
    carga,
    meus: ativos.filter((c) => c.responsavelId === membro.userId || c.equipe.includes(membro.userId)).map((c) => ({ id: c.id, nome: c.nome, pacote: c.pacote, incluso: c.incluso })),
  };
}
