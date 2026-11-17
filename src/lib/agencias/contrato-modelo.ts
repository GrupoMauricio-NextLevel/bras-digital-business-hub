import { formatar, impressaoDigital, type Secao } from "@/lib/contratos/loja-pronta-express";

/**
 * Modelo de contrato da agência com o cliente dela (D321). Regra pura e testada: os dados entram, o texto sai. Linguagem
 * simples, sem promessa de resultado. É um modelo de referência: a tela pede que a agência revise com o advogado dela.
 */
export type DadosContratoAgencia = {
  contratada: { nome: string; razao: string; documento: string; cidadeForo: string; representante: string; email: string };
  cliente: { nome: string; documento: string; email: string; contato: string | null };
  pacote: string; inclusoTexto: string; valorMensalCents: number; diaVencimento: number;
  inicio: string; vigenciaMeses: number; avisoPrevioDias: number; rodadasAjuste: number; prazoAprovacaoDias: number;
  extras: string | null;
};

/** O que falta para o contrato poder sair (cada item em português claro). */
export function pendenciasDoContrato(d: DadosContratoAgencia): string[] {
  const p: string[] = [];
  if (!d.contratada.razao) p.push("Razão social da agência (Equipe, em Dados da agência)");
  if (!d.contratada.documento) p.push("CNPJ ou CPF da agência (Equipe, em Dados da agência)");
  if (!d.contratada.cidadeForo) p.push("Cidade do foro (Equipe, em Dados da agência)");
  if (!d.cliente.documento) p.push("CPF ou CNPJ do cliente (ficha do cliente)");
  if (!d.cliente.email) p.push("E-mail do cliente (é por ele que o cliente entra no portal para aceitar)");
  if (!d.valorMensalCents) p.push("Valor mensal do contrato (ficha do cliente)");
  if (!d.diaVencimento) p.push("Dia do vencimento (ficha do cliente)");
  if (!d.inclusoTexto) p.push("O que entra no mês (ficha do cliente)");
  return p;
}

export function secoesDoContrato(d: DadosContratoAgencia): Secao[] {
  const s: Secao[] = [
    { titulo: "1. O que está sendo contratado", resumo: `${d.contratada.nome} cuida do marketing digital de ${d.cliente.nome} todo mês, dentro do pacote abaixo.`,
      paragrafos: [`A CONTRATADA, ${d.contratada.razao}, presta à CONTRATANTE, ${d.cliente.nome}, serviços de marketing digital e produção de conteúdo no pacote "${d.pacote || "mensal"}".`] },
    { titulo: "2. O que entra em cada mês", itens: [`Entregas do mês: ${d.inclusoTexto}.`, "Conteúdos não usados no mês não passam para o mês seguinte, salvo combinado por escrito.", "Pedidos fora do pacote são orçados à parte antes de começar."] },
    { titulo: "3. Aprovação dos conteúdos", resumo: "Tudo passa pelo portal do cliente: você assiste, aprova ou pede ajuste.",
      itens: [`Os conteúdos são enviados para aprovação no portal do cliente da ${d.contratada.nome}.`, `Cada conteúdo inclui até ${d.rodadasAjuste} rodada(s) de ajuste. Ajustes além disso podem ser cobrados à parte, com aviso antes.`, `A CONTRATANTE responde em até ${d.prazoAprovacaoDias} dia(s) útil(eis). Sem resposta, o calendário de publicação pode ser reprogramado.`] },
    { titulo: "4. O que a CONTRATANTE fornece", itens: ["Informações, materiais, fotos, logotipo e acessos às redes sociais necessários ao trabalho.", "Disponibilidade para as gravações agendadas. Gravação desmarcada sem aviso de 24 horas pode não ser reposta no mês.", "Veracidade das informações sobre produtos, preços e serviços dela que forem divulgados."] },
    { titulo: "5. Valor e pagamento", resumo: `${formatar.brl(d.valorMensalCents)} por mês, com vencimento todo dia ${d.diaVencimento}.`,
      itens: [`Valor mensal: ${formatar.brl(d.valorMensalCents)}, com vencimento todo dia ${d.diaVencimento}, pelo link de pagamento enviado pela CONTRATADA ou outro meio combinado.`, "Com pagamento em atraso, a CONTRATADA pode pausar a produção até a regularização, avisando antes."] },
    { titulo: "6. Anúncios pagos", paragrafos: ["O valor investido em anúncios (Meta, Google, TikTok e outros) não está incluído neste contrato e é pago pela CONTRATANTE diretamente às plataformas."] },
    { titulo: "7. Resultados", paragrafos: ["A CONTRATADA se compromete com a qualidade e a regularidade do trabalho. Alcance, seguidores, contatos e vendas dependem de fatores fora do controle dela e não são garantidos."] },
    { titulo: "8. Imagem e direitos de uso", itens: ["A CONTRATANTE autoriza o uso das imagens, vozes e marcas que fornecer, apenas para os conteúdos deste contrato.", "Os conteúdos aprovados e publicados podem ser usados livremente pela CONTRATANTE.", "A CONTRATADA pode mostrar os trabalhos no próprio portfólio, salvo pedido contrário por escrito."] },
    { titulo: "9. Dados e acessos", paragrafos: ["As duas partes tratam dados pessoais conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018). Senhas e acessos recebidos são usados só para este trabalho e devolvidos ou apagados ao fim do contrato."] },
    { titulo: "10. Prazo e encerramento", resumo: `Começa em ${formatar.data(d.inicio)}, vale ${d.vigenciaMeses} meses e renova sozinho. Para encerrar, aviso de ${d.avisoPrevioDias} dias.`,
      itens: [`Início em ${formatar.data(d.inicio)}, com vigência de ${d.vigenciaMeses} meses, renovada automaticamente por períodos iguais.`, `Qualquer das partes pode encerrar com aviso por escrito de ${d.avisoPrevioDias} dias. O mês em andamento é pago e entregue normalmente.`] },
  ];
  if (d.extras?.trim()) s.push({ titulo: "11. Combinados adicionais", paragrafos: d.extras.trim().split(/\n+/).map((x) => x.trim()).filter(Boolean) });
  s.push({ titulo: `${d.extras?.trim() ? 12 : 11}. Foro`, paragrafos: [`Fica eleito o foro da comarca de ${d.contratada.cidadeForo} para resolver qualquer questão deste contrato.`] });
  return s;
}

export const hashDoContrato = (d: DadosContratoAgencia, secoes: Secao[]) => impressaoDigital(d, secoes);
