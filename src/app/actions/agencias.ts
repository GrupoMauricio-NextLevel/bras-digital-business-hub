"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { convidarMembro, criarAgencia, desligarMembro, marcarAgenciaInterna, mudarFuncao, mudarSituacaoDaAgencia, type novaAgenciaSchema, type novoMembroSchema } from "@/lib/agencias/agencias";
import { atualizarCliente, criarCliente, definirEquipeDoCliente, importarClientes, mudarSituacaoDoCliente, type ClienteInput } from "@/lib/agencias/clientes";
import type { AgenciaClienteSituacao, AgenciaFuncao } from "@/db/schema";
import { atualizarPeca, avancarPeca, comentarPeca, criarPeca, pedirAjuste, planejarMes, transferirPeca, type atualizacaoPecaSchema, type comentarioSchema, type novaPecaSchema } from "@/lib/agencias/producao";
import { mesValido } from "@/lib/agencias/fluxo";
import { responderAulaDaAgencia } from "@/lib/agencias/aprender";
import { copiarRecorrentes, excluirDespesa, lancarDespesa, marcarDespesaPaga, type despesaSchema } from "@/lib/agencias/despesas";
import { cancelarCobranca, conectarMercadoPago, conferirPagamentosAbertos, criarCobrancaAvulsa, desconectarMercadoPago, gerarCobrancasDoMes, gerarLinkDePagamento, marcarPagaManual, type avulsaSchema, type baixaSchema } from "@/lib/agencias/cobranca";
import { responderSolicitacao } from "@/lib/agencias/portal";
import { salvarCaptacao, type captacaoSchema } from "@/lib/agencias/captacao";
import { cancelarContratoDaAgencia, encerrarContratoDaAgencia, enviarContrato, previaDoContrato, reenviarContratoPorEmail, salvarDadosJuridicos, type OpcoesContrato, type dadosJuridicosSchema } from "@/lib/agencias/contratos";
import { trazerContratoDoMaster } from "@/lib/agencias/migrar-contrato-master";
import { atualizarOportunidade, criarOportunidade, marcarOnboarding, perderOportunidade, virarCliente, type oportunidadeSchema } from "@/lib/agencias/comercial";

/** Ações do Painel da Agência (D313). Permissão e agência conferidas no domínio, a partir da sessão. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const idCliente = z.string().regex(/^agcl_[a-z0-9]+$/i);
const idUsuario = z.string().regex(/^usr_[a-z0-9]+$/i);
const refresh = () => revalidatePath("/agencia", "layout");

export async function criarAgenciaAction(input: z.input<typeof novaAgenciaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarAgencia(db, actor, input); revalidatePath("/master/agencias"); return r; });
}
export async function mudarSituacaoDaAgenciaAction(agenciaId: string, situacao: "PILOTO" | "ATIVA" | "PAUSADA") {
  return runAction(async () => { const { actor, db } = await ctx(); await mudarSituacaoDaAgencia(db, actor, z.string().regex(/^agc_[a-z0-9]+$/i).parse(agenciaId), situacao); revalidatePath("/master/agencias"); return undefined; });
}
export async function convidarMembroAction(input: z.input<typeof novoMembroSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await convidarMembro(db, actor, input); refresh(); return r; });
}
export async function mudarFuncaoAction(userId: string, input: { funcao: AgenciaFuncao; todosClientes: boolean }) {
  return runAction(async () => { const { actor, db } = await ctx(); await mudarFuncao(db, actor, idUsuario.parse(userId), input); refresh(); return undefined; });
}
export async function desligarMembroAction(userId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await desligarMembro(db, actor, idUsuario.parse(userId)); refresh(); return undefined; });
}
export async function criarClienteAction(input: ClienteInput) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarCliente(db, actor, input); refresh(); return r; });
}
export async function atualizarClienteAction(id: string, input: Partial<ClienteInput>) {
  return runAction(async () => { const { actor, db } = await ctx(); await atualizarCliente(db, actor, idCliente.parse(id), input); refresh(); return undefined; });
}
export async function mudarSituacaoDoClienteAction(id: string, input: { situacao: AgenciaClienteSituacao; motivo?: string | null }) {
  return runAction(async () => { const { actor, db } = await ctx(); await mudarSituacaoDoCliente(db, actor, idCliente.parse(id), input); refresh(); return undefined; });
}
export async function definirEquipeDoClienteAction(id: string, userIds: string[]) {
  return runAction(async () => { const { actor, db } = await ctx(); await definirEquipeDoCliente(db, actor, idCliente.parse(id), userIds); refresh(); return undefined; });
}
export async function importarClientesAction(texto: string, confirmar: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await importarClientes(db, actor, texto, { confirmar }); if (confirmar) refresh(); return r; });
}

// Produção (D314, Fase 1A)
const idPeca = z.string().regex(/^agpc_[a-z0-9]+$/i);
const refreshProducao = () => { revalidatePath("/agencia", "layout"); };
export async function criarPecaAction(input: z.input<typeof novaPecaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarPeca(db, actor, input); refreshProducao(); return r; });
}
export async function planejarMesAction(clienteIds: string[], mes: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!mesValido(mes)) throw new ForbiddenError("Mês inválido.");
    let criadas = 0;
    for (const id of z.array(idCliente).min(1).max(200).parse(clienteIds)) criadas += (await planejarMes(db, actor, id, mes)).criadas;
    refreshProducao(); return { criadas };
  });
}
export async function atualizarPecaAction(id: string, input: z.input<typeof atualizacaoPecaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); await atualizarPeca(db, actor, idPeca.parse(id), input); refreshProducao(); return undefined; });
}
export async function avancarPecaAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await avancarPeca(db, actor, idPeca.parse(id)); refreshProducao(); return r; });
}
export async function pedirAjusteAction(id: string, motivo: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await pedirAjuste(db, actor, idPeca.parse(id), motivo); refreshProducao(); return undefined; });
}
export async function transferirPecaAction(id: string, userId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await transferirPeca(db, actor, idPeca.parse(id), idUsuario.parse(userId)); refreshProducao(); return undefined; });
}
export async function comentarPecaAction(id: string, input: z.input<typeof comentarioSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await comentarPeca(db, actor, idPeca.parse(id), input); refreshProducao(); return r; });
}

// Aprender da agência (D317)
export async function responderAulaDaAgenciaAction(input: { aulaId: string; respostas: number[] }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await responderAulaDaAgencia(db, actor, input); revalidatePath("/agencia/aprender"); return r; });
}

// Comercial da agência (D317)
const idOportunidade = z.string().regex(/^agop_[a-z0-9]+$/i);
const refreshComercial = () => revalidatePath("/agencia", "layout");
export async function criarOportunidadeAction(input: z.input<typeof oportunidadeSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarOportunidade(db, actor, input); refreshComercial(); return r; });
}
export async function atualizarOportunidadeAction(id: string, input: Parameters<typeof atualizarOportunidade>[3]) {
  return runAction(async () => { const { actor, db } = await ctx(); await atualizarOportunidade(db, actor, idOportunidade.parse(id), input); refreshComercial(); return undefined; });
}
export async function perderOportunidadeAction(id: string, motivo: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await perderOportunidade(db, actor, idOportunidade.parse(id), motivo); refreshComercial(); return undefined; });
}
export async function virarClienteAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await virarCliente(db, actor, idOportunidade.parse(id)); refreshComercial(); return r; });
}
export async function marcarOnboardingAction(clienteId: string, chave: string, feito: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); await marcarOnboarding(db, actor, idCliente.parse(clienteId), chave, feito); refreshComercial(); return undefined; });
}

// Cobrança da agência (D318)
const idFatura = z.string().regex(/^agft_[a-z0-9]+$/i);
const refreshFin = () => revalidatePath("/agencia", "layout");
export async function conectarMercadoPagoAction(token: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await conectarMercadoPago(db, actor, token); refreshFin(); return r; });
}
export async function desconectarMercadoPagoAction() {
  return runAction(async () => { const { actor, db } = await ctx(); await desconectarMercadoPago(db, actor); refreshFin(); return undefined; });
}
export async function gerarCobrancasDoMesAction(mes: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await gerarCobrancasDoMes(db, actor, mes); refreshFin(); return r; });
}
export async function criarCobrancaAvulsaAction(input: z.input<typeof avulsaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await criarCobrancaAvulsa(db, actor, input); refreshFin(); return r; });
}
export async function gerarLinkDePagamentoAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await gerarLinkDePagamento(db, actor, idFatura.parse(id)); refreshFin(); return r; });
}
export async function conferirPagamentosAction() {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await conferirPagamentosAbertos(db, actor); refreshFin(); return r; });
}
export async function marcarPagaManualAction(id: string, observacao: string, extra: z.input<typeof baixaSchema> = {}) {
  return runAction(async () => { const { actor, db } = await ctx(); await marcarPagaManual(db, actor, idFatura.parse(id), observacao, extra); refreshFin(); revalidatePath("/agencia/contratos", "layout"); return undefined; });
}
export async function cancelarCobrancaAction(id: string, motivo: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await cancelarCobranca(db, actor, idFatura.parse(id), motivo); refreshFin(); return undefined; });
}

// Despesas da agência (D319)
const idDespesa = z.string().regex(/^agdp_[a-z0-9]+$/i);
export async function lancarDespesaAction(input: z.input<typeof despesaSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await lancarDespesa(db, actor, input); refreshFin(); return r; });
}
export async function marcarDespesaPagaAction(id: string, pago: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); await marcarDespesaPaga(db, actor, idDespesa.parse(id), pago); refreshFin(); return undefined; });
}
export async function excluirDespesaAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await excluirDespesa(db, actor, idDespesa.parse(id)); refreshFin(); return undefined; });
}
export async function copiarRecorrentesAction(mes: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await copiarRecorrentes(db, actor, mes); refreshFin(); return r; });
}

// Portal do cliente (D320): a agência responde os pedidos que chegam pelo portal
export async function responderSolicitacaoAction(id: string, input: { resposta?: string; situacao: "EM_ANDAMENTO" | "RESPONDIDA" }) {
  return runAction(async () => { const { actor, db } = await ctx(); await responderSolicitacao(db, actor, z.string().regex(/^agso_[a-z0-9]+$/i).parse(id), input); revalidatePath("/agencia", "layout"); return undefined; });
}

// Contratos da agência (D321)
const idContrato = z.string().regex(/^agct_[a-z0-9]+$/i);
export async function salvarDadosJuridicosAction(input: z.input<typeof dadosJuridicosSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); await salvarDadosJuridicos(db, actor, input); revalidatePath("/agencia", "layout"); return undefined; });
}
export async function previaContratoAction(clienteId: string, opcoes: OpcoesContrato) {
  return runAction(async () => { const { actor, db } = await ctx(); return previaDoContrato(db, actor, idCliente.parse(clienteId), opcoes); });
}
export async function enviarContratoAction(clienteId: string, opcoes: OpcoesContrato) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await enviarContrato(db, actor, idCliente.parse(clienteId), opcoes); revalidatePath("/agencia", "layout"); return r; });
}
/** D342: encerrar contrato aceito, reenviar por e-mail e trazer do Master. */
export async function encerrarContratoAgenciaAction(id: string, motivo: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await encerrarContratoDaAgencia(db, actor, idContrato.parse(id), motivo); refresh(); return undefined; });
}
export async function reenviarContratoAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); return reenviarContratoPorEmail(db, actor, idContrato.parse(id)); });
}
export async function trazerContratoDoMasterAction(contratoId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await trazerContratoDoMaster(db, actor, z.string().regex(/^ctr_[a-z0-9]+$/i).parse(contratoId)); refresh(); revalidatePath("/master/contratos"); return r; });
}
export async function marcarAgenciaInternaAction(agenciaId: string, interna: boolean) {
  return runAction(async () => { const { actor, db } = await ctx(); await marcarAgenciaInterna(db, actor, z.string().regex(/^agc_[a-z0-9]+$/i).parse(agenciaId), interna); revalidatePath("/master/agencias"); return undefined; });
}
export async function cancelarContratoAgenciaAction(id: string) {
  return runAction(async () => { const { actor, db } = await ctx(); await cancelarContratoDaAgencia(db, actor, idContrato.parse(id)); revalidatePath("/agencia", "layout"); return undefined; });
}

// Página de captação (D322)
export async function salvarCaptacaoAction(input: z.input<typeof captacaoSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); await salvarCaptacao(db, actor, input); revalidatePath("/agencia/comercial"); return undefined; });
}
