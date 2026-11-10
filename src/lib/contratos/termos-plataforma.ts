import { CONTRATADA_PADRAO, impressaoDigital, type Secao } from "./loja-pronta-express";

/**
 * Termos de uso da plataforma NextLevel E-commerce (D279): o contrato padrão que todo dono de loja aceita no painel,
 * com o próprio login, antes de usar. Texto simples, sem pontos polêmicos (pedido do dono, 10/11/2026); preços e taxas
 * não ficam aqui (vêm da página de planos e da tela de pagamento). Versão nova = todos aceitam de novo.
 * Arquivo puro: a impressão digital sai do texto, então qualquer letra mudada exige trocar a versão.
 */
export const VERSAO_TERMOS = "2026-11-10";
export const TITULO_TERMOS = "Termos de uso da plataforma NextLevel E-commerce";

const c = CONTRATADA_PADRAO;

export const SECOES_TERMOS: Secao[] = [
  { titulo: "1. Quem são as partes", resumo: "Em resumo: a NextLevel fornece a tecnologia; a loja e as vendas são suas.", paragrafos: [
    `De um lado, a ${c.razao}, CNPJ ${c.cnpj} ("NextLevel"), que opera a plataforma NextLevel E-commerce. Do outro, a pessoa ou empresa que cria a conta e a loja na plataforma ("LOJISTA").`,
    "Ao aceitar estes termos no painel, o LOJISTA contrata o uso da plataforma nas condições abaixo.",
  ] },
  { titulo: "2. O que a plataforma oferece", paragrafos: [
    "A plataforma é um sistema online para criar e operar uma loja virtual: vitrine, catálogo, carrinho e pagamento, pedidos, clientes, temas, integrações e as demais ferramentas do painel.",
    "O LOJISTA recebe o direito de usar a plataforma enquanto a conta estiver ativa. Os recursos de cada plano estão na página de planos. A NextLevel pode melhorar, mudar ou trocar recursos para manter a plataforma atualizada.",
  ] },
  { titulo: "3. Conta e acesso", itens: [
    "Os dados do cadastro (nome, CPF ou CNPJ, e-mail e telefone) precisam ser verdadeiros e ficar atualizados.",
    "A senha é pessoal. O LOJISTA responde pelo que for feito com a conta dele e pela equipe que convidar para o painel.",
    "Para criar conta é preciso ter 18 anos ou mais, ou ser uma empresa.",
  ] },
  { titulo: "4. Teste grátis, planos e pagamento", resumo: "Em resumo: preço e condições aparecem antes de você pagar; sem pagamento, o acesso pode ser pausado.", paragrafos: [
    "O valor, o período de teste, a forma de pagamento, a renovação e as taxas de cada plano aparecem na página de planos e na tela de pagamento, antes do pagamento.",
    "Os planos são pagos antes de cada período (mensal ou anual). Sem o pagamento depois do vencimento, o acesso ao painel e a loja podem ser pausados até a regularização, com aviso no painel.",
    "Mudança de preço é avisada com pelo menos 30 dias de antecedência e vale a partir do período seguinte. No plano anual, o preço fica o mesmo até o fim do ano contratado.",
  ] },
  { titulo: "5. O dinheiro das vendas", resumo: "Em resumo: o dinheiro das suas vendas cai direto na sua conta de pagamento.", paragrafos: [
    "Os pagamentos dos clientes da loja são feitos na conta de pagamento do próprio LOJISTA (por exemplo, Mercado Pago), que tem regras e tarifas próprias. A NextLevel não recebe nem guarda o dinheiro das vendas e não guarda dados de cartão.",
    "Quando o plano tiver taxa de plataforma sobre as vendas, ela aparece na página de planos e é cobrada pela NextLevel em fatura separada.",
  ] },
  { titulo: "6. O que é responsabilidade do LOJISTA", itens: [
    "Os produtos, preços, estoque, descrições e fotos da loja.",
    "A venda ao cliente final: entrega, trocas, devoluções, garantia e atendimento, seguindo o Código de Defesa do Consumidor.",
    "Notas fiscais, impostos e licenças do negócio.",
    "O conteúdo publicado na loja (fotos, textos, marcas), com direito de usá-lo.",
    "Os dados dos clientes da loja, usados só para a venda e conforme a Lei Geral de Proteção de Dados.",
  ] },
  { titulo: "7. O que não é permitido", paragrafos: [
    "Vender produtos ilegais, falsificados, pirateados ou que violem direitos de outras pessoas; publicar conteúdo enganoso; enviar mensagens em massa sem autorização; tentar burlar a segurança da plataforma; ou revender a plataforma sem autorização.",
    "Nesses casos a NextLevel pode retirar o conteúdo ou suspender a loja, informando o motivo pelo e-mail ou pelo painel.",
  ] },
  { titulo: "8. O que é responsabilidade da NextLevel", itens: [
    "Manter a plataforma funcionando, segura e atualizada, com cópias de segurança dos dados.",
    "Dar suporte pelos canais de atendimento informados no site e no painel.",
    "Avisar no painel quando houver manutenção programada.",
  ], paragrafos: [
    "A plataforma pode ter interrupções por manutenção ou por falhas de serviços de terceiros (hospedagem, meios de pagamento, Correios e transportadoras). A NextLevel trabalha para resolver o quanto antes, mas não responde por vendas que deixaram de acontecer nesses casos.",
    "Simulações, relatórios e recomendações da plataforma são informativos: não são promessa de vendas, faturamento ou lucro.",
  ] },
  { titulo: "9. Dados pessoais (LGPD)", paragrafos: [
    "A NextLevel cuida dos dados da conta do LOJISTA conforme a Política de Privacidade. Nos pedidos da loja, o LOJISTA é o responsável pelos dados dos clientes dele, e a NextLevel trata esses dados só em nome da loja, para a venda funcionar.",
  ] },
  { titulo: "10. Marcas e conteúdo", paragrafos: [
    "A plataforma, os temas, o código e a marca NextLevel pertencem à NextLevel. O conteúdo da loja e o domínio próprio pertencem ao LOJISTA, que autoriza a NextLevel a exibir esse conteúdo para a loja funcionar.",
  ] },
  { titulo: "11. Cancelamento", resumo: "Em resumo: você cancela quando quiser, pelo painel, sem multa.", paragrafos: [
    "O LOJISTA pode cancelar a qualquer momento pelo painel ou pelo atendimento, sem multa. O acesso continua até o fim do período já pago; o que já foi pago segue as condições mostradas na contratação e a lei.",
    "Depois do cancelamento ou do fim do acesso, a loja sai do ar. Os dados ficam guardados por um período para reativação e depois podem ser apagados, menos o que a lei manda guardar.",
  ] },
  { titulo: "12. Mudanças nestes termos", paragrafos: [
    "Quando estes termos mudarem, a nova versão aparece no painel com a data, e o LOJISTA aceita de novo para continuar usando a plataforma.",
  ] },
  { titulo: "13. Comunicação e aceite eletrônico", paragrafos: [
    "As comunicações são feitas pelo e-mail do cadastro e pelo painel.",
    "O LOJISTA aceita estes termos no painel, com o próprio login, marcando \"Li e concordo\" e apertando \"Aceitar e continuar\". O sistema registra a data, a hora, o endereço de rede, o aparelho e a impressão digital do texto aceito. As partes reconhecem esse aceite como válido, com o mesmo efeito da assinatura.",
  ] },
  { titulo: "14. Lei e foro", paragrafos: [
    "Estes termos seguem a lei brasileira. Fica eleito o foro da comarca de São Paulo/SP, ressalvado o direito do consumidor de usar o foro do próprio domicílio.",
  ] },
];

/** Impressão digital da versão atual (versão + título + texto). */
export const HASH_TERMOS = impressaoDigital({ versao: VERSAO_TERMOS, titulo: TITULO_TERMOS }, SECOES_TERMOS);
