import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { caminhoDoInteressado } from "./brand-leads";
import { activities, brandLeads, contratoParcelas, contratos, crmAcompanhamento, financeInvoices, iaConversas, iaMensagens, organizations, stores, users } from "@/db/schema";
import { DomainError, NotFoundError } from "./errors";
import { requireMasterFn, type Actor } from "./access";
import { funilEcommerce, DEGRAUS } from "./funil-ecommerce";
import { situacoesComerciais, type SituacaoComercial } from "./situacao-comercial";
import { linkWhatsapp } from "./agora-ecommerce";
import { getConfigComercial, mensageiro } from "./comercial-config";
import { origensDe, ROTULO_VIA, type OrigemResumo } from "./trafego/origem-contato";
import { enfileirarConversao } from "./trafego/retorno";

/** Caminho escolhido na entrada (NB1, D306), mostrado no detalhe do cartão do Comercial. */
const ROTULO_CAMINHO: Record<string, string> = { site: "Quer: site para a empresa", loja: "Quer: loja virtual", business: "Quer: sistema de gestão (Business)", agencia: "Quer: ajuda da agência", indeciso: "Ainda não sabe: site ou loja" };

/**
 * Comercial da Commerce (D202): UM funil do contato ao pagante. Junta interessados (formulário), conversas do site com
 * contato e lojas criadas na mesma pessoa (e-mail ou WhatsApp iguais), sem duplicar. A etapa vem dos fatos do sistema
 * (ninguém digita); responsável, próxima ação e prazo ficam em `crm_acompanhamento`.
 */
export const ETAPAS = [
  { key: "contato", rotulo: "Contato", dica: "Deixou nome e WhatsApp, ainda sem loja" },
  { key: "conta", rotulo: "Conta criada", dica: "Criou a loja e está montando" },
  { key: "ativando", rotulo: "Ativando", dica: "Produto e loja no ar; falta receber ou vender" },
  { key: "vendendo", rotulo: "Vendendo", dica: "Já vendeu; ainda sem plano pago" },
  { key: "pagante", rotulo: "Pagante", dica: "Plano ativo" },
  { key: "risco", rotulo: "Em risco", dica: "Pagamento vencido ou pendente" },
  { key: "perdido", rotulo: "Perdido", dica: "Desistiu ou cancelou" },
] as const;
export type Etapa = (typeof ETAPAS)[number]["key"];

export type Pessoa = {
  chave: string; nome: string; empresa: string | null; email: string | null; whatsapp: string | null;
  etapa: Etapa; desde: string; origem: string; temperatura: 1 | 2 | 3; detalhe: string;
  storeId: string | null; leadId: string | null; conversaId: string | null;
  situacao: SituacaoComercial | null; responsavel: string | null; proximaAcao: string | null; prazo: string | null; whatsappHref: string | null;
  /** De onde veio (TR3, D294): canal, campanha, peça, cidade, aparelho, clique de anúncio. */
  fonte: OrigemResumo | null;
  /** Venda fechada à mão (TR3, D294). */
  fechou: { em: string; valorCents: number; descricao: string | null } | null;
  motivoPerda: string | null;
};

/** Motivos de perda (TR3, D294): servem para entender onde o funil vaza. */
export const MOTIVOS_PERDA = ["Achou caro", "Escolheu outra plataforma", "Não respondeu mais", "Ainda não é a hora", "Ainda não tem produto ou empresa", "Não era o público", "Outro"] as const;

const soDigitos = (t: string | null | undefined) => { const d = (t ?? "").replace(/\D/g, ""); return d.length >= 10 ? d.replace(/^55(?=\d{10,11}$)/, "") : null; };
const emailN = (e: string | null | undefined) => (e ?? "").trim().toLowerCase() || null;
const equipe = (actor: Actor) => requireMasterFn(actor, ["COMERCIAL", "SUPORTE"]);

/** Temperatura simples e explicável: faturamento informado, conversa recente, loja avançando. */
function temperatura(p: { faturamento?: string | null; etapa: Etapa; ultima?: string | null }, agora: Date): 1 | 2 | 3 {
  let t = 1;
  if (p.faturamento && !/come(ç|c)ando|ainda n/i.test(p.faturamento)) t++;
  if (["ativando", "vendendo", "risco"].includes(p.etapa)) t++;
  if (p.ultima && agora.getTime() - new Date(p.ultima).getTime() < 2 * 86_400_000) t++;
  return Math.min(3, t) as 1 | 2 | 3;
}

export async function funilComercial(db: Database, actor: Actor, agora = new Date()): Promise<Pessoa[]> {
  equipe(actor);
  const lojas = await db.select({ id: stores.id, nome: stores.name, whatsapp: stores.whatsapp, email: stores.contactEmail, criadaEm: stores.createdAt, paidUntil: stores.paidUntil, trialEndsAt: stores.trialEndsAt, entryOffer: stores.entryOffer })
    .from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(and(eq(organizations.brand, "NEXTLEVEL_COMMERCE"), isNull(stores.showcaseTheme)));
  const ids = lojas.map((l) => l.id);
  const MSG = mensageiro(await getConfigComercial(db));
  const [donos, sit, funil, leads, conversas, acomp] = await Promise.all([
    ids.length ? db.select({ storeId: users.storeId, nome: users.name, email: users.email }).from(users).where(and(inArray(users.storeId, ids), eq(users.role, "STORE_OWNER"), eq(users.storeRole, "OWNER"))) : Promise.resolve([]),
    situacoesComerciais(db, lojas, agora),
    funilEcommerce(db, actor, agora),
    db.select().from(brandLeads).where(eq(brandLeads.brand, "NEXTLEVEL_COMMERCE")).orderBy(desc(brandLeads.createdAt)).limit(500),
    db.select().from(iaConversas).where(and(eq(iaConversas.brand, "NEXTLEVEL_COMMERCE"), eq(iaConversas.canal, "HOME"), isNotNull(iaConversas.whatsapp))).orderBy(desc(iaConversas.ultimaEm)).limit(500),
    db.select().from(crmAcompanhamento).where(eq(crmAcompanhamento.brand, "NEXTLEVEL_COMMERCE")),
  ]);
  const ac = new Map(acomp.map((a) => [a.chave, a]));
  const parada = new Map(funil.paradas.map((p) => [p.storeId, p]));
  const dono = new Map(donos.map((d) => [d.storeId!, d]));
  const pessoas: Pessoa[] = [];
  const porContato = new Map<string, Pessoa>();
  const indexar = (p: Pessoa) => { for (const k of [emailN(p.email), soDigitos(p.whatsapp)]) if (k && !porContato.has(k)) porContato.set(k, p); };
  const achar = (email: string | null | undefined, tel: string | null | undefined) => porContato.get(emailN(email) ?? "") ?? porContato.get(soDigitos(tel) ?? "");
  const comAcomp = (p: Omit<Pessoa, "responsavel" | "proximaAcao" | "prazo" | "whatsappHref" | "fonte" | "fechou" | "motivoPerda">): Pessoa => {
    const a = ac.get(p.chave);
    const fechou = a?.fechouEm ? { em: a.fechouEm, valorCents: a.valorFechadoCents ?? 0, descricao: a.fechouDescricao } : null;
    // Fechado à mão conta como pagante (a menos que o sistema já diga "em risco"); perdido vence tudo.
    const etapa: Etapa = a?.perdido ? "perdido" : fechou && p.etapa !== "risco" ? "pagante" : p.etapa;
    const detalhe = fechou && etapa === "pagante" && p.etapa !== "pagante" ? `Fechado à mão: ${brl(fechou.valorCents)}${fechou.descricao ? ` · ${fechou.descricao}` : ""}` : p.detalhe;
    return { ...p, etapa, detalhe, responsavel: a?.responsavelNome ?? null, proximaAcao: a?.proximaAcao ?? null, prazo: a?.prazo ?? null, whatsappHref: linkWhatsapp(p.whatsapp, MSG.interessado(p.nome.split(" ")[0] ?? p.nome)), fonte: null, fechou, motivoPerda: a?.perdido ? a.motivoPerda ?? null : null };
  };

  // 1) Lojas (a forma mais avançada da pessoa).
  for (const l of lojas) {
    const s = sit.get(l.id)!;
    const pa = parada.get(l.id);
    const etapa: Etapa = s.pagamento === "pagante" ? "pagante" : s.pagamento === "vencido" || s.pagamento === "aguardando" ? "risco" : s.pagamento === "cancelado" ? "perdido"
      : !pa ? "vendendo" : pa.parouEm === "PRODUTO" ? "conta" : pa.parouEm === "PUBLICOU" || pa.parouEm === "PAGAMENTO" || pa.parouEm === "PRIMEIRA_VENDA" ? "ativando" : "vendendo";
    const d = dono.get(l.id);
    const p = comAcomp({ chave: `loja:${l.id}`, nome: d?.nome ?? l.nome, empresa: l.nome, email: d?.email ?? l.email, whatsapp: l.whatsapp, etapa, desde: l.criadaEm, origem: "Cadastro no site",
      temperatura: temperatura({ etapa }, agora), detalhe: pa?.passo && etapa !== "pagante" ? `Falta: ${pa.passo}` : s.rotulo, storeId: l.id, leadId: null, conversaId: null, situacao: s });
    pessoas.push(p); indexar(p);
  }
  // 2) Conversas do site com contato: viram "contato" se a pessoa ainda não tem loja.
  for (const c of conversas) {
    const ja = achar(c.email, c.whatsapp);
    if (ja) { ja.conversaId ??= c.id; continue; }
    const p = comAcomp({ chave: `conversa:${c.id}`, nome: c.nome ?? "Visitante", empresa: null, email: c.email, whatsapp: c.whatsapp, etapa: c.status === "PERDIDA" ? "perdido" : "contato", desde: c.createdAt,
      origem: `Conversa com o Maurício${c.origem?.utm_source ? ` · ${c.origem.utm_source}` : ""}`, temperatura: temperatura({ faturamento: c.faturamento, etapa: "contato", ultima: c.ultimaEm }, agora),
      detalhe: [c.faturamento, c.interesse].filter(Boolean).join(" · ") || (c.ultimaMensagem ?? ""), storeId: null, leadId: c.leadId, conversaId: c.id, situacao: null });
    pessoas.push(p); indexar(p);
  }
  // 3) Interessados do formulário.
  for (const l of leads) {
    const ja = achar(l.email, l.phone);
    if (ja) { ja.leadId ??= l.id; continue; }
    const p = comAcomp({ chave: `interessado:${l.id}`, nome: l.name, empresa: l.storeName, email: l.email, whatsapp: l.phone, etapa: l.status === "LOST" ? "perdido" : "contato", desde: l.createdAt,
      origem: `Formulário${l.attribution?.utm_source ? ` · ${l.attribution.utm_source}` : l.affiliateRef ? " · parceiro" : ""}`, temperatura: temperatura({ etapa: "contato", ultima: l.createdAt }, agora),
      detalhe: [ROTULO_CAMINHO[caminhoDoInteressado(l.needs) ?? ""], l.segment, l.message?.slice(0, 90)].filter(Boolean).join(" · "), storeId: null, leadId: l.id, conversaId: null, situacao: null });
    pessoas.push(p); indexar(p);
  }
  // TR3 (D294): a origem da pessoa é a da forma mais antiga que ela deixou (formulário ou conversa) ou do cadastro da loja.
  const origens = await origensDe(db, pessoas.flatMap((p) => [p.chave, p.leadId ? `interessado:${p.leadId}` : "", p.conversaId ? `conversa:${p.conversaId}` : ""]).filter(Boolean));
  for (const p of pessoas) {
    const f = [origens.get(p.leadId ? `interessado:${p.leadId}` : ""), origens.get(p.conversaId ? `conversa:${p.conversaId}` : ""), origens.get(p.chave)]
      .filter((x): x is OrigemResumo => !!x).sort((a, b) => a.em.localeCompare(b.em));
    // Código digitado pela equipe vale mais que a captura automática.
    p.fonte = f.find((x) => x.via === "CODIGO_WHATSAPP") ?? f[0] ?? null;
    if (p.fonte) p.origem = `${ROTULO_VIA[p.fonte.via]} · ${p.fonte.rotulo}${p.fonte.campanha ? ` · ${p.fonte.campanha}` : ""}`;
  }
  return pessoas.sort((a, b) => b.temperatura - a.temperatura || b.desde.localeCompare(a.desde));
}

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Ficha 360: a pessoa e uma linha do tempo única (conversa, marcos da loja, notas). */
export async function fichaCliente(db: Database, actor: Actor, chave: string, agora = new Date()) {
  const todas = await funilComercial(db, actor, agora);
  const p = todas.find((x) => x.chave === chave);
  if (!p) throw new NotFoundError("Cliente não encontrado.");
  type Evento = { em: string; tipo: "conversa" | "loja" | "nota" | "sistema" | "email" | "dinheiro"; texto: string; autor?: string };
  const linha: Evento[] = [];
  if (p.conversaId) {
    const ms = await db.select().from(iaMensagens).where(eq(iaMensagens.conversaId, p.conversaId)).orderBy(asc(iaMensagens.createdAt)).limit(200);
    for (const m of ms) if (m.autor !== "SISTEMA") linha.push({ em: m.createdAt, tipo: "conversa", texto: m.texto.replaceAll("**", ""), autor: m.autor === "CLIENTE" ? p.nome : m.autor === "HUMANO" ? `${m.autorNome ?? "Equipe"} (equipe)` : "Maurício" });
  }
  if (p.leadId) {
    const [l] = await db.select().from(brandLeads).where(eq(brandLeads.id, p.leadId)).limit(1);
    if (l) { linha.push({ em: l.createdAt, tipo: "sistema", texto: `Preencheu o formulário${l.message ? `: “${l.message.slice(0, 200)}”` : ""}` }); if (l.notes) linha.push({ em: l.updatedAt, tipo: "nota", texto: l.notes }); }
  }
  if (p.storeId) {
    linha.push({ em: p.desde, tipo: "loja", texto: `Criou a loja ${p.empresa ?? ""}`.trim() });
    const at = await db.select().from(activities).where(eq(activities.storeId, p.storeId)).orderBy(desc(activities.createdAt)).limit(15);
    for (const a of at) linha.push({ em: a.createdAt, tipo: "loja", texto: a.message });
    const ajuda = await db.select({ id: iaConversas.id }).from(iaConversas).where(and(eq(iaConversas.storeId, p.storeId), eq(iaConversas.canal, "PAINEL"))).limit(5);
    for (const c of ajuda) for (const m of await db.select().from(iaMensagens).where(eq(iaMensagens.conversaId, c.id)).orderBy(asc(iaMensagens.createdAt)).limit(100))
      if (m.autor !== "SISTEMA") linha.push({ em: m.createdAt, tipo: "conversa", texto: m.texto, autor: m.autor === "CLIENTE" ? `${p.nome} (Ajuda)` : `${m.autorNome ?? "Equipe"} (equipe)` });
  }
  // D301: e-mails (suporte@), contrato com parcelas e faturas do plano na mesma linha do tempo.
  if (p.email) {
    const convs = await db.select({ id: iaConversas.id }).from(iaConversas).where(and(eq(iaConversas.canal, "EMAIL"), eq(iaConversas.email, p.email.toLowerCase()))).limit(5);
    if (convs.length) for (const m of await db.select().from(iaMensagens).where(inArray(iaMensagens.conversaId, convs.map((c) => c.id))).orderBy(asc(iaMensagens.createdAt)).limit(200))
      if (m.autor !== "SISTEMA") linha.push({ em: m.createdAt, tipo: "email", texto: m.texto, autor: m.autor === "CLIENTE" ? `${p.nome} (e-mail)` : `${m.autorNome ?? "Equipe"} (e-mail)` });
  }
  if (p.storeId) {
    for (const c of await db.select({ id: contratos.id, numero: contratos.numero, titulo: contratos.titulo, enviadoEm: contratos.enviadoEm, aceitoEm: contratos.aceitoEm }).from(contratos).where(eq(contratos.storeId, p.storeId)).limit(10)) {
      linha.push({ em: c.enviadoEm, tipo: "dinheiro", texto: `Contrato ${c.numero} enviado: ${c.titulo}` });
      if (c.aceitoEm) linha.push({ em: c.aceitoEm, tipo: "dinheiro", texto: `Contrato ${c.numero} aceito no painel` });
    }
    for (const x of await db.select().from(contratoParcelas).where(eq(contratoParcelas.storeId, p.storeId)).limit(40)) {
      const n = `Parcela ${x.ordem} (${brl(x.valorCents)})`;
      if (x.avisadoEm) linha.push({ em: x.avisadoEm, tipo: "dinheiro", texto: `${n}: avisou que fez o Pix${x.avisoNota ? ` · “${x.avisoNota.slice(0, 120)}”` : ""}` });
      if (x.confirmadoEm) linha.push({ em: x.confirmadoEm, tipo: "dinheiro", texto: `${n}: recebimento confirmado` });
      if (x.naoEncontradoEm) linha.push({ em: x.naoEncontradoEm, tipo: "dinheiro", texto: `${n}: Pix não encontrado no banco` });
    }
    const ST: Record<string, string> = { OPEN: "em aberto", PAID: "paga", OVERDUE: "vencida", WAIVED: "dispensada", CANCELED: "cancelada" };
    for (const f of await db.select({ desc: financeInvoices.description, valor: financeInvoices.amountCents, status: financeInvoices.status, criada: financeInvoices.createdAt, paga: financeInvoices.paidAt }).from(financeInvoices).where(eq(financeInvoices.storeId, p.storeId)).orderBy(desc(financeInvoices.createdAt)).limit(24)) {
      linha.push({ em: f.criada, tipo: "dinheiro", texto: `Fatura: ${f.desc} · ${brl(f.valor)} (${ST[f.status] ?? f.status})` });
      if (f.paga) linha.push({ em: f.paga, tipo: "dinheiro", texto: `Pagou: ${f.desc} · ${brl(f.valor)}` });
    }
  }
  if (p.fonte) linha.push({ em: p.fonte.em, tipo: "sistema", texto: `Chegou por ${p.fonte.rotulo}${p.fonte.campanha ? ` (campanha ${p.fonte.campanha}${p.fonte.peca ? `, peça ${p.fonte.peca}` : ""})` : ""}${p.fonte.cidade ? ` · ${p.fonte.cidade}${p.fonte.uf ? `/${p.fonte.uf}` : ""}` : ""}${p.fonte.aparelho ? ` · ${p.fonte.aparelho}` : ""}` });
  if (p.fechou) linha.push({ em: p.fechou.em, tipo: "sistema", texto: `Negócio fechado: ${brl(p.fechou.valorCents)}${p.fechou.descricao ? ` · ${p.fechou.descricao}` : ""}` });
  const [a] = await db.select().from(crmAcompanhamento).where(eq(crmAcompanhamento.chave, chave)).limit(1);
  if (a?.notas) linha.push({ em: a.updatedAt, tipo: "nota", texto: a.notas, autor: a.responsavelNome ?? undefined });
  linha.sort((x, y) => y.em.localeCompare(x.em));
  const passos = p.storeId ? DEGRAUS.map((d) => d.rotulo) : [];
  return { pessoa: p, linha, notas: a?.notas ?? "", passos };
}

/** Responsável, próxima ação, prazo, notas ou "perdido". */
export type Fechamento = { valorCents: number; descricao?: string | null } | null;
export async function salvarAcompanhamento(db: Database, actor: Actor, chave: string, nomeAtor: string, d: { proximaAcao?: string; prazo?: string | null; notas?: string; assumir?: boolean; perdido?: boolean; motivoPerda?: string | null; fechou?: Fechamento }) {
  equipe(actor);
  if (!/^(loja|interessado|conversa):[\w-]+$/.test(chave)) throw new DomainError("CHAVE", "Cliente inválido.");
  if (d.perdido && d.motivoPerda !== undefined && d.motivoPerda !== null && !MOTIVOS_PERDA.some((m) => d.motivoPerda === m || d.motivoPerda!.startsWith(`${m}: `)))
    throw new DomainError("MOTIVO", "Escolha um motivo da lista.");
  if (d.fechou && (!Number.isInteger(d.fechou.valorCents) || d.fechou.valorCents < 0 || d.fechou.valorCents > 100_000_000)) throw new DomainError("VALOR", "Informe o valor fechado em reais.");
  const valores = {
    ...(d.proximaAcao !== undefined ? { proximaAcao: d.proximaAcao.trim().slice(0, 200) || null } : {}),
    ...(d.prazo !== undefined ? { prazo: d.prazo ? new Date(d.prazo).toISOString() : null } : {}),
    ...(d.notas !== undefined ? { notas: d.notas.slice(0, 3000) } : {}),
    ...(d.assumir ? { responsavelId: actor.userId, responsavelNome: nomeAtor } : {}),
    ...(d.perdido !== undefined ? { perdido: d.perdido, motivoPerda: d.perdido ? (d.motivoPerda?.slice(0, 200) ?? null) : null } : {}),
    // Fechou: grava valor e o quê; fechou = null desfaz. Fechar tira o "perdido".
    ...(d.fechou !== undefined ? (d.fechou ? { fechouEm: agoraIso(), valorFechadoCents: d.fechou.valorCents, fechouDescricao: d.fechou.descricao?.trim().slice(0, 200) || null, perdido: false, motivoPerda: null } : { fechouEm: null, valorFechadoCents: null, fechouDescricao: null }) : {}),
    updatedAt: agoraIso(),
  };
  await db.insert(crmAcompanhamento).values({ chave, ...valores }).onConflictDoUpdate({ target: crmAcompanhamento.chave, set: valores });
  // TR5 (D298): negócio fechado à mão volta para a Meta e o Google como venda, com o valor.
  if (d.fechou) await enfileirarConversao(db, { evento: "VENDA", chave, valorCents: d.fechou.valorCents });
}
const agoraIso = () => new Date().toISOString();
