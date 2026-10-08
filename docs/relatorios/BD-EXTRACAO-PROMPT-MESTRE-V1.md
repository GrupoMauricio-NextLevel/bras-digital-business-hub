# Brás Digital — extração do Prompt Mestre v1.0

**Fonte analisada:** `BRAS-DIGITAL-PROMPT-MESTRE.md` (versão 1.0, 07/10/2026)  
**Regra de precedência aplicada:** Constituição > `docs/design/DECISIONS.md` > `docs/prompts/bras-digital-plataforma.md` com seu adendo 1.1 > este documento de extração.  
**Objetivo:** aproveitar requisitos de produto e qualidade da v1.0 sem importar instruções incompatíveis com o repositório atual.

## Decisão de conciliação

A v1.0 é uma boa especificação de requisitos, riscos e critérios de aceite. Ela não é a arquitetura executável do projeto atual: foi escrita como se a Brás Digital exigisse repositório, Render, Neon e banco próprios.

O adendo 1.1 já corrigiu esse ponto após estudar o código. Portanto, a implementação seguirá o motor único existente e a branch `claude/bras-digital`. Nenhuma ação será enviada à branch de publicação `claude/wonderful-cannon-5o38v5`.

## O que foi preservado da v1.0

- Privacidade comercial do dono como requisito principal.
- Preço, estoque, nome de importadora e vídeo completo inacessíveis a visitante ou membro não aprovado.
- Reserva idempotente e atômica; estoque nunca negativo; baixa definitiva somente no fluxo de retirada.
- Valores monetários em centavos, histórico de preço no item da reserva e dados financeiros sem exclusão física.
- Isolamento de tenant, teste de IDOR e teste de vazamento de campos nas respostas do Balcão.
- Auditoria de ações relevantes, confirmação ativa de pagamento e webhooks assinados.
- Planilha validada, com histórico; concorrência de estoque, expiração e erros de provedor como casos de teste.
- Acessibilidade WCAG 2.2 AA, estados de erro úteis e experiência responsiva.
- Uso de adaptadores para pagamento, vídeo e conectores de estoque, evitando acoplamento com provedores.
- Testes de unidade, integração, segurança, carga, acessibilidade e E2E descritos na v1.0.

## O que foi substituído pelo adendo 1.1

| V1.0 anexada | Direção vigente no repositório |
|---|---|
| Repositório, Render, Neon e banco novos | Mesmo repositório, deploy e banco; independência é de produto, não de infraestrutura. |
| Modelo de dados integralmente novo | Estender entidades existentes; criar `bd_*` somente quando houver lacuna comprovada. |
| Branch própria `codex/<fase>-<assunto>` e PR por entrega | Trabalho em `claude/bras-digital`; não criar PR sem pedido do dono. |
| Decisões `BD-001` em pasta nova | Decisões em `docs/design/DECISIONS.md`, a partir de D92. |
| Estrutura `/src/modulos` e `/migrations` | Convenções existentes: domínio em `src/lib/domain/`, app em `src/app/`, migrações em `drizzle/`. |
| Produto isolado e cópia/adaptação do sistema existente | Motor compartilhado e extensão controlada das capacidades existentes. |

## Requisitos que seguem bloqueados por [CONFIRMAR]

1. Pix em Split 1:1 do Mercado Pago, tarifas, requisitos e plano B.
2. Importadora piloto, API/escopos do Bling e layout da planilha.
3. Base, vigência e cobrança da comissão; política de dinheiro, expiração e falta na retirada.
4. Visibilidade do CNPJ à importadora, cancelamento, ocorrência e estorno.
5. Provedor/orçamento de vídeo e live, IA, WhatsApp e validação de CNPJ.
6. Parâmetros de negócio: últimas caixas, frescor do estoque e expiração de Pix.
7. Uso de Postgres na operação produtiva para a concorrência real de estoque.

Esses pontos não serão inventados nem codificados como regra definitiva.

## Ordem de execução resultante

1. Manter o relatório de mapeamento da Fase 0 como porta de entrada.
2. Resolver as confirmações que mudam arquitetura ou dinheiro.
3. Só então definir D92 sobre o encaixe do Estúdio no Master e as extensões estritamente necessárias.
4. Implementar Fase 0 com testes de isolamento e proteção de preço antes de telas de negócio.
5. Parar novamente para revisão antes de qualquer etapa de publicação.

## Estado

Nenhum código de produto, migração, infraestrutura, credencial, PR ou publicação foi criado por este documento.
