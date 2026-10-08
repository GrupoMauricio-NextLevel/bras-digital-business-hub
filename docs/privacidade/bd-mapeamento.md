# Brás Digital — mapeamento inicial de privacidade

**Estado:** rascunho de engenharia para a Fase 0. Não é política de privacidade nem texto jurídico.  
**Obrigação antes de publicar:** revisão jurídica dos textos e confirmação das decisões marcadas.

## Princípios

- Coletar somente o necessário para cadastro, reserva, pagamento e retirada.
- A importadora recebe apenas os dados mínimos para cumprir uma reserva paga dela.
- Dados de CRM, aquisição, conteúdo, audiência, analytics e relação comercial do dono não são expostos à importadora.
- Documentos, tokens e dados pessoais nunca entram em log, fixture, captura de tela ou mensagem de erro.
- Toda leitura e alteração de dado sensível deve passar por autorização de servidor, escopo de tenant e auditoria.

## Inventário inicial

| Dado | Finalidade | Acesso previsto | Retenção / proteção |
|---|---|---|---|
| Nome, e-mail e telefone do responsável do membro | Login, contato operacional e avisos | Membro, dono e equipe autorizada | Mínimo necessário; mascarar em listas e logs |
| CNPJ, razão social e nome fantasia | Validação e identificação B2B | Dono/equipe; importadora apenas conforme decisão | **[CONFIRMAR]** se CNPJ aparece no Balcão; padrão conservador: nome fantasia + código do pedido |
| Usuários adicionais da organização | Permissões internas do membro | Organização e dono/equipe autorizada | Autorização por organização |
| Origem de captação, segmentos, notas e valor vitalício | CRM exclusivo do dono | Dono/equipe somente | Nunca serializar em resposta do Balcão |
| Itens, quantidades, pagamento e retirada | Operação da reserva | Membro; importadora da própria reserva; dono/equipe | Histórico financeiro e auditoria; sem exclusão física |
| Transportadora, motorista, documento e placa | Conferência de retirada | Membro, importadora da reserva e dono/equipe | Mascarar documento; prazo de retenção **[CONFIRMAR]** |
| Token de conector e chave de pagamento | Integrações autorizadas | Serviço de aplicação; nunca em tela completa | `encryptSecret`, rotação e auditoria |
| Foto de retirada/ocorrência | Prova operacional | Partes autorizadas da reserva | Tipo/tamanho controlados; prazo **[CONFIRMAR]** |

## Matriz de proibição para o Balcão

O Balcão não pode receber, por API, HTML, cache ou exportação:

- lista, histórico, segmentação, notas, origem ou valor vitalício de membros;
- compras do membro em outras importadoras;
- métricas de conteúdo, lives, audiência e analytics;
- comissões, integrações ou dados operacionais de outra importadora;
- tokens, dados completos de cartão/documento ou anotações internas do dono.

A resposta do Balcão deverá ter contrato de campos permitidos e teste automático de vazamento.

## Controles técnicos obrigatórios

1. Autorização no servidor por papel, marca e tenant.
2. Consultas de importadora sempre restritas à própria importadora; não revelar existência de recurso fora do escopo.
3. Preço, estoque, importadora e vídeo completo só para membro `APROVADO` com sessão válida.
4. Dados públicos: `noindex`, ausência de preço em HTML/metadados/cache público.
5. Auditoria para aprovação, alterações de estoque, transições de reserva, pagamento, retirada, suporte e acesso privilegiado.
6. Tokens cifrados; validação de webhook; idempotência; limitação de taxa e CSRF.
7. Exportação, anonimização e retenção serão desenhadas após a revisão jurídica e a definição dos prazos legais.

## Testes de privacidade e segurança

- Anônimo não recebe informação comercial.
- Membro pendente, suspenso ou recusado não recebe preço.
- Importadora A recebe 403/404 ao tentar acessar recurso da importadora B.
- Contrato do Balcão rejeita campos de CRM, analytics, conteúdo e dados de terceiros.
- Logs, snapshots e respostas de erro não contêm token, documento completo ou dado pessoal desnecessário.
- Acesso de suporte é temporário, motivado, somente leitura por padrão e auditado.

## Pendências [CONFIRMAR]

1. Base legal, aviso de privacidade e termos: revisão por advogado.
2. Política de exibição de CNPJ e documento de motorista à importadora.
3. Prazos de retenção para dados de retirada, fotos, ocorrências e auditoria.
4. Provedor de validação de CNPJ e de WhatsApp.
5. Processo operacional de exportação/anonimização e requisitos fiscais.
