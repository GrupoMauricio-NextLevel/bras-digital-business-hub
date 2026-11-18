// Converte imagens geradas (PNG/JPG) para WebP leve, pronto para o site (D342). Funciona no Windows, Mac e Linux.
// Uso (na pasta do projeto):  node scripts/imagens/converter-webp.mjs <pasta-de-origem> <pasta-de-destino> [largura-maxima]
//   ex.: node scripts/imagens/converter-webp.mjs C:\Users\voce\Downloads\abacus public/theme-demo/arena 1536
// Regras (docs/prompts/imagens-temas-gpt.md, seção 3): WebP qualidade 80, sem metadados, até 250 KB por imagem.
// Mantém o nome do arquivo (só troca a extensão) e avisa quais passaram de 250 KB.
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const [origem, destino, larguraTexto] = process.argv.slice(2);
if (!origem || !destino) {
  console.error("Uso: node scripts/imagens/converter-webp.mjs <pasta-de-origem> <pasta-de-destino> [largura-maxima]");
  process.exit(1);
}
const largura = Number(larguraTexto) || 1536;
const LIMITE = 250 * 1024;
mkdirSync(destino, { recursive: true });

const arquivos = readdirSync(origem).filter((n) => /\.(png|jpe?g|webp)$/i.test(n));
if (arquivos.length === 0) {
  console.error(`Nenhuma imagem PNG, JPG ou WebP em ${origem}.`);
  process.exit(1);
}
let pesadas = 0;
for (const nome of arquivos) {
  const saida = join(destino, `${basename(nome, extname(nome))}.webp`);
  let qualidade = 80;
  await sharp(join(origem, nome)).rotate().resize({ width: largura, withoutEnlargement: true }).webp({ quality: qualidade }).toFile(saida);
  // Passou do limite? Tenta de novo um pouco mais leve antes de avisar.
  while (statSync(saida).size > LIMITE && qualidade > 60) {
    qualidade -= 10;
    await sharp(join(origem, nome)).rotate().resize({ width: largura, withoutEnlargement: true }).webp({ quality: qualidade }).toFile(saida);
  }
  const kb = Math.round(statSync(saida).size / 1024);
  const aviso = statSync(saida).size > LIMITE ? "  ⚠ acima de 250 KB" : "";
  if (aviso) pesadas++;
  console.log(`${nome} → ${saida} (${kb} KB, qualidade ${qualidade})${aviso}`);
}
console.log(`\n${arquivos.length} imagem(ns) convertida(s)${pesadas ? `; ${pesadas} acima de 250 KB (diminua a largura)` : ""}.`);
