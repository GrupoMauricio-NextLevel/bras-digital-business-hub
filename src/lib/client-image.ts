/** Redimensiona e comprime uma imagem no navegador (JPEG, lado maior 900px) e devolve um data URL. */
export async function compressImage(file: File, maxSide = 900, quality = 0.82, format: "jpeg" | "png" = "jpeg"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Arquivo não é uma imagem.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  if (format === "jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality);
}
