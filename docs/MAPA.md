# Mapa do que falta implementar

Tamanho relativo: **P** pequeno, **M** médio, **G** grande. Não são prazos.

## Onde estamos (feito)
Rodada visual concluída (ver `docs/design/DECISIONS.md`, D10): portal público, home Lite, análise e prévia em 3 larguras no Pro, Loja NextLevel com pedido de serviço, recomendações e conversa nos painéis.


Painéis Master (torre de controle), Fornecedor (esteira ao vivo, corte, ondas), Expedição (sem valores), Membro; carteira com recarga Pix; etiqueta em PDF; cobrança da NextLevel por Pix e add-ons (simulado); racional de preços e planos (documentos); site real em `app.superdrop.com.br` com domínio conectado; vitrine de demonstração (Mega Tron / MRS Sports), página `/f/megatron`, pós-venda e etiquetas do membro.

## Bloco A: ações suas (sem código)
| # | Ação | Por que importa |
|---|---|---|
| 1 | Trocar o Render para o plano Starter (US$ 7) | O Free hiberna; portal público precisa estar sempre no ar |
| 2 | Agendar os 2 crons no cron-job.org | Expirar reservas (10 min) e fechamento financeiro (diário) |
| 3 | Conectar o Mercado Pago (token de teste, depois produção): NextLevel, cada fornecedor e cada membro | Pix real de faturas, recargas e vendas |
| 4 | Criar MantosShop e Alpha Outfit no Master | Contas reais dos dois fornecedores |
| 5 | Publicar o serviço de demonstração no Render | Mostrar o sistema sem tocar na produção |
| 6 | E-mail transacional: escolher provedor e configurar SPF/DKIM no domínio | Convite, fim do teste, recibo, recuperar senha |
| 7 | Jurídico e contábil: termos, privacidade, aceite de compartilhamento de dados, contrato dos fundadores e fornecedores, direito de arrependimento, empresa emissora por fatura | Operar dentro da lei |
| 8 | Conteúdo dos 2 fornecedores: logo, cores, textos, WhatsApp, depoimentos, fotos reais com direito de uso | Páginas de vendas |
| 9 | Gravar o módulo 1 da Academy e o roteiro dos módulos bloqueados | O teste de 7 dias precisa impressionar |
| 10 | Responder as decisões pendentes (abaixo) | Destravam as tarefas de taxa e planos |

**Decisões já respondidas (ver `docs/PLANOS.md`, item 0):** taxa do Drop manual 5%, estorno devolve a taxa, base sem frete, testes sem taxa, fornecedores sem taxa por 15 dias, sem desconto por ciclo nos planos (só nos serviços), Pix é o preço de lista, setups e mensalidades dos fornecedores.

**Decisões ainda pendentes:** (a) taxa por pedido do Drop manual (proposta 5%); (b) base sem frete; (c) estorno devolve a taxa; (d) taxa cobrada no fechamento mensal; (e) pedidos de teste sem taxa; (f) percentual do desconto à vista no Pix; (g) desconto de 15% (semestral) e 25% (anual) também nos planos; (h) R$ 2.400 da Loja Própria como setup com 12 meses de plataforma de lançamento; (i) setup e mensalidades dos fornecedores; (j) prazo da comissão dos fundadores; (k) benefícios do lançamento.

## Bloco B: desenvolvimento

### P1: rodar o teste com os 2 fornecedores (prioridade máxima)
| # | Item | Tam. | Depende de |
|---|---|---|---|
| 1 | Checkout das lojas e recargas somente Pix (excluir cartão no Mercado Pago) | P | nada |
| 2 | Taxa por pedido (2%/3%/5%): tabela, registro por pedido e por parte, fechamento mensal para fornecedor e membro, estorno devolve | G | decisões a a e |
| 3 | Planos: mensal/semestral/anual, setup separado, Pix ou cartão (1x cheio, 2 a 6x ×1,14), desconto à vista, lançamento de 12 meses, descontos de serviços | G | decisões f a k, Mercado Pago |
| 4 | Cupom + teste de 7 dias sem cartão + atribuição ao fornecedor + 1 por CPF/CNPJ + prorrogação + conta simulada fora das taxas | G | nada |
| 5 | Cadastro público com escolha de plano e checkout | M | 3 e 4 |
| 6 | E-mail transacional + recuperar senha | M | A6 |
| 7 | Cobrança automática do membro e corte de acesso (carência, limitado, suspenso, encerrado) | M | 3 e 6 |
| 8 | Comissão dos fundadores (25% do setup + 20% da mensalidade, com data final) e extrato | M | decisão j |
| 9 | Portal `superdrop.com.br` (home, como funciona, planos, para fornecedores, white label, parceiros, FAQ, contato, termos, privacidade) + roteamento por endereço | G | A7, A8 |
| 10 | Páginas de MantosShop e Alpha Outfit com conteúdo real + editor simples | M | A8 |
| 11 | Academy: estrutura, módulo 1 completo, bloqueados com prévia, compra à parte | M | A9 |
| 12 | Termos e aceite versionado no cadastro | P | A7 |

### U3: membro Lite
Fluxo em uma tela (recarregar, escolher, enviar, anexar etiqueta) M · assistente de conexão do Mercado Pago da loja com teste M · horário de corte visível ao membro P · upgrades com o ponto de equilíbrio (R$ 7.000 de vendas por mês) P.

### U4: membro Pro
Análise de vendas e margem G · editor da loja em 3 larguras G · templates premium M · domínio próprio com assistente de DNS e roteamento por endereço G · equipe M · relatórios exportáveis M.

### U5: Loja NextLevel e Academy de impacto
Vitrine por painel com recomendações M · compra paga de serviços (fatura + Pix) M · Academy completa G · ofertas periódicas M.

### U6: chat de pós-venda da NextLevel
Conversas com SLA, contexto do pedido, respostas prontas e avaliação G.

### U7: controle e automação
Motor de regras, fila de trabalho do dia, saúde persistida, receita em tempo real, indicação de membros G.

### U8: endurecimento e entrega
Acessibilidade, desempenho, E2E por papel, backups e monitoramento, documentação M.

### P4: assinante independente e Mega Tron
Custódia e repasse aos fornecedores, catálogo com vários fornecedores, carrinho dividido, alinhamento fiscal G (depende do jurídico e do contábil).

### Infra e evolução técnica
Lojas em `nome.superdrop.com.br` (DNS curinga + `SUPERDROP_ROOT_DOMAIN`) P · taxa automática por split (Mercado Pago OAuth) G · cartão recorrente G · etiquetas e fotos em R2/S3 fora do banco M · backups do Neon e monitoramento de erros M · variação por cor e outras categorias quando sair de camisetas M.

## Caminho mais curto para o teste de 15 dias
1. **Você:** A1 a A4, A6, A8 e A9; responder as decisões.
2. **Eu, nesta ordem:** P1-1 (Pix), P1-4 (cupom e teste), P1-2 (taxa), P1-3 versão mínima (Pix mensal/semestral/anual), P1-6 (e-mail), P1-9 enxuto, P1-10, P1-11 (módulo 1), P1-12.
3. **Pode ficar para depois do teste:** cartão parcelado, comissão automática (manual por 15 dias), editor da página, corte de acesso automático completo, e tudo de U3 a U8 e P4.
