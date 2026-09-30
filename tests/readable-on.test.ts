import { describe, expect, it } from "vitest";
import { readableOn } from "@/lib/utils";

const lum = (hex: string) => { const c = hex.replace("#", ""); const f = (i: number) => { const s = parseInt(c.slice(i, i + 2), 16) / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4); };
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

describe("cor de texto legível sobre a cor da loja", () => {
  it("escolhe o texto de maior contraste e nunca fica abaixo de 3:1 nas cores de marca comuns", () => {
    for (const bg of ["#22c55e", "#d4a017", "#facc15", "#0f1c16", "#ffffff", "#000000", "#2563eb", "#ef4444", "#f97316", "#7c3aed", "#84cc16"]) {
      const fg = readableOn(bg);
      const other = fg === "#ffffff" ? "#111827" : "#ffffff";
      expect(ratio(bg, fg), bg).toBeGreaterThanOrEqual(ratio(bg, other));
      expect(ratio(bg, fg), bg).toBeGreaterThanOrEqual(3);
    }
  });
  it("aceita hex curto e devolve branco para valor inválido", () => {
    expect(readableOn("#fff")).toBe("#111827");
    expect(readableOn("#000")).toBe("#ffffff");
    expect(readableOn("azul")).toBe("#ffffff");
  });
});
