import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BRAND_CODES, brandByCode } from "@/lib/brand";
import { EQUIPE_ACERVO, EQUIPE_FOTOS, type EquipeFotoNome } from "@/lib/marcas/equipe-imagens";
import { AVATAR_CEO, CEO, EQUIPE_ALT, SO_INTERNAS, secaoEquipeDaMarca } from "@/lib/marcas/equipe";
import { emails, renderHtml } from "@/lib/email";
import { diasDeTeste } from "@/lib/domain/store-access";

/** D179: fotos reais da equipe NextLevel nas marcas, com o CEO como rosto, sem promessa e nunca dentro das lojas. */
const PUBLIC = join(process.cwd(), "public");

describe("acervo da equipe", () => {
  it("toda foto existe nas duas larguras e nos dois formatos, com texto alternativo", () => {
    for (const nome of Object.keys(EQUIPE_FOTOS) as EquipeFotoNome[]) {
      for (const w of EQUIPE_ACERVO.fotos[nome].larguras) for (const ext of ["avif", "webp"]) {
        const f = join(PUBLIC, EQUIPE_ACERVO.base, `${nome}-${w}.${ext}`);
        expect(existsSync(f) && statSync(f).size > 0, f).toBe(true);
      }
      expect(EQUIPE_ALT[nome].length).toBeGreaterThan(20);
    }
    for (const f of ["96.webp", "192.webp", "96.avif", "192.avif", "192.jpg"]) expect(existsSync(join(PUBLIC, `${AVATAR_CEO}-${f}`))).toBe(true);
  });

  it("cada marca tem o seu bloco: foto pública, o fato verdadeiro e nenhum número ou promessa", () => {
    const fotos = new Set<string>();
    for (const code of BRAND_CODES) {
      const s = secaoEquipeDaMarca(code, brandByCode(code).name);
      expect(Object.keys(EQUIPE_FOTOS)).toContain(s.foto);
      expect(SO_INTERNAS).not.toContain(s.foto);
      expect(s.texto).toMatch(/NextLevel Marketing/);
      expect(s.texto).toMatch(/São Paulo/);
      expect(`${s.titulo} ${s.texto}`).not.toMatch(/\d|ganh|garant|lucr|fatur/i);
      fotos.add(s.foto);
    }
    // Marcas de produto com cara própria: Commerce e NextLevel não repetem a mesma foto.
    expect(new Set(["NEXTLEVEL_COMMERCE", "NEXTLEVEL"].map((c) => secaoEquipeDaMarca(c as never, "X").foto)).size).toBe(2);
    expect(secaoEquipeDaMarca("NEXTLEVEL_COMMERCE", "NextLevel Commerce").texto).toMatch(/^A NextLevel Commerce é desenvolvida/);
  });

  it("a equipe nunca entra nas lojas dos lojistas nem nos temas", () => {
    const pastas = ["src/app/store", "src/components/storefront", "src/lib/themes"];
    const arquivos = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? arquivos(join(d, e.name)) : [join(d, e.name)]);
    for (const f of pastas.flatMap((p) => arquivos(join(process.cwd(), p)))) {
      const t = readFileSync(f, "utf8");
      expect(/equipe-imagens|marcas\/equipe|secao-equipe|equipe\/blocos|\/equipe\/v1\//.test(t), f).toBe(false);
    }
  });
});

describe("e-mail de boas-vindas", () => {
  it("assina com nome e foto do CEO e diz os dias de teste reais", () => {
    const m = emails.welcomeStore("Ateliê Ana", "https://x.test/merchant", 3);
    expect(m.text).toContain("Você tem 3 dias de teste");
    expect(m.text).not.toMatch(/7 dias/);
    expect(emails.welcomeStore("A", "u", 1).text).toContain("1 dia de teste");
    expect(emails.welcomeStore("A", "u", 0).text).not.toMatch(/dias? de teste/);
    const html = renderHtml(m, brandByCode("NEXTLEVEL_COMMERCE"));
    expect(html).toContain(CEO.nome);
    expect(html).toContain(`${AVATAR_CEO}-192.jpg`);
    expect(html).toMatch(/src="https:\/\//);
    expect(renderHtml(emails.passwordReset("https://x.test/r"), brandByCode("SUPERDROP"))).not.toContain(CEO.nome);
  });

  it("aviso de fim do teste não fixa 7 dias", () => {
    expect(emails.trialEnding(0, "/merchant").subject).toBe("Seu teste termina hoje");
  });

  it("dias de teste: arredonda para cima e nunca fica negativo", () => {
    const agora = new Date("2026-10-27T12:00:00Z");
    expect(diasDeTeste(null, agora)).toBe(0);
    expect(diasDeTeste("2026-10-30T12:00:00Z", agora)).toBe(3);
    expect(diasDeTeste("2026-10-30T11:00:00Z", agora)).toBe(3);
    expect(diasDeTeste("2026-10-26T12:00:00Z", agora)).toBe(0);
  });
});
