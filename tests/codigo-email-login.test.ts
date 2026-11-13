import { describe, expect, it } from "vitest";
import { bilheteCodigoEmail, codigoEmailLigado, conferirCodigoEmail, lerBilheteCodigoEmail, lerBilheteSegundaEtapa, novoCodigoEmail } from "@/lib/domain/seguranca-conta";

describe("código de segurança por e-mail a cada entrada (D286)", () => {
  it("código de 6 números; o bilhete não revela o código e só confere o código certo, da mesma conta, no prazo", () => {
    const c = novoCodigoEmail();
    expect(c).toMatch(/^\d{6}$/);
    const b = bilheteCodigoEmail("usr_1", c);
    expect(Buffer.from(b.split(".")[0]!, "base64url").toString()).not.toContain(c);
    expect(conferirCodigoEmail(b, c)).toBe("usr_1");
    expect(conferirCodigoEmail(b, ` ${c.slice(0, 3)} ${c.slice(3)} `)).toBe("usr_1"); // espaços digitados não atrapalham
    expect(conferirCodigoEmail(b, c === "000000" ? "111111" : "000000")).toBeNull();
    expect(conferirCodigoEmail(b.replace(/.$/, (x) => (x === "A" ? "B" : "A")), c)).toBeNull(); // bilhete adulterado
    expect(conferirCodigoEmail(bilheteCodigoEmail("usr_1", c, Date.now() - 11 * 60_000), c)).toBeNull(); // vencido
    expect(lerBilheteCodigoEmail(b)).toBe("usr_1");
    expect(lerBilheteSegundaEtapa(b)).toBeNull(); // bilhete de e-mail não serve como bilhete do aplicativo
  });
  it("liga por padrão, desliga na demonstração e com LOGIN_CODIGO_EMAIL=0", () => {
    const antes = process.env.LOGIN_CODIGO_EMAIL;
    delete process.env.LOGIN_CODIGO_EMAIL;
    expect(codigoEmailLigado(false)).toBe(true);
    expect(codigoEmailLigado(true)).toBe(false);
    process.env.LOGIN_CODIGO_EMAIL = "0";
    expect(codigoEmailLigado(false)).toBe(false);
    if (antes === undefined) delete process.env.LOGIN_CODIGO_EMAIL; else process.env.LOGIN_CODIGO_EMAIL = antes;
  });
});
