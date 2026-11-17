import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { agenciaClientes, agenciaContratos, agenciaMembros, agencias, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { sendEmail } from "@/lib/email";
import { newId } from "@/lib/ids";
import { dataHora, gerarPdfDocumento } from "@/lib/contratos/pdf";
import { formatar } from "@/lib/contratos/loja-pronta-express";
import { escopoDaAgencia, pode } from "./acesso";
import { hojeEmSaoPaulo, inclusoTexto } from "./clientes";
import { hashDoContrato, pendenciasDoContrato, secoesDoContrato, type DadosContratoAgencia } from "./contrato-modelo";
import { clienteDoPortal, urlDoPortal } from "./portal";

/**
 * Contratos da agência com os clientes dela (D321), sobre o motor dos contratos do Master (D276): a agência gera pelo
 * modelo (com os dados da ficha), envia e o cliente aceita no portal com o texto que viu (impressão digital igual). O
 * aceite guarda a prova, marca o onboarding e manda o PDF assinado aos dois lados. Só administrador e financeiro.
 */
async function escopo(db: Database, actor: Actor) {
  const e = await escopoDaAgencia(db, actor);
  if (!pode.editarContrato(e.membro)) throw new ForbiddenError("Os contratos são do administrador e do financeiro.");
  return e;
}

export const dadosJuridicosSchema = z.object({
  razaoSocial: z.string().trim().min(3, "Razão social").max(160),
  documento: z.string().trim().min(11, "CNPJ ou CPF").max(20),
  cidadeForo: z.string().trim().min(3, "Cidade do foro, ex.: São Paulo/SP").max(80),
});
export async function salvarDadosJuridicos(db: Database, actor: Actor, raw: z.input<typeof dadosJuridicosSchema>) {
  const { agencia } = await escopo(db, actor);
  const d = dadosJuridicosSchema.parse(raw);
  await db.update(agencias).set({ ...d, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agencia.id));
}

export const opcoesSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início"),
  vigenciaMeses: z.number().int().min(1).max(60).default(12),
  avisoPrevioDias: z.number().int().min(0).max(180).default(30),
  rodadasAjuste: z.number().int().min(0).max(10).default(2),
  prazoAprovacaoDias: z.number().int().min(1).max(30).default(3),
  extras: z.string().trim().max(4000).optional().nullable(),
});
export type OpcoesContrato = z.input<typeof opcoesSchema>;

async function montar(db: Database, actor: Actor, clienteId: string, raw: OpcoesContrato) {
  const { agencia, membro } = await escopo(db, actor);
  const c = await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, clienteId), eq(agenciaClientes.agenciaId, agencia.id)) });
  if (!c) throw new NotFoundError("Cliente não encontrado.");
  const o = opcoesSchema.parse(raw);
  const u = (await db.query.users.findFirst({ where: eq(users.id, membro.userId), columns: { name: true, email: true } }))!;
  const dados: DadosContratoAgencia = {
    contratada: { nome: agencia.nome, razao: agencia.razaoSocial ?? "", documento: agencia.documento ?? "", cidadeForo: agencia.cidadeForo ?? "", representante: u.name, email: u.email },
    cliente: { nome: c.nome, documento: c.documento ?? "", email: c.email?.toLowerCase() ?? "", contato: c.contatoNome },
    pacote: c.pacote ?? "", inclusoTexto: inclusoTexto(c.incluso), valorMensalCents: c.valorMensalCents ?? 0, diaVencimento: c.diaVencimento ?? 0,
    inicio: o.inicio, vigenciaMeses: o.vigenciaMeses, avisoPrevioDias: o.avisoPrevioDias, rodadasAjuste: o.rodadasAjuste, prazoAprovacaoDias: o.prazoAprovacaoDias, extras: o.extras?.trim() || null,
  };
  const secoes = secoesDoContrato(dados);
  return { agencia, membro, cliente: c, dados, secoes, pendencias: pendenciasDoContrato(dados) };
}

/** Prévia: o texto exatamente como vai sair, e o que falta preencher. */
export async function previaDoContrato(db: Database, actor: Actor, clienteId: string, raw: OpcoesContrato) {
  const { dados, secoes, pendencias } = await montar(db, actor, clienteId, raw);
  return { dados, secoes, pendencias };
}

/** Envia o contrato (o envio é a assinatura da agência) e avisa o cliente por e-mail com o link do portal. */
export async function enviarContrato(db: Database, actor: Actor, clienteId: string, raw: OpcoesContrato, now = new Date()) {
  const { agencia, membro, cliente, dados, secoes, pendencias } = await montar(db, actor, clienteId, raw);
  if (pendencias.length) throw new DomainError("CONTRATO_INCOMPLETO", `Falta preencher: ${pendencias.join("; ")}.`);
  const aberto = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.status, "ENVIADO")), columns: { id: true } });
  if (aberto) throw new DomainError("JA_ENVIADO", "Já há um contrato esperando o aceite deste cliente. Cancele aquele antes de mandar outro.");
  const id = newId("agct");
  const numero = `AG-${hojeEmSaoPaulo(now).replace(/-/g, "")}-${id.slice(-5).toUpperCase()}`;
  const hash = hashDoContrato(dados, secoes);
  await db.insert(agenciaContratos).values({ id, agenciaId: agencia.id, clienteId: cliente.id, numero, titulo: `Prestação de serviços de marketing · ${cliente.nome}`, dados: dados as unknown as Record<string, unknown>, conteudo: { secoes }, hash, enviadoPor: membro.userId, enviadoEm: now.toISOString() });
  await recordAudit(db, actor, { action: "AGENCIA_CONTRATO_ENVIADO", entityType: "agencia_contrato", entityId: id, after: { numero, clienteId: cliente.id, hash } }, { force: true });
  await sendEmail(db, {
    kind: "AGENCIA_CONTRATO_ENVIADO", to: dados.cliente.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contrato:${id}:enviado`,
    subject: `${agencia.nome}: seu contrato está pronto para aceite`,
    text: `Olá! A ${agencia.nome} enviou o contrato ${numero} (${formatar.brl(dados.valorMensalCents)} por mês). Leia com calma e aceite pelo portal, com o seu e-mail e um código, sem senha.`,
    cta: { label: "Ler e aceitar", url: urlDoPortal(agencia.slug) },
  });
  return { id, numero };
}

export async function cancelarContratoDaAgencia(db: Database, actor: Actor, id: string, now = new Date()) {
  const { agencia } = await escopo(db, actor);
  const r = await db.update(agenciaContratos).set({ status: "CANCELADO", canceladoEm: now.toISOString() }).where(and(eq(agenciaContratos.id, id), eq(agenciaContratos.agenciaId, agencia.id), eq(agenciaContratos.status, "ENVIADO"))).returning({ id: agenciaContratos.id });
  if (!r.length) throw new DomainError("NAO_CANCELA", "Só dá para cancelar contrato que ainda não foi aceito.");
}

export async function contratosDoClienteNaAgencia(db: Database, actor: Actor, clienteId: string) {
  const { agencia } = await escopo(db, actor);
  return db.select({ id: agenciaContratos.id, numero: agenciaContratos.numero, status: agenciaContratos.status, enviadoEm: agenciaContratos.enviadoEm, aceitoEm: agenciaContratos.aceitoEm, aceitoNome: agenciaContratos.aceitoNome })
    .from(agenciaContratos).where(and(eq(agenciaContratos.agenciaId, agencia.id), eq(agenciaContratos.clienteId, clienteId), ne(agenciaContratos.status, "CANCELADO"))).orderBy(desc(agenciaContratos.enviadoEm));
}

/** Contratos que o cliente vê no portal: os que esperam o aceite (com o texto) e os aceitos. */
export async function contratosDoPortal(db: Database, agenciaId: string, token: string | undefined, clienteId: string) {
  const { cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  return contratosVistosPeloCliente(db, agenciaId, cliente.id);
}
/** Os contratos como o cliente vê (portal e "Ver como cliente"). Quem chama já conferiu o acesso. */
export async function contratosVistosPeloCliente(db: Database, agenciaId: string, clienteId: string) {
  const cliente = { id: clienteId };
  const rows = await db.select().from(agenciaContratos).where(and(eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.agenciaId, agenciaId), ne(agenciaContratos.status, "CANCELADO"))).orderBy(desc(agenciaContratos.enviadoEm));
  return rows.map((c) => ({ id: c.id, numero: c.numero, titulo: c.titulo, status: c.status, hash: c.hash, enviadoEm: c.enviadoEm, aceitoEm: c.aceitoEm, aceitoNome: c.aceitoNome, secoes: c.status === "ENVIADO" ? c.conteudo.secoes : [] }));
}

export const aceiteSchema = z.object({ concordo: z.literal(true, { error: "Marque \"Li e concordo\" para aceitar." }), hashVisto: z.string().length(64), nome: z.string().trim().min(3, "Digite o seu nome completo").max(120) });

/** Aceite do cliente no portal: só uma vez, só do texto que ele viu, com a prova gravada e o PDF para os dois lados. */
export async function aceitarContratoNoPortal(db: Database, agenciaId: string, token: string | undefined, clienteId: string, id: string, raw: z.input<typeof aceiteSchema>, prova: { ip: string | null; aparelho: string | null }, now = new Date()) {
  const { email, cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const input = aceiteSchema.parse(raw);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.agenciaId, agenciaId)) });
  if (!c || c.status === "CANCELADO") throw new NotFoundError("Contrato não encontrado.");
  if (c.status === "ACEITO") throw new DomainError("JA_ACEITO", "Este contrato já foi aceito.");
  if (input.hashVisto !== c.hash || hashDoContrato(c.dados as unknown as DadosContratoAgencia, c.conteudo.secoes) !== c.hash) throw new DomainError("CONTRATO_MUDOU", "O contrato mudou desde que você abriu a página. Recarregue e leia de novo.");
  const r = await db.update(agenciaContratos).set({ status: "ACEITO", aceitoEmail: email, aceitoNome: input.nome, aceitoEm: now.toISOString(), aceitoIp: prova.ip?.slice(0, 100) ?? null, aceitoAparelho: prova.aparelho?.slice(0, 300) ?? null })
    .where(and(eq(agenciaContratos.id, c.id), eq(agenciaContratos.status, "ENVIADO"))).returning({ id: agenciaContratos.id });
  if (!r.length) throw new DomainError("JA_ACEITO", "Este contrato já foi aceito.");
  await db.update(agenciaClientes).set({ onboarding: { ...(cliente.onboarding ?? {}), contrato: now.toISOString() }, updatedAt: now.toISOString() }).where(eq(agenciaClientes.id, cliente.id));
  const aceito = (await db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, c.id) }))!;
  const anexo = [{ filename: `Contrato-${c.numero}.pdf`, contentBase64: Buffer.from(await pdfDoContratoDaAgencia(aceito)).toString("base64") }];
  const d = c.dados as unknown as DadosContratoAgencia;
  const quando = dataHora(now.toISOString());
  const admins = await db.select({ email: users.email }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId)).where(and(eq(agenciaMembros.agenciaId, agenciaId), inArray(agenciaMembros.funcao, ["ADMIN", "FINANCEIRO"])));
  for (const to of new Set([d.contratada.email, ...admins.map((a) => a.email)])) {
    await sendEmail(db, { kind: "AGENCIA_CONTRATO_ACEITO", to, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contrato:${c.id}:aceito:${to}`, subject: `Contrato ${c.numero} aceito por ${cliente.nome}`, text: `${input.nome} aceitou o contrato ${c.numero} no portal em ${quando}. A cópia assinada pelas duas partes está em anexo.\n\nImpressão digital: ${c.hash}`, attachments: anexo });
  }
  await sendEmail(db, { kind: "AGENCIA_CONTRATO_ACEITO_CLIENTE", to: email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contrato:${c.id}:aceito-cliente`, subject: `Seu contrato com a ${d.contratada.nome} está assinado`, text: `Registramos o seu aceite do contrato ${c.numero} em ${quando}. A cópia assinada pelas duas partes está em anexo e também fica no portal.`, attachments: anexo });
  return { numero: c.numero };
}

/** PDF do contrato (o mesmo motor do D276), com a marca da agência no topo. */
export function pdfDoContratoDaAgencia(c: typeof agenciaContratos.$inferSelect) {
  const d = c.dados as unknown as DadosContratoAgencia;
  return gerarPdfDocumento({
    titulo: `Contrato ${c.numero} · ${c.titulo}`, autor: d.contratada.razao, marca: [d.contratada.nome, "com tecnologia NextLevel"],
    cabecalho: ["Contrato de Prestação de Serviços", `Marketing digital · nº ${c.numero} · ${formatar.data(c.enviadoEm)}`],
    rodape: `Contrato ${c.numero} · ${d.contratada.nome} e ${d.cliente.nome}`,
    resumo: [
      ["Contratada", `${d.contratada.razao} · CNPJ/CPF ${d.contratada.documento} · representada por ${d.contratada.representante} · ${d.contratada.email}`],
      ["Contratante", `${d.cliente.nome} · CPF/CNPJ ${d.cliente.documento} · ${d.cliente.email}`],
      ["Pacote", `${d.pacote ? `${d.pacote}: ` : ""}${d.inclusoTexto}`],
      ["Valor", `${formatar.brl(d.valorMensalCents)} por mês, vencimento todo dia ${d.diaVencimento}`],
      ["Vigência", `A partir de ${formatar.data(d.inicio)}, ${d.vigenciaMeses} meses com renovação automática; aviso prévio de ${d.avisoPrevioDias} dias`],
    ],
    secoes: c.conteudo.secoes,
    registro: [
      `CONTRATADA: ${d.contratada.razao}, CNPJ/CPF ${d.contratada.documento}, representada por ${d.contratada.representante}. Assinado e enviado pelo Painel da Agência em ${dataHora(c.enviadoEm)}.`,
      c.aceitoEm ? `CONTRATANTE: ${c.aceitoNome ?? d.cliente.nome}, CPF/CNPJ ${d.cliente.documento}. Aceito no portal do cliente, com código enviado a ${c.aceitoEmail}, em ${dataHora(c.aceitoEm)}. Endereço de rede: ${c.aceitoIp ?? "não informado"}. Aparelho: ${c.aceitoAparelho ?? "não informado"}.` : "CONTRATANTE: aguardando o aceite no portal do cliente.",
    ],
    hash: c.hash,
  });
}

/** Contrato para baixar: pela agência (administrador e financeiro) ou pelo cliente dono, no portal. */
export async function contratoParaPdfDaAgencia(db: Database, actor: Actor, id: string) {
  const { agencia } = await escopo(db, actor);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.agenciaId, agencia.id)) });
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  return c;
}
export async function contratoParaPdfDoPortal(db: Database, agenciaId: string, token: string | undefined, clienteId: string, id: string) {
  const { cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.agenciaId, agenciaId), ne(agenciaContratos.status, "CANCELADO")) });
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  return c;
}
