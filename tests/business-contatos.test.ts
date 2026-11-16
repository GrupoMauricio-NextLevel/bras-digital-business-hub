import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { contatosNegocio, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { criarServico } from "@/lib/business/servicos";
import { atualizarContato, fichaDoContato, listarContatos, registrarContato, registrarContatoManual, resumoDosContatos } from "@/lib/business/contatos";

let ctx: Awaited<ReturnType<typeof freshDb>>;
let n = 0;
async function negocio(nome: string) {
  n += 1;
  const cpf = ["529.982.247-25", "111.444.777-35", "390.533.447-05"][n % 3]!;
  const r = await signupMember(ctx.db, { storeName: nome, ownerName: "Rita Lima", email: `rita${n}@contatos.com.br`, password: "senha-segura-1", taxId: cpf, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true, formato: "LOJA" });
  const user = await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) });
  return { storeId: r.storeId, slug: r.slug, actor: actorFromUser(user!) as Actor };
}
const envio = (extra: Record<string, unknown> = {}) => ({ nome: "João Souza", whatsapp: "(11) 98888-7777", mensagem: "Box de 1,20 m", tempoMs: 8000, chaveEnvio: "chave-envio-0001", ...extra });

describe("formulário de orçamento do site (NB3, D309)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("grava na empresa certa com a origem do anúncio; repetição técnica não duplica; envio novo grava", async () => {
    const a = await negocio("Vidraçaria Cristal");
    const s = await criarServico(ctx.db, a.actor, a.storeId, { nome: "Box de banheiro" });
    const r1 = await registrarContato(ctx.db, a.slug, envio({ servicoId: s.id, origem: { utm_source: "facebook", utm_medium: "paid", utm_campaign: "box-novembro", fbclid: "abc" } }));
    expect(r1.novo).toBe(true);
    const r2 = await registrarContato(ctx.db, a.slug, envio());
    expect(r2).toEqual({ id: r1.id, novo: false });
    await registrarContato(ctx.db, a.slug, envio({ chaveEnvio: "chave-envio-0002", origem: {} }));
    const lista = await listarContatos(ctx.db, a.actor, a.storeId);
    expect(lista).toHaveLength(2);
    const c = lista.find((x) => x.id === r1.id)!;
    expect(c).toMatchObject({ canal: "meta-pago", utmCampaign: "box-novembro", servicoNome: "Box de banheiro", whatsapp: "11988887777", situacao: "NOVO" });
    expect(c.clickIds).toEqual({ fbclid: "abc" });
    expect(lista.find((x) => x.id !== r1.id)!.canal).toBe("direto");
  });

  it("robô (campo-isca ou envio rápido demais) recebe ok e nada é gravado; precisa de WhatsApp ou e-mail", async () => {
    const a = await negocio("Vidraçaria Cristal");
    expect(await registrarContato(ctx.db, a.slug, envio({ site: "http://spam" }))).toEqual({ id: null, novo: false });
    expect(await registrarContato(ctx.db, a.slug, envio({ tempoMs: 400, chaveEnvio: "chave-envio-0003" }))).toEqual({ id: null, novo: false });
    await expect(registrarContato(ctx.db, a.slug, envio({ whatsapp: "", chaveEnvio: "chave-envio-0004" }))).rejects.toThrow(/WhatsApp ou o e-mail/);
    expect(await ctx.db.select().from(contatosNegocio)).toHaveLength(0);
  });

  it("serviço de outra empresa é ignorado; outra empresa não vê nem altera o contato", async () => {
    const a = await negocio("Vidraçaria Cristal"); const b = await negocio("Academia Forte");
    const sb = await criarServico(ctx.db, b.actor, b.storeId, { nome: "Musculação" });
    const r = await registrarContato(ctx.db, a.slug, envio({ servicoId: sb.id }));
    expect((await fichaDoContato(ctx.db, a.actor, a.storeId, r.id!)).servicoId).toBeNull();
    await expect(fichaDoContato(ctx.db, b.actor, b.storeId, r.id!)).rejects.toThrow(/não encontrado/);
    await expect(fichaDoContato(ctx.db, b.actor, a.storeId, r.id!)).rejects.toThrow();
    await expect(atualizarContato(ctx.db, b.actor, b.storeId, r.id!, { situacao: "GANHO" })).rejects.toThrow(/não encontrado/);
    expect(await listarContatos(ctx.db, b.actor, b.storeId)).toEqual([]);
  });

  it("andamento: assumir marca responsável e primeira resposta (uma vez); fechou com valor; resumo do painel", async () => {
    const a = await negocio("Vidraçaria Cristal");
    const r = await registrarContato(ctx.db, a.slug, envio());
    const t0 = new Date(Date.now() + 20 * 60_000);
    await atualizarContato(ctx.db, a.actor, a.storeId, r.id!, { assumir: true, situacao: "EM_ATENDIMENTO" }, t0);
    await atualizarContato(ctx.db, a.actor, a.storeId, r.id!, { situacao: "ORCAMENTO_ENVIADO" }, new Date(t0.getTime() + 3_600_000));
    let c = await fichaDoContato(ctx.db, a.actor, a.storeId, r.id!);
    expect(c.responsavelNome).toBe("Rita Lima");
    expect(new Date(c.primeiraRespostaEm!).getTime()).toBe(t0.getTime());
    await atualizarContato(ctx.db, a.actor, a.storeId, r.id!, { situacao: "GANHO", valorCents: 129000 });
    c = await fichaDoContato(ctx.db, a.actor, a.storeId, r.id!);
    expect(c).toMatchObject({ situacao: "GANHO", valorCents: 129000 });
    await registrarContatoManual(ctx.db, a.actor, a.storeId, { nome: "Maria", whatsapp: "11977776666", via: "WHATSAPP_CONFIRMADO" });
    const res = await resumoDosContatos(ctx.db, a.storeId);
    expect(res).toMatchObject({ total: 2, novos: 0, ganhos: 1, valorGanhoCents: 129000 });
    expect(res.medianaRespostaMs).toBeGreaterThan(0);
  });
});
