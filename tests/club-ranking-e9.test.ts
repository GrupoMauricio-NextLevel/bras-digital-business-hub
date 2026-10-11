import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { clubReferrals } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { cityRanking, setRankingOptIn } from "@/lib/domain/club/ranking";

/** D122 (fase E9 do Club): ranking do mês por cidade, só para quem aceitar aparecer. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
async function membro(nome: string, cnpj: string, email: string) {
  const r = await signupBrasMember(ctx.db, { name: nome, companyName: `${nome} LTDA`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor;
}
let n = 0;
const ativadas = async (a: Actor, qtd: number, when = new Date()) => {
  for (let i = 0; i < qtd; i++) await ctx.db.insert(clubReferrals).values({ id: `ref${++n}`, referrerUserId: a.userId, kind: "CLIENTE", name: `Indicado ${n}`, phone: `1190000${String(n).padStart(4, "0")}`, status: "ATIVOU", activatedAt: when.toISOString() });
};

beforeEach(async () => { ctx = await freshDb(); n = 0; });

describe("ranking por cidade", () => {
  it("só quem aceitou aparece, com o primeiro nome; posição por indicações ativadas no mês; sair tira do ranking", async () => {
    const ana = await membro("Ana Souza", "11222333000181", "ana@u.teste");
    const bia = await membro("Bia Lima", "11444777000161", "bia@u.teste");
    const caio = await membro("Caio Reis", "45723174000110", "caio@u.teste");
    expect(await cityRanking(ctx.db, ana)).toMatchObject({ optedIn: false, rows: [] });
    await setRankingOptIn(ctx.db, ana, { show: true, city: "Belo Horizonte", uf: "MG" });
    await setRankingOptIn(ctx.db, bia, { show: true, city: "belo horizonte ", uf: "MG" });
    await setRankingOptIn(ctx.db, caio, { show: false, city: "Belo Horizonte", uf: "MG" });
    await ativadas(ana, 1); await ativadas(bia, 3); await ativadas(caio, 5);
    await ativadas(ana, 4, new Date(Date.now() - 62 * 86_400_000)); // mês passado não conta
    const r = await cityRanking(ctx.db, ana);
    expect(r.rows).toEqual([{ position: 1, name: "Bia", activated: 3, me: false }, { position: 2, name: "Ana", activated: 1, me: true }]);
    expect(JSON.stringify(r)).not.toMatch(/Souza|Lima|Caio|@/);
    await expect(setRankingOptIn(ctx.db, ana, { show: true, city: "x", uf: "MG" })).rejects.toThrow();
    await setRankingOptIn(ctx.db, bia, { show: false, city: "Belo Horizonte", uf: "MG" });
    expect((await cityRanking(ctx.db, ana)).rows.map((x) => x.name)).toEqual(["Ana"]);
  });
});
