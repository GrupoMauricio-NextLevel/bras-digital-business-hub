/**
 * Mensagem de erro para envios feitos no navegador (imagens). Quando o sistema é publicado de novo com a tela aberta,
 * a ação antiga deixa de existir no servidor ("Failed to find Server Action", "unexpected response"): a pessoa precisa só
 * recarregar a página. Sem isto, o envio do banner falhava com uma mensagem técnica.
 */
export function mensagemDeEnvio(e: unknown, padrao = "Não foi possível enviar a imagem."): string {
  const msg = e instanceof Error ? e.message : "";
  if (/server action|unexpected response|failed to fetch|network|load failed/i.test(msg)) return "O sistema foi atualizado enquanto esta tela estava aberta. Recarregue a página (F5) e envie a imagem de novo.";
  return msg && !/^[A-Z][a-zA-Z]+Error\b/.test(msg) && msg.length < 200 ? msg : padrao;
}
