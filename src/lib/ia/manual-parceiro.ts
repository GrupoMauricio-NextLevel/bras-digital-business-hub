import type { Guia } from "./manual";

/**
 * Manual do parceiro (D253): o Maurício no painel do parceiro da E-commerce guia o dia a dia sem IA (offline), com o
 * passo a passo de cada tela, rotinas, roteiros de venda, respostas a objeções e as regras que protegem a comissão.
 * Os números editáveis pelo Master (valor mínimo do saque, dias de atribuição) não ficam aqui: o guia diz onde vê-los.
 * Nada aqui promete ganho.
 */
export const GUIAS_PARCEIRO: Guia[] = [
  // ---------------- Rotina ----------------
  { id: "rotina", titulo: "Sua rotina de 20 minutos por dia", termos: ["rotina", "dia a dia", "todo dia", "hoje", "o que fazer hoje", "o que eu faco hoje", "faco hoje", "comecar o dia", "organizar", "por onde comeco", "agenda", "habito"], passos: [
    "Abra o Início e leia o \"Precisa de você agora\": teste terminando, quem escolheu o plano e não pagou, plano vencido. Resolva esses primeiro, porque é dinheiro quase certo.",
    "Responda os contatos parados no CRM de clientes (quem você falou ontem e não respondeu).",
    "Publique ou envie uma divulgação nova: um story, um status no WhatsApp ou uma mensagem para 5 lojistas da sua lista.",
    "Confira em Links quais canais trouxeram cliques; repita o que funcionou.",
    "Uma vez por semana: Financeiro (saldo disponível e saque) e Indicados (quem está em teste, quem pagou).",
  ], link: { rotulo: "Abrir o Início", href: "/partner" } },
  { id: "primeira-semana", titulo: "Primeira semana: do cadastro à 1ª venda", termos: ["comecando", "novo parceiro", "primeira venda", "primeira semana", "acabei de entrar", "primeiros passos", "nao sei como comecar"], passos: [
    "Dia 1: cadastre a chave Pix em Meu perfil (o saque vai sempre para o seu CPF ou CNPJ).",
    "Dia 1: copie o seu link no Início e crie um cupom de 7 dias com um código fácil (ex.: SEUNOME7).",
    "Dia 2: liste 20 lojistas que você conhece (clientes, amigos, quem vende no Instagram ou no Brás) e anote no CRM de clientes.",
    "Dias 2 a 4: mande a mensagem pronta do WhatsApp para 5 por dia e ofereça ajuda para montar a loja.",
    "Dia 5: ligue para quem respondeu, mostre a loja de demonstração e o comparativo de preços.",
    "Dias 6 e 7: acompanhe quem começou o teste e ajude a publicar o primeiro produto. Loja com produto publicado converte muito mais.",
  ] },
  { id: "inicio", titulo: "Entender o Início do painel", termos: ["inicio", "painel", "tela inicial", "o que significa", "pulso", "precisa de voce", "resumo"], passos: [
    "No topo ficam o seu link, o botão de copiar e o de enviar no WhatsApp.",
    "\"Precisa de você agora\" lista os indicados que pedem uma ação sua, do mais urgente ao menos urgente.",
    "Os números mostram indicados, quem está em teste, quem paga e o que você tem a receber.",
    "Quando a NextLevel lança um desafio do mês ou manda um aviso, eles aparecem em cima do Início.",
    "Agência ainda não aprovada vê ali o pedido do selo de agência parceira.",
  ], link: { rotulo: "Abrir o Início", href: "/partner" } },

  // ---------------- Divulgação ----------------
  { id: "link", titulo: "Pegar e compartilhar o seu link", termos: ["link", "meu link", "copiar link", "compartilhar", "divulgar", "enviar link", "url"], passos: [
    "Início → Copiar link (ou Enviar no WhatsApp, que já vai com o texto pronto).",
    "Quem se cadastra pelo seu link fica ligado a você pelos dias de atribuição mostrados em Links.",
    "Depois que a loja é criada com o seu link ou cupom, ela fica ligada a você para sempre: a recorrência continua enquanto o cliente pagar.",
    "Ponha o link na bio do Instagram, no status do WhatsApp e no fim dos seus vídeos.",
  ], link: { rotulo: "Abrir Links", href: "/partner/links" } },
  { id: "link-campanha", titulo: "Um link por canal (Instagram, WhatsApp, YouTube)", termos: ["campanha", "canal", "varios links", "rastrear", "qual canal", "medir", "cliques", "utm"], passos: [
    "Links → Criar link por campanha.",
    "Dê um nome por canal (ex.: Instagram bio, Grupo do Brás, YouTube) e, se quiser, escolha o plano que o link já sugere.",
    "Use cada link só no seu canal. Em Seus links você vê os cliques de cada um.",
    "A cada 15 dias, corte o canal que não traz cliques e reforce o que traz.",
  ], link: { rotulo: "Criar link", href: "/partner/links" } },
  { id: "qrcode", titulo: "QR code e cartão para indicar pessoalmente", termos: ["qr", "qrcode", "qr code", "cartao", "impresso", "pessoalmente", "loja fisica", "balcao", "imprimir"], passos: [
    "Links → QR code do link principal: baixe a imagem.",
    "Imprima num cartão ou adesivo com a frase \"Sua loja virtual com taxa zero da plataforma\" e o seu cupom.",
    "Na visita, peça para o lojista apontar a câmera ali mesmo e criar a conta na sua frente: a loja já nasce ligada a você.",
  ], link: { rotulo: "Abrir Links", href: "/partner/links" } },
  { id: "cupom", titulo: "Criar cupom de 7 dias", termos: ["cupom", "codigo", "7 dias", "teste gratis", "desconto", "criar cupom"], passos: [
    "Cupons de 7 dias → crie um código curto e fácil de falar (ex.: ANA7, BRAS7).",
    "Copie o link com cupom e mande junto com a mensagem.",
    "O cupom vale mais que o link: quem entra com ele fica ligado a você mesmo que tenha clicado no link de outra pessoa antes.",
    "Use o cupom em vídeo e em conversa falada, onde ninguém clica em link.",
  ], link: { rotulo: "Abrir Cupons", href: "/partner/coupons" } },
  { id: "whatsapp", titulo: "Mensagem pronta para o WhatsApp", termos: ["mensagem", "whatsapp", "texto pronto", "o que falar", "abordagem", "script", "roteiro", "primeira mensagem"], passos: [
    "Use o botão Enviar no WhatsApp do Início: o texto já vai com o seu link.",
    "Personalize a primeira linha com o nome da pessoa e o que ela vende (ex.: \"Oi, Carla, vi as suas peças de moda praia\").",
    "Um modelo que funciona: \"Estou indicando uma loja virtual com taxa zero da plataforma nas vendas pelo Mercado Pago. Dá para testar sem cartão. Quer que eu te mostre em 5 minutos?\"",
    "Não mande para quem não conhece você e não use listas compradas: isso é spam e queima o seu número.",
    "Quem respondeu entra no CRM de clientes na hora, com a próxima conversa marcada.",
  ] },
  { id: "criador", titulo: "Plano de conteúdo para criadores (4 semanas)", termos: ["criador", "influenciador", "conteudo", "plano de conteudo", "post", "story", "reels", "video", "tiktok", "instagram", "audiencia", "seguidores"], passos: [
    "Semana 1: conte a sua história. \"Como eu abriria uma loja virtual hoje gastando pouco\" + cupom.",
    "Semana 2: tutorial curto. Mostre a loja de demonstração e um produto sendo cadastrado em 1 minuto.",
    "Semana 3: comparativo honesto do custo total (mensalidade + taxa) com o link da página Comparativo. Sem prometer que a pessoa vai vender.",
    "Semana 4: prova e chamada. Mostre um seguidor que montou a loja (com autorização) e repita o cupom.",
    "Sempre: link na bio, cupom falado no vídeo e um link de campanha por rede, para saber de onde veio cada cliente.",
    "Use a hashtag #publi quando for conteúdo de parceria.",
  ] },
  { id: "vendedor", titulo: "Rota de visitas no Brás (vendedor)", termos: ["vendedor", "representante", "visita", "rota", "bras", "porta em porta", "lojista fisico", "rua", "presencial"], passos: [
    "Monte a rota de 10 lojas por manhã, na mesma rua ou galeria. A manhã é o melhor horário: depois das 11h o movimento aumenta.",
    "Abordagem em 3 frases: quem você é, a dor (\"vender no Instagram sem perder pedido\") e a oferta (taxa zero da plataforma e teste grátis).",
    "Mostre a loja de demonstração no celular e o pedido de atacado (grade e peça avulsa no mesmo produto).",
    "Quem topar: crie a conta na hora pelo QR code ou com o seu cupom.",
    "Anote cada visita no CRM de clientes, com a próxima ação (ex.: voltar quinta para cadastrar os produtos).",
  ] },
  { id: "agencia-clientes", titulo: "Levar os clientes da sua agência", termos: ["agencia", "meus clientes", "carteira", "marcas que atendo", "social media", "consultoria", "levar clientes"], passos: [
    "Separe os clientes por momento: quem ainda não tem loja, quem paga taxa sobre venda em outra plataforma e quem está insatisfeito.",
    "Para quem paga taxa: monte a conta do custo total (mensalidade + taxa) com a página Comparativo. É o argumento mais forte.",
    "Ofereça a implantação como serviço seu (você cobra do cliente) e a migração pela NextLevel quando ele precisar.",
    "Crie a conta de cada cliente com o seu link ou cupom: cada um soma para o seu nível (24% com 10 clientes ativos, 28% com 25), sobre toda a carteira.",
    "Peça o selo de agência parceira no Início, se ainda não tem.",
  ] },

  // ---------------- Venda ----------------
  { id: "argumentos", titulo: "Argumentos que convencem o lojista", termos: ["argumento", "vantagem", "por que", "convencer", "diferencial", "beneficio", "vender a plataforma", "pitch"], passos: [
    "Taxa zero da plataforma: com o checkout do Mercado Pago, a NextLevel não cobra sobre as vendas; o lojista paga só a mensalidade (as taxas do Mercado Pago são do Mercado Pago).",
    "Custo total mais vantajoso: mostre a página Comparativo, que tem data e fonte de cada concorrente.",
    "Feita para o atacado: grade fechada e peça avulsa no mesmo produto, preço por quantidade, pedido mínimo e pedido do balcão.",
    "Loja pronta rápido: tema grátis já com banners e páginas, e o lojista só troca as fotos.",
    "Sem fidelidade e com teste: menos risco para quem está em dúvida.",
    "Equipe no Brás: suporte perto de quem vende.",
  ], link: { rotulo: "Ver o comparativo", href: "/comparativo" } },
  { id: "objecoes", titulo: "Responder as objeções mais comuns", termos: ["objecao", "objecoes", "caro", "esta caro", "respondo", "o que eu respondo", "o lojista disse", "nao tenho tempo", "ja tenho loja", "nao confio", "vou pensar", "desculpa", "resistencia", "duvida do cliente", "nao quer"], passos: [
    "\"Está caro\": compare o custo total. Em outra plataforma, a taxa sobre cada venda cresce junto com a loja; aqui é só a mensalidade.",
    "\"Não tenho tempo\": a loja nasce pronta no tema grátis, e dá para importar os produtos por planilha.",
    "\"Já tenho loja em outra plataforma\": a migração traz os produtos e mantém os endereços antigos para não perder o Google.",
    "\"Vendo só no Instagram\": os pedidos do Instagram e do WhatsApp entram no mesmo painel, com link de pagamento.",
    "\"Vou pensar\": marque a próxima conversa no CRM e mande o link do teste grátis. Quem testa decide com a loja na mão.",
    "Nunca prometa faturamento nem resultado: prometa só o que a plataforma faz.",
  ] },
  { id: "plano-certo", titulo: "Ajudar o lojista a escolher o plano", termos: ["qual plano", "plano ideal", "start", "pro", "scale", "escolher plano", "diferenca dos planos", "limite"], passos: [
    "Abra a página Planos com o lojista: a tabela mostra produtos, pessoas na equipe, IA e suporte de cada plano.",
    "Quem está começando: Start. Quem já vende e tem equipe: Pro. Operação grande e muitos produtos: Scale.",
    "No anual, o lojista economiza, e você recebe a comissão do anual de uma vez (equivalente ao mensal do ano).",
    "Na dúvida, comece no Start: dá para mudar de plano depois, sem perder nada.",
  ], link: { rotulo: "Ver os planos", href: "/planos" } },
  { id: "atacado", titulo: "Vender para quem trabalha com atacado", termos: ["atacado", "grade", "pacote", "pedido minimo", "revenda", "sacoleira", "lojista do bras", "quantidade"], passos: [
    "Pergunte como ele vende hoje: grade fechada, pacote, peça avulsa ou mistura.",
    "Mostre que o mesmo produto vende a grade e a peça avulsa, com preço por quantidade e pedido mínimo da loja.",
    "Mostre a proposta pelo WhatsApp e o pedido do balcão: as regras de atacado valem em tudo.",
    "Sacoleira e excursão: o pedido sai pronto para separar, sem anotar no caderno.",
  ] },
  { id: "migracao", titulo: "Lojista que vem de outra plataforma", termos: ["migrar", "migracao", "trocar de plataforma", "nuvemshop", "shopify", "tray", "wbuy", "loja integrada", "sair"], passos: [
    "Peça a planilha de produtos da plataforma antiga: dá para importar em Produtos → Importar.",
    "Os endereços antigos podem ser cadastrados, para quem chega pelo Google cair no produto novo.",
    "Se ele preferir, a equipe NextLevel faz a migração (no catálogo comercial você vê o serviço e a sua comissão).",
    "Combine a troca para um dia de pouco movimento e mantenha a loja antiga até a nova estar publicada.",
  ], link: { rotulo: "Ver o catálogo comercial", href: "/partner/catalogo" } },
  { id: "demo", titulo: "Mostrar a loja funcionando", termos: ["demonstracao", "demo", "mostrar", "exemplo", "loja exemplo", "como fica", "apresentar"], passos: [
    "Abra a página Temas no celular e mostre um tema do segmento do lojista.",
    "Mostre o checkout com Pix e cartão e o cálculo do frete por CEP.",
    "Mostre o painel: pedidos, produtos e o \"Precisa de você agora\" do lojista.",
    "Termine com o cupom: \"cria agora, sem cartão, e eu te ajudo a colocar os 5 primeiros produtos\".",
  ], link: { rotulo: "Ver os temas", href: "/temas" } },

  // ---------------- CRM ----------------
  { id: "crm", titulo: "Organizar seus contatos no CRM", termos: ["crm", "contato", "lead", "lista", "organizar contatos", "etapa", "funil", "acompanhar contatos", "anotar"], passos: [
    "CRM de clientes → cadastre nome, e-mail, WhatsApp e empresa de cada lojista que você abordou.",
    "Mova pela etapa: novo, diagnóstico agendado, diagnóstico entregue, proposta enviada, negociação, ganho, perdido, implantação ou reativação.",
    "Contato registrado no seu CRM fica ligado a você quando ele comprar, mesmo sem clicar no link.",
    "Revise o CRM toda manhã: quem está há mais de 3 dias sem conversa precisa de um toque.",
  ], link: { rotulo: "Abrir o CRM", href: "/partner/crm" } },
  { id: "diagnostico", titulo: "Fazer o diagnóstico do lojista", termos: ["diagnostico", "maturidade", "perguntas", "avaliar lojista", "nota", "recomendacao"], passos: [
    "No CRM, abra o contato e responda o diagnóstico com o lojista (perguntas padronizadas).",
    "O sistema gera a nota de maturidade e as recomendações do catálogo, válidas por 30 dias.",
    "Use as recomendações para oferecer o plano e os serviços certos, sem empurrar o que ele não precisa.",
  ], link: { rotulo: "Abrir o CRM", href: "/partner/crm" } },
  { id: "proposta", titulo: "Pedir proposta de serviço (Soluções)", termos: ["proposta", "orcamento", "servico", "solucoes", "implantacao", "loja pronta", "projeto"], passos: [
    "No CRM, abra o contato e peça a proposta escolhendo o produto do catálogo.",
    "A NextLevel monta a proposta com escopo, prazo e valores, e a venda fica atribuída a você.",
    "Acompanhe a etapa \"proposta enviada\" e combine com o lojista o dia da resposta.",
  ], link: { rotulo: "Abrir o CRM", href: "/partner/crm" } },
  { id: "catalogo", titulo: "Vender o catálogo comercial (temas e serviços)", termos: ["catalogo", "tema pago", "servico", "produto nextlevel", "comissao do servico", "desconto permitido", "vender tema"], passos: [
    "Catálogo comercial mostra o que a NextLevel liberou para você vender: preço público, desconto permitido, a sua comissão e o benefício ao cliente.",
    "Copie o link rastreável do item e mande para o lojista certo (ex.: tema do segmento dele).",
    "Valores e regras são do Master e podem mudar: confira sempre antes de passar preço.",
  ], link: { rotulo: "Abrir o catálogo", href: "/partner/catalogo" } },

  // ---------------- Acompanhamento ----------------
  { id: "indicados", titulo: "Acompanhar os indicados e converter o teste", termos: ["indicados", "minhas lojas", "quem entrou", "teste", "converter", "status", "situacao", "acompanhar"], passos: [
    "Indicados mostra cada loja ligada a você (o nome aparece em parte, por privacidade) e a situação: em teste, pagante, atrasada ou cancelada.",
    "Em teste: ajude a publicar o primeiro produto e a conectar o Mercado Pago. Loja publicada converte muito mais.",
    "Escolheu o plano e não pagou: um lembrete seu no WhatsApp costuma resolver.",
    "A comissão começa no 1º pagamento: o teste grátis não conta.",
  ], link: { rotulo: "Abrir Indicados", href: "/partner/referrals" } },
  { id: "teste-acabando", titulo: "Teste acabando: o que fazer", termos: ["teste acabando", "teste termina", "teste do meu indicado", "indicado acabando", "acabando", "terminando", "vencendo", "ultimo dia", "nao pagou", "lembrete", "urgente"], passos: [
    "O Início avisa quando o teste de um indicado termina em até 3 dias.",
    "Ligue ou mande áudio: pergunte o que falta para a loja ficar pronta e se ele precisa de ajuda com o plano.",
    "Mostre o anual (mais vantajoso para ele) e lembre que não tem fidelidade.",
    "Se ele não for continuar agora, marque a reativação no CRM para 30 dias.",
  ] },
  { id: "reter", titulo: "Manter o cliente pagando (sua recorrência)", termos: ["reter", "retencao", "cancelar", "cancelamento", "cliente saiu", "recorrencia", "manter cliente", "vencido"], passos: [
    "A sua renda mensal depende de o cliente continuar: cliente que cancela para de gerar recorrência.",
    "Uma vez por mês, pergunte aos seus clientes como estão as vendas e mostre um recurso novo.",
    "Plano vencido aparece no Início: avise o cliente no mesmo dia.",
    "Cliente com dificuldade técnica: indique o suporte da NextLevel no painel dele (botão Chamar a equipe).",
  ] },

  // ---------------- Ganhos ----------------
  { id: "comissao", titulo: "Como a comissão é calculada", termos: ["bonus", "black", "campanha", "comissao", "quanto ganho", "porcentagem", "percentual", "calculo", "valor", "ganho", "primeira mensalidade", "recorrente"], passos: [
    "Você ganha a porcentagem do seu nível sobre TODA mensalidade paga, desde a 1ª, enquanto o cliente ficar.",
    "Cadastro com CNPJ (parceiro): até 9 clientes ativos 20%, com 10 24%, com 25 28%. Cadastro com CPF (Programa de Indicações): 15%, 19% e 23%. O percentual vale para a carteira inteira.",
    "Saque por Pix, sem anexar nota fiscal.",
    "No plano anual, você recebe a porcentagem sobre o valor pago no ano, de uma vez.",
    "Não tem bônus avulso nem campanha que muda a conta: o extrato mostra cada lançamento.",
    "A base é o valor pago pelo cliente, descontados os impostos e as taxas de pagamento, conforme a regra do programa. O extrato mostra cada lançamento.",
  ], link: { rotulo: "Abrir o Financeiro", href: "/partner/finance" } },
  { id: "niveis", titulo: "Subir de nível (20%, 24% e 28%)", termos: ["nivel", "niveis", "prata", "ouro", "diamante", "subir", "subo", "elite", "aumentar comissao", "escada"], passos: [
    "O nível conta os seus clientes pagantes ativos: até 9 = Inicial, 10 = Prata, 25 = Ouro. Com CNPJ: 20%, 24% e 28%. Pelo CPF: 15%, 19% e 23%. O percentual vale para toda a carteira.",
    "Sobe na hora, na próxima venda que atingir o mínimo.",
    "Só desce depois de 2 meses seguidos abaixo do mínimo, então uma oscilação não tira o seu nível.",
    "O jeito mais rápido de subir: converter os testes e não deixar cliente cancelar.",
  ] },
  { id: "desafio", titulo: "Desafio do mês e avisos", termos: ["desafio", "meta", "aviso", "recado", "campanha do mes", "ranking"], passos: [
    "Quando houver desafio, ele aparece no Início com a barra de progresso (ex.: 3 lojas novas no mês).",
    "Conta cada loja nova que pagou a 1ª mensalidade no mês.",
    "Bateu a meta: você ganha destaque no ranking do mês. O desafio é reconhecimento, não muda a comissão.",
    "Os avisos da NextLevel também aparecem no Início, por 45 dias.",
  ], link: { rotulo: "Abrir o Início", href: "/partner" } },
  { id: "saque", titulo: "Sacar por Pix", termos: ["saque", "sacar", "saco", "dinheiro", "meu dinheiro", "receber", "recebo", "pix", "receber dinheiro", "retirar", "pagamento", "quando recebo", "transferencia"], passos: [
    "Financeiro → Solicitar saque. Você vê o saldo em garantia, o disponível e o já recebido.",
    "Só o saldo disponível pode ser sacado, a partir do valor mínimo mostrado na tela.",
    "O Pix vai para a chave cadastrada em Meu perfil, sempre do mesmo CPF ou CNPJ do cadastro.",
    "A equipe NextLevel paga e o pedido aparece no Histórico de saques.",
  ], link: { rotulo: "Abrir o Financeiro", href: "/partner/finance" } },
  { id: "garantia", titulo: "Garantia, estorno e saldo negativo", termos: ["garantia", "em garantia", "estorno", "chargeback", "saldo negativo", "devolucao", "bloqueado", "quando libera"], passos: [
    "Cada comissão fica 30 dias em garantia antes de ficar disponível. Isso cobre estornos e cancelamentos do cliente.",
    "Se o cliente pedir estorno durante a garantia, a comissão é anulada.",
    "Se já estava disponível ou sacada, entra um débito igual no seu saldo, que é compensado nas próximas comissões.",
  ], link: { rotulo: "Abrir o Financeiro", href: "/partner/finance" } },

  // ---------------- Regras ----------------
  { id: "atribuicao", titulo: "Quando a loja fica ligada a você", termos: ["atribuicao", "ligada", "credito", "outro parceiro", "quem indicou", "cookie", "perdi a indicacao", "nao apareceu"], passos: [
    "Pelo link: quem se cadastra dentro dos dias de atribuição (mostrados em Links) fica com você.",
    "Pelo cupom: o cupom vale mais que qualquer link.",
    "Pelo CRM: contato que você registrou fica com você quando comprar.",
    "Depois de criada, a loja não muda de parceiro.",
    "Indicação não apareceu? Confira se a pessoa usou o seu link ou cupom; se usou, fale com a equipe com o e-mail da loja.",
  ] },
  { id: "regras", titulo: "O que não pode (para não perder comissão)", termos: ["regra", "proibido", "nao pode", "spam", "autoindicacao", "fraude", "perder comissao", "termos", "suspenso"], passos: [
    "Indicar a si mesmo (mesmo CPF, CNPJ ou e-mail) não gera comissão e vai para revisão.",
    "Não use a marca NextLevel como se fosse a empresa (perfil, anúncio ou domínio com o nosso nome).",
    "Não prometa faturamento, prazo ou desconto que não estão no site.",
    "Não mande spam nem use listas compradas.",
    "Repetir essas práticas leva à suspensão do cadastro. Os termos completos estão na página do programa.",
  ], link: { rotulo: "Ler os termos", href: "/parceiros/termos" } },
  { id: "inativo", titulo: "Cadastro inativo: como evitar e voltar", termos: ["inativo", "inatividade", "desativado", "pausado", "reativar", "6 meses"], passos: [
    "Na E-commerce não tem meta mensal nem taxa de manutenção.",
    "O cadastro só fica inativo depois de 6 meses sem nenhum cliente ativo e sem nenhuma venda.",
    "Enquanto você tem cliente pagando, continua ativo e recebendo.",
    "Ficou inativo? A tela de reativação aparece no painel.",
  ] },
  { id: "agencia-selo", titulo: "Virar agência parceira", termos: ["virar agencia", "selo", "selo de agencia", "agencia parceira", "aprovacao", "mudar tipo"], passos: [
    "Início → pedido de agência: informe o site ou Instagram da agência e quantos clientes atende.",
    "A equipe avalia em até 2 dias úteis.",
    "Aprovado, você ganha o selo de agência parceira e os benefícios exclusivos para agências, que a equipe apresenta. Agência é só com CNPJ.",
  ], link: { rotulo: "Abrir o Início", href: "/partner" } },
  { id: "perfil", titulo: "Atualizar dados e chave Pix", termos: ["perfil", "dados", "telefone", "chave pix", "nome", "alterar", "atualizar"], passos: [
    "Meu perfil → atualize o nome que aparece, o WhatsApp e a chave Pix.",
    "A chave Pix precisa ser do mesmo CPF ou CNPJ do cadastro.",
  ], link: { rotulo: "Abrir Meu perfil", href: "/partner/profile" } },
];
