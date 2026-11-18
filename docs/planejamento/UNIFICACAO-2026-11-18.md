# Unificação do planejamento (16 a 18/11/2026)

> Feito em 18/11/2026 a pedido do dono: juntar o que ~12 conversas fizeram em paralelo, achar conflitos, duplicações e retrabalho, e propor a ordem. **Ainda não é decisão**: as perguntas da seção 6 são do dono. Depois de respondidas, viram uma decisão em `docs/design/DECISIONS.md`.

## 1. O que aconteceu nos últimos dias (por frente)

| Frente | Decisões | Onde está |
|---|---|---|
| Ecossistema e Business (quatro portas, Sites, Business por dentro) | D304 a D311, D324, D336, D337 | no ar |
| Captação NB4 (página de campanha, links, QR) | D339 | **branch parada** `ccr-ecbeafd1-sh4iy2` |
| Painel da Agência (UP, equipe, cobrança, portal, contratos, gavetas) | D312 a D327, D333, D334 | no ar |
| Contratos da agência a 100% (Império Maia, Bazar Prime, trazer do Master) | "D335" | **branch parada** `claude/eager-shannon-f76xmw` |
| Painel da Agência para qualquer segmento; academia sai | D340 | **branch parada** `ccr-ecbeafd1-sh4iy2` |
| Painéis com vida (cor, gráficos, ícones 3D) | D331 a D335 | no ar |
| Loja: cadastro de produto, editor de temas no suporte, carregamento travado | D328 a D330 | no ar |
| Banco que dorme (Neon estourou) | D338 | no ar |

## 2. Conflitos que quebram (resolver antes de publicar mais nada)

1. **Duas migrações 0117.** `eager-shannon` (contratos) e `ccr-ecbeafd1` (personalização + captação) criam cada uma a sua `0117` e mexem nos mesmos arquivos (`schema.ts`, `actions/agencias.ts`, `agencia/layout.tsx`, `nav.ts`, ficha do cliente). Publicar uma e depois a outra quebra o deploy. Solução: juntar uma, gerar a outra de novo como `0118`, rodar os testes da agência e publicar as duas numa montagem só.
2. **Número de decisão repetido.** D335 existe duas vezes (Master "Agora" no ar × contratos na branch); D324 também (no ar × verificação Google/Bing em `keen-hypatia`). Ao juntar: contratos vira D341, verificação Google/Bing vira D342.
3. **Branch da academia contradiz o que está no ar.** `claude/upbeat-babbage-ianepy` usa D302 a D307 (todas já ocupadas), diz "NextLevel Business = novo nome da agência" (contra D324) e cria a área `/academia` (contra D340). **Descartar.**

## 3. Duplicações de conceito (o retrabalho que está nascendo)

O mesmo assunto está sendo construído em três lugares:

| Assunto | Master | Painel da Agência | Meu negócio / Business |
|---|---|---|---|
| Funil de vendas | Comercial (`crm_acompanhamento`) | Comercial (`agencia_oportunidades`) | Contatos e orçamentos + quadro (`contatos_negocio`, D337) |
| Contratos | `contratos` + `contrato_parcelas` | `agencia_contratos` (D321, "D335") | "em breve" (D336) |
| Cobrança do cliente | parcelas do Master | `agencia_faturas` (D318) | "em breve" |
| Portal do cliente | — | portal da agência (D320) | "em breve" (D336) |
| Projetos e tarefas | — | Produção (peças, etapas, D314/D340) | "em breve" (D337, opção A) |

**Leitura de dono:** a D340 transformou o Painel da Agência num sistema de serviços para qualquer segmento (contabilidade, advocacia, consultoria…). Isso **é** o "NextLevel Business no caminho do Bitrix" da D336. Se continuarmos, teremos dois produtos fazendo a mesma coisa com nomes diferentes.

**Proposta:** um motor só.
- **NextLevel Business = o Painel da Agência personalizável (D340)**, com o modelo "Agência de marketing" como um dos modelos. Nada de construir projetos, contratos e portal de novo dentro do Meu negócio: o cartão "NextLevel Business" do Meu negócio abre esse painel (a ponte já existe ao contrário, D323).
- **Meu negócio (todo cliente) = Contatos e orçamentos + quadro + Maurício (D337)**, que funciona como o Business Essencial.
- **Contratos:** um gerador e uma prova de aceite (`src/lib/contratos`), usados pelo Master e pelo Business. A migração "trazer do Master" da branch de contratos já é o primeiro passo.
- **Funil:** quando um contato do Meu negócio "vira cliente" com serviço recorrente, ele passa para os clientes do Business, não para uma terceira lista.

## 4. Ordem de prioridade (critério: 10 empresas pagantes, D174/D336)

**Agora (hoje e amanhã), uma montagem só no Render:**
1. Dono: limite do Neon em 1 CU (D338).
2. Juntar contratos (`eager-shannon`) — tem dinheiro real: Império Maia (saldo de R$ 250 em 18/11) e Bazar Prime.
3. Juntar personalização + captação (`ccr-ecbeafd1`), migração renumerada para 0118.
4. Juntar junto os pequenos prontos: segurança do Next 16.4.1 (`fix/next-criticos`, alertas críticos desde 13/11), segunda-feira dos executivos (`relaxed-bell`), verificação Google/Bing (`keen-hypatia`).

**Próxima (esta semana):**
5. Decidir preço antes da virada de 01/12 (`claude/vigilant-bell-neurpc` foi escrito antes da D336 e precisa ser conferido de novo).
6. Fechar a seção 3 (um motor só) e só depois abrir qualquer tela nova de Business.
7. Painéis com vida: aplicar o que já existe às telas novas (Contratos, Captação, Personalizar), sem componente novo.

**Pausado (sem tempo nisso até as 10 pagantes):** academia e NextLevel Club, UPClips além do que já existe, fábrica de conteúdo (é trabalho do dono, não de código), Brás, Cargas, SuperDrop, atualizações grandes do TypeScript 7 e ESLint 10.

## 5. O que fazer com cada branch

| Branch | O que é | Destino |
|---|---|---|
| `claude/eager-shannon-f76xmw` | contratos da agência a 100% | **juntar** (como D341) |
| `ccr-ecbeafd1-sh4iy2` | captação NB4 (D339) + agência para qualquer segmento (D340) | **juntar** (migração 0118) |
| `fix/next-criticos` | Next 16.4.1, segurança | **juntar** |
| `claude/relaxed-bell-3erg4n` | correção da segunda-feira | **juntar** |
| `claude/keen-hypatia-fp0o6v` | verificação Google e Bing | **juntar** (como D342) |
| `claude/vigilant-bell-neurpc` | mapa de preços (14/11) | rever com a D336, depois juntar o documento |
| `claude/peaceful-fermi-m20pc2` | checklist único do dono | juntar o documento |
| `claude/cool-hamilton-xfcd23` | plano comercial e departamentos | juntar o documento |
| `claude/design-content-audit-kfs4gm` | auditoria fase 1 (promessas e números) | conferir se ainda aplica; se sim, juntar |
| `claude/fabrica-conteudo-redes-sociais-sxu3ne` | fábrica de conteúdo | juntar só o documento, como referência |
| `claude/upbeat-babbage-ianepy` | Business para academia | **descartar** (contradiz D324 e D340) |
| `claude/eloquent-ramanujan-rfizdl` | NextLevel Club academia | **arquivar** (pausado pela D340) |
| `revisao/ecommerce-home-imersiva` | versão antiga da caixa de entrada (D290) | **descartar** (já no ar como D296) |
| `dependabot` TypeScript 7 / ESLint 10 | atualizações grandes | adiar |
| demais `claude/*` com 0 commits à frente | já estão no ar | apagar |

## 6. Perguntas para o dono

1. **Um motor só:** o NextLevel Business passa a ser o Painel da Agência personalizável (D340), e o Meu negócio fica com o funil simples? (Recomendado: sim.)
2. **Junção:** posso juntar as cinco branches do item 4 e publicar numa montagem só?
3. **Descartar:** posso descartar a branch da academia (`upbeat-babbage`) e arquivar a do Club?
4. **Preço de 01/12:** retomamos as três perguntas do mapa de preços (Natal no anual, Pro R$ 167 ou R$ 157, faixa que fica com a Loja Integrada) à luz da D336?

## 7. Regra para não acontecer de novo

- **Uma conversa por frente**, e cada conversa começa lendo este arquivo e o fim de `DECISIONS.md`.
- **Número de decisão e de migração só se pega na hora de juntar** à branch de publicação, nunca no começo da conversa.
- **Antes de criar tela, tabela ou módulo:** procurar no quadro da seção 3. Se o assunto já existe em outro painel, estender o que existe.
