import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { DESPESA_CATEGORIAS, agenciaClientes, agenciaDespesas, agenciaFaturas } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { escopoDaAgencia, pode } from "./acesso";
import { mesAnterior } from "./fluxo";

/**
 * Despesas da agência e margem por cliente (D319, briefing da UPClips: custos fixos e variáveis, freelancers, custo por
 * cliente, lucro e margem estimados). O investimento em mídia que o cliente paga direto às plataformas não entra aqui.
 * Só administrador e financeiro.
 */
export const CATEGORIA_ROTULO: Record<(typeof DESPESA_CATEGORIAS)[number], string> = { FIXO: "Custo fixo", FREELANCER: "Freelancer", VARIAVEL: "Custo variável", FERRAMENTA: "Ferramenta", IMPOSTO: "Imposto", OUTRO: "Outro" };

async function escopo(db: Database, actor: Actor) {
  const e = await escopoDaAgencia(db, actor);
  if (!pode.editarContrato(e.membro)) throw new ForbiddenError("As despesas são do administrador e do financeiro.");
  return e;
}

export const despesaSchema = z.object({
  competencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  descricao: z.string().trim().min(2, "Descreva a despesa").max(160),
  categoria: z.enum(DESPESA_CATEGORIAS),
  valorCents: z.number().int().min(1, "Informe o valor").max(100_000_000),
  clienteId: z.string().optional().nullable(),
  favorecido: z.string().trim().max(120).optional().nullable(),
  pago: z.boolean().default(false),
  recorrente: z.boolean().default(false),
});

export async function lancarDespesa(db: Database, actor: Actor, raw: z.input<typeof despesaSchema>) {
  const { membro } = await escopo(db, actor);
  const d = despesaSchema.parse(raw);
  if (d.clienteId && !(await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, d.clienteId), eq(agenciaClientes.agenciaId, membro.agenciaId)) }))) throw new NotFoundError("Cliente não encontrado.");
  const id = newId("agdp");
  await db.insert(agenciaDespesas).values({ id, agenciaId: membro.agenciaId, competencia: d.competencia, descricao: d.descricao, categoria: d.categoria, valorCents: d.valorCents, clienteId: d.clienteId || null, favorecido: d.favorecido?.trim() || null, pago: d.pago, pagoEm: d.pago ? new Date().toISOString() : null, recorrente: d.recorrente, origemId: d.recorrente ? id : null });
  return { id };
}

async function despesaDaAgencia(db: Database, agenciaId: string, id: string) {
  const d = await db.query.agenciaDespesas.findFirst({ where: and(eq(agenciaDespesas.id, id), eq(agenciaDespesas.agenciaId, agenciaId)) });
  if (!d) throw new NotFoundError("Despesa não encontrada.");
  return d;
}

export async function marcarDespesaPaga(db: Database, actor: Actor, id: string, pago: boolean) {
  const { membro } = await escopo(db, actor);
  const d = await despesaDaAgencia(db, membro.agenciaId, id);
  await db.update(agenciaDespesas).set({ pago, pagoEm: pago ? new Date().toISOString() : null }).where(eq(agenciaDespesas.id, d.id));
}

export async function excluirDespesa(db: Database, actor: Actor, id: string) {
  const { membro } = await escopo(db, actor);
  const d = await despesaDaAgencia(db, membro.agenciaId, id);
  if (d.pago) throw new DomainError("PAGA", "Despesa já paga não se apaga; desmarque o pagamento antes, se foi engano.");
  await db.delete(agenciaDespesas).where(eq(agenciaDespesas.id, d.id));
  await recordAudit(db, actor, { action: "AGENCIA_DESPESA_EXCLUIDA", entityType: "agencia_despesa", entityId: d.id, before: { descricao: d.descricao, valorCents: d.valorCents } }, { force: true });
}

/** Traz para o mês as despesas recorrentes do mês anterior (aluguel, ferramentas), sem pagar e sem duplicar. */
export async function copiarRecorrentes(db: Database, actor: Actor, mes: string) {
  const { membro } = await escopo(db, actor);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new DomainError("MES", "Mês inválido.");
  const anteriores = await db.select().from(agenciaDespesas).where(and(eq(agenciaDespesas.agenciaId, membro.agenciaId), eq(agenciaDespesas.competencia, mesAnterior(mes)), eq(agenciaDespesas.recorrente, true)));
  if (!anteriores.length) return { copiadas: 0 };
  const r = await db.insert(agenciaDespesas).values(anteriores.map((d) => ({ id: newId("agdp"), agenciaId: d.agenciaId, competencia: mes, descricao: d.descricao, categoria: d.categoria, valorCents: d.valorCents, clienteId: d.clienteId, favorecido: d.favorecido, recorrente: true, origemId: d.origemId ?? d.id })))
    .onConflictDoNothing().returning({ id: agenciaDespesas.id });
  return { copiadas: r.length };
}

/**
 * Resultado do mês (testado): receita recebida e contratada, despesas por categoria, resultado e margem, e a margem
 * direta de cada cliente (o que o cliente paga no mês menos os custos lançados para ele; custos gerais não são rateados).
 */
export async function resultadoDoMes(db: Database, actor: Actor, mes: string) {
  const { membro } = await escopo(db, actor);
  const [despesas, faturas, clientes] = await Promise.all([
    db.select().from(agenciaDespesas).where(and(eq(agenciaDespesas.agenciaId, membro.agenciaId), eq(agenciaDespesas.competencia, mes))).orderBy(asc(agenciaDespesas.categoria), asc(agenciaDespesas.descricao)),
    db.select().from(agenciaFaturas).where(and(eq(agenciaFaturas.agenciaId, membro.agenciaId), eq(agenciaFaturas.competencia, mes), ne(agenciaFaturas.situacao, "CANCELADA"), eq(agenciaFaturas.registradoNoMaster, false))),
    db.select({ id: agenciaClientes.id, nome: agenciaClientes.nome }).from(agenciaClientes).where(eq(agenciaClientes.agenciaId, membro.agenciaId)),
  ]);
  const faturado = faturas.reduce((s, f) => s + f.valorCents, 0);
  const recebido = faturas.filter((f) => f.situacao === "PAGA").reduce((s, f) => s + f.valorCents, 0);
  const custo = despesas.reduce((s, d) => s + d.valorCents, 0);
  const porCategoria = DESPESA_CATEGORIAS.map((c) => ({ categoria: c, valorCents: despesas.filter((d) => d.categoria === c).reduce((s, d) => s + d.valorCents, 0) })).filter((c) => c.valorCents);
  const nomes = new Map(clientes.map((c) => [c.id, c.nome]));
  const ids = [...new Set([...faturas.map((f) => f.clienteId), ...despesas.filter((d) => d.clienteId).map((d) => d.clienteId!)])];
  const porCliente = ids.map((id) => {
    const receita = faturas.filter((f) => f.clienteId === id).reduce((s, f) => s + f.valorCents, 0);
    const custos = despesas.filter((d) => d.clienteId === id).reduce((s, d) => s + d.valorCents, 0);
    return { clienteId: id, nome: nomes.get(id) ?? "", receitaCents: receita, custoCents: custos, margemCents: receita - custos, margemPct: receita ? Math.round(((receita - custos) / receita) * 100) : null };
  }).sort((a, b) => (a.margemPct ?? -999) - (b.margemPct ?? -999));
  return {
    mes, faturadoCents: faturado, recebidoCents: recebido, despesasCents: custo, despesasPagasCents: despesas.filter((d) => d.pago).reduce((s, d) => s + d.valorCents, 0),
    resultadoCents: faturado - custo, margemPct: faturado ? Math.round(((faturado - custo) / faturado) * 100) : null,
    porCategoria, porCliente, despesas: despesas.map((d) => ({ ...d, clienteNome: d.clienteId ? nomes.get(d.clienteId) ?? null : null })),
  };
}
