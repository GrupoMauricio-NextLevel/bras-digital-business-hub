/**
 * Texto pronto que o parceiro manda no WhatsApp (D168). Vem da marca do endereço (`getBrand()`): o parceiro da NextLevel
 * Commerce não convida para o SuperDrop. Sem prazo de teste fixo no texto (o prazo vem do Master e muda por oferta).
 */
export function textoConvite(marca: { name: string; tagline: string }, link: string, cupom?: string): string {
  const frase = marca.tagline.replace(/[.\s]+$/, "");
  return cupom ? `Conheça ${marca.name} (${frase}) e use o meu cupom ${cupom}: ${link}` : `Conheça ${marca.name}: ${frase}. Teste aqui: ${link}`;
}
