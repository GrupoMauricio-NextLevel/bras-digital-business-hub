import { describe, expect, it, vi } from "vitest";
import { freshDb } from "./setup";

const holder: { db?: Awaited<ReturnType<typeof freshDb>>["db"] } = {};
vi.mock("@/db/client", async (orig) => ({ ...(await orig<typeof import("@/db/client")>()), getDb: async () => holder.db, resolveDatabaseUrl: () => "pglite://memory" }));

describe("/api/health mostra a versão no ar e a última atualização do banco", () => {
  it("devolve o commit informado pelo Render e a última migração aplicada", async () => {
    holder.db = (await freshDb()).db;
    process.env.RENDER_GIT_COMMIT = "01a89aeb993a00ac77fe3cbc77762122fca5f726";
    const { GET } = await import("@/app/api/health/route");
    const body = await (await GET()).json();
    expect(body).toMatchObject({ ok: true, version: "01a89ae" });
    expect(body.migration).toBe("0045_bras_agenda_descobertas");
    delete process.env.RENDER_GIT_COMMIT;
  }, 120_000);
});
