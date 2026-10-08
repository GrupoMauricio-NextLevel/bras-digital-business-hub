# Brás Digital — relatório da Fase 0 (2026-10-08)

Branch: `claude/bras-digital` (não publica). Nada desta frente foi ao Render, nenhum PR foi aberto e a branch de publicação `claude/wonderful-cannon-5o38v5` não foi tocada.

## 1. Validação do trabalho já entregue (Codex)

Os 14 commits do Codex (de `6bda688` a `56f3aba`) foram conferidos num checkout funcional antes de qualquer mudança:

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | sem erros |
| `npx eslint src e2e tests --max-warnings=0` | sem avisos |
| Testes da frente (`brand`, `bras-visibility`, `bras-access`) e vizinhos (`store-access`, `supplier-page`, `tenancy`) | todos passam |

Nenhuma falha causada pelo trabalho já entregue. O "Bloqueio técnico" registrado no plano (sem checkout autenticado) está resolvido.

## 2. O que esta rodada entregou

| Commit | Bloco | O que protege |
|---|---|---|
| `6be8d69` | Operação fechada como configuração da marca | `closedCommerce: true` na Brás em `src/lib/brand.ts` (`isClosedCommerceBrand`, `closedCommerceBrandCodes`); `noindex` em todo o endereço da Brás, não só na página de espera. |
| `c390516` | Fronteira com o motor público | Importadora da Brás (fornecedor de marca fechada) fica fora de `/f/[slug]`, da lista de fornecedores do cadastro e da escolha no cadastro de lojista (mesmo erro `SUPPLIER`, sem revelar que existe). SuperDrop e Commerce seguem iguais (casos de controle no teste). |
| `5dcb4e5` | Projeção comercial | `projectBrasCommercial` entrega só campos da lista permitida; preço, estoque em caixas, importadora e vídeo completo só com membro aprovado. `brasCommercialAccessFromSession` falha fechado: até existir o modelo de membro B2B, ninguém é "membro aprovado". |
| `7531533` | Cascas dos painéis | `/master/bras` com Estúdio, Balcão e Meu Brás: estados vazio, carregando e erro, sem nenhum dado. Abre só para o Master **e** com `BRAS_PANELS=true`; fora disso, 404. Sem papel, tabela, menu ou migração novos. Cada região mostra de qual decisão depende. |

Testes da frente: `tests/brand.test.ts`, `tests/bras-visibility.test.ts`, `tests/bras-access.test.ts`, `tests/bras-fronteira.test.ts` (inclui isolamento entre tenants), `tests/bras-panels.test.ts`. Última execução: 8 arquivos, 55 testes passando; tipos e estilo limpos.

### Por que a prévia fica dentro do Master

Onde mora o Estúdio é decisão pendente (D91 na numeração da Brás). As cascas ficam em `/master/bras` só como prévia técnica do Master, atrás de uma variável desligada por padrão. Se a decisão for por área própria, mover as telas é trocar a rota; nenhuma regra depende do lugar.

## 3. Situação das entregas do plano

| Entrega | Estado |
|---|---|
| 1. Mapa de reaproveitamento | documento pronto, aguarda revisão do dono |
| 2. Direção visual | plano de design pronto; tokens e galeria não iniciados (dependem de aprovação visual) |
| 3. Privacidade | inventário pronto; testes de não vazamento de preço e estoque feitos (`bras-access`) |
| 4. Contratos de autorização | marca e tenant cobertos; papel depende do modelo de membro e dos papéis da importadora |
| 5. Estados de acesso | visitante e membro não aprovado não recebem dado comercial (falha fechada) |
| 6. Auditoria e observabilidade | não iniciado: os eventos dependem das ações reais (reserva, retirada) |
| 7. Casca dos painéis | feito (prévia do Master) |
| 8. Galeria de design | não iniciado |
| 9. Testes de fundação | isolamento e preço anônimo feitos; contrato do Balcão depende dos papéis e dos dados pessoais da retirada |

## 4. Itens [CONFIRMAR] registrados e não implementados

1. Onde mora o Estúdio: módulo do Master com filtro de marca ou área própria (D91 da Brás).
2. Modelo de membro comprador B2B e aprovação por CNPJ.
3. Papéis da importadora (quem do Balcão vê o quê).
4. Pix Split, base e cobrança da comissão, plano B se o Split não servir.
5. Dados do cliente visíveis à importadora (CNPJ, documento na retirada), cancelamento, ocorrência e reembolso.
6. Provedores: vídeo e live, Bling, WhatsApp, IA de tendência e validação de CNPJ.
7. Parâmetros operacionais: limite de "últimas caixas", atualização e validade do estoque.
8. Concorrência de estoque em Postgres (reserva de caixa sem vender duas vezes).

Nenhum desses foi inventado no código: sem Pix, comissão, Bling, vídeo, regra de CNPJ, dado pessoal ou migração.

## 5. Riscos para unir à branch de publicação

- **Numeração de decisões colide.** Nesta branch, D90 é "Brás Digital passa a prioridade". Na branch de publicação, D90 é "Financeiro Master" e a próxima livre é D91. Ao unir, renumerar a decisão da Brás (e o "D91: Estúdio no Master" citado nos documentos e nas cascas) para os próximos números livres.
- **Conflitos esperados.** Esta branch saiu de `0166f33`, antes das decisões D88 a D90 e do trabalho financeiro. Arquivos com mudança dos dois lados: `src/lib/domain/store-access.ts`, `src/app/(portal)/page.tsx`, `CLAUDE.md`, `docs/design/DECISIONS.md`. Resolver mantendo os dois trabalhos e rodar a suíte completa.
- **`BRAS_PANELS`** não deve ser ligada em produção antes da decisão do Estúdio.

## 6. Próximo passo sugerido

Revisão do dono deste relatório e das respostas aos itens da seção 4, começando por 1, 2 e 3: com eles dá para ligar o papel nas cascas e escrever o contrato do Balcão. A galeria de design (entrega 8) pode avançar quando o dono quiser ver o visual.
