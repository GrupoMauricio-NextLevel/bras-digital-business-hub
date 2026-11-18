// Gera o "pacote de contexto" do projeto num arquivo só, para subir num Projeto do Abacus (D343).
// As conversas com o Claude não se exportam, mas tudo o que foi decidido nelas está registrado no repositório
// (regras, decisões, base de conhecimento, observações do dono). Este arquivo junta o essencial.
// Uso: node scripts/gerar-pacote-abacus.mjs [arquivo-de-saida]   (padrão: contexto-nextlevel-abacus.md na pasta atual)
// Rode de novo sempre que houver decisões novas e troque o arquivo no Projeto do Abacus.
import { readFileSync, writeFileSync } from "node:fs";

const saida = process.argv[2] || "contexto-nextlevel-abacus.md";
const ler = (p) => readFileSync(p, "utf8").trim();
const decisoes = ler("docs/design/DECISIONS.md");
const inicioRecentes = decisoes.search(/^## D3\d\d\b/m);
const recentes = inicioRecentes >= 0 ? decisoes.slice(inicioRecentes) : decisoes;
const ultima = [...decisoes.matchAll(/^## (D\d+)\b/gm)].pop()?.[1] ?? "?";
const hoje = new Date().toISOString().slice(0, 10);

const partes = [
  `# Contexto do projeto NextLevel (para o Abacus), gerado em ${hoje}, última decisão ${ultima}`,
  `> **Como usar:** suba este arquivo como conhecimento de um Projeto no Abacus. Ele substitui o histórico das conversas com o Claude: tudo o que foi decidido nelas está aqui (regras do projeto, decisões D300 em diante, base de conhecimento e observações do dono). O histórico completo (D1 em diante) fica em \`docs/design/DECISIONS.md\` no repositório. Em conflito, vale o repositório, que é sempre o mais novo.`,
  `> **Seu papel:** só o visual, na branch \`abacus/visual\`, no computador do dono. Nunca peça nem use senhas de produção (Neon, Render, Mercado Pago, Resend). Regras completas na parte 2.`,
  `---\n# Parte 1. Regras do projeto (CLAUDE.md)\n\n${ler("CLAUDE.md").replace(/^@AGENTS\.md\s*/, "")}`,
  `---\n# Parte 2. Regras para agentes (AGENTS.md) e guia do Abacus\n\n${ler("AGENTS.md")}\n\n${ler("docs/abacus/COMECE-AQUI.md")}`,
  `---\n# Parte 3. Observações do dono sobre as telas\n\n${ler("docs/melhorias/telas-observacoes-do-dono.md")}`,
  `---\n# Parte 4. Base de conhecimento (como a plataforma funciona hoje)\n\n${ler("docs/conhecimento/BC0-INVENTARIO.md")}`,
  `---\n# Parte 5. Decisões recentes (D300 até ${ultima})\n\n${recentes}`,
];
writeFileSync(saida, partes.join("\n\n") + "\n");
console.log(`Pacote gerado: ${saida} (${Math.round(Buffer.byteLength(partes.join("\n\n")) / 1024)} KB, até ${ultima}).`);
