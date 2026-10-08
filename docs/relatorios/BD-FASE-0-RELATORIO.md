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

Testes da frente: `tests/brand.test.ts`, `tests/bras-visibility.test.ts`, `tests/bras-access.test.ts`, `tests/bras-fronteira.test.ts` (inclui isolamento entre tenants), `tests/bras-panels.test.ts`. Suíte completa (`npx vitest run`): 92 arquivos, 691 testes passando; tipos e estilo limpos.

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

## 4. Respostas do dono (D91) e o que foi feito com elas

| Pendência | Resposta do dono | Situação |
|---|---|---|
| 1. Onde fica o Estúdio | Dentro do Master | Feito: `/master/bras` com vídeos e membros |
| 2. Membro comprador | Cadastro grátis e simples com CNPJ; libera na hora | Feito: `/cadastro` no endereço da Brás, `bd_members`, papel `BRAS_MEMBER`, área `/meu-bras`; o Master pode bloquear |
| 3. O que a importadora vê | Nada do cliente, só o endereço de envio | Registrado; o Balcão segue como prévia até existir o fluxo de pedido |
| 4. Pix Split e comissão | Nada avançado: o dinheiro vai todo para a importadora e ela paga a comissão à parte | Registrado; nada no código |
| 5. Dados na retirada, cancelamento, ocorrência e reembolso | Só dados de envio; atendimento é responsabilidade da Brás | Registrado |
| 6. Vídeo/live, Bling, WhatsApp, IA, validação de CNPJ | Segunda etapa | Vídeos ficam no YouTube (escolha do dono); o resto não foi feito |
| 7. "Últimas caixas" e validade do estoque | Não dá para controlar agora | Não feito |
| 8. Vender a mesma caixa duas vezes | Controlar depois | Não feito |

Também a pedido do dono: **página pública da Brás** (apresentação forte, vídeos de análise com "Quero comprar" que leva ao cadastro, botões de cadastro e de área do cliente). Liga com `BRAND_SIGNUP_BRAS_DIGITAL=true`; sem ela continua "em breve". Na primeira etapa, "Quero comprar" dentro do Meu Brás abre o WhatsApp da equipe (`BRAS_WHATSAPP`). Fotos pendentes: `public/portal/bras/v3/MANIFESTO.md`.

Verificação desta rodada: tipos, estilo e `npm run build` limpos; testes novos de membro, vídeos, rotas e indexação; `e2e/bras-portal.mjs` (página vazia e com vídeos em 360, 768 e 1440, vídeo tocando, cadastro com CNPJ inválido e válido, Meu Brás, Estúdio, bloqueio, fronteira entre marcas) sem rolagem horizontal e sem violação grave de acessibilidade.

## 5. Riscos para unir à branch de publicação

- **Numeração de decisões colide.** Nesta branch, D90 é "Brás Digital passa a prioridade". Na branch de publicação, D90 é "Financeiro Master" e a próxima livre é D91. Ao unir, renumerar a decisão da Brás (e o "D91: Estúdio no Master" citado nos documentos e nas cascas) para os próximos números livres.
- **Conflitos esperados.** Esta branch saiu de `0166f33`, antes das decisões D88 a D90 e do trabalho financeiro. Arquivos com mudança dos dois lados: `src/lib/domain/store-access.ts`, `src/app/(portal)/page.tsx`, `CLAUDE.md`, `docs/design/DECISIONS.md`. Resolver mantendo os dois trabalhos e rodar a suíte completa.
- **Migração 0042 repetida.** Esta branch criou `drizzle/0042_bras_membros_e_videos.sql`; a de publicação já tem `0042_financeiro_master`. Ao unir, apagar a da Brás (nunca foi publicada) e gerar de novo com `npx drizzle-kit generate --name bras_membros_e_videos`, que sai como 0043.
- **`BRAS_PANELS`** (prévia do Balcão) não deve ser ligada em produção antes do fluxo de pedido.
- **Antes de ligar `BRAND_SIGNUP_BRAS_DIGITAL` em produção:** termos de uso e política de privacidade da Brás publicados (o cadastro guarda CNPJ, nome, e-mail e WhatsApp) e o `BRAS_WHATSAPP` configurado.

## 6. Próximo passo sugerido

1. O dono aprova o visual da página pública e do Meu Brás (capturas da rodada) e gera as 4 fotos do manifesto.
2. Unir a branch com a de publicação (renumerar D90/D91 e a migração), conferir e publicar com `BRAND_SIGNUP_BRAS_DIGITAL` ainda desligada; ligar quando os termos estiverem prontos.
3. Próxima etapa de produto: catálogo das importadoras com preço e estoque em caixas (projeção comercial já pronta) e o pedido pelo sistema, com o Balcão vendo só o envio.
