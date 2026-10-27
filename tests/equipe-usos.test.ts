import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BRAND_CODES } from "@/lib/brand";
import { EQUIPE_ACERVO } from "@/lib/marcas/equipe-imagens";
import { SO_INTERNAS } from "@/lib/marcas/equipe";
import { CARTA_DO_FUNDADOR, fotoDoDia, fotosDaPagina, fraseDoCeo, LETREIRO, mostrarBoasVindas, PAGINAS_EQUIPE, PARES_QUASE_IGUAIS, USOS_EQUIPE } from "@/lib/marcas/equipe-usos";
import { supportContacts, formatarTelefone } from "@/lib/support";

/** D181: fotos da equipe em toda parte, com critério (mapa único de usos). */
describe("mapa de usos da equipe", () => {
  it("toda foto do mapa existe, inclusive a versão leve de 480 px dos painéis", () => {
    for (const u of Object.values(USOS_EQUIPE)) for (const f of u.fotos) {
      expect(EQUIPE_ACERVO.fotos[f], f).toBeTruthy();
      for (const ext of ["avif", "webp"]) expect(existsSync(join(process.cwd(), "public", EQUIPE_ACERVO.base, `${f}-480.${ext}`)), `${f}-480.${ext}`).toBe(true);
    }
    expect(existsSync(join(process.cwd(), "public/portal/nextlevel/equipe/v1/eq-og-escritorio.jpg"))).toBe(true);
  });

  it("página pública: nunca a foto do prêmio e sempre com legenda", () => {
    for (const [lugar, u] of Object.entries(USOS_EQUIPE)) if (u.publico) {
      for (const f of u.fotos) expect(SO_INTERNAS, lugar).not.toContain(f);
      expect(u.legenda, lugar).toBeTruthy();
    }
  });

  it("numa mesma página: um letreiro só, nenhum par quase igual e nenhuma foto repetida", () => {
    for (const pagina of Object.keys(PAGINAS_EQUIPE)) {
      const fotos = fotosDaPagina(pagina);
      expect(new Set(fotos).size, pagina).toBe(fotos.length);
      expect(new Set(fotos.map((f) => LETREIRO[f]).filter(Boolean)).size, pagina).toBeLessThanOrEqual(1);
      for (const [a, b] of PARES_QUASE_IGUAIS) expect(fotos.includes(a) && fotos.includes(b), `${pagina}: ${a} e ${b}`).toBe(false);
    }
  });

  it("rodízio diário: a mesma foto o dia todo, outra no dia seguinte", () => {
    const d1 = new Date("2026-10-27T08:00:00Z"), d1b = new Date("2026-10-27T22:00:00Z"), d2 = new Date("2026-10-28T08:00:00Z");
    expect(fotoDoDia("login-master", d1)).toBe(fotoDoDia("login-master", d1b));
    expect(fotoDoDia("login-master", d1)).not.toBe(fotoDoDia("login-master", d2));
    expect(USOS_EQUIPE["login-master"].fotos).toContain(fotoDoDia("login-master", d2));
  });
});

describe("textos em nome do CEO", () => {
  it("sem número, sem promessa de ganho, uma frase por marca", () => {
    const textos = [...CARTA_DO_FUNDADOR, ...BRAND_CODES.map(fraseDoCeo)];
    for (const t of textos) expect(t, t).not.toMatch(/\d|ganh|lucr|garant|fatur|renda|milion|rico/i);
    expect(new Set(["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS"].map((c) => fraseDoCeo(c as never))).size).toBe(4);
  });

  it("recado de boas-vindas: 14 primeiros dias e só até a primeira venda paga", () => {
    const agora = new Date("2026-10-27T12:00:00Z");
    expect(mostrarBoasVindas({ criadaEm: "2026-10-20T12:00:00Z", temVendaPaga: false }, agora)).toBe(true);
    expect(mostrarBoasVindas({ criadaEm: "2026-10-20T12:00:00Z", temVendaPaga: true }, agora)).toBe(false);
    expect(mostrarBoasVindas({ criadaEm: "2026-10-01T12:00:00Z", temVendaPaga: false }, agora)).toBe(false);
  });
});

describe("canal oficial de suporte (D181)", () => {
  it("sem configuração no Render, vale o WhatsApp e o e-mail informados pelo dono", () => {
    const c = supportContacts("Olá! Teste.");
    if (!process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP) {
      expect(c.whatsappUrl).toContain("wa.me/5511940862144");
      expect(c.whatsappLabel).toBe("(11) 94086-2144");
    }
    if (!process.env.NEXT_PUBLIC_SUPPORT_EMAIL) expect(c.email).toBe("sac@nextlevelgroup.com.br");
    expect(c.whatsappUrl).toContain(encodeURIComponent("Olá! Teste."));
    expect(formatarTelefone("5511940862144")).toBe("(11) 94086-2144");
    expect(formatarTelefone("5521912345678")).toBe("(21) 91234-5678");
  });
});
