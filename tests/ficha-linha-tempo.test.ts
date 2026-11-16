import { describe, expect, it } from "vitest";
import { financeInvoices, iaConversas, iaMensagens } from "@/db/schema";
import { fichaCliente, funilComercial } from "@/lib/domain/comercial";
import { signupMember } from "@/lib/domain/store-access";
import { freshDb } from "./setup";

describe("linha do tempo do cliente no Comercial (D301)", () => {
  it("mostra e-mails de suporte e faturas do plano junto com o resto", async () => {
    const { db, actors } = await freshDb();
    await signupMember(db, { storeName: "Loja Linha", ownerName: "Maria Souza", email: "maria@linha.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    const loja = (await funilComercial(db, actors.master)).find((p) => p.email === "maria@linha.com.br" && p.storeId);
    expect(loja).toBeTruthy();
    const agora = new Date().toISOString();
    await db.insert(iaConversas).values({ id: "iac_t1", brand: "NEXTLEVEL_COMMERCE", canal: "EMAIL", tokenHash: "x", email: loja!.email!.toLowerCase(), status: "NOVA" });
    await db.insert(iaMensagens).values({ id: "iam_t1", conversaId: "iac_t1", autor: "CLIENTE", texto: "Assunto: Domínio\n\nComo ligo o domínio?", createdAt: agora });
    await db.insert(financeInvoices).values({ id: "fin_t1", dedupeKey: "t1", payerType: "STORE", tenantType: "STORE", storeId: loja!.storeId!, kind: "STORE_PLAN", description: "Plano Pro · novembro", amountCents: 14700, status: "PAID", dueDate: agora, paidAt: agora } as typeof financeInvoices.$inferInsert);
    const { linha } = await fichaCliente(db, actors.master, loja!.chave);
    expect(linha.find((e) => e.tipo === "email")?.texto).toContain("Como ligo o domínio?");
    expect(linha.some((e) => e.tipo === "dinheiro" && e.texto.startsWith("Pagou: Plano Pro"))).toBe(true);
    expect(linha.some((e) => e.tipo === "dinheiro" && e.texto.includes("(paga)"))).toBe(true);
  });
});
