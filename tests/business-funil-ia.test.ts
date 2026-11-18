import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { funilEmQuadro, registrarContatoManual } from "@/lib/business/contatos";
import { lerRespostaDaIa, proximaAcaoPorRegras, sugestaoDoContato, sugestaoPorRegras, tarefasDeHoje, type Ficha } from "@/lib/business/assistente-contato";

const agora = new Date("2026-11-18T15:00:00Z");
const h = (horas: number) => new Date(agora.getTime() - horas * 3_600_000).toISOString();
const ficha = (x: Partial<Ficha>): Ficha => ({ id: "ctn_1", storeId: "sto_1", nome: "João Souza", whatsapp: "11988887777", email: null, servicoId: null, servicoNome: "Box de banheiro", mensagem: "Box de 1,20 m", pagina: null, via: "FORMULARIO", situacao: "NOVO", responsavelId: null, responsavelNome: null, primeiraRespostaEm: null, valorCents: null, motivoPerda: null, notas: null, canal: "meta_ads", utmSource: null, utmMedium: null, utmCampaign: "box-novembro", utmContent: null, utmTerm: null, clickIds: {}, origemSite: null, chaveEnvio: null, createdAt: h(3), updatedAt: h(3), ...x } as Ficha);

describe("funil em quadro e tarefas do dia (D337)", () => {
  it("cinco etapas, soma do valor e fechados só dos últimos 30 dias", () => {
    const q = funilEmQuadro([ficha({ situacao: "NOVO" }), ficha({ situacao: "GANHO", valorCents: 50_000, updatedAt: h(24) }), ficha({ situacao: "GANHO", valorCents: 99_000, updatedAt: h(24 * 40) })], agora);
    expect(q.map((c) => c.situacao)).toEqual(["NOVO", "EM_ATENDIMENTO", "ORCAMENTO_ENVIADO", "GANHO", "PERDIDO"]);
    expect(q[3]).toMatchObject({ valorCents: 50_000 });
    expect(q[3]!.itens).toHaveLength(1);
  });
  it("hoje: novos primeiro (o mais antigo antes), depois orçamento parado, depois atendimento parado; o resto fica de fora", () => {
    const t = tarefasDeHoje([
      ficha({ id: "a", situacao: "EM_ATENDIMENTO", updatedAt: h(30) }),
      ficha({ id: "b", situacao: "NOVO", createdAt: h(1) }),
      ficha({ id: "c", situacao: "ORCAMENTO_ENVIADO", updatedAt: h(72) }),
      ficha({ id: "d", situacao: "NOVO", createdAt: h(10) }),
      ficha({ id: "e", situacao: "ORCAMENTO_ENVIADO", updatedAt: h(5) }),
      ficha({ id: "f", situacao: "GANHO" }),
    ], agora);
    expect(t.map((x) => x.id)).toEqual(["d", "b", "c", "a"]);
    expect(t[0]!.urgente).toBe(true);
  });
  it("próxima ação em português claro, pelo canal que o cliente deixou", () => {
    expect(proximaAcaoPorRegras(ficha({ situacao: "NOVO", createdAt: h(5) }), agora)).toMatch(/^Assuma o contato e responda pelo WhatsApp \(chegou há 5 h/);
    expect(proximaAcaoPorRegras(ficha({ situacao: "NOVO", responsavelId: "u", whatsapp: null, email: "a@b.com" }), agora)).toMatch(/^Responda por e-mail/);
    expect(proximaAcaoPorRegras(ficha({ situacao: "ORCAMENTO_ENVIADO", updatedAt: h(72) }), agora)).toMatch(/há 3 dias/);
    expect(proximaAcaoPorRegras(ficha({ situacao: "GANHO", valorCents: null }), agora)).toMatch(/Registre o valor/);
  });
});

describe("Maurício no contato (D337)", () => {
  it("regras: resumo com origem e campanha, resposta cordial com o nome da empresa", () => {
    const s = sugestaoPorRegras(ficha({}), "Vidraçaria Cristal", agora);
    expect(s.origem).toBe("regras");
    expect(s.resumo).toMatch(/Box de banheiro/);
    expect(s.resumo).toMatch(/box-novembro/);
    expect(s.resposta).toMatch(/^Olá, João! Aqui é da Vidraçaria Cristal/);
  });
  it("lê as três partes da IA; resposta fora do formato volta às regras", () => {
    const base = sugestaoPorRegras(ficha({}), "Vidraçaria Cristal", agora);
    const ia = lerRespostaDaIa("RESUMO: Cliente quer box.\nPRÓXIMA AÇÃO: Ligue hoje.\nRESPOSTA: Olá João, tudo bem?", base);
    expect(ia).toEqual({ resumo: "Cliente quer box.", proximaAcao: "Ligue hoje.", resposta: "Olá João, tudo bem?", origem: "ia" });
    expect(lerRespostaDaIa("texto solto", base)).toBe(base);
  });
  it("sem IA no plano usa as regras; contato de outra loja não aparece", async () => {
    const ctx = await freshDb();
    const conta = async (nome: string, email: string, cpf: string) => {
      const r = await signupMember(ctx.db, { storeName: nome, ownerName: "Rita Lima", email, password: "senha-segura-1", taxId: cpf, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true });
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) });
      return { storeId: r.storeId, actor: actorFromUser(user!) as Actor };
    };
    const a = await conta("Vidraçaria Cristal", "rita@funil.com.br", "529.982.247-25");
    const b = await conta("Outra Loja", "ana@funil.com.br", "111.444.777-35");
    const c = await registrarContatoManual(ctx.db, a.actor, a.storeId, { nome: "Maria Lima", whatsapp: "11977776666" });
    let chamou = false;
    const s = await sugestaoDoContato(ctx.db, a.actor, a.storeId, c.id, "Vidraçaria Cristal", agora, async () => { chamou = true; return ""; });
    expect(s.origem).toBe("regras");
    expect(chamou).toBe(false);
    await expect(sugestaoDoContato(ctx.db, b.actor, b.storeId, c.id, "Outra Loja", agora)).rejects.toThrow(/não encontrado/);
  });
});
