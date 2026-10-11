import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { activationPage } from "@/lib/domain/ecossistema/ativacao";
import { routeHost } from "@/lib/host-routing";

/** D130 (fase P5A): página de ativação ao trocar de marca. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("página de ativação", () => {
  it("ponte de → para, números só com contagem real e caminho para o cadastro com a origem", async () => {
    const p = await activationPage(ctx.db, "BRAS_DIGITAL", "SUPERDROP");
    expect(p.bridge).toMatch(/SuperDrop/);
    expect(p.ctaHref).toBe("/cadastro?utm_source=grupo-superdrop");
    expect(p.numbers.every((n) => n.value >= 3)).toBe(true);
    const same = await activationPage(ctx.db, "SUPERDROP", "SUPERDROP");
    expect(same.from).toBeNull();
    expect((await activationPage(ctx.db, "SUPERDROP", "<script>")).from).toBeNull();
  });
  it("a rota abre nas marcas de lista fechada", () => {
    const env = { BRAND_DOMAINS_NEXTLEVEL_CARGAS: "cargas.teste" };
    expect(routeHost({ host: "cargas.teste", pathname: "/ativar" }, env)).toEqual({ kind: "next" });
  });
});
