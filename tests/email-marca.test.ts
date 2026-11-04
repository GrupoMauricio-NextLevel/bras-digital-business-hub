import { describe, expect, it } from "vitest";
import { dominioDoEmail, MARCA_COMPLETA, provedorPorMx } from "@/lib/domain/email-marca";
import { pendenciasDoDono } from "@/lib/domain/pendencias-dono";

/** E-mail com o domínio (D245): grátis guiado (Zoho), verificação pelo MX; pago bloqueado. */
describe("e-mail da marca", () => {
  it("domínio do e-mail é o raiz", () => {
    expect(dominioDoEmail("www.minhaloja.com.br")).toBe("minhaloja.com.br");
    expect(dominioDoEmail("loja.minhamarca.com.br")).toBe("minhamarca.com.br");
    expect(dominioDoEmail("minhaloja.com")).toBe("minhaloja.com");
  });
  it("reconhece o provedor pelo MX", () => {
    expect(provedorPorMx(["mx.zoho.com.", "mx2.zoho.com"])).toBe("zoho");
    expect(provedorPorMx(["aspmx.l.google.com"])).toBe("google");
    expect(provedorPorMx(["minhaloja-com-br.mail.protection.outlook.com"])).toBe("microsoft");
    expect(provedorPorMx(["route1.mx.cloudflare.net"])).toBe("cloudflare");
    expect(provedorPorMx(["mail.qualquer.net"])).toBe("outro");
    expect(provedorPorMx([])).toBeNull();
  });
  it("Marca Completa pago fica bloqueado; e-mail não é mais pendência do dono", () => {
    expect(MARCA_COMPLETA.disponivel).toBe(false);
    expect(pendenciasDoDono({}).map((p) => p.key)).toEqual(["render-api"]);
  });
});
