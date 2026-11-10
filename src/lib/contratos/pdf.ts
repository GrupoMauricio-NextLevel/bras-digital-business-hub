import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatar, type DadosLojaPronta, type Secao } from "./loja-pronta-express";

/**
 * PDF do contrato (D276), gerado no servidor sem navegador (pdf-lib, fontes padrão). Mesma ordem da prévia aprovada pelo
 * dono: resumo, Pix em destaque, "Como vamos trabalhar juntos?", cláusulas e, no fim, o registro do aceite.
 */
export type ContratoParaPdf = {
  numero: string; titulo: string; hash: string; dados: DadosLojaPronta; secoes: Secao[];
  enviadoEm: string; aceitoEm?: string | null; aceitoNome?: string | null; aceitoIp?: string | null; aceitoAparelho?: string | null;
};

const A4 = { w: 595.28, h: 841.89 };
const M = 48;
const NAVY = rgb(11 / 255, 19 / 255, 40 / 255), AZUL = rgb(41 / 255, 76 / 255, 220 / 255), CIANO = rgb(39 / 255, 199 / 255, 242 / 255);
const TINTA = rgb(16 / 255, 26 / 255, 51 / 255), CINZA = rgb(58 / 255, 66 / 255, 88 / 255), LINHA = rgb(223 / 255, 228 / 255, 238 / 255);
const FUNDO_AZUL = rgb(238 / 255, 243 / 255, 255 / 255), FUNDO_CINZA = rgb(243 / 255, 246 / 255, 252 / 255);

/** As fontes padrão do PDF só têm o alfabeto latino básico: troca o que não existe nelas. */
const limpo = (t: string) => t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/ /g, " ").replace(/[^\x20-\x7e -ÿ–—•·]/g, "");
const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

function quebrar(texto: string, f: PDFFont, tam: number, largura: number): string[] {
  const linhas: string[] = [];
  for (const par of limpo(texto).split("\n")) {
    let atual = "";
    for (const palavra of par.split(/\s+/)) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (f.widthOfTextAtSize(teste, tam) <= largura) atual = teste;
      else { if (atual) linhas.push(atual); atual = palavra; }
    }
    linhas.push(atual);
  }
  return linhas;
}

export async function gerarPdfContrato(c: ContratoParaPdf): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(limpo(`Contrato ${c.numero} · ${c.titulo}`)); pdf.setAuthor(limpo(c.dados.contratada.razao)); pdf.setLanguage("pt-BR");
  const R = await pdf.embedFont(StandardFonts.Helvetica), B = await pdf.embedFont(StandardFonts.HelveticaBold);
  const L = A4.w - 2 * M;
  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - M;
  const nova = () => { page = pdf.addPage([A4.w, A4.h]); y = A4.h - M; };
  const espaco = (h: number) => { if (y - h < M + 24) nova(); };
  const texto = (t: string, o: { f?: PDFFont; tam?: number; cor?: ReturnType<typeof rgb>; x?: number; larg?: number; entre?: number } = {}) => {
    const f = o.f ?? R, tam = o.tam ?? 9.5, x = o.x ?? M, larg = o.larg ?? L, entre = o.entre ?? tam * 1.45;
    for (const l of quebrar(t, f, tam, larg)) { espaco(entre); page.drawText(l, { x, y: y - tam, size: tam, font: f, color: o.cor ?? TINTA }); y -= entre; }
  };
  const d = c.dados;

  // Topo
  page.drawRectangle({ x: 0, y: A4.h - 92, width: A4.w, height: 92, color: NAVY });
  page.drawRectangle({ x: 0, y: A4.h - 95, width: A4.w, height: 3, color: CIANO });
  page.drawText("NextLevel", { x: M, y: A4.h - 50, size: 20, font: B, color: rgb(1, 1, 1) });
  page.drawText("E-commerce", { x: M, y: A4.h - 68, size: 12, font: B, color: CIANO });
  const t1 = "Contrato de Prestação de Serviços";
  page.drawText(limpo(t1), { x: A4.w - M - B.widthOfTextAtSize(limpo(t1), 15), y: A4.h - 50, size: 15, font: B, color: rgb(1, 1, 1) });
  const t2 = limpo(`Loja Virtual Pronta Express · nº ${c.numero} · ${formatar.data(c.enviadoEm)}`);
  page.drawText(t2, { x: A4.w - M - R.widthOfTextAtSize(t2, 8.5), y: A4.h - 66, size: 8.5, font: R, color: rgb(0.73, 0.77, 0.87) });
  y = A4.h - 118;

  // Resumo
  texto("RESUMO DO CONTRATO", { f: B, tam: 7.5, cor: AZUL });
  y -= 2;
  const linhas: [string, string][] = [
    ["Contratada", `${d.contratada.razao} · CNPJ ${d.contratada.cnpj} · representada por ${d.contratada.representante}${d.contratada.cpfRepresentante ? ` · CPF ${d.contratada.cpfRepresentante}` : ""} · ${d.contratada.emailRepresentante}`],
    ["Contratante", `${d.cliente.nome} · CPF/CNPJ ${d.cliente.documento} · ${d.cliente.email}`],
    ["Loja", `${d.loja.nome} (/${d.loja.slug})`],
    ["Serviço", "Loja Virtual Pronta Express, desenvolvida exclusivamente dentro da plataforma NextLevel E-commerce"],
    ["Produtos", `Cadastro inicial de ${d.produtos} produtos e treinamento para o CONTRATANTE cadastrar os demais`],
    ["Valor", `De ${formatar.brl(d.valorCheioCents)} por ${formatar.brl(d.valorCents)} (valor promocional, pagamento único)`],
    ["Pagamento", `Pix · ${formatar.brl(d.sinalCents)} de sinal em ${formatar.data(d.dataSinal)} · ${formatar.brl(d.restanteCents)} até ${formatar.data(d.dataRestante)}`],
    ["Entrega", `Em até ${d.prazoDias} dias corridos depois do pagamento total e do recebimento de todo o material`],
    ["Não incluído", d.cortesiaMeses > 0 ? `Domínio. Mensalidade da plataforma: ${d.cortesiaMeses} meses de cortesia; depois, por conta do CONTRATANTE` : "Mensalidade da plataforma e domínio, contratados à parte"],
  ];
  for (const [k, v] of linhas) {
    const vl = quebrar(v, R, 9, L - 120);
    espaco(vl.length * 13 + 8);
    page.drawText(limpo(k), { x: M, y: y - 9, size: 9, font: B, color: CINZA });
    vl.forEach((l, i) => page.drawText(l, { x: M + 120, y: y - 9 - i * 13, size: 9, font: R, color: TINTA }));
    y -= vl.length * 13 + 5;
    page.drawLine({ start: { x: M, y }, end: { x: M + L, y }, thickness: 0.6, color: LINHA });
    y -= 4;
  }

  // Pix em destaque
  y -= 8;
  const hPix = 92;
  espaco(hPix + 10);
  page.drawRectangle({ x: M, y: y - hPix, width: L, height: hPix, color: FUNDO_AZUL, borderColor: AZUL, borderWidth: 1.5 });
  page.drawText("DADOS PARA PAGAMENTO · PIX", { x: M + 12, y: y - 18, size: 7.5, font: B, color: AZUL });
  page.drawText("Chave Pix (CNPJ)", { x: M + 12, y: y - 32, size: 8.5, font: R, color: CINZA });
  page.drawText(limpo(d.contratada.chavePix), { x: M + 12, y: y - 54, size: 20, font: B, color: NAVY });
  const lado = [`Banco ${d.contratada.banco}`, `Favorecido: ${d.contratada.favorecido}`, `1ª parcela: ${formatar.brl(d.sinalCents)} em ${formatar.data(d.dataSinal)}`, `2ª parcela: ${formatar.brl(d.restanteCents)} até ${formatar.data(d.dataRestante)}`];
  lado.forEach((l, i) => { const s = limpo(l); const f = i === 0 ? B : R; page.drawText(s, { x: M + L - 12 - f.widthOfTextAtSize(s, 9), y: y - 22 - i * 14, size: 9, font: f, color: TINTA }); });
  page.drawText(limpo(`Confira o nome do favorecido antes de confirmar e envie o comprovante para ${d.contratada.emailRepresentante}.`), { x: M + 12, y: y - hPix + 12, size: 8, font: R, color: CINZA });
  y -= hPix + 16;

  // Seções
  for (const s of c.secoes) {
    espaco(40);
    y -= 4;
    texto(s.titulo, { f: B, tam: 11, cor: AZUL });
    if (s.resumo) {
      const rl = quebrar(s.resumo, R, 8.5, L - 16);
      espaco(rl.length * 12 + 10);
      page.drawRectangle({ x: M, y: y - rl.length * 12 - 6, width: L, height: rl.length * 12 + 6, color: FUNDO_CINZA });
      page.drawRectangle({ x: M, y: y - rl.length * 12 - 6, width: 2.5, height: rl.length * 12 + 6, color: AZUL });
      rl.forEach((l, i) => page.drawText(l, { x: M + 10, y: y - 11 - i * 12, size: 8.5, font: R, color: TINTA }));
      y -= rl.length * 12 + 10;
    }
    for (const p of s.paragrafos ?? []) { texto(p); y -= 3; }
    for (const it of s.itens ?? []) {
      const il = quebrar(it, R, 9.5, L - 14);
      espaco(il.length * 13.5);
      page.drawText("•", { x: M + 2, y: y - 9.5, size: 9.5, font: B, color: rgb(10 / 255, 138 / 255, 92 / 255) });
      il.forEach((l, i) => page.drawText(l, { x: M + 14, y: y - 9.5 - i * 13.5, size: 9.5, font: R, color: TINTA }));
      y -= il.length * 13.5 + 1;
    }
  }

  // Registro do aceite (manifesto)
  y -= 10;
  espaco(150);
  page.drawLine({ start: { x: M, y }, end: { x: M + L, y }, thickness: 1, color: NAVY });
  y -= 8;
  texto("REGISTRO DE ASSINATURA E ACEITE", { f: B, tam: 8, cor: AZUL });
  texto(`CONTRATADA: ${d.contratada.razao}, CNPJ ${d.contratada.cnpj}, representada por ${d.contratada.representante}. Assinado e enviado pelo painel Master em ${dataHora(c.enviadoEm)}.`, { tam: 9 });
  if (c.aceitoEm) texto(`CONTRATANTE: ${c.aceitoNome ?? d.cliente.nome}, CPF/CNPJ ${d.cliente.documento}. Aceito no painel da loja, com login próprio, em ${dataHora(c.aceitoEm)}. Endereço de rede: ${c.aceitoIp ?? "não informado"}. Aparelho: ${c.aceitoAparelho ?? "não informado"}.`, { tam: 9 });
  else texto("CONTRATANTE: aguardando o aceite no painel da loja.", { tam: 9 });
  texto(`Impressão digital do texto (SHA-256): ${c.hash}`, { tam: 7.5, cor: CINZA });
  texto("A impressão digital muda se qualquer letra do contrato for alterada; ela confirma que este é exatamente o texto aceito.", { tam: 7.5, cor: CINZA });

  // Rodapé de todas as páginas
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 34 }, end: { x: A4.w - M, y: 34 }, thickness: 0.6, color: LINHA });
    p.drawText(limpo(`Contrato Loja Virtual Pronta Express · nº ${c.numero}`), { x: M, y: 22, size: 7.5, font: R, color: CINZA });
    const pg = `Página ${i + 1} de ${paginas.length}`;
    p.drawText(pg, { x: A4.w - M - R.widthOfTextAtSize(pg, 7.5), y: 22, size: 7.5, font: R, color: CINZA });
  });
  return pdf.save();
}
