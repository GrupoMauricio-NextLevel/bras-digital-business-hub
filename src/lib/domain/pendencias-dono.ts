/**
 * Pendências do dono (D236; e-mail saiu em D245: caminho grátis guiado, pago bloqueado): o que só o dono pode fazer para o sistema rodar sozinho. Calculadas do ambiente: somem
 * da lista quando ficam prontas (ninguém marca à mão). Sem segredo na tela: só diz se existe ou não.
 */
export type PendenciaDono = { key: string; titulo: string; porque: string; passos: string[]; feita: boolean };

export function pendenciasDoDono(env: Record<string, string | undefined> = process.env): PendenciaDono[] {
  return [
    {
      key: "render-api",
      titulo: "Criar a chave de API do Render",
      porque: "Com ela, o domínio próprio de cada lojista é ligado na hospedagem sozinho, com HTTPS, sem ninguém da equipe.",
      passos: [
        "No Render, abra Account Settings → API Keys → Create API Key e copie a chave.",
        "Abra o serviço da plataforma no Render → Settings e copie o Service ID (começa com srv-).",
        "Em Environment, crie RENDER_API_KEY (a chave) e RENDER_SERVICE_ID (o srv-…) e salve.",
      ],
      feita: !!env.RENDER_API_KEY && !!env.RENDER_SERVICE_ID,
    },
  ];
}
