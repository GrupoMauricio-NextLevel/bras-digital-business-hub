import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import type { BrasRules } from "./regras";

/**
 * Modelos jurídicos da Brás v2 (D108). O dono pediu "dados simulados e editáveis": os textos nascem como MODELO
 * SIMULADO (sem valor de contrato), com os dados da empresa fictícios e marcados, e ficam editáveis no Master.
 * Valores (sinal, prazos, taxa) entram por marcadores `{{...}}` que leem as regras e o catálogo na hora: mudou a
 * regra, o texto acompanha. Só depois da revisão do advogado o Master marca "Revisado" (com nome e data).
 * Enquanto estiver simulado, toda tela que mostrar o texto exibe o aviso.
 */
export const BRAS_LEGAL_DOCS = ["PRE_PEDIDO", "COTA_CONTEINER", "COTACAO_FORA_CATALOGO", "IMPORTADORA", "TRANSPORTADORA", "PLANOS_MEMBRO"] as const;
export type BrasLegalDoc = (typeof BRAS_LEGAL_DOCS)[number];

const entitySchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  cnpj: z.string().trim().min(2).max(40),
  address: z.string().trim().min(2).max(240),
  forum: z.string().trim().min(2).max(80),
  email: z.string().trim().min(3).max(120),
  dpoName: z.string().trim().min(2).max(120),
  /** Verdadeiro enquanto os dados da empresa forem fictícios. */
  simulated: z.boolean(),
});
const docSchema = z.object({
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(20).max(20_000),
  status: z.enum(["SIMULADO", "REVISADO"]),
  reviewedBy: z.string().trim().max(120).nullable(),
  reviewedAt: z.string().nullable(),
  version: z.number().int().min(1),
});
export const brasLegalSchema = z.object({
  entity: entitySchema,
  docs: z.object(Object.fromEntries(BRAS_LEGAL_DOCS.map((d) => [d, docSchema])) as Record<BrasLegalDoc, typeof docSchema>),
});
export type BrasLegal = z.infer<typeof brasLegalSchema>;
export type BrasLegalDocValue = z.infer<typeof docSchema>;

export const BRAS_LEGAL_LABEL: Record<BrasLegalDoc, string> = {
  PRE_PEDIDO: "Pré-pedido de produto em alto mar", COTA_CONTEINER: "Cota de contêiner dividido", COTACAO_FORA_CATALOGO: "Cotação fora do catálogo",
  IMPORTADORA: "Termos da importadora parceira", TRANSPORTADORA: "Termos da transportadora (NextLevel Cargas)", PLANOS_MEMBRO: "Planos do membro",
};

/** Marcadores aceitos nos textos (o Master vê a lista ao editar). */
export const BRAS_LEGAL_TOKENS: Record<string, string> = {
  empresa: "Razão social", cnpj: "CNPJ", endereco: "Endereço", foro: "Foro", email: "E-mail jurídico", encarregado: "Encarregado de dados (LGPD)",
  sinalPct: "Sinal do pré-pedido (%)", atrasoDias: "Atraso que libera a devolução (dias)", saldoDias: "Prazo para pagar o saldo (dias)",
  cotacaoCatalogoDias: "Prazo da cotação do catálogo (dias)", cotacaoForaDias: "Prazo da cotação fora do catálogo (dias)", cotacaoForaItens: "Itens por cotação fora do catálogo",
  cotacaoForaTaxa: "Taxa da cotação fora do catálogo (do catálogo Master)", cotacaoForaDevolucaoPct: "Devolução da taxa se atrasar (%)",
  cotaPrazoDias: "Prazo para completar o contêiner (dias)", cotaProrrogacaoDias: "Prorrogação (dias)", cotaProrrogacoes: "Número de prorrogações", cotaMinimoPct: "Mínimo para fechar (%)",
  comissaoCargaGratisPct: "Comissão por carga no plano grátis (%)", comissaoCargaProPct: "Comissão por carga no Pro (%)", comissaoCargaPremiumPct: "Comissão por carga no Premium (%)",
};

const SIMULADO = "[DADO SIMULADO]";
export const DEFAULT_BRAS_LEGAL: BrasLegal = {
  entity: { legalName: `NextLevel Marketing Ltda ${SIMULADO}`, cnpj: `00.000.000/0001-00 ${SIMULADO}`, address: `Rua Exemplo, 100, Brás, São Paulo/SP, 03000-000 ${SIMULADO}`, forum: "São Paulo/SP", email: `juridico@exemplo.com.br ${SIMULADO}`, dpoName: `Nome do encarregado ${SIMULADO}`, simulated: true },
  docs: {
    PRE_PEDIDO: { title: "Condições do pré-pedido de produto em alto mar", status: "SIMULADO", reviewedBy: null, reviewedAt: null, version: 1, body: `1. Partes. A compra é feita entre o membro (comprador, pessoa jurídica) e a importadora que vende o produto. A {{empresa}}, CNPJ {{cnpj}}, opera a plataforma Brás Digital e intermedia o pedido; não é a vendedora da mercadoria.
2. Sinal. Para reservar caixas de um produto em trânsito, o membro paga um sinal de {{sinalPct}}% do valor do pedido, diretamente à importadora. O sinal não é investimento nem aplicação: é parte do pagamento de uma mercadoria com entrega futura.
3. Saldo. Quando o produto ficar disponível no galpão da importadora, o membro paga o saldo em até {{saldoDias}} dias. Sem o pagamento do saldo no prazo, o pedido pode ser cancelado conforme a política de devolução da importadora.
4. Previsão de chegada. A data de chegada é uma previsão informada pela importadora e pode mudar por motivos de transporte, porto ou desembaraço. Toda mudança é avisada ao membro.
5. Atraso. Se a chegada passar {{atrasoDias}} dias da previsão original, o membro pode cancelar e receber de volta 100% do sinal, devolvido pela importadora. A plataforma registra o pedido de devolução e acompanha o prazo.
6. Avaria ou falta. Atendimento pela equipe da Brás Digital, com devolução proporcional ao que faltar ou chegar avariado, conforme conferência no recebimento.
7. Nota fiscal. A importadora emite a nota fiscal da mercadoria.
8. Dados. A importadora recebe apenas o necessário para entregar o pedido. Encarregado de dados: {{encarregado}} ({{email}}).
9. Foro. Fica eleito o foro de {{foro}}.` },
    COTA_CONTEINER: { title: "Condições da cota de contêiner dividido", status: "SIMULADO", reviewedBy: null, reviewedAt: null, version: 1, body: `1. O que é. A cota é a compra antecipada de uma quantidade definida de caixas de mercadoria, com entrega futura, num contêiner organizado pela importadora. Não é investimento, consórcio nem participação em lucro.
2. Pagamento. O valor da cota é pago diretamente à importadora, que emite a nota fiscal da mercadoria. A {{empresa}} opera a plataforma e não recebe o valor da mercadoria.
3. Prazo para completar. O contêiner precisa atingir {{cotaMinimoPct}}% das cotas em até {{cotaPrazoDias}} dias. O prazo pode ser prorrogado {{cotaProrrogacoes}} vez(es), por {{cotaProrrogacaoDias}} dias, com aviso a todos e opção de sair sem custo.
4. Não completou. Se o contêiner não completar no prazo, a venda é cancelada e cada comprador recebe de volta 100% do que pagou.
5. Preço. O preço da cota é calculado com o contêiner cheio. Se a importadora quiser fechar com ocupação menor, qualquer ajuste de ocupação é mostrado antes e só vale com o aceite do comprador.
6. Chegada. Depois de completo, o contêiner segue a linha do tempo de importação, com previsão de chegada avisada a cada mudança.
7. Foro de {{foro}}.` },
    COTACAO_FORA_CATALOGO: { title: "Serviço de cotação de contêiner fora do catálogo", status: "SIMULADO", reviewedBy: null, reviewedAt: null, version: 1, body: `1. Serviço. A {{empresa}} recebe até {{cotacaoForaItens}} itens que não estão no catálogo, leva às importadoras parceiras e devolve uma proposta de contêiner ou a justificativa de não cotação.
2. Taxa. O serviço custa {{cotacaoForaTaxa}}, pagos à {{empresa}}, com nota fiscal de serviço.
3. Prazo. A resposta sai em até {{cotacaoForaDias}} dias da confirmação do pagamento. Se o prazo vencer sem resposta, a {{empresa}} devolve {{cotacaoForaDevolucaoPct}}% da taxa.
4. Sem obrigação de compra. A proposta não obriga o membro a comprar. Itens de catálogo têm cotação sem taxa, com resposta em até {{cotacaoCatalogoDias}} dias, nos planos que incluem o serviço.
5. Foro de {{foro}}.` },
    IMPORTADORA: { title: "Termos da importadora parceira", status: "SIMULADO", reviewedBy: null, reviewedAt: null, version: 1, body: `1. A importadora vende as próprias mercadorias aos membros da Brás Digital, emite a nota fiscal e recebe os pagamentos na própria conta.
2. Comissão. A {{empresa}} recebe a comissão combinada na ficha da importadora sobre as vendas pagas, apurada por mês, com relatório e conferência.
3. Dados do comprador. A importadora recebe só o endereço de entrega de cada pedido. Contato, atendimento, ocorrências e trocas são com a Brás Digital. É proibido usar os dados recebidos para contato comercial direto.
4. Estoque. A importadora mantém o saldo atualizado (manual, planilha ou integração). Pedido confirmado e sem estoque é tratado pela equipe da Brás.
5. Pré-pedido e contêiner. Quando oferecer, a importadora segue as condições do pré-pedido e da cota, incluindo devolução por atraso e por contêiner incompleto.
6. Conteúdo. Vídeos gravados no showroom podem ser publicados pela Brás. Conteúdo pago sai com o rótulo "Patrocinado"; o veredito da análise é independente.
7. Foro de {{foro}}.` },
    TRANSPORTADORA: { title: "Termos da transportadora (NextLevel Cargas)", status: "SIMULADO", reviewedBy: null, reviewedAt: null, version: 1, body: `1. A transportadora presta o serviço de transporte diretamente ao contratante e responde pela carga desde a coleta até a entrega, conforme a lei e o seguro declarado.
2. Comissão por carga. A {{empresa}} cobra, sobre o valor do frete das cargas fechadas pela plataforma: {{comissaoCargaGratisPct}}% no plano grátis, {{comissaoCargaProPct}}% no Pro e {{comissaoCargaPremiumPct}}% no Premium, em fatura mensal.
3. Documentos. RNTRC, seguro, CT-e e MDF-e são de responsabilidade da transportadora.
4. Retirada. A coleta só acontece com o código do pedido conferido no balcão da importadora.
5. Publicidade. Destaques pagos aparecem sempre com o rótulo "Patrocinado". A nota de reputação é calculada pelo sistema e não é vendida.
6. Foro de {{foro}}.` },
    PLANOS_MEMBRO: { title: "Condições dos planos do membro", status: "SIMULADO", reviewedBy: null, reviewedAt: null, version: 1, body: `1. Comprar caixas é grátis em qualquer plano. Os planos pagos liberam informação, ferramentas e atendimento.
2. Nenhum plano garante venda, margem ou lucro. Análises, tendências e simulações ajudam a decidir; o resultado depende do seu negócio.
3. Renovação mensal, com cancelamento a qualquer momento e sem multa: o acesso segue até o fim do mês pago.
4. Contratante: {{empresa}}, CNPJ {{cnpj}}, {{endereco}}. Dúvidas: {{email}}.
5. Foro de {{foro}}.` },
  },
};

const KEY = "bras.legal";
export async function getBrasLegal(db: Database): Promise<BrasLegal> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const v = (row?.value ?? {}) as Partial<BrasLegal>;
  const entity = entitySchema.safeParse(v.entity);
  const docs = { ...DEFAULT_BRAS_LEGAL.docs };
  for (const d of BRAS_LEGAL_DOCS) { const p = docSchema.safeParse(v.docs?.[d]); if (p.success) docs[d] = p.data; }
  return { entity: entity.success ? entity.data : DEFAULT_BRAS_LEGAL.entity, docs };
}

const legalEditSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("entity"), entity: entitySchema }),
  z.object({ kind: z.literal("doc"), doc: z.enum(BRAS_LEGAL_DOCS), title: z.string(), body: z.string(), reviewed: z.boolean(), reviewedBy: z.string().trim().max(120).optional() }),
]);

/** Edita os dados da empresa ou um documento. Mudar o texto sobe a versão; marcar "Revisado" exige o nome de quem revisou. */
export async function saveBrasLegal(db: Database, actor: Actor, raw: z.input<typeof legalEditSchema>, now = new Date()) {
  requireMaster(actor);
  const input = legalEditSchema.parse(raw);
  const cur = await getBrasLegal(db);
  let next: BrasLegal;
  if (input.kind === "entity") next = { ...cur, entity: input.entity };
  else {
    const before = cur.docs[input.doc];
    if (input.reviewed && !input.reviewedBy) throw new z.ZodError([{ code: "custom", path: ["reviewedBy"], message: "Informe quem revisou (nome e OAB)." }]);
    const changed = before.title !== input.title.trim() || before.body !== input.body.trim();
    const doc = docSchema.parse({
      title: input.title, body: input.body, status: input.reviewed ? "REVISADO" : "SIMULADO",
      reviewedBy: input.reviewed ? input.reviewedBy ?? null : null,
      reviewedAt: input.reviewed ? (before.status === "REVISADO" && !changed ? before.reviewedAt : now.toISOString()) : null,
      version: changed ? before.version + 1 : before.version,
    });
    next = { ...cur, docs: { ...cur.docs, [input.doc]: doc } };
  }
  await db.insert(platformSettings).values({ key: KEY, value: next, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: next, updatedBy: actor.userId, updatedAt: now.toISOString() } });
  await recordAudit(db, actor, { action: "BRAS_LEGAL_SAVED", entityType: "platform_settings", entityId: input.kind === "entity" ? `${KEY}.entity` : `${KEY}.${input.doc}`, before: input.kind === "entity" ? cur.entity : { version: cur.docs[input.doc].version, status: cur.docs[input.doc].status }, after: input.kind === "entity" ? next.entity : { version: next.docs[input.doc].version, status: next.docs[input.doc].status } }, { force: true });
  return next;
}

const pctBps = (b: number) => (b / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Troca os marcadores pelos valores atuais. Marcador desconhecido fica visível entre colchetes (nunca some em silêncio). */
export function renderBrasLegal(body: string, entity: BrasLegal["entity"], rules: BrasRules, offCatalogFeeCents: number | null): string {
  const map: Record<string, string> = {
    empresa: entity.legalName, cnpj: entity.cnpj, endereco: entity.address, foro: entity.forum, email: entity.email, encarregado: entity.dpoName,
    sinalPct: String(rules.preorder.depositPct), atrasoDias: String(rules.preorder.delayRefundDays), saldoDias: String(rules.preorder.balanceDueDays),
    cotacaoCatalogoDias: String(rules.quotes.catalogDays), cotacaoForaDias: String(rules.quotes.offCatalogDays), cotacaoForaItens: String(rules.quotes.offCatalogMaxItems),
    cotacaoForaTaxa: offCatalogFeeCents === null ? "[valor a definir no catálogo Master]" : formatBRL(offCatalogFeeCents), cotacaoForaDevolucaoPct: String(rules.quotes.offCatalogLateRefundPct),
    cotaPrazoDias: String(rules.shared.closeDays), cotaProrrogacaoDias: String(rules.shared.extensionDays), cotaProrrogacoes: String(rules.shared.maxExtensions), cotaMinimoPct: String(rules.shared.minFillPct),
    comissaoCargaGratisPct: pctBps(rules.carriers.commissionBps.GRATIS), comissaoCargaProPct: pctBps(rules.carriers.commissionBps.PRO), comissaoCargaPremiumPct: pctBps(rules.carriers.commissionBps.PREMIUM),
  };
  return body.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_, k: string) => map[k] ?? `[marcador desconhecido: ${k}]`);
}
