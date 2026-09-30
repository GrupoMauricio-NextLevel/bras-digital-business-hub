# Prompt de pesquisa para o GPT: integração máxima da NextLevel Commerce com o TikTok Shop

> **Uso:** cole o bloco da seção 1 num chat do GPT (de preferência com navegação na web ligada, para consultar a documentação oficial). Peça a resposta em partes se ficar longa ("continue na seção C"). Traga a resposta de volta para cá: ela vira o racional e o prompt de desenvolvimento do módulo (`docs/prompts/tiktok-shop-integracao.md`, a criar depois).
>
> **Cuidados:** o GPT pode estar desatualizado sobre o TikTok Shop (o programa muda rápido e varia por país). O prompt obriga a citar a documentação oficial com link e data e a marcar o que não foi confirmado. **Confirme você mesmo no Partner Center** antes de qualquer decisão de investimento.
>
> **Objetivo do dono:** beneficiar os lojistas clientes da plataforma de lojas virtuais, ligando a loja de cada lojista ao ecossistema do TikTok Shop (produtos, pedidos, criadores/influenciadores, vídeos e lives). O primeiro passo é um **teste controlado** com poucos lojistas.

## 1. O PROMPT (copie tudo o que está no bloco)

```
PAPEL
Você é arquiteto de integrações de e-commerce e especialista no ecossistema TikTok Shop (Seller Center, Partner Center, TikTok Shop Open Platform, programa de afiliados/criadores). Vou lhe passar o contexto técnico e de negócio do meu sistema. Sua tarefa é pesquisar a documentação OFICIAL e entregar o racional do NÍVEL MÁXIMO de integração que consigo alcançar, com foco em beneficiar meus lojistas clientes. Responda em português do Brasil, sem jargão desnecessário, com rigor técnico.

REGRAS DE PESQUISA (obrigatórias)
1. Use apenas fontes oficiais como base (TikTok Shop Partner Center / Open Platform, documentação de API, políticas de vendedor, central de ajuda do TikTok Shop Brasil). Cite CADA afirmação relevante com: link, título da página e data em que você consultou.
2. Marque cada item com CONFIANÇA: ALTA (documentação oficial clara e atual), MÉDIA (documentação incompleta ou inferida) ou BAIXA (relatos, blogs, memória). Não misture as três.
3. No fim de cada seção, liste "NÃO CONSEGUI CONFIRMAR" com o que eu preciso verificar no Partner Center ou perguntar ao suporte/gerente de conta.
4. Se algo depender do país, diga explicitamente o estado no BRASIL (disponibilidade, categorias liberadas, logística, pagamentos, notas fiscais). Não presuma que o que vale nos EUA/Sudeste Asiático vale aqui.
5. Não invente nomes de endpoints, escopos, limites ou taxas. Se não achar, diga "não encontrei".

CONTEXTO DO MEU SISTEMA (fatos, não hipóteses)
Empresa: NextLevel Marketing Ltda. Produto: NextLevel Commerce, plataforma de lojas virtuais para lojistas do Brás e do Brasil (moda, atacado e varejo). Mesmo motor atende outras marcas (SuperDrop = dropshipping com fornecedores; Brás Digital = futuro marketplace atacadista).
Stack: Next.js 16 (App Router), React 19, TypeScript, Postgres com Drizzle (PGlite em desenvolvimento, Neon em produção), Zod, Vitest, hospedagem em Docker (Render). Multi-tenant por loja; permissões no servidor; segredos de terceiros guardados criptografados (AES-256-GCM); eventos de domínio com trava de idempotência (dedupeKey); rotas de webhook que NUNCA confiam no corpo recebido (sempre confirmam consultando a API do provedor); rotas de cron para tarefas periódicas; e-mail transacional (Resend).
Domínio já pronto:
- Catálogo: produtos com variantes (cor/tamanho, grades P a 2XL e infantil 18-28), packs de atacado (grade fechada), imagens, SEO, importação por planilha; estoque central com RESERVA ao pedir, baixa ao expedir e histórico de movimentações.
- Pedidos: máquina de estados (pendente → pago → pronto para separar → enviado → entregue, cancelado), canais (LOJA_ONLINE, WHATSAPP, INSTAGRAM, MANUAL), tipo de venda (varejo/atacado), cliente, endereço, frete, eventos do pedido, expiração de reserva, pedido de teste.
- Pagamentos do consumidor: Mercado Pago (Pix e cartão até 6x), confirmado sempre pela API do Mercado Pago. Faturas e planos da plataforma cobrados por Pix/cartão.
- Envio: conexão com SuperFrete e Melhor Envio (token criptografado por loja); compra de etiqueta pela API e cotação de frete estão PLANEJADAS, ainda não prontas.
- Temas e editor visual de loja (seções, blocos, 4 temas hoje, 10 planejados), loja de temas, domínio próprio da loja.
- Programa de Parceiros (afiliados) pronto: links rastreáveis, cupons, cookie de atribuição, livro-razão imutável de comissões, garantia, estorno, saque, antifraude. Sobre ele está PLANEJADO o módulo de INFLUENCIADORES (comissão sobre vendas da loja, vitrine por influenciador, painel do lojista).
- Feed de vídeos com produto marcado e live shop: PLANEJADOS, não existem.
- Atacado B2B (preço por faixa, cliente atacadista): PLANEJADO.
- Análise de vendas, CRM e painel Master com filtro por marca; marcas por domínio.
NÃO existe hoje: adaptador de marketplace, fluxo OAuth por loja para serviços externos, sincronização de catálogo/estoque/pedidos com canal externo, tabela de mapeamento de produtos externos, importação de pedidos de canal externo, conciliação financeira de canal externo.
Pontos de extensão que já temos: interfaces de adaptadores (pagamento, frete, e-mail), `orders.channel`, `domain_events`, `store_assets`, livro-razão de parceiros, seções de tema, entitlements por plano (recursos ligados por plano e por marca).

OBJETIVO
Quero que cada loja virtual da plataforma tenha ALTA CONEXÃO com influenciadores do TikTok e com o TikTok Shop, em benefício do lojista: vender pelo TikTok Shop com o catálogo e o estoque que ele já tem aqui, receber e expedir pedidos do TikTok no mesmo painel, trabalhar com criadores/afiliados do TikTok Shop, reaproveitar vídeos e lives, e enxergar o resultado consolidado. Primeiro faremos um TESTE CONTROLADO com 1 a 3 lojistas.

O QUE VOCÊ DEVE ENTREGAR (nesta ordem; use títulos numerados e tabelas)

A. ELEGIBILIDADE E MODELO DE PARCERIA
 A1. Estado do TikTok Shop no Brasil (lançamento, regiões, categorias de moda liberadas, restrições para vestuário e réplicas/marcas, exigências para vendedores brasileiros: CNPJ/CPF, MEI, documentos).
 A2. Como uma plataforma como a minha se conecta: tipos de aplicativo/parceiro (por exemplo aplicativo público, personalizado, provedor de serviços/ISV, parceiro de e-commerce), requisitos, processo de aprovação, prazos, custos, contratos, selos de parceiro, exigências de segurança e de política de dados. Diga qual caminho se aplica a mim e qual é o MELHOR para um teste controlado (ex.: aplicativo personalizado em lojas de teste, ou credenciais de vendedor único) versus o caminho de produção.
 A3. Ambiente de testes: sandbox, lojas de teste, dados fictícios, limites do teste, como sair do teste para produção.

B. AUTENTICAÇÃO, SEGURANÇA E LIMITES
 B1. Fluxo de autorização por loja (OAuth 2.0): telas de consentimento, escopos por módulo, duração e renovação de tokens, identificador/“cipher” da loja, assinatura e carimbo de tempo das requisições, ambientes e URLs base por região.
 B2. Webhooks/notificações: eventos disponíveis, formato, assinatura de verificação, reentrega, ordem, idempotência, tempo máximo de resposta, como registrar e testar.
 B3. Limites de taxa, paginação, quotas, códigos de erro relevantes, boas práticas de retentativa.
 B4. Exigências de segurança e privacidade (retenção de dados de pedido, LGPD, dados pessoais do comprador, proibições de armazenamento).

C. MAPA COMPLETO DAS FUNÇÕES DA API (o coração da pesquisa)
Para CADA módulo abaixo, entregue uma tabela: função | o que faz | endpoint/recurso oficial (se achar) | leitura ou escrita | pré-requisitos e escopos | limitações/pegadinhas | CONFIANÇA | link oficial.
 C1. Loja e conta (dados da loja, status, categorias e marcas autorizadas, armazéns).
 C2. Produtos: criar, editar, ativar/desativar, categorias e atributos obrigatórios (moda: tamanho, cor, material, gênero), guias de tamanho, marcas, upload de imagens/vídeos e requisitos (dimensões, peso, proporção), títulos e descrições (limites), auditoria/aprovação e motivos de reprovação, variações (SKU), preços e promoções.
 C3. Estoque e armazéns: leitura e atualização de estoque por SKU, reserva, multi-armazém, tempo real x lote.
 C4. Pedidos: listagem, detalhe, estados e transições, pagamento (o TikTok recebe? quando repassa?), cancelamento, divisão de pedido, itens, comprador, endereço, mensagens, prazos de despacho (SLA) e penalidades.
 C5. Logística e cumprimento: envio pelo vendedor x logística do TikTok (fulfilled by), geração de etiqueta, transportadoras suportadas no Brasil, rastreio, confirmação de envio/entrega, coleta, pacotes e volumes.
 C6. Devoluções, reembolsos e disputas: fluxo, prazos, estados, API.
 C7. Financeiro: extratos de repasse (settlements), transações por pedido, tarifas e comissões do TikTok Shop, prazos de liberação, impostos, formato para conciliação.
 C8. Promoções: descontos, ofertas relâmpago, cupons da loja, campanhas da plataforma, inscrição por API.
 C9. Afiliados e criadores (o ponto mais importante para mim): colaboração aberta, colaboração direcionada, convite a criadores, busca/descoberta de criadores, definição de comissão por produto e por criador, pedidos de amostra e gestão de amostras, aprovação de conteúdo, relatórios de desempenho por criador/vídeo/live, pagamento de comissão (quem paga: TikTok ou a loja?), atribuição de venda, o que a API expõe e o que só existe na interface, regras e limites do programa no Brasil.
 C10. Conteúdo, vídeo e live: vídeo com produto vinculado (shoppable), publicação por API ou só pelo app, lives (agendar, vincular produtos, métricas), o que o vendedor/parceiro consegue fazer por API, uso de vídeos do criador no site da loja (direitos e permissões, Embed/Display API, Login Kit, Content Posting API, Research API: o que existe, para quem, e restrições).
 C11. Atendimento: mensagens de compradores e criadores (Customer Service/IM) via API.
 C12. Dados e análise: desempenho da loja, produtos, vídeos, lives, funil.
 C13. Anúncios e marketing: TikTok Ads/Marketing API, GMV Max, pixel e Events API (conversões), como conectar à loja própria e ao TikTok Shop.
 C14. Outros módulos relevantes que eu não listei (e por que importam para o meu lojista).

D. MAPEAMENTO PARA O MEU SISTEMA (sugestão de arquitetura)
 D1. Tabela de correspondência entre entidades: produto/variante/SKU/categoria/atributos/imagens, estoque, pedido/itens/estados, cliente/endereço, frete/etiqueta/rastreio, devolução, repasse financeiro, criador/afiliado/comissão do TikTok ↔ meu modelo (produto, variante, estoque com reserva, pedido com máquina de estados, canal do pedido, livro-razão de comissões do influenciador, fatura, evento de domínio). Aponte incompatibilidades (ex.: estados diferentes, moeda, arredondamento, impostos, unidades, campos obrigatórios que eu não tenho).
 D2. Fonte da verdade: recomende, por dado (catálogo, estoque, preço, pedido, cliente, financeiro), quem manda (meu sistema ou o TikTok) e como resolver conflito, duplicidade e atraso. Estratégia para EVITAR VENDA EM DUPLICIDADE do mesmo estoque em vários canais (reserva atômica, sincronização por evento + reconciliação periódica).
 D3. Desenho de adaptador `MarketplaceProvider` (interface): quais operações mínimas, quais eventos, como tratar idempotência, retentativa, fila, limites de taxa, falha parcial, versão da API, expiração de token.
 D4. Modelo de dados sugerido (tabelas novas: conexão por loja, mapeamento de produtos/variantes, pedidos externos, eventos recebidos, fila de sincronização, extratos, criadores e colaborações) sem duplicar o que já existe (estender livro-razão de parceiros, canal do pedido e eventos).
 D5. Como o programa de INFLUENCIADORES da minha plataforma (comissão da loja, link, cupom, vitrine) convive com o programa de AFILIADOS do TikTok Shop: sobreposição, conflito de atribuição, dupla comissão, o que unificar num painel do lojista e o que manter separado.

E. NÍVEIS DE INTEGRAÇÃO (avalie, ordene e recomende)
Avalie a viabilidade real (técnica, política, custo, prazo) de cada nível, o valor para o lojista e as dependências:
 N1 Conexão e leitura (autorizar a loja, ver dados, pedidos, produtos)
 N2 Publicar o catálogo do lojista no TikTok Shop a partir do meu catálogo (com validação de categoria/atributos)
 N3 Estoque e preço em tempo real com uma só fonte de verdade
 N4 Importar pedidos do TikTok para o painel do lojista, expedir e devolver rastreio, tratar cancelamentos e devoluções
 N5 Afiliados/criadores: convidar, definir comissão, amostras, ver desempenho e comissões no painel do lojista
 N6 Conteúdo: vídeos e lives do criador ↔ feed e páginas da loja própria (com permissão)
 N7 Financeiro: conciliar repasses e tarifas do TikTok no financeiro do lojista
 N8 Marketing: anúncios/GMV Max, pixel e eventos de conversão coordenados
 N9 Atendimento: mensagens de compradores e criadores no mesmo painel
Diga qual é o TETO REALISTA de integração hoje para um parceiro/vendedor brasileiro, o que exige aprovação especial e o que é impossível por API (só na interface do TikTok).

F. TESTE CONTROLADO (plano)
 F1. Escopo mínimo do teste com 1 a 3 lojistas (qual nível de integração, quais categorias/produtos, quantos SKUs, quais canais, duração).
 F2. Pré-requisitos do lojista (conta, documentos, categorias liberadas, logística) e o que eu preciso providenciar como plataforma (conta de parceiro, aplicativo, domínio, políticas de privacidade e termos, revisão).
 F3. Passo a passo do que fazer primeiro, em ordem, com prazos estimados de aprovação.
 F4. Métricas de sucesso e critérios de parada (pedidos importados sem erro, divergência de estoque, tempo de sincronização, taxa de reprovação de produto, vendas por criador, custo por pedido).
 F5. Riscos e mitigação (bloqueio de conta, reprovação de categoria/marca, oversell, atraso de despacho, mudança de API, LGPD, dependência de plataforma, custos e tarifas).

G. CUSTOS, TARIFAS E MODELO DE NEGÓCIO
 G1. Tarifas do TikTok Shop para o vendedor no Brasil (comissão da plataforma, tarifa de transação, frete, afiliados, campanhas), com fonte.
 G2. Como eu, plataforma, posso ser remunerado sem violar as políticas (mensalidade do módulo, taxa por pedido, serviços) e o que é proibido.
 G3. Impacto para o lojista: simulação de uma venda de camiseta (preço, tarifa, comissão do criador, frete, líquido) com números marcados como ESTIMATIVA e fonte.

H. FECHAMENTO
 H1. Resumo executivo (10 linhas): o que é possível, o que não é, o caminho mais curto para o teste controlado.
 H2. Lista de decisões que eu, dono, preciso tomar (com sua recomendação).
 H3. Perguntas para levar ao suporte/gerente de conta do TikTok Shop.
 H4. Um BLOCO FINAL em JSON com: { "nivel_recomendado_teste": "...", "caminho_de_parceria": "...", "modulos_api_prioritarios": [...], "eventos_webhook_necessarios": [...], "entidades_novas": [...], "riscos_criticos": [...], "pendencias_de_confirmacao": [...] } para eu colar no meu sistema de desenvolvimento.

FORMATO
Markdown; uma seção por letra; tabelas onde indicado; cada tabela com a coluna CONFIANÇA e a coluna LINK. Se a resposta ficar longa, pare no fim de uma seção e escreva "CONTINUA NA SEÇÃO X" (eu digito "continue").
Comece confirmando em 3 linhas o que entendeu do meu contexto e listando quaisquer suposições suas; depois entregue a seção A.
```

## 2. Minhas hipóteses para você conferir com a resposta do GPT (não confie nelas sem fonte)
- O TikTok Shop tem **plataforma aberta de API** (Partner Center) com módulos de loja, produtos, pedidos, logística, devoluções, financeiro, promoções e afiliados. A disponibilidade **no Brasil** e o que uma plataforma como a nossa pode fazer (aplicativo público, personalizado, provedor de serviços) precisam ser confirmados.
- **Afiliados e criadores** costumam ser o módulo mais restrito por API (parte só na interface). É justamente o que mais interessa: por isso o prompt pede o que existe por API e o que só existe na interface.
- Vídeos e lives de criadores no **site da loja** dependem de permissões e de outras APIs (conteúdo/embed) com regras próprias; talvez o caminho seja **embutir** (não copiar) e pedir consentimento.
- O maior risco técnico é **estoque em vários canais** (oversell). Nosso estoque com reserva atômica é uma vantagem; precisamos decidir a fonte da verdade.
- O maior risco de negócio é **política de plataforma** (categorias, marcas, réplicas de camisas de time) e **conta bloqueada**. Camisas de time são sensíveis: só produtos com licença ou sem marca registrada.

## 3. Como trazer a resposta para cá
1. Cole a resposta do GPT **inteira** (ou por seções) numa mensagem e escreva: "Analise esta pesquisa do TikTok Shop, confronte com o nosso código e gere o prompt de desenvolvimento".
2. Eu confronto com o que já existe (pedidos, estoque, parceiros, eventos), apontando o que reaproveitar e o que falta, e crio `docs/prompts/tiktok-shop-integracao.md` com fases, modelo de dados, adaptador `MarketplaceProvider`, testes e critérios de aceite, mais o plano do teste controlado.
3. Se o GPT trouxer links oficiais, guarde-os: o prompt de desenvolvimento cita as fontes e as datas.

## 4. O que já temos e o que falta (visão rápida para o teste controlado)
| Peça | Situação | Observação |
|---|---|---|
| Catálogo com variantes, grades e imagens | pronto | Precisa mapear categoria e atributos do TikTok |
| Estoque com reserva atômica | pronto | Base para uma fonte da verdade única entre canais |
| Pedidos com estados e canal | pronto | Adicionar canal `TIKTOK_SHOP` e pedido externo |
| Webhook que confirma pela API | padrão pronto | Reaproveitar para eventos do TikTok |
| Tokens criptografados por loja | pronto | Precisa OAuth por loja e renovação |
| Eventos de domínio idempotentes | pronto | Cola da sincronização |
| Programa de parceiros e livro-razão | pronto | Base de influenciadores e de comissão de criador |
| Frete e etiqueta pela API | planejado (P1) | Necessário para expedir pedido do TikTok |
| Influenciadores (comissão sobre vendas da loja) | planejado (P3) | Convive com afiliados do TikTok |
| Feed e live shop | planejado (P4) | Reaproveitar vídeos dos criadores (com permissão) |
| Adaptador de marketplace, mapeamento e importação | **não existe** | É o núcleo do módulo TikTok Shop |
