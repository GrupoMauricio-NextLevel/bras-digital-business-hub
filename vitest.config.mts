import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 120_000,
    globalSetup: ["tests/global-setup.ts"],
    // Máquina de 8 GB: 254 processos em paralelo estouravam a memória e produziam falhas falsas.
    // Dois processos por vez cabem na RAM; `isolate: false` reaproveita o processo entre arquivos.
    pool: "forks",
    maxWorkers: 2,
    minWorkers: 1,
    isolate: true,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
