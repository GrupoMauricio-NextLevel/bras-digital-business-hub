import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { brandLeads, users } from "@/db/schema";
import { CONTATOS, responderPara } from "@/lib/contatos";
import { caixa, enderecoDeDestino, podeUsarCaixa, quemSao, responder, salvarComoInteressado } from "@/lib/domain/caixa-entrada";
import { normalizar } from "@/lib/integrations/hostinger-mail";
import { freshDb } from "./setup";

const end = (address: string) => ({ name: "", address });

describe("endereços por assunto e caixa de entrada do Master (D296)", () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.HOSTINGER_MAIL_TOKEN; });

  it("cada tipo de e-mail sai com a resposta indo para o endereço certo", () => {
    expect(responderPara("CONTRATO_ASSINADO")).toBe(CONTATOS.financeiro);
    expect(responderPara("INVOICE_DUE")).toBe(CONTATOS.financeiro);
    expect(responderPara("PARTNER_WELCOME")).toBe(CONTATOS.parceiros);
    expect(responderPara("LEAD_FOLLOWUP")).toBe(CONTATOS.comercial);
    expect(responderPara("PASSWORD_RESET")).toBe(CONTATOS.suporte);
    expect(responderPara("QUALQUER_OUTRO")).toBe(CONTATOS.contato);
  });

  it("reconhece para qual endereço da NextLevel a mensagem foi enviada", () => {
    expect(enderecoDeDestino({ to: [end("Suporte@NextLevelCommerce.com.br")], cc: [] })).toBe("suporte");
    expect(enderecoDeDestino({ to: [end("x@y.com")], cc: [end(CONTATOS.financeiro)] })).toBe("financeiro");
    expect(enderecoDeDestino({ to: [end("x@y.com")], cc: [] })).toBeNull();
  });

  it("só o dono abre; a equipe do Master e o lojista não", async () => {
    const { db, actors } = await freshDb();
    expect(podeUsarCaixa(actors.master)).toBe(true);
    expect(podeUsarCaixa({ ...actors.master, masterFunction: "SUPORTE" })).toBe(false);
    expect(podeUsarCaixa(actors.mantos)).toBe(false);
    await expect(caixa(db, actors.mantos, "INBOX", 1)).rejects.toThrow(/Só o dono/);
  });

  it("reconhece o remetente como lojista, sem diferenciar maiúsculas", async () => {
    const { db, actors } = await freshDb();
    const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, actors.mantos.userId));
    const mapa = await quemSao(db, [u!.email.toUpperCase(), "desconhecido@x.com"]);
    expect(mapa.get(u!.email.toLowerCase())?.tipo).toBe("LOJISTA");
    expect(mapa.has("desconhecido@x.com")).toBe(false);
  });

  it("responde na mesma conversa pela API da Hostinger, com o token só no cabeçalho", async () => {
    const { db, actors } = await freshDb();
    process.env.HOSTINGER_MAIL_TOKEN = "tok_teste";
    const chamadas: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      chamadas.push({ url, init });
      if (url.endsWith("/me")) return new Response(JSON.stringify({ data: { mailboxes: [{ resourceId: "AC1", address: "m@x.com" }] } }), { status: 200 });
      return new Response(JSON.stringify({ data: { ok: true } }), { status: 200 });
    }));
    await responder(db, actors.master, { pasta: "INBOX", uid: 7, para: ["cliente@x.com"], assunto: "Re: dúvida", texto: "Olá" });
    const envio = chamadas.find((c) => c.url.endsWith("/mailboxes/AC1/send"))!;
    expect(JSON.parse(String(envio.init.body))).toMatchObject({ to: ["cliente@x.com"], subject: "Re: dúvida", inReplyTo: { uid: 7, folder: "INBOX" } });
    expect((envio.init.headers as Record<string, string>).authorization).toBe("Bearer tok_teste");
    expect(String(envio.init.body)).not.toContain("tok_teste");
  });

  it("remetente sem conta vira interessado no CRM com um clique, e responder muda para contatado", async () => {
    const { db, actors } = await freshDb();
    await expect(salvarComoInteressado(db, actors.mantos, { email: "novo@cliente.com" })).rejects.toThrow(/Só o dono/);
    const r = await salvarComoInteressado(db, actors.master, { email: "Novo@Cliente.com", nome: "Ana", assunto: "Quero uma loja" });
    expect(r.criado).toBe(true);
    expect((await salvarComoInteressado(db, actors.master, { email: "novo@cliente.com" })).criado).toBe(false); // sem duplicar
    expect((await quemSao(db, ["novo@cliente.com"])).get("novo@cliente.com")).toMatchObject({ tipo: "INTERESSADO", href: `/master/comercial/${encodeURIComponent(`interessado:${r.id}`)}` });
    process.env.HOSTINGER_MAIL_TOKEN = "tok_teste";
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith("/me") ? { data: { mailboxes: [{ resourceId: "AC1", address: "m@x.com" }] } } : { data: {} }), { status: 200 })));
    await responder(db, actors.master, { pasta: "INBOX", uid: 3, para: ["novo@cliente.com"], assunto: "Re: Quero uma loja", texto: "Vamos conversar" });
    const [lead] = await db.select({ status: brandLeads.status }).from(brandLeads).where(eq(brandLeads.id, r.id));
    expect(lead!.status).toBe("CONTACTED");
  });

  it("aceita o formato real da Hostinger: remetente como um endereço só, listas ausentes", () => {
    const m = normalizar({ uid: 2, subject: "Preciso de suporte", from: { name: "Next Level", address: "x@gmail.com" }, to: [{ name: "", address: CONTATOS.suporte }] });
    expect(m.from).toEqual([{ name: "Next Level", address: "x@gmail.com" }]);
    expect(m.cc).toEqual([]);
    expect(m.attachments).toEqual([]);
    expect(enderecoDeDestino(m)).toBe("suporte");
  });
});
