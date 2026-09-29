import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** PDF de etiqueta fictícia (100x150 mm) para a demonstração e os testes. Não é uma etiqueta real do SuperFrete. */
export async function makeDemoLabelPdf(orderNumber: number, recipient = "Cliente Demonstração"): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const mm = 2.8346;
  const page = doc.addPage([100 * mm, 150 * mm]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({ x: 6, y: 6, width: page.getWidth() - 12, height: page.getHeight() - 12, borderColor: rgb(0, 0, 0), borderWidth: 1.5 });
  page.drawText("SUPERFRETE (DEMO)", { x: 20, y: page.getHeight() - 40, size: 16, font: bold });
  page.drawText(`Pedido #${orderNumber}`, { x: 20, y: page.getHeight() - 70, size: 22, font: bold });
  page.drawText("Destinatário", { x: 20, y: page.getHeight() - 110, size: 9, font });
  page.drawText(recipient, { x: 20, y: page.getHeight() - 126, size: 14, font: bold });
  for (let i = 0; i < 46; i++) page.drawRectangle({ x: 20 + i * 5, y: 60, width: i % 3 === 0 ? 3 : 1.5, height: 70, color: rgb(0, 0, 0) });
  page.drawText(`ME${String(orderNumber).padStart(9, "0")}BR`, { x: 20, y: 40, size: 12, font: bold });
  return doc.save();
}
