import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser, isMaster } from "@/lib/domain/access";
import { createMasterMember, listMasterTeam, updateMasterMember } from "@/lib/domain/equipe-master";
import { masterPathAllowed, masterHomeFor } from "@/lib/master-equipe";
import { DEFAULT_PROPOSAL, saveProposal } from "@/lib/domain/precos/proposta";
import { ecosystemTower } from "@/lib/domain/ecossistema/torre";
import { ticketQueue } from "@/lib/domain/fiscal/meu-contador";
import { saveClubRules } from "@/lib/domain/club/regras";

/** D138: equipe do Master com funções; o contador parceiro só vê a fila do Meu Contador. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const pessoa = async (fn: "COMERCIAL" | "SUPORTE" | "FINANCEIRO" | "CONTEUDO" | "CONTADOR", email: string) => {
  const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: `Pessoa ${fn}`, email, password: "provisoria-123", masterFunction: fn });
  return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!);
};

describe("equipe do Master", () => {
  it("telas por função", () => {
    expect(masterPathAllowed(null, "/master/financeiro/precos")).toBe(true);
    expect(masterPathAllowed("COMERCIAL", "/master/ecossistema")).toBe(true);
    expect(masterPathAllowed("COMERCIAL", "/master/financeiro/precos")).toBe(false);
    expect(masterPathAllowed("FINANCEIRO", "/master/financeiro/proposta")).toBe(true);
    expect(masterPathAllowed("CONTADOR", "/master")).toBe(false);
    expect(masterPathAllowed("CONTADOR", "/bras/meu-contador")).toBe(true);
    expect(masterHomeFor("CONTADOR")).toBe("/bras/meu-contador");
  });

  it("o comercial não mexe em preço; o financeiro mexe; o contador só atende chamados; só o dono cadastra", async () => {
    const com = await pessoa("COMERCIAL", "com@nl.teste");
    const fin = await pessoa("FINANCEIRO", "fin@nl.teste");
    const cont = await pessoa("CONTADOR", "cont@escritorio.teste");
    await expect(saveProposal(ctx.db, com, DEFAULT_PROPOSAL)).rejects.toThrow(/sua função/);
    await expect(saveClubRules(ctx.db, com, { pointsPerReal: 200 })).rejects.toThrow(/sua função/);
    await saveProposal(ctx.db, fin, DEFAULT_PROPOSAL);
    await ecosystemTower(ctx.db, com);
    await expect(ecosystemTower(ctx.db, fin)).rejects.toThrow(/sua função/);
    expect(isMaster(cont)).toBe(false);
    await ticketQueue(ctx.db, cont);
    await expect(ticketQueue(ctx.db, com)).rejects.toThrow();
    await expect(createMasterMember(ctx.db, com, { name: "Outra Pessoa", email: "x@nl.teste", password: "provisoria-123", masterFunction: "SUPORTE" })).rejects.toThrow(/dono/);
    expect((await listMasterTeam(ctx.db, ctx.actors.master)).length).toBe(4);
    await updateMasterMember(ctx.db, ctx.actors.master, com.userId, { disabled: true });
    expect((await ctx.db.query.users.findFirst({ where: eq(users.id, com.userId) }))!.disabledAt).not.toBeNull();
    await expect(updateMasterMember(ctx.db, ctx.actors.master, ctx.actors.master.userId, { disabled: true })).rejects.toThrow(/dono/);
  });
});
