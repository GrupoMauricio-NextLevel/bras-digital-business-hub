import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { agenciaClientes, agenciaContratos, agenciaFaturas, contratoParcelas, contratos, stores, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { garantirParcelas } from "@/lib/domain/contratos";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { sendEmail } from "@/lib/email";
import { newId } from "@/lib/ids";
import { MODELO_LOJA_PRONTA, formatar, type DadosLojaPronta } from "@/lib/contratos/loja-pronta-express";
import { escopoDaAgencia, pode } from "./acesso";
import { pdfDoContratoDaAgencia } from "./contratos";
import { urlDoPortal } from "./portal";

/**
 * Trazer contratos de serviço do Master para o Painel da Agência interna (D335). O contrato aceito NÃO é reescrito nem
 * assinado de novo: texto congelado, impressão digital e prova do aceite são copiados como estão, com a origem marcada.
 * O original fica no Master, marcado "transferido" e fora das pendências e lembretes de lá. Parcelas pagas entram como
 * "pago, registrado no caixa do Master" (não somam de novo na receita da agência). Só o administrador da agência interna.
 */
async function escopo(db: Database, actor: Actor) {
  const e = await escopoDaAgencia(db, actor);
  if (!e.agencia.interna) throw new ForbiddenError("Só a agência interna da NextLevel traz contratos do Master.");
  if (!pode.gerirEquipe(e.membro)) throw new ForbiddenError("Só o administrador traz contratos do Master.");
  return e;
}

/** Contratos de serviço aceitos no Master que ainda não vieram para a agência. */
export async function contratosDoMasterParaTrazer(db: Database, actor: Actor) {
  await escopo(db, actor);
  const rows = await db.select({ id: contratos.id, numero: contratos.numero, titulo: contratos.titulo, aceitoEm: contratos.aceitoEm, aceitoNome: contratos.aceitoNome, dados: contratos.dados, loja: stores.name })
    .from(contratos).innerJoin(stores, eq(stores.id, contratos.storeId))
    .where(and(eq(contratos.status, "ACEITO"), eq(contratos.modelo, MODELO_LOJA_PRONTA), isNull(contratos.transferidoEm))).orderBy(desc(contratos.aceitoEm));
  return rows.map(({ dados, ...r }) => { const d = dados as unknown as DadosLojaPronta; return { ...r, cliente: d.cliente.nome, valorCents: d.valorCents }; });
}

export async function trazerContratoDoMaster(db: Database, actor: Actor, contratoId: string, now = new Date()) {
  const { agencia } = await escopo(db, actor);
  const ja = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.origemContratoId, contratoId), eq(agenciaContratos.agenciaId, agencia.id)) });
  if (ja) return { id: ja.id, numero: ja.numero, clienteId: ja.clienteId, novo: false };
  const c = await db.query.contratos.findFirst({ where: eq(contratos.id, contratoId) });
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  if (c.modelo !== MODELO_LOJA_PRONTA) throw new DomainError("NAO_SERVICO", "Só contratos de serviço (Loja Virtual Pronta Express) vêm para a agência.");
  if (c.status !== "ACEITO") throw new DomainError("NAO_ACEITO", "Traga só contratos já aceitos. O que espera aceite continua no Master até o cliente aceitar.");
  if (c.transferidoEm) throw new DomainError("JA_TRANSFERIDO", "Este contrato já foi levado para outra agência.");
  await garantirParcelas(db, c);
  const d = c.dados as unknown as DadosLojaPronta;
  const [loja, parcelas, quemAceitou] = await Promise.all([
    db.query.stores.findFirst({ where: eq(stores.id, c.storeId), columns: { name: true } }),
    db.select().from(contratoParcelas).where(eq(contratoParcelas.contratoId, c.id)).orderBy(asc(contratoParcelas.ordem)),
    c.aceitoPor ? db.query.users.findFirst({ where: eq(users.id, c.aceitoPor), columns: { email: true } }) : Promise.resolve(undefined),
  ]);
  const doc = d.cliente.documento.replace(/\D/g, "");
  const id = newId("agct");
  const r = await db.transaction(async (tx) => {
    // O cliente: o que já está ligado à loja, ou um novo com os dados do contrato.
    let cliente = await tx.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.agenciaId, agencia.id), eq(agenciaClientes.storeId, c.storeId)) });
    if (!cliente) {
      const clienteId = newId("agcl");
      await tx.insert(agenciaClientes).values({
        id: clienteId, agenciaId: agencia.id, nome: (loja?.name ?? d.loja.nome).slice(0, 120), contatoNome: d.cliente.nome, email: d.cliente.email.toLowerCase(),
        documento: doc.length === 11 || doc.length === 14 ? doc : null, pacote: "Loja Virtual Pronta Express", storeId: c.storeId, inicioEm: c.enviadoEm.slice(0, 10),
        observacoes: `Contrato ${c.numero} trazido do Master em ${formatar.data(now.toISOString())}.`, exigeAprovacao: false, onboarding: { contrato: c.aceitoEm },
      });
      cliente = (await tx.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, clienteId) }))!;
    }
    await tx.insert(agenciaContratos).values({
      id, agenciaId: agencia.id, clienteId: cliente.id, numero: c.numero, titulo: c.titulo, dados: c.dados, conteudo: c.conteudo, hash: c.hash, status: "ACEITO",
      enviadoPor: c.enviadoPor, enviadoEm: c.enviadoEm, aceitoPor: c.aceitoPor, aceitoEmail: quemAceitou?.email ?? d.cliente.email, aceitoNome: c.aceitoNome, aceitoEm: c.aceitoEm,
      aceitoIp: c.aceitoIp, aceitoAparelho: c.aceitoAparelho, aceitoHash: c.aceitoHash ?? c.hash,
      modelo: "LOJA_PRONTA_EXPRESS", versaoModelo: c.versaoModelo, origem: "MASTER", origemContratoId: c.id, valorTotalCents: d.valorCents,
    });
    if (parcelas.length) await tx.insert(agenciaFaturas).values(parcelas.map((p) => ({
      id: newId("agft"), agenciaId: agencia.id, clienteId: cliente!.id, competencia: (p.confirmadoEm ?? p.vencimento).slice(0, 7), descricao: `Loja Virtual Pronta Express · ${p.descricao}`,
      valorCents: p.valorCents, vencimento: p.vencimento.slice(0, 10), avulsa: true, contratoId: id, parcela: p.ordem,
      ...(p.status === "PAGA"
        ? { situacao: "PAGA" as const, pagoEm: p.confirmadoEm ?? now.toISOString(), pagoComo: "MANUAL" as const, pagoMeio: "PIX", registradoNoMaster: true, observacao: `Confirmado no Master${p.caixaLancamentoId ? " e lançado no caixa" : ""}` }
        : { observacao: "Aberta no Master; a conferência passa a ser feita na agência" }),
    })));
    const t = await tx.update(contratos).set({ transferidoEm: now.toISOString(), transferidoPara: id }).where(and(eq(contratos.id, c.id), isNull(contratos.transferidoEm))).returning({ id: contratos.id });
    if (!t.length) throw new DomainError("JA_TRANSFERIDO", "Este contrato acabou de ser trazido. Recarregue a página.");
    return { clienteId: cliente.id, emailCliente: cliente.email ?? d.cliente.email };
  });
  await recordAudit(db, actor, { action: "AGENCIA_CONTRATO_TRAZIDO_DO_MASTER", entityType: "agencia_contrato", entityId: id, after: { origem: c.id, numero: c.numero, hash: c.hash } }, { force: true });
  await recordAudit(db, actor, { action: "CONTRATO_TRANSFERIDO_PARA_AGENCIA", entityType: "contrato", entityId: c.id, after: { agenciaContratoId: id, agenciaId: agencia.id } }, { force: true });
  const novo = (await db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, id) }))!;
  if (r.emailCliente) {
    const anexo = [{ filename: `Contrato-${c.numero}.pdf`, contentBase64: Buffer.from(await pdfDoContratoDaAgencia(novo)).toString("base64") }];
    await sendEmail(db, {
      kind: "AGENCIA_CONTRATO_TRANSFERIDO", to: r.emailCliente, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contrato:${id}:transferido`,
      subject: `Seu contrato ${c.numero} agora também está no portal da ${agencia.nome}`,
      text: `Olá, ${d.cliente.nome.split(" ")[0]}!\n\nO seu contrato ${c.numero} (${c.titulo}), aceito em ${c.aceitoEm ? formatar.data(c.aceitoEm) : "—"}, passou a ser acompanhado pela equipe de serviços da ${agencia.nome}. Nada muda no que foi combinado: o texto e o seu aceite continuam exatamente os mesmos (a cópia está em anexo).\n\nNo portal do cliente você acompanha o andamento, as parcelas e fala com a equipe. A sua loja e o contrato da plataforma continuam no painel da loja, como sempre.`,
      cta: { label: "Abrir o portal do cliente", url: urlDoPortal(agencia.slug) }, attachments: anexo,
    });
  }
  return { id, numero: c.numero, clienteId: r.clienteId, novo: true };
}

