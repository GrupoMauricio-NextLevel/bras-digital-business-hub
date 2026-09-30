import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateTemporaryPassword } from "@/lib/security/password";
import { decryptSecret, encryptSecret, signSession, verifySession } from "@/lib/security/crypto";

describe("senhas", () => {
  it("verifica a senha correta e rejeita incorreta ou vazia", () => {
    const h = hashPassword("segredo-forte");
    expect(verifyPassword("segredo-forte", h)).toBe(true);
    expect(verifyPassword("outra", h)).toBe(false);
    expect(verifyPassword("segredo-forte", null)).toBe(false);
    expect(verifyPassword("segredo-forte", "lixo")).toBe(false);
  });
  it("hashes diferentes para a mesma senha (salt)", () => {
    expect(hashPassword("x1234567")).not.toBe(hashPassword("x1234567"));
  });
  it("senha temporária tem tamanho e alfabeto seguros", () => {
    const p = generateTemporaryPassword();
    expect(p).toHaveLength(10);
    expect(p).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
  });
});

describe("segredos e sessão", () => {
  it("criptografa e descriptografa; adulteração falha", () => {
    const enc = encryptSecret("APP_USR-1234567890");
    expect(enc).not.toContain("APP_USR");
    expect(decryptSecret(enc)).toBe("APP_USR-1234567890");
    const parts = enc.split(".");
    parts[3] = Buffer.from("adulterado").toString("base64url");
    expect(decryptSecret(parts.join("."))).toBeNull();
    expect(decryptSecret(null)).toBeNull();
  });
  it("sessão assinada válida, expirada e adulterada", () => {
    const ok = signSession({ uid: "usr_1", exp: Date.now() + 60_000 });
    expect(verifySession(ok)?.uid).toBe("usr_1");
    expect(verifySession(signSession({ uid: "usr_1", exp: Date.now() - 1 }))).toBeNull();
    const [body] = ok.split(".");
    expect(verifySession(`${body}.assinaturafalsa`)).toBeNull();
    const forged = Buffer.from(JSON.stringify({ uid: "usr_admin", exp: Date.now() + 60_000 })).toString("base64url");
    expect(verifySession(`${forged}.${ok.split(".")[1]}`)).toBeNull();
    expect(verifySession(undefined)).toBeNull();
  });
});
