import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * D346: a cópia do Abacus (computador do dono) só consegue enviar para a branch própria. A trava fica no começo do
 * .githooks/pre-push e só age com `git config nextlevel.branchPermitida`. Aqui rodamos só o trecho da trava num
 * repositório de teste (sem tipos/estilo, que vêm depois no gancho).
 */
function trava(permitida: string | null, destino: string) {
  const pasta = mkdtempSync(join(tmpdir(), "trava-"));
  execFileSync("git", ["init", "-q"], { cwd: pasta });
  if (permitida) execFileSync("git", ["config", "nextlevel.branchPermitida", permitida], { cwd: pasta });
  const gancho = readFileSync(".githooks/pre-push", "utf8");
  const trecho = gancho.slice(0, gancho.indexOf("\nfi\n") + 4) + "echo LIBERADO\n";
  const script = join(pasta, "trava.sh");
  writeFileSync(script, trecho);
  return spawnSync("bash", [script], { cwd: pasta, input: `refs/heads/x 111 refs/heads/${destino} 222\n`, encoding: "utf8" });
}

describe("trava de envio da cópia do Abacus (D346)", () => {
  it("bloqueia o envio para a branch de publicação", () => {
    const r = trava("abacus/visual", "claude/wonderful-cannon-5o38v5");
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("só envia para a branch abacus/visual");
  });
  it("libera o envio para a branch própria", () => {
    const r = trava("abacus/visual", "abacus/visual");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("LIBERADO");
  });
  it("não age nas outras cópias (sem a configuração)", () => {
    const r = trava(null, "claude/wonderful-cannon-5o38v5");
    expect(r.status).toBe(0);
  });
});
