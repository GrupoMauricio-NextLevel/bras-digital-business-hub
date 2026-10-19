import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { requireMasterFn, type Actor } from "./access";
import { recordAudit } from "./audit";
import { DECISOES, mesDe, type RegistroDecisao, type Sugestao } from "@/lib/revisao-desligados-base";

/**
 * Revisão mensal do "Pronto e desligado" (R4, D174). Cada item desligado tem uma sugestão (o dono disse "eu sugiro, você
 * decide") e a decisão do mês: ligar, manter desligado ou aposentar. Decidir aqui NÃO liga nada: só registra a escolha,
 * que fica na auditoria. A sugestão segue a regra de foco 60/25/15 (E-commerce primeiro, até 10 lojistas pagantes).
 */
export { DECISOES, ROTULO_DECISAO, mesDe, type Decisao, type RegistroDecisao, type Sugestao } from "@/lib/revisao-desligados-base";
/** Minhas sugestões de outubro/2026. Chave = `key` do item em `readyButOff`. */
export const SUGESTOES: Record<string, Sugestao> = {
  "roteiro-1": { decisao: "LIGAR", porque: "Custa nada e mostra quanto o lojista da E-commerce aceita pagar. Ligue só na E-commerce." },
  "roteiro-2": { decisao: "LIGAR", porque: "Na E-commerce a trilha de primeiros passos ajuda a loja a publicar e vender (sem pontos, que são do Club da Brás)." },
  "roteiro-3": { decisao: "MANTER", porque: "Experimento de preço precisa de visitas; com poucas lojas novas por semana a resposta não sai." },
  "roteiro-4": { decisao: "MANTER", porque: "A barra do ecossistema só faz sentido quando duas marcas estiverem abertas para o mesmo público." },
  "roteiro-5": { decisao: "MANTER", porque: "O Club é do Brás Digital, que fica para outra etapa." },
  "mp-nextlevel": { decisao: "LIGAR", porque: "Sem a conta de produção a E-commerce não cobra os planos: é o primeiro passo da meta de 10 lojistas pagantes." },
  pagarme: { decisao: "MANTER", porque: "Um gateway basta até haver volume; dois dobram conferência e suporte." },
  "excursao-taxa": { decisao: "MANTER", porque: "Brás e Cargas estão nos 15% do esforço; cobrar antes de ter ônibus ativos afasta quem está chegando." },
  "excursao-pix": { decisao: "MANTER", porque: "Mesmo motivo da taxa: ligar quando houver ônibus usando toda semana." },
  experimentos: { decisao: "MANTER", porque: "Sem tráfego, experimento não dá resposta confiável." },
  proposta: { decisao: "MANTER", porque: "Aprovar quando os preços da E-commerce estiverem fechados com as entrevistas do questionário." },
  "cadastro-commerce": { decisao: "LIGAR", porque: "É a porta da meta de 10 lojistas pagantes: sem cadastro aberto, cada loja depende de contato manual." },
  "parceiros-commerce": { decisao: "MANTER", porque: "Abrir parceiros depois dos primeiros 5 lojistas pagantes, com o produto já provado." },
  "bras-publico": { decisao: "MANTER", porque: "Brás fica para outra etapa (decisão de foco)." },
  "bras-paineis": { decisao: "MANTER", porque: "Brás fica para outra etapa (decisão de foco)." },
  "site-grupo": { decisao: "MANTER", porque: "A home do grupo ficou para depois (decisão do dono, 19/10)." },
  "master-exclusivo": { decisao: "MANTER", porque: "Já está como deve: o Master só abre no endereço dele." },
  escritorio: { decisao: "MANTER", porque: "Endereço separado para painéis só quando houver muitos lojistas; hoje confunde mais que ajuda." },
  email: { decisao: "LIGAR", porque: "Sem e-mail o lojista não recebe pedido, senha nem cobrança. Essencial para vender." },
  suporte: { decisao: "LIGAR", porque: "Lojista novo precisa de um caminho para pedir ajuda; sem isso desiste." },
};

const KEY = "qualidade.revisao-desligados";
const registroSchema = z.object({ decisao: z.enum(DECISOES), nota: z.string().max(400).default(""), mes: z.string().regex(/^\d{4}-\d{2}$/), quem: z.string(), quando: z.string() });
const revisaoSchema = z.record(z.string(), registroSchema);

export async function revisaoDesligados(db: Database): Promise<Record<string, RegistroDecisao>> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const p = revisaoSchema.safeParse(row?.value);
  return p.success ? p.data : {};
}

/** Itens ainda sem decisão no mês corrente (os ligados não entram). */
export function pendentesDoMes(itens: { key: string; state: string }[], revisao: Record<string, RegistroDecisao>, now = new Date()): string[] {
  const mes = mesDe(now);
  return itens.filter((i) => i.state !== "LIGADO" && revisao[i.key]?.mes !== mes).map((i) => i.key);
}

const entradaSchema = z.object({ key: z.string().min(1).max(60), decisao: z.enum(DECISOES), nota: z.string().max(400).optional() });

/** Registra a decisão do mês para um item. Só o dono do Master; fica na auditoria. Não liga nada. */
export async function decidirDesligado(db: Database, actor: Actor, raw: unknown, now = new Date()) {
  requireMasterFn(actor, []);
  const e = entradaSchema.parse(raw);
  const atual = await revisaoDesligados(db);
  const registro: RegistroDecisao = { decisao: e.decisao, nota: e.nota?.trim() ?? "", mes: mesDe(now), quem: actor.userId, quando: now.toISOString() };
  const value = { ...atual, [e.key]: registro };
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: now.toISOString() } });
  await recordAudit(db, actor, { action: "REVISAO_DESLIGADO", entityType: "platform_setting", entityId: `${KEY}:${e.key}`, before: atual[e.key], after: registro }, { force: true });
  return registro;
}
