import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { iaConversas, iaMensagens } from "@/db/schema";
import { CONTATOS } from "@/lib/contatos";
import { limparNaoLidasCache } from "@/lib/integrations/hostinger-mail";
import { responderComoEquipe } from "@/lib/domain/ia-conversas";
import { sincronizarSuporte, textoNovo } from "@/lib/domain/suporte-email";
import { POST } from "@/app/api/webhooks/hostinger-mail/route";
import { freshDb } from "./setup";

type Msg = { uid: number; subject: string; from: { name: string; address: string }; to: { name: string; address: string }[]; date: string };
function caixaFalsa(msgs: Msg[], textos: Record<number, string>) {
  const envios: Record<string, unknown>[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const j = (d: unknown) => new Response(JSON.stringify(d), { status: 200 });
    if (url.endsWith("/me")) return j({ data: { mailboxes: [{ resourceId: "AC1", address: "m@x.com" }] } });
    if (url.endsWith("/send")) { envios.push(JSON.parse(String(init!.body))); return j({ data: {} }); }
    const t = url.match(/messages\/(\d+)\/text$/); if (t) return j({ data: { text: textos[Number(t[1])] ?? "", html: "" } });
    if (/messages\?/.test(url)) return j({ data: msgs.map((m) => ({ ...m, path: "INBOX", flags: [], unseen: true, size: 1, cc: [], bcc: [], attachments: [] })), pagination: { page: 1, perPage: 20, total: msgs.length, totalPages: 1 } });
    return j({ data: {} });
  }));
  return envios;
}

describe("e-mail para suporte@ vira atendimento no Master (D300)", () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.HOSTINGER_MAIL_TOKEN; delete process.env.HOSTINGER_MAIL_WEBHOOK_SECRET; limparNaoLidasCache(); });

  it("tira a parte citada da resposta", () => {
    expect(textoNovo("Oi, ainda não funcionou.\n\nEm qui., 13 de nov. de 2026, NextLevel escreveu:\n> Olá!\n> Tente de novo")).toBe("Oi, ainda não funcionou.");
    expect(textoNovo("Linha 1\n> citado\nLinha 2")).toBe("Linha 1\nLinha 2");
  });

  it("importa só o que foi para suporte@, uma vez só, e junta na conversa aberta da mesma pessoa", async () => {
    const { db } = await freshDb();
    process.env.HOSTINGER_MAIL_TOKEN = "tok";
    const msgs: Msg[] = [
      { uid: 1, subject: "Preciso de suporte", from: { name: "Ana Souza", address: "Ana@Cliente.com" }, to: [{ name: "", address: CONTATOS.suporte }], date: "2026-11-14T10:00:00Z" },
      { uid: 2, subject: "Proposta", from: { name: "Bia", address: "bia@x.com" }, to: [{ name: "", address: CONTATOS.comercial }], date: "2026-11-14T10:01:00Z" },
    ];
    caixaFalsa(msgs, { 1: "Minha loja não abre." });
    expect(await sincronizarSuporte(db)).toEqual({ importadas: 1 });
    expect(await sincronizarSuporte(db)).toEqual({ importadas: 0 }); // não duplica
    msgs.push({ uid: 3, subject: "Re: Preciso de suporte", from: { name: "Ana Souza", address: "ana@cliente.com" }, to: [{ name: "", address: CONTATOS.suporte }], date: "2026-11-14T11:00:00Z" });
    caixaFalsa(msgs, { 3: "Agora abriu, obrigada!\n\nEm sex., NextLevel escreveu:\n> resposta" });
    expect(await sincronizarSuporte(db)).toEqual({ importadas: 1 });
    const conv = await db.select().from(iaConversas).where(eq(iaConversas.canal, "EMAIL"));
    expect(conv).toHaveLength(1);
    expect(conv[0]).toMatchObject({ email: "ana@cliente.com", nome: "Ana Souza", naoLidas: 2, status: "NOVA" });
    const ms = await db.select({ texto: iaMensagens.texto }).from(iaMensagens).where(eq(iaMensagens.conversaId, conv[0]!.id));
    expect(ms.map((m) => m.texto).join("|")).toContain("Agora abriu, obrigada!");
    expect(ms.map((m) => m.texto).join("|")).not.toContain("> resposta");
  });

  it("a resposta da equipe sai por e-mail, na mesma conversa", async () => {
    const { db, actors } = await freshDb();
    process.env.HOSTINGER_MAIL_TOKEN = "tok";
    const envios = caixaFalsa([{ uid: 9, subject: "Domínio", from: { name: "Caio", address: "caio@x.com" }, to: [{ name: "", address: CONTATOS.suporte }], date: "2026-11-14T10:00:00Z" }], { 9: "Como ligo o domínio?" });
    await sincronizarSuporte(db);
    const [c] = await db.select({ id: iaConversas.id }).from(iaConversas).where(eq(iaConversas.canal, "EMAIL"));
    await responderComoEquipe(db, actors.master, c!.id, "Abra Minha loja → Domínio próprio.", "Maurício Ramos");
    expect(envios).toHaveLength(1);
    expect(envios[0]).toMatchObject({ to: ["caio@x.com"], subject: "Re: Domínio", text: "Abra Minha loja → Domínio próprio.", inReplyTo: { uid: 9, folder: "INBOX" } });
  });

  it("o aviso da Hostinger só entra com o segredo certo", async () => {
    process.env.HOSTINGER_MAIL_WEBHOOK_SECRET = "segredo-de-teste-1234567890";
    const req = (auth?: string) => new Request("http://x/api/webhooks/hostinger-mail", { method: "POST", headers: auth ? { authorization: auth } : {}, body: "{}" });
    expect((await POST(req())).status).toBe(401);
    expect((await POST(req("Bearer errado-errado-errado-errado"))).status).toBe(401);
    expect((await POST(req("Bearer segredo-de-teste-1234567890"))).status).toBe(200); // sem token da caixa: nada a importar
  });
});
