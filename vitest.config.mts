import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // Cada arquivo sobe um Postgres em WebAssembly (PGlite); em paralelo, 5 s padrão estoura sem haver erro.
  test: { include: ["tests/**/*.test.{ts,tsx}"], environment: "node", testTimeout: 30_000 },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
