import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import type { Actor } from "@/lib/domain/access";
import { clubNaMarca } from "@/lib/club-marcas";
import { benefitsPanel, saveBenefitsSettings } from "@/lib/domain/beneficios/painel";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";

/** R3 (decisão do dono, 19/10): os pontos são do Brás Digital Club e só aparecem na Brás e na Cargas. */
describe("Club só onde existe", () => {
  it("Club só na Brás Digital e na Cargas", () => {
    expect(["BRAS_DIGITAL", "NEXTLEVEL_CARGAS"].every(clubNaMarca)).toBe(true);
    expect(["NEXTLEVEL_COMMERCE", "SUPERDROP", "NEXTLEVEL", null, undefined].some(clubNaMarca)).toBe(false);
  });

  it("painel de benefícios: pontos para o membro da Brás, nada de pontos para a loja do SuperDrop", async () => {
    const { db, actors } = await freshDb();
    await saveBenefitsSettings(db, actors.master, { brands: ["SUPERDROP", "NEXTLEVEL_COMMERCE", "BRAS_DIGITAL"] });
    const r = await signupBrasMember(db, { name: "Ana", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@club.teste", password: "senha-forte-1", acceptTerms: true });
    const m = (await getBrasMemberByUser(db, r.userId))!;
    const membro: Actor = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
    expect((await benefitsPanel(db, membro))?.wallet).toMatchObject({ href: "/meu-bras/club" });
    expect((await benefitsPanel(db, actors.mantos))?.wallet).toBeNull();
  });

  it("telas do lojista, do fornecedor e das páginas de entrada não falam de Club nem de pontos", () => {
    const pastas = ["src/app/merchant", "src/app/supplier", "src/app/commerce", "src/app/login", "src/app/esqueci-senha", "src/components/app"];
    const arquivos = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? arquivos(p) : /\.tsx?$/.test(f) ? [p] : []; });
    const achados: string[] = [];
    for (const arq of pastas.flatMap(arquivos)) {
      readFileSync(arq, "utf8").split("\n").forEach((l, i) => {
        // Texto visível: entre aspas ou entre tags. Nomes do código (variáveis, rotas) não contam.
        if (/\/\/ só Brás|^\s*(\*|\/\/)/.test(l)) return;
        if (/(["'`>])[^"'`<]*\b(Club|pontos do|seus pontos)\b/.test(l) && !/Brás Digital Club/.test(l)) achados.push(`${arq}:${i + 1}`);
      });
    }
    expect(achados).toEqual([]);
  });
});
