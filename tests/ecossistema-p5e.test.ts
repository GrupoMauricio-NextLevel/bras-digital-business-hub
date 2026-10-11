import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { ecosystemBar, saveEcoSettings } from "@/lib/domain/ecossistema/lancador";

/** D129 (fase P5E): barra do ecossistema, desligada por padrão, recomendação por perfil. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("barra do ecossistema", () => {
  it("desligada por padrão; ligada mostra a marca atual mais larga, recomendações com motivo e só marcas abertas", async () => {
    expect(await ecosystemBar(ctx.db, "SUPERDROP")).toBeNull();
    await saveEcoSettings(ctx.db, ctx.actors.master, { brands: ["SUPERDROP"] });
    const bar = (await ecosystemBar(ctx.db, "SUPERDROP"))!;
    expect(bar.segments.find((s) => s.current)?.brand).toBe("SUPERDROP");
    expect(bar.mine[0]).toMatchObject({ brand: "SUPERDROP", current: true });
    expect(bar.recommended.every((r) => r.reason && r.brand !== "SUPERDROP")).toBe(true);
    expect(bar.recommended.some((r) => r.brand === "NEXTLEVEL_CARGAS")).toBe(true);
    expect(bar.all.every((i) => !i.current && i.href.startsWith("http"))).toBe(true);
    expect(await ecosystemBar(ctx.db, "NEXTLEVEL_COMMERCE")).toBeNull();
    await expect(saveEcoSettings(ctx.db, ctx.actors.arena, { brands: [] })).rejects.toThrow();
  });
});
