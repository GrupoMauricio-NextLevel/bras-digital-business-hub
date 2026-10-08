import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { addBrasVideo, listBrasVideosForMaster, listPublicBrasVideos, moveBrasVideo, parseYoutubeId, removeBrasVideo, setBrasVideoActive } from "@/lib/domain/bras/videos";

/** D91: vídeos de análise no YouTube, geridos no Estúdio (Master), mostrados na página pública sem preço nem importadora. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("link do YouTube", () => {
  it("reconhece Shorts, watch, youtu.be, embed, live e o código puro", () => {
    for (const u of ["https://youtube.com/shorts/dQw4w9WgXcQ?si=abc", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "youtu.be/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"]) {
      expect(parseYoutubeId(u)).toBe("dQw4w9WgXcQ");
    }
  });
  it("recusa outros sites e códigos inválidos", () => {
    for (const u of ["https://vimeo.com/123", "https://evil.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=curto", "javascript:alert(1)", ""]) expect(parseYoutubeId(u)).toBeNull();
  });
});

describe("vídeos no Estúdio", () => {
  it("só o Master adiciona, pausa, ordena e remove; o público vê só os ativos, na ordem, sem campos internos", async () => {
    const m = ctx.actors.master;
    await expect(addBrasVideo(ctx.db, ctx.actors.supplier, { url: "dQw4w9WgXcQ", title: "Garrafa térmica" })).rejects.toThrow();
    await expect(addBrasVideo(ctx.db, ctx.actors.mantos, { url: "dQw4w9WgXcQ", title: "Garrafa térmica" })).rejects.toThrow();
    const a = await addBrasVideo(ctx.db, m, { url: "https://youtube.com/shorts/aaaaaaaaaaa", title: "Garrafa térmica 1 L", summary: "Caixa com 24" });
    const b = await addBrasVideo(ctx.db, m, { url: "https://youtu.be/bbbbbbbbbbb", title: "Kit potes herméticos" });
    const c = await addBrasVideo(ctx.db, m, { url: "ccccccccccc", title: "Luminária LED" });
    await expect(addBrasVideo(ctx.db, m, { url: "https://www.youtube.com/watch?v=aaaaaaaaaaa", title: "Repetido" })).rejects.toMatchObject({ code: "VIDEO_DUP" });
    await expect(addBrasVideo(ctx.db, m, { url: "https://vimeo.com/1", title: "Outro site" })).rejects.toMatchObject({ code: "VIDEO_URL" });

    expect((await listPublicBrasVideos(ctx.db)).map((v) => v.title)).toEqual(["Garrafa térmica 1 L", "Kit potes herméticos", "Luminária LED"]);
    await moveBrasVideo(ctx.db, m, c.id, "up");
    await moveBrasVideo(ctx.db, m, a.id, "up"); // já é o primeiro: nada muda
    expect((await listPublicBrasVideos(ctx.db)).map((v) => v.id)).toEqual([a.id, c.id, b.id]);
    await setBrasVideoActive(ctx.db, m, c.id, false);
    const pub = await listPublicBrasVideos(ctx.db);
    expect(pub.map((v) => v.id)).toEqual([a.id, b.id]);
    expect(Object.keys(pub[0]!).sort()).toEqual(["id", "summary", "title", "youtubeId"]);
    expect((await listBrasVideosForMaster(ctx.db, m)).length).toBe(3);
    await expect(listBrasVideosForMaster(ctx.db, ctx.actors.supplier)).rejects.toThrow();
    await removeBrasVideo(ctx.db, m, b.id);
    expect((await listPublicBrasVideos(ctx.db)).map((v) => v.id)).toEqual([a.id]);
  });
});
