import { randomBytes, createHash } from "node:crypto";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { iaConversas, iaMensagens } from "@/db/schema";
import { CONTATOS } from "@/lib/contatos";
import { newId } from "@/lib/ids";
import * as hm from "@/lib/integrations/hostinger-mail";
import { quemSao } from "./caixa-entrada";

/**
 * E-mail para suporte@ vira atendimento no Master (D300). O aviso da Hostinger só dispara a busca: as mensagens são
 * lidas na própria caixa (o corpo do aviso nunca é confiável) e cada uma entra uma vez só (uid guardado na mensagem).
 */
const agora = () => new Date().toISOString();

/** Tira a parte citada da resposta ("> ..." e "Em ..., fulano escreveu:"), para o atendimento ver só o texto novo. */
export function textoNovo(texto: string): string {
  const linhas = texto.replace(/\r/g, "").split("\n");
  const fim = linhas.findIndex((l) => /^(Em|On) .+(escreveu|wrote):\s*$/i.test(l.trim()) || /^-{2,} ?(Mensagem original|Original Message)/i.test(l.trim()));
  const corpo = (fim >= 0 ? linhas.slice(0, fim) : linhas).filter((l) => !l.startsWith(">"));
  return corpo.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const paraSuporte = (m: hm.Mensagem) => [...m.to, ...m.cc].some((a) => a.address.toLowerCase() === CONTATOS.suporte);

/** Busca as últimas mensagens da Entrada e transforma as de suporte@ ainda não importadas em atendimento. */
export async function sincronizarSuporte(db: Database, opts: { pasta?: string; quantas?: number } = {}): Promise<{ importadas: number }> {
  if (!hm.caixaConfigurada()) return { importadas: 0 };
  const pasta = opts.pasta ?? "INBOX";
  const { data } = await hm.mensagens(pasta, 1, opts.quantas ?? 20);
  const candidatas = data.filter((m) => paraSuporte(m) && m.from[0]?.address);
  if (!candidatas.length) return { importadas: 0 };
  const uids = candidatas.map((m) => String(m.uid));
  const ja = await db.select({ uid: sql<string>`${iaMensagens.extra}->>'emailUid'` }).from(iaMensagens)
    .where(and(sql`${iaMensagens.extra}->>'emailPasta' = ${pasta}`, inArray(sql<string>`${iaMensagens.extra}->>'emailUid'`, uids)));
  const feitas = new Set(ja.map((x) => x.uid));
  const novas = candidatas.filter((m) => !feitas.has(String(m.uid))).sort((a, b) => a.date.localeCompare(b.date));
  if (!novas.length) return { importadas: 0 };
  const quem = await quemSao(db, novas.map((m) => m.from[0]!.address));
  let importadas = 0;
  for (const m of novas) {
    const de = m.from[0]!;
    const email = de.address.toLowerCase();
    const corpo = await hm.textoDaMensagem(pasta, m.uid).catch(() => ({ text: "", html: "" }));
    const texto = (textoNovo(corpo.text) || "(mensagem sem texto; veja na Caixa de entrada)").slice(0, 2000);
    const assunto = (m.subject ?? "").slice(0, 200);
    const q = quem.get(email);
    const aberta = (await db.select({ id: iaConversas.id }).from(iaConversas)
      .where(and(eq(iaConversas.canal, "EMAIL"), eq(iaConversas.email, email), notInArray(iaConversas.status, ["GANHA", "PERDIDA"]))).limit(1))[0];
    const id = aberta?.id ?? newId("iac");
    const origem = { emailPasta: pasta, emailUid: String(m.uid), assunto };
    if (!aberta) {
      await db.insert(iaConversas).values({ id, brand: "NEXTLEVEL_COMMERCE", canal: "EMAIL", status: "NOVA", tokenHash: createHash("sha256").update(randomBytes(24)).digest("hex"), nome: de.name || q?.nome || null, email, pagina: q?.detalhe ?? null, origem });
    }
    await db.insert(iaMensagens).values({ id: newId("iam"), conversaId: id, autor: "CLIENTE", autorNome: de.name || null, texto: assunto ? `Assunto: ${assunto}\n\n${texto}`.slice(0, 2000) : texto, extra: { emailPasta: pasta, emailUid: String(m.uid) }, createdAt: agora() });
    await db.update(iaConversas).set({ origem, ultimaMensagem: texto.slice(0, 150), ultimaEm: agora(), mensagens: sql`${iaConversas.mensagens} + 1`, naoLidas: sql`${iaConversas.naoLidas} + 1` }).where(eq(iaConversas.id, id));
    importadas++;
  }
  return { importadas };
}

/** Resposta da equipe numa conversa de e-mail: sai pela caixa da Hostinger, na mesma conversa do cliente. */
export async function enviarRespostaPorEmail(c: { email: string | null; origem: Record<string, string> }, texto: string) {
  if (!c.email) return;
  const assunto = c.origem.assunto ? (/^re:/i.test(c.origem.assunto) ? c.origem.assunto : `Re: ${c.origem.assunto}`) : "Resposta do suporte NextLevel Commerce";
  const resposta = c.origem.emailUid ? { uid: Number(c.origem.emailUid), folder: c.origem.emailPasta || "INBOX" } : undefined;
  await hm.enviar({ to: [c.email], subject: assunto, text: texto, resposta });
}
