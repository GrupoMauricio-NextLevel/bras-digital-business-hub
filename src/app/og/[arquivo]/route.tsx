import { ImageResponse } from "next/og";
import { brandByCode, isBrandCode } from "@/lib/brand";
import { PALETTES } from "@/lib/brand-palette";

/** Cartão de prévia gerado para a marca sem arte própria: nome, frase e a cor de sinal da marca sobre o navy do grupo. */
export async function GET(_req: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const code = (await params).arquivo.replace(/\.png$/, "").toUpperCase();
  if (!isBrandCode(code)) return new Response("Não encontrado", { status: 404 });
  const brand = brandByCode(code);
  const signal = PALETTES[code].dark.signal;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 96px", background: "#0B1427", color: "#F4F1E9", position: "relative" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 640, height: 640, borderRadius: 640, background: signal, opacity: 0.28, display: "flex" }} />
        <div style={{ display: "flex", width: 96, height: 10, borderRadius: 10, background: signal, marginBottom: 36 }} />
        <div style={{ display: "flex", fontSize: 88, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{brand.name}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 28, color: "#C3C8DC", maxWidth: 900, lineHeight: 1.25 }}>{brand.tagline}</div>
        <div style={{ display: "flex", position: "absolute", left: 96, bottom: 56, fontSize: 24, color: "#8F97AE" }}>Um sistema da NextLevel</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
