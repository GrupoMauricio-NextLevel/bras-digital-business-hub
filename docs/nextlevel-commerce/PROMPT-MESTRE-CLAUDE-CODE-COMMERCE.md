# Prompt mestre para Claude Code — desenvolvimento incremental da NextLevel Commerce

> Preparado em 02/10/2026 com a skill local `engenharia-nextlevel`. Este é um comando de execução para o Claude Code, não um relatório de implementação. Deve atuar em conjunto com `COMMERCE-MEMORIA-FUNCIONAL-E-PLANO-CLAUDE.md`.

## Como usar estes dois arquivos

Forneça os dois MDs ao Claude Code, no projeto `bras-digital-business-hub`, e diga:

```text
Use PROMPT-MESTRE-CLAUDE-CODE-COMMERCE.md como comando de execução e
COMMERCE-MEMORIA-FUNCIONAL-E-PLANO-CLAUDE.md como memória funcional.
Execute o ciclo padrão definido no prompt: descoberta breve da Onda 0
e implementação local da Onda 1, com testes e relatório de entrega.
Não faça push, deploy nem efeitos externos pagos.
```

Se os arquivos estiverem apenas anexados, leia os anexos. Se estiverem no workspace, leia os arquivos. Não presuma acesso a arquivos do Windows a partir de uma sessão em nuvem.

O restante deste documento é o prompt completo. Pode ser fornecido como arquivo ou colado integralmente ao executor. Não é necessário instalar esta skill no Claude: o contrato de execução está explicitado abaixo.

---

## 1. Sua tarefa e o resultado esperado

Você está trabalhando no repositório `bras-digital-business-hub`, do ecossistema NextLevel. Desenvolva a NextLevel Commerce sobre o motor existente do SuperDrop, com continuidade entre sessões, sem criar uma plataforma paralela e sem quebrar a operação atual.

A pessoa que usará o produto é o lojista independente: ela cadastra seus próprios produtos, controla seu estoque, vende, recebe, separa e envia pedidos. Não precisa entender fornecedor oculto, redes de distribuição ou carteira de recarga da Central.

Seu resultado deve ser uma rotina funcional, persistida e verificável, não apenas novos menus ou um painel visualmente parecido com os prints. Cada etapa precisa conectar:

```text
necessidade do lojista
  → interface e estados
  → action autenticada
  → autorização e domínio
  → dados e transações
  → serviço externo, quando houver
  → teste e evidência de funcionamento
```

O objetivo geral inclui os módulos da memória funcional: administração, dashboard, pedidos, PDV, propostas/links, catálogo, preferências, categorias, estoque, logística, CRM, marketing, temas, configurações e financeiro.

Esse objetivo geral não deve ser executado como uma única mudança gigantesca. Trabalhe na onda ativa, entregue-a e mantenha o restante rastreável para próximas sessões.

## 2. Parâmetros desta execução

### 2.1 Configuração padrão

| Parâmetro | Valor deste comando |
| --- | --- |
| Produto em desenvolvimento | NextLevel Commerce |
| Persona principal | Dono de loja independente |
| Base reutilizável | Motor compartilhado SuperDrop/NextLevel |
| Modo | Desenvolvimento local, com persistência e testes |
| Onda ativa | Onda 1 — núcleo independente e segurança operacional |
| Pré-etapa obrigatória | Onda 0 — descoberta breve e revalidação de evidências |
| Continuação no mesmo ciclo | Concluir Onda 1; não iniciar automaticamente Onda 2 |
| Frontend e backend | Ambos permitidos dentro do escopo da Onda 1 |
| Publicação | Não autorizada |
| Push / PR | Não autorizados |
| Serviços pagos / envio real / compra de etiqueta | Não autorizados |
| Credenciais reais / banco real | Não usar sem autorização específica |
| Novos preços / planos / taxas | Não alterar |
| Novas marcas e novos domínios | Fora do escopo |
| Multiloja, equipe, seller geral | Fora do ciclo padrão |

### 2.2 O que você pode decidir sem me perguntar

- Nomes internos compatíveis com o padrão do projeto.
- Extração pequena de helper para eliminar repetição real.
- Organização do código dentro dos limites do módulo afetado.
- Texto operacional em português, sem alterar promessas ou condições comerciais.
- Seletores de teste, fixtures sintéticas e estados de carregamento/erro.
- Uso dos componentes, tokens e convenções já existentes.
- Implementação técnica de um guard, desde que conserve as regras de modalidade e tenant.
- Ajustes mínimos em layout necessários para expor uma função aprovada.

Não interrompa a execução a cada detalhe rotineiro. Declare a decisão e prossiga.

### 2.3 O que exige uma decisão minha

- Alteração de preço, contrato, prazo comercial ou política de suspensão.
- Mudança do momento de reservar/baixar estoque em toda a plataforma.
- Permitir nova modalidade de pagamento, vender sem estoque ou liberar ação antes bloqueada por dívida.
- Mudança ampla do modelo de identidade, seller, multiloja ou compartilhamento de cliente.
- Publicação, push para branch que dispara deploy, PR ou alteração de infraestrutura.
- Uso de credenciais reais, produção, compra de envio, emissão fiscal ou envio a clientes reais.
- Serviço novo, dependência de infraestrutura paga ou transferência de dados a outro provedor.
- Redesenho global de marca ou substituição do editor de temas.
- Conflito com alterações existentes que não pode ser resolvido preservando o trabalho alheio.

Nesses casos, conclua o que for seguro e independente, registre o bloqueio com opções concretas e peça apenas a decisão que falta. Não amplie a autorização por associação.

## 3. Memória funcional obrigatória e fontes

### 3.1 Arquivo de memória

Leia integralmente `COMMERCE-MEMORIA-FUNCIONAL-E-PLANO-CLAUDE.md` antes de formular o escopo final. Ele contém:

- Inventário dos recursos visíveis nos prints.
- Distinção entre recurso observado, nome de menu e proposta nossa.
- Análise de reaproveitamento da base SuperDrop.
- Lacunas e riscos R-01 a R-20.
- IDs de requisitos por módulo.
- Ondas de implementação, dependências e critérios de aceite.
- Índice de arquivos/símbolos para retomada.

Localização original no computador do dono:

```text
C:\Users\Pichau\Documents\Codex\2026-10-01\c-users-pichau-documents-projetos-bras\outputs\COMMERCE-MEMORIA-FUNCIONAL-E-PLANO-CLAUDE.md
```

Esse caminho é uma referência de origem, não garantia de acesso da sua sessão. Se tiver o arquivo anexado, o anexo é suficiente. Se a memória não estiver disponível por nenhum meio, solicite o arquivo e não invente seu conteúdo.

### 3.2 Ordem de leitura no repositório

1. `docs/design/BRIEFING-CODEX.md`.
2. `AGENTS.md` e `CLAUDE.md`, incluindo instruções mais específicas aplicáveis aos arquivos.
3. Memória funcional fornecida neste comando.
4. `docs/nextlevel-commerce/aproveitamento-superdrop.md`.
5. `docs/prompts/nextlevel-commerce-plataforma.md`.
6. Decisões pertinentes em `docs/design/DECISIONS.md`.
7. Código, migrations e testes dos fluxos da onda ativa.

Não trate prompts históricos como implementação. Não leia todo o repositório sem direção: após as fontes obrigatórias, vá aos pontos que mudam decisões da etapa.

### 3.3 Precedência e conflitos

- Minha instrução explícita mais recente define o objetivo e a autoridade desta entrega.
- As instruções aplicáveis do repositório orientam implementação e segurança.
- O código atual descreve o comportamento presente; não transforma um defeito em requisito desejado.
- A memória preserva requisitos e a fotografia anterior, não substitui a inspeção atual.
- Os prints são evidência de interface; não provam API, arquitetura, segurança ou comportamento interno do concorrente.
- Documento antigo de plano não é evidência de que o recurso está pronto.

Se houver conflito material, cite as fontes e proponha a menor solução segura. Não esconda divergência que altera modelo, permissão ou produto.

Este comando delega ao Claude alterações full-stack necessárias à onda ativa. A antiga separação “Codex visual / Claude domínio” não deve impedir uma entrega funcional aprovada, mas também não autoriza modificar frentes visuais alheias ou redesign global.

A orientação antiga de push automático não vale neste ciclo: não publique. Commit local de arquivos desta entrega é o limite de Git autorizado aqui.

## 4. Contexto técnico inicial — revalidar, não assumir

Na inspeção usada para gerar a memória, o projeto declarava Next.js 16, React 19, TypeScript estrito, Tailwind 4, Radix, Drizzle, Zod, PGlite local, PostgreSQL/Neon e Vitest/Playwright.

Referência de repositório local:

```text
C:\Users\Pichau\Documents\Projetos\bras-digital-business-hub
```

Fotografia anterior:

- Branch local: `codex/visual`.
- HEAD: `6becfc85b95f3ff9f261b2dc33a7e425b2ef492d`.
- Alterações locais no portal Commerce e arquivos de imagem/componente, não pertencentes a este ciclo.
- Demo local já disponível em `http://localhost:3100`.

Não imponha essa branch a uma sessão Claude em nuvem. Não afirme que viu o localhost do dono se estiver executando em outro ambiente. Determine branch, commit, alterações e ferramentas presentes na sua sessão.

Antes de escrever código Next.js, leia os guias pertinentes em `node_modules/next/dist/docs/` da versão instalada. Se ausentes, localize a documentação oficial correspondente à versão realmente usada. Não implemente convenções por lembrança de versões antigas.

Páginas que consultam banco devem respeitar a regra do projeto de `export const dynamic = "force-dynamic"`. Verifique o lugar adequado, sem inserir configuração incompatível ou redundantemente em componentes client.

## 5. Princípios arquiteturais que não podem ser violados

### 5.1 Um motor, marcas e modalidades distintas

Reaproveite o mesmo núcleo de catálogo, pedidos, estoque, pagamento, billing e temas. Não crie cópias `commerce_orders`, `commerce_inventory` ou um segundo page builder só para separar a marca.

Há diferenças que precisam existir sem duplicação:

| Conceito | Papel no sistema |
| --- | --- |
| Marca | Identidade, copy, entrada pública |
| Modalidade | Independente, loja de rede, loja própria de fornecedor |
| Tenant | Fronteira de dados/loja |
| Papel/capacidade | Ações autorizadas para aquele ator |
| Oferta/entitlement | Recursos contratados e limites |
| Integração | Conta externa e efeitos de pagamento/frete/e-mail |

Marca vem da infraestrutura `getBrand()`/`brand.ts`, conforme contexto existente. Não derive acesso da cor, nome do portal, hostname isolado, cookie de preview ou parâmetro client `independent=true`.

### 5.2 Conta independente existente

A memória identificou:

- `createHiddenCentral` cria a estrutura oculta para catálogo/estoque.
- `independentSupplierOfStore` resolve a modalidade independente.
- `catalogSupplierId` autoriza manutenção de catálogo pelo ator apropriado.
- `requireIndependent` protege rotas da conta simples.
- Rotas `/merchant/catalogo` reaproveitam `ProductsBody` e `ProductBody` do supplier.
- `SUPPLIER_OWN` evita débito de carteira no fluxo correspondente.

Verifique essas condições no código atual. Não recrie o cadastro independente, não crie um usuário SUPPLIER_ADMIN para o dono e não exponha a Central oculta como uma entidade que ele deve gerenciar.

`SUPPLIER_OWN` também atende loja própria de fornecedor real. Não é suficiente sozinho para classificar toda conta como Commerce independente. Preserve a distinção atual.

### 5.3 Preservação do SuperDrop

O lojista de rede pode continuar dependendo de distribuição de produto, piso de preço, custo à Central, saldo e etiquetas. A conta independente não deve receber essas dependências artificiais.

Não “corrija” o SuperDrop removendo carteira ou pagamento da Central do domínio inteiro. Adapte a apresentação e a autorização por modalidade, preservando a disciplina transacional.

Não faça a loja independente ganhar permissões de fornecedor só para aproveitar um botão de expedição. Crie capacidade da própria loja ou use política equivalente validada no servidor.

## 6. Onda 0 — descoberta breve, orientada à implementação

Execute esta pré-etapa no começo do ciclo. Seu propósito é revalidar o mapa e impedir retrabalho, não consumir a sessão com uma auditoria infinita.

### 6.1 Identificação do ambiente

- Confirme cwd, raiz do repositório, branch e HEAD.
- Leia `git status` e separe alterações pré-existentes das suas futuras mudanças.
- Verifique instruções de subdiretório antes de editar.
- Identifique banco de teste/demo e confirme que não é produção, sem exibir connection string.
- Verifique package manager, scripts e runtime já instalados.
- Localize a sessão de preview existente quando local; não abra um segundo servidor sem necessidade.
- Em nuvem, use apenas o ambiente disponível e informe a diferença.

Não rode reset, seed ou migration em banco não identificado. Não leia arquivos de segredos para copiar seus valores para relatório ou prompt.

### 6.2 Pontos de entrada a inspecionar

| Fluxo | Arquivos/símbolos candidatos confirmados na fotografia anterior |
| --- | --- |
| Conta independente | `src/lib/domain/independent.ts`, `src/lib/require-independent.ts`, `src/lib/domain/store-access.ts` |
| Ator e acesso | `src/lib/domain/access.ts`, `src/lib/require-session.ts`, sessão em `src/lib/auth.ts` |
| Pedido/estoque | `src/lib/domain/orders.ts`, `order-status.ts`, `inventory.ts` |
| Actions de pedido | `src/app/actions/orders.ts` |
| Botões e listagem | `src/components/shared/order-actions.tsx`, `orders-table.tsx`, `order-quick-view.tsx` |
| Páginas merchant | `src/app/merchant/orders/`, dashboard, finance e catálogo |
| Publicação de produto | `src/app/actions/merchant.ts`, `src/lib/domain/catalog.ts` |
| Catálogo próprio | `src/app/merchant/catalogo/`, `src/app/actions/supplier.ts` |
| Carteira e custo interno | `src/lib/domain/wallet.ts`, `own-store.ts` |
| Menu/copy | `src/components/app/role-layout.tsx`, `src/lib/nav.ts`, `src/lib/features.ts` |
| Pagamento externo | `src/lib/payments/service.ts`, `mercadopago.ts`, webhook correspondente |
| Capacidade financeira | Domínio de finance e billing vigente da loja |
| Etiqueta e expedição | `src/lib/domain/labels.ts`, `operations.ts`, actions correspondentes |
| Evidência de regressão | `tests/independent.test.ts`, `tenancy.test.ts`, `orders.test.ts`, testes de inventory, wallet, labels e payments |

Confirme os caminhos e símbolos. Se foram renomeados, registre a equivalência atual. Não conclua que o recurso desapareceu porque um caminho antigo não existe.

### 6.3 Produza um mapa mínimo

Descreva os fluxos atuais:

1. Cadastro independente → usuário/loja/estrutura oculta → plano → acesso.
2. Produto próprio → listing/publicação → catálogo público → pedido.
3. Pedido manual → confirmação de pagamento → reserva/estado → expedição.
4. Pedido de gateway → consulta API → confirmação válida → estado operacional.
5. Pedido SuperDrop → custo/saldo → etiqueta → expedição pela Central.
6. Mutation de produto/estoque → invalidação → tela merchant atualizada.

Para cada fluxo, identifique onde está a decisão de permissão, modalidade, pagamento e atualização de estado.

### 6.4 Classifique os riscos da memória

Revalide R-01 a R-20, mas implemente apenas os selecionados para este ciclo. Para cada item, use:

- Confirmado no estado atual.
- Já corrigido, com evidência.
- Parcialmente confirmado.
- Não reproduzido.
- Não verificável no ambiente disponível.

Não chame um achado de vulnerabilidade explorada sem reproduzir o comportamento relevante. Não transforme hipótese em fato. Ao mesmo tempo, não considere um teste de UI como prova de guard server-side.

### 6.5 Encerramento da pré-etapa

Apresente uma atualização curta com:

- Base existente que será usada.
- Lacunas confirmadas da Onda 1.
- Arquivos/fluxos previstos para mudança.
- Exclusões e riscos que ficam para depois.

Se o escopo se mantém e não há decisão material pendente, prossiga diretamente para implementação da Onda 1. Não espere nova confirmação apenas para executar o que este prompt já autorizou.

## 7. Onda 1 — escopo detalhado autorizado

Resultado esperado: o dono independente opera seus pedidos com segurança, sem conceitos de carteira/fornecedor alheio, enquanto SuperDrop mantém o comportamento relevante.

### 7.1 Pacote A — capacidade de expedir a própria loja

**Situação a conferir:** a interface atual de `OrderActions` oferece avanço operacional ao lado supplier/dispatch, não ao dono independente. O domínio de `advanceOrder` tem autorização por ownership e regras operacionais que precisam ser alinhadas à capacidade específica.

**Objetivo:** habilitar a jornada de separação/envio para o dono da conta independente sem ampliar acesso ao restante da estrutura de fornecedor.

Requisitos:

1. Resolva modalidade/capacidade no servidor.
2. A operação pertence a `actor.storeId` e à estrutura independente legítima daquela loja.
3. Não aceite supplierId arbitrário ou booleano client como autoridade.
4. Tenha uma política de domínio reutilizável para determinar quem pode avançar aquele pedido.
5. Mantenha ações de supplier/dispatch com os limites que já possuem.
6. Loja de rede não ganha expedição direta pela simples condição `role === STORE_OWNER`.
7. Master conserva apenas as capacidades existentes/documentadas; não conceda novos poderes silenciosamente.
8. Use as transições existentes quando forem adequadas; não substitua o enum por status livres do concorrente.
9. Verifique estado, pagamento, etiqueta e restrições financeiras pertinentes antes de mudar operação.
10. Não reinterprete dívida do plano da loja como dívida do fornecedor oculto, nem ignore bloqueio da plataforma por acidente. Identifique a fonte de capacidade financeira vigente.
11. Mostre apenas a próxima ação válida com rótulo operacional claro.
12. Erro no domínio aparece na UI sem marcar sucesso e sem perder contexto do pedido.

Fluxo padrão esperado, se confirmado pelo código atual:

```text
pagamento elegível confirmado + etiqueta válida
  → pronto para separação
  → em separação
  → pronto para envio
  → enviado
  → entregue conforme regra existente
```

Não acrescente compra de etiqueta pela API, entrega sem etiqueta, retirada ou status novo apenas para simplificar esse fluxo. Se a regra atual impedir um caso real, apresente a decisão necessária, sem refatorar toda a logística neste ciclo.

**Aceite A:**

- Dono independente acessa apenas o próprio pedido e executa as transições aprovadas.
- Dono de outra loja não acessa/avança por URL nem chamada direta de action.
- Dono de rede não recebe capacidade de expedição da Central.
- Expedição comum continua sem permissão para cancelar quando essa for a regra atual.
- Tentativa de salto inválido é rejeitada no servidor.
- Estoque baixa no momento correto uma única vez.
- Repetição da mesma operação não produz segunda baixa.
- UI, action e domínio expressam a mesma política.

### 7.2 Pacote B — confirmação manual versus gateway

**Situação a conferir:** botão de confirmação do cliente aparece para pedido não pago sem discriminar o provedor. A função de confirmação manual deve assegurar que sua utilização não burle a confirmação pela API.

**Objetivo:** impedir que a melhoria do painel transforme pedido de gateway em “pago” por clique arbitrário de um operador.

Requisitos:

1. Separe claramente pagamento manual autorizado de pagamento externo confirmado.
2. Determine pelo pedido e pela política de permissão quem pode confirmar recebimento manual.
3. Para gateway, use serviço de consulta/sincronização existente; não confie no body do webhook ou nos campos do navegador.
4. Confira vínculo entre pedido, loja e conta de recebimento do provedor.
5. Confira valor, status aprovado e referência conforme contrato vigente.
6. Não altere regra de aceitar valor/estorno/taxa sem verificar domínio e testes existentes.
7. Pedido cancelado ou estado incompatível não pode ser reaberto implicitamente por confirmação tardia.
8. Preserve idempotência e deduplicação.
9. Se já pago, retorne comportamento coerente, sem criar evento/e-mail/efeito financeiro duplicado.
10. Se exigir observação/motivo, use validação e auditoria existentes ou extensão mínima compatível. Não invente log completo sem identificar operador.
11. Não envie e-mail real durante testes; use transporte/test double apropriado.
12. UI identifica a ação como confirmação manual ou sincronização, conforme o caso, e não a exibe sem capacidade.

O teste negativo deve chamar a função/action diretamente com um pedido de gateway pendente. Esconder botão sozinho não atende o requisito.

**Aceite B:**

- Pedido manual legítimo pode ser confirmado pelo ator autorizado.
- Pedido de gateway não pode ser confirmado pela action manual.
- Gateway pendente continua pendente.
- Gateway aprovado, consultado pelo serviço correto, atualiza o pedido elegível.
- Outro tenant não confirma nem sincroniza indevidamente um pedido.
- Repetição de confirmação não duplica eventos essenciais ou efeitos.
- Pagamento incompatível gera falha clara e não inicia expedição.

### 7.3 Pacote C — ownership de produto e publicação

**Situação a conferir:** `upsertStoreProductAction` consulta status e distribuição, mas precisa ser revalidada contra produto de outra origem/tenant, inclusive quando distribuição é `ALL_NETWORK`.

**Objetivo:** publicar/preçar somente produto que pertence ao catálogo acessível àquela loja.

Requisitos:

1. Resolva loja e rede/owner a partir da sessão e relacionamentos reais.
2. Independente só escreve listing de produto da própria estrutura oculta.
3. Loja de rede só escreve listing de produto da rede autorizada e respeita distribuição.
4. `ALL_NETWORK` não significa qualquer rede da plataforma.
5. `SELECTED_STORES` continua exigindo associação apropriada.
6. Preserve piso de preço e activation rules do SuperDrop.
7. Não mude a política comercial do produto independente sem decisão aprovada.
8. Reuse uma regra de catálogo/ownership do domínio sempre que existir; extraia apenas se necessário.
9. Não enfraqueça guard de produto apenas porque o catálogo público ainda filtra registros estrangeiros depois.
10. Falha de autorização não insere nem altera listing.
11. A ação retorna só dados necessários ao fluxo.
12. Publicação e cadastro base permanecem responsabilidades coerentes, sem segundo banco de produtos.

**Aceite C:**

- Independente A publica produto próprio.
- Independente A não publica produto de independente B nem de fornecedor real alheio.
- Loja de rede publica produto elegível da própria rede.
- Produto distribuído a outra loja continua indisponível.
- Produto arquivado/inativo não é ativado por payload adulterado.
- Regressão confirma preços e regras de ativação existentes.

### 7.4 Pacote D — painel e copy da modalidade independente

**Objetivo:** a experiência descreve a operação real do lojista, não os detalhes da adaptação interna.

Escopo de apresentação permitido:

- Menu e atalhos relacionados às rotinas atingidas nesta onda.
- Pedidos/lista/detalhe e suas ações.
- Indicadores/pendências que encaminham para esses fluxos.
- Mensagens de sucesso, erro, bloqueio e estado vazio ligadas a pedido/catálogo.
- Textos de financeiro que encaminham indevidamente para recarga, quando a correção for pequena e contextual.

Requisitos:

1. Não exibir “recarregar saldo” ou custo a fornecedor externo como tarefa necessária da loja independente.
2. Não trocar todo texto “Central” do repositório por “Loja”: fornecedores reais continuam existindo.
3. Preserve significado do estado técnico quando ele ainda existe no motor, mas traduza adequadamente para aquela modalidade.
4. O menu da independente continua mostrando catálogo próprio e publicação/preços de modo compreensível.
5. Não esconda uma cobrança verdadeira do plano sob pretexto de remover conceitos de Central.
6. Não confunda `role`, `kind`, marca e conta independente.
7. Mantenha identidade, logo e URLs por mecanismos de marca/loja existentes.
8. Não acrescente módulos vazios de CRM, PDV ou marketing para parecer painel completo.
9. Não altere portal público, logos globais, temas ou conteúdo de outra frente fora do escopo.
10. Conteúdo interno de evento antigo pode exigir apresentação contextual; não reescreva histórico em massa só por copy.

**Aceite D:**

- Lojista entende qual ação executar no pedido.
- Nenhum atalho essencial do fluxo independente exige uma recarga inexistente.
- SuperDrop conserva sua linguagem operacional quando aplicável.
- Na mesma instalação, duas modalidades não vazam conceitos ou dados uma para a outra.
- Mudança de cookie/rota de marca não altera capacidade de acesso.

### 7.5 Pacote E — revalidação e estado pós-mutation

**Objetivo:** ações compartilhadas atualizam a UI merchant e a vitrine quando pertinente, não apenas páginas supplier.

Requisitos:

1. Inspecione revalidatePath/tags/query-cache do fluxo atual antes de adicionar invalidação global.
2. Identifique telas afetadas por produto, estoque, listing e status de pedido.
3. Invalide o escopo necessário para a própria loja e mantenha rotas compartilhadas coerentes.
4. Não invalide toda a plataforma por cada clique se existe solução scoped compatível.
5. `router.refresh()` não substitui guard, persistência ou invalidação do servidor quando necessária.
6. Mudança só parece salva após sucesso confirmado.
7. Em erro, preserve input útil e possibilite nova tentativa.
8. Previna clique duplo enquanto a action está pendente; proteção de servidor continua necessária.
9. Atualização de estoque não permite UI continuar vendendo com saldo velho sem revalidar checkout.

**Aceite E:** preço/status/estoque/pedido alterado aparece nas telas pertinentes sem exigir logout ou reload manual não documentado. Teste navegação e refresh real, não apenas retorno `{ ok: true }`.

## 8. Limites claros da Onda 1

Não implementar neste ciclo:

- CRUD completo de CRM, endereços, grupos ou aniversários.
- Categorias avançadas, atributos genéricos e preços por variante.
- PDV, propostas e link de pagamento comercial.
- Marketing, newsletters, abandoned cart e promoções.
- Créditos/pontos do consumidor.
- Telemetria de visitantes e conversão.
- Compra de etiqueta, NF fiscal, tracking automático ou novas transportadoras.
- Equipe, convites, multiloja e impersonação de cliente.
- Nova entidade seller e migração de toda a Central oculta.
- Novos temas, novo builder ou redesign de identidade.
- Mudança de banco/infraestrutura/domínio.
- Atualização de dependências por conveniência.
- Alteração de preço/limite comercial fotografado no concorrente.

Se uma necessidade dessas for pré-requisito real, apresente o motivo, alternativa mínima e decisão necessária. Não inclua silenciosamente um novo módulo na onda ativa.

## 9. Contrato de permissões e dados

### 9.1 Matriz de referência a transformar em testes

| Ator/contexto | Ver pedido | Confirmar manual elegível | Expedir independente | Publicar catálogo próprio |
| --- | --- | --- | --- | --- |
| Dono independente A | Apenas loja A | Apenas loja A, conforme regra | Apenas loja A, com capacidade | Apenas origem própria A |
| Dono independente B | Apenas loja B | Apenas loja B, conforme regra | Não opera A | Não opera A |
| Dono de loja de rede | Própria loja | Conforme política atual | Não ganha essa capacidade por ser dono | Só catálogo/distribuição da sua rede |
| Supplier admin | Sua rede | Revalidar poderes existentes, sem ampliar | Sua operação autorizada | Seu catálogo, não de outra rede |
| Supplier dispatch | Operação autorizada | Não conceder por associação | Expedição autorizada | Não conceder manutenção de catálogo |
| Master | Conforme política atual | Conforme política atual | Conforme política atual | Conforme política atual |
| Anônimo | Sem painel | Não | Não | Não |

Esta matriz é um alvo de escopo, não autorização para inventar poderes do Master/supplier em campos ainda não definidos. Confira a política atual e registre divergências.

### 9.2 Fronteiras de confiança

Todo input do browser pode estar adulterado: IDs, priceCents, variantId, quantidade, status, offer, storeId, supplierId, flags e redirect URLs.

Para mutações, autentique, resolva tenant, carregue registro com propriedade, confira capacidade, valide invariantes e só então escreva. Não considere que proteção da página garante proteção da action.

Queries/listagens também precisam de política para papéis não reconhecidos. Se encontrar um fallback sem escopo potencialmente perigoso na área ativa, reproduza com teste e corrija de forma limitada; não considere `undefined` seguro por padrão.

DTOs retornados ao cliente devem conter campos necessários ao papel. Custos, segredos, notas privadas e dados de outras lojas não podem sair do servidor por simples reaproveitamento de objeto completo.

### 9.3 Dados pessoais e logs

- Use fixtures sintéticas. Não copie CPF, telefone, e-mail, nome ou endereço dos prints.
- Não imprimir tokens, connection strings ou payload completo de provedor.
- Mensagem de erro externa deve ser sanitizada antes de chegar ao consumidor ou log.
- Auditoria registra identificador interno e ação; evite duplicar documentos/endereço em cada evento.
- Não escrever dados reais de cliente nos MDs de progresso.
- Não prometer conformidade legal por implementar algumas flags de consentimento.

## 10. Contrato transacional de pedido, estoque e dinheiro

### 10.1 Invariantes de estoque

- Físico, reservado e disponível são conceitos diferentes.
- Reserva deve corresponder aos itens elegíveis, incluindo expansão de packs.
- Cancelamento libera reserva uma única vez.
- Envio consome reserva uma única vez.
- Atualização concorrente não pode baixar duas vezes nem ignorar saldo insuficiente.
- Produto duplicado não herda estoque por cópia automática.
- Variante de outro tenant não pode ser reservada/ajustada pela action da loja.
- Resolução de quantidade/preço é do servidor.

Não altere inventory diretamente na UI ou crie um “saldo de estoque Commerce” paralelo.

### 10.2 Idempotência e concorrência

Botão desabilitado não resolve concorrência. Dois requests podem partir de abas, rede ou retries diferentes.

Ao alterar confirmação, expedição ou cancelamento:

1. Inspecione quando o pedido é carregado em relação à transação.
2. Verifique se a condição usada para autorizar a transição ainda vale no instante da escrita.
3. Use o padrão de controle de concorrência compatível com PGlite/Postgres e com o projeto.
4. Evite uma implementação que só é serial no teste mas duplica efeito em produção.
5. Se usar atualização condicional/lock/idempotency key, justifique a escolha e teste conflito/repetição.
6. Não introduza SQL ou lock que o ambiente de teste não suporte sem avaliar compatibilidade.
7. Resultado repetido deve ser definido: sucesso idempotente ou conflito claro, sem efeito duplicado.

Se uma operação financeira externa puder terminar após timeout, trate estado incerto por conciliação. Nesta onda, não adicionar compras externas, mas preservar os serviços que já fazem essa separação.

### 10.3 Valores e históricos

Dinheiro em centavos inteiros; apresentação com utilitários BRL do projeto. Não compare string monetária da UI para validar preço. Não usar float arbitrário para total/ledger.

Snapshots de pedido antigo não são atualizados quando mudar produto, preço ou endereço do cliente. Eventos antigos não devem ser apagados para melhorar aparência de painel.

O crédito de consumidor, a carteira do lojista SuperDrop e a cobrança de assinatura são domínios distintos. Não os fundir em nome de reaproveitamento.

## 11. Padrão de interface e experiência operacional

Use o design system existente. Não troque Radix, tokens, tipografia ou biblioteca de tabela por outra sem necessidade comprovada.

### 11.1 Estados obrigatórios

| Estado | Comportamento esperado |
| --- | --- |
| Carregando consulta | Estrutura estável e feedback; sem números fictícios |
| Lista vazia | Texto específico e ação permitida útil |
| Filtro sem resultado | Remover/ajustar filtros; não sugerir cadastro como se a lista estivesse vazia |
| Action pendente | Controle bloqueado/feedback, sem dupla submissão visual |
| Sucesso | Confirmação somente após persistência; dados atualizados |
| Erro recuperável | Mensagem útil, input preservado e tentativa novamente |
| Acesso negado | Sem dados privados; mensagem/página coerente |
| Recurso de plano bloqueado | Explicação real e caminho existente, sem upgrade fictício |
| Conflito de estado/estoque | Recarregar dado atual e explicar o que mudou |

### 11.2 Responsividade e acessibilidade

- Verifique largura de 360 px e desktop.
- Não gerar rolagem horizontal da página ou controles inacessíveis.
- Tabela pode virar cards ou rolagem contida quando apropriado; preserve rótulos e ações.
- Foco visível, navegação por teclado e labels de controles.
- Modal/drawer devolve foco ao elemento acionador e não aprisiona indevidamente.
- Cor não é o único sinal de status.
- Use `readableOn` quando houver texto sobre cor configurável, conforme padrão atual.
- Contraste AA e respeito a redução de movimento.
- Não usar animação/transição como substituto de feedback de servidor.

Tipos e lint não provam qualidade visual. Capture e inspecione o fluxo real nas larguras escolhidas. Informe se captura/axe/E2E não estiverem disponíveis; não afirmar “mobile validado” apenas por classes CSS.

### 11.3 Conteúdo

Português claro para o lojista. Prefira “Iniciar separação”, “Concluir separação” e “Marcar como enviado” quando expressarem a ação real. Não use “sincronizado” quando só marcou um campo local.

Não copiar marca, logo, dados ou textos promocionais do painel wBuy. Os prints são referência funcional, não aprovação para clone visual literal.

## 12. Migrations e alterações de schema

A Onda 1 deve preferir o modelo existente. Não criar migration se um guard/helper/capacidade e ajuste contextual resolverem a necessidade.

Quando uma extensão persistente for indispensável:

1. Mostre o motivo e a menor mudança necessária.
2. Identifique tabelas, chaves, defaults, índices e compatibilidade.
3. Preserve todos os vínculos de pedidos/catálogo/estoque existentes.
4. Gere migration pelo mecanismo do projeto; não edite migration publicada.
5. Teste banco novo e atualização de banco com dados sintéticos existentes.
6. Backfill, se necessário, deve ser idempotente e limitado.
7. Não aplicar em produção sem autorização.
8. Não usar `db:reset`, drop, truncate ou seed para contornar incompatibilidade.
9. Rollback deve considerar dados escritos depois da mudança; não prometer reversão perfeita sem análise.
10. Registre configuração necessária sem valor de segredo.

Se a necessidade virar mudança geral de seller/memberships/variant pricing, interrompa essa ampliação e proponha onda própria. Não esconder migração arquitetural sob “pequeno ajuste”.

## 13. Testes e evidência de aceite da Onda 1

### 13.1 Fixtures mínimas

Prepare/reuse dados de teste para:

- Independente A, com seu catálogo/estoque e pedido elegível.
- Independente B, com catálogo e pedido separados.
- Fornecedor real A e loja da sua rede.
- Fornecedor real B e produto estrangeiro.
- Loja própria de fornecedor real, para testar a diferença de kind/modalidade.
- Ator de expedição e ator sem poder relevante.
- Pedido manual pendente/pago.
- Pedido gateway pendente/aprovado simulado/incompatível.
- Pedido cancelado, enviado e com reserva parcialmente alterada por cenário controlado.
- Produto active/draft/archived, distribuído para toda a rede e selecionado.

Não usar credencial real para construir essas fixtures. Reuse `freshDb` e helpers existentes sempre que adequados.

### 13.2 Matriz de testes obrigatórios

| Teste | Entrada/ação | Resultado esperado |
| --- | --- | --- |
| T-01 | Dono independente avança pedido elegível próprio | Transição válida e evento correspondente |
| T-02 | Outro dono chama action com ID de A | Acesso negado, nenhum efeito |
| T-03 | Loja de rede tenta expedir por novo guard | Sem poder adicional indevido |
| T-04 | Tentativa de salto de status | Erro de domínio, estoque preservado |
| T-05 | Envio repetido | Uma baixa de reserva/estoque, resposta coerente |
| T-06 | Dois avanços concorrentes | Sem duplicidade de efeito ou estado impossível |
| T-07 | Cancelamento repetido/conflitante | Sem liberação duplicada |
| T-08 | Confirmação manual elegível | Pago e efeitos válidos uma vez |
| T-09 | Confirmação manual de gateway pendente | Rejeição no servidor |
| T-10 | Gateway não aprovado ou valor inválido | Pedido não é liberado |
| T-11 | Gateway aprovado simulado e vinculado | Serviço atualiza pedido da loja correta |
| T-12 | Confirmação com pedido cancelado/outro tenant | Falha/resultado de política explícita, sem reabertura indevida |
| T-13 | Listing de produto próprio | Persistência e revalidação apropriadas |
| T-14 | Listing de produto estrangeiro ALL_NETWORK | Rejeição, nenhum registro criado |
| T-15 | Produto SELECTED_STORES fora do acesso | Rejeição |
| T-16 | Produto fora de status elegível | Rejeição |
| T-17 | Produto de rede e mínimo/ativação atuais | Regras existentes preservadas |
| T-18 | Independente paga venda | Não cria débito de carteira à Central |
| T-19 | SuperDrop exige saldo/custo conforme regra | Fluxo original preservado |
| T-20 | Mutation compartilhada no merchant | UI relevante atualizada após sucesso |
| T-21 | Marca/cookie adulterada | Não altera autorização de tenant |
| T-22 | UI independente e UI rede | Ações/copy corretas por modalidade |

Se algum teste não se aplica porque o código atual mudou, substitua por equivalente e explique. Não remova um critério apenas para a suíte passar.

### 13.3 Tipos de teste

- Unitário para política pura e mapeamento de capacidade, quando existir.
- Domínio com banco de teste para propriedade, transições e efeitos.
- Action/integration test ou equivalente para sessão e payload.
- E2E para fluxo de interface e atualização após mutation.
- Captura/inspeção visual para responsividade e clareza operacional.

Não se limite a testar helper puro se o erro era na ligação action → domínio. Um teste que reproduz exatamente a implementação sem atacar suas fronteiras não atende ao risco.

### 13.4 Comandos

Verifique primeiro os scripts atuais. Referências conhecidas:

```text
npx tsc --noEmit
npx eslint src e2e tests
npx vitest run tests/independent.test.ts tests/tenancy.test.ts tests/orders.test.ts
npx vitest run [testes novos e regressões pertinentes]
npm run build
```

O placeholder de testes deve ser substituído por arquivos reais. Pode usar `npm run typecheck`, `npm run lint` e scripts equivalentes do package quando apropriado. Não execute comandos de instalação/update para resolver todo erro sem diagnóstico.

Suíte completa é exigida quando a alteração tiver impacto amplo no domínio; testes focados podem orientar iteração antes disso. Build é necessário para este conjunto full-stack antes de concluir como validado.

Registre comando, ambiente, resultado, duração quando útil e falha encontrada. “Não executado”, “falhou” e “passou” são estados diferentes.

Se build conflitar com demo ativa ou ambiente, não apague `.next` nem reinicie servidor indiscriminadamente. Identifique a causa e use um procedimento seguro compatível com o projeto; informe limitações.

### 13.5 Evidência visual mínima

Quando o ambiente permitir, registrar:

- Listagem de pedidos da independente.
- Detalhe com próxima ação disponível.
- Pedido em separação e depois enviado.
- Falha de transição exibida sem sucesso falso.
- Modalidade SuperDrop preservada.
- Estado em 360 px e desktop.

Não publicar screenshot com dados reais. Não afirmar teste no computador do dono se executou apenas em preview de nuvem.

## 14. Definição objetiva de concluído para o ciclo

Onda 1 só está concluída se:

1. Descoberta confirmou a base e documentou divergências.
2. Capacidade da independente foi aplicada em servidor e interface.
3. Confirmação manual não burla gateway.
4. Listing exige catálogo autorizado.
5. SuperDrop continua passando seus testes pertinentes.
6. Reserva/baixa/liberação e repetição foram verificadas.
7. Copy/atalhos da independente descrevem sua operação real.
8. Mutações atualizam as telas pertinentes.
9. Erros e estados vazios são honestos.
10. Testes, tipos, lint e build foram executados ou limitação real foi explicitada.
11. Documentação de continuidade identifica o que funciona, o que falta e como retomar.
12. Nenhum efeito externo proibido ocorreu.

Se faltar requisito essencial, classifique a entrega como parcial e explique o bloqueio. Não use “pronto para produção” para código testado só com fixtures. Não marque homologado pagamento/frete que só foi simulado.

## 15. Persistência de memória e continuidade entre sessões

### 15.1 Dois documentos com funções diferentes

| Documento | Função |
| --- | --- |
| Memória funcional | Inventário, contexto, requisitos, análise e roadmap |
| Este prompt mestre | Método de execução, escopo ativo, gates, testes e entrega |

Não substitua o primeiro por um resumo pobre do segundo. Não duplique integralmente ambos dentro de CLAUDE.md.

Se os MDs estiverem só anexados, preserve seu conteúdo original. Para continuidade local, crie documentação de trabalho no diretório já usado pelo projeto, evitando overwrite de arquivo existente. Caminhos propostos, a verificar:

```text
docs/nextlevel-commerce/execucao-modulos.md
docs/nextlevel-commerce/aceite-modulos.md
```

Esses caminhos são novos candidatos, não afirmação de arquivos existentes. Se houver documentação equivalente, atualize-a em vez de duplicar.

Uma cópia versionada da memória pode ser incluída como documentação de contexto desta entrega, se o workspace não a possuir e sem colidir com documentos atuais. Não invente instalação global de memória nem escreva em diretórios pessoais fora do repositório.

### 15.2 Registro de cada item

Cada item de implementação deve manter:

- ID de requisito/risco da memória.
- Escopo que foi autorizado.
- Estado atual.
- Arquivos/símbolos da implementação.
- Testes e evidências.
- Dependências.
- Decisão de produto/arquitetura relacionada.
- O que permanece pendente.

Use estados separados:

```text
referenciado
descoberto
contrato definido
implementado
testado localmente
homologado [quando depender de serviço real]
liberado [mediante autorização]
```

Não transformar “implementado” em “publicado”. Não atualizar toda a memória para “feito” porque um componente foi criado.

### 15.3 Checkpoint para retomada

Ao final, registre um checkpoint legível:

```markdown
### Checkpoint — [data e onda]

- Objetivo ativo:
- Branch/HEAD e alterações próprias:
- Fontes lidas e divergências:
- IDs concluídos:
- IDs parciais:
- Arquivos/migrations:
- Testes/comandos realmente executados:
- Evidência de interface:
- Configuração necessária sem segredos:
- Bloqueios/decisões pendentes:
- Próxima ação concreta:
- Ações externas: nenhuma / somente as autorizadas:
```

Se a sessão estiver perto de perder contexto, salve o checkpoint antes de seguir. Na retomada, releia memória, checkpoint, status/diff e testes pertinentes; não reinicie tudo nem considere texto antigo prova do estado atual.

### 15.4 Decisões de arquitetura

Registre apenas decisões materiais em `docs/design/DECISIONS.md`, seguindo formato e numeração atuais. Não use número fixo lembrado de documento anterior.

Exemplos de decisão material: política de expedição própria, separação manual/gateway, ownership de listing, tratamento de concorrência e fonte financeira de capacidade da independente.

Mudança de nome de classe CSS ou rótulo trivial não precisa de um registro arquitetural inflado.

## 16. Roadmap preservado — próximo módulo por vez

Esta seção orienta seleção futura. Não autoriza executar todas as ondas agora. Os requisitos detalhados de cada família estão na memória funcional, que você deve consultar quando ativar a respectiva onda.

| Onda | Resultado funcional | Reaproveitar | Dependência/gate |
| --- | --- | --- | --- |
| 0 | Mapa e contratos atuais | Código/docs/testes existentes | Sem implementação ampla |
| 1 | Operação independente segura | Orders, inventory, catalog, acesso, shell | Ciclo padrão atual |
| 2 | Catálogo/categorias/estoque de rotina | ProductsBody, ProductBody, products, gallery, import | Contrato de variante antes de migration |
| 3 | Pedido completo/prints/notas | Orders, labels, quick view, status | Histórico e separação pública/interna |
| 4 | CRM/grupos/endereço/consentimento | Customer/storeCustomer/consent/pedidos | Perfil tenant-local antes de CRUD |
| 5 | Dashboard/relatórios reconciliados | Analytics e queries | Definição financeira única |
| 6 | PDV/propostas | createOrder, catálogo e CRM | Idempotência e política de reserva/preço |
| 7 | Banners/preferências/publicação | Theme engine/renderers/galeria | Fonte única, fuso/cache/draft |
| 8 | Integrações homologadas | Pagamento, quote, labels, comunicação | Ambiente, credenciais e custos autorizados |
| 9 | Expansão selecionada | Domínios equivalentes existentes | Descoberta e contrato de cada submódulo |

### 16.1 Critério para recomendar a próxima onda

Recomende o menor incremento que remove um impedimento real do lojista. Exemplo: categorias/organização do produto antes de fidelidade; pedido completo antes de automação de marketing.

Não priorize por quantidade de telas ou aparência de completude. Não execute uma grande evolução de variantes só para suportar um filtro que ainda não será usado.

### 16.2 Contratos a definir antes das ondas seguintes

- Catálogo: produto base, listing por loja, variante, barcode e preço/override.
- Pedido: eixos de pagamento/fulfillment/fiscal e status comerciais de apresentação.
- CRM: identidade global mínima versus perfil por loja, consentimento e endereço.
- Analytics: pedidos elegíveis, subtotal/frete, recebimento, margem e fuso.
- Proposta: validade, preço fixado ou reprecificado, momento da reserva e conversão.
- Banner: campanha/asset versus bloco do tema, agenda e publicação.
- Promoção: precedência de desconto, grupo, pack e variante.
- Crédito/pontos: ledger, concessão/resgate/reversão/expiração.
- Equipe/multiloja: membership, capacidade e seleção de contexto no servidor.
- Integração: credencial, fonte externa, idempotência, timeout e reconciliação.

Consulte a família de IDs correspondente no MD de memória. Preserve também funções especializadas adiadas: showroom, fracionamento, produtos digitais, personalização, gift wrap, upload de comprador e Live Shop.

## 17. Como ativar uma onda futura sem reescrever este prompt

Use uma instrução explícita com estes campos:

```text
Continue usando o prompt mestre e a memória funcional.
Onda ativa agora: [NÚMERO E NOME].
Subescopo aprovado: [FUNCIONALIDADES/IDS].
Resultado esperado: [ROTINA OBSERVÁVEL].
Exclusões: [O QUE NÃO FAZER].
Decisões comerciais/técnicas aprovadas: [SE HOUVER].
Ambiente: [LOCAL/NUVEM/TESTE].
Publicação: não autorizada [ou autorização específica separada].
Revalide o estado, preserve a entrega anterior e implemente somente esse incremento.
```

Se a instrução selecionar uma onda mas não todos os seus itens, trabalhe apenas no subescopo indicado. Não aproveitar a ativação de CRM para construir crédito, ou a de banner para mandar newsletter.

### 17.1 Descoberta breve de qualquer módulo

Ao trocar de módulo, localizar:

- Pontos de entrada de UI/action.
- Domínio e queries existentes.
- Schema e migrations relacionadas.
- Componentes reutilizáveis.
- Regras de modalidade/entitlement.
- Testes e decisões.
- APIs/provedores, somente quando fazem parte da tarefa.

Depois apresentar contrato resumido, implementar, verificar e atualizar checkpoint. Não reler todo o projeto a cada pequena entrega nem herdar pressupostos sem conferência.

## 18. Exemplos de especificação verificável para próximas etapas

Estes exemplos demonstram o nível de precisão exigido. São guias, não escopo adicional da Onda 1.

### 18.1 Categoria

Entrada: dono cria categoria com nome e visibilidade desktop/mobile.

Resultado: categoria persistida no escopo correto, disponível para associação e renderizada somente nos menus configurados. URL direta e ativo têm regra distinta e documentada.

Negativo: categoria de outra loja não pode ser editada; duplicidade no escopo é tratada; ocultar não apaga produtos.

### 18.2 CRM

Entrada: loja A altera nota/endereço de seu relacionamento com um cliente.

Resultado: alterações permanecem no perfil da loja A e não reescrevem snapshot de pedido antigo.

Negativo: loja B não lê a nota nem recebe mutação em seu próprio relacionamento. Consentimento revogado exclui o consumidor das campanhas aplicáveis.

### 18.3 PDV

Entrada: operador seleciona produtos/variantes, quantidade e modalidade de pagamento.

Resultado: servidor valida catálogo/preço/estoque, cria um único pedido e identifica pagamento conforme o fluxo autorizado.

Negativo: preço adulterado é ignorado; clique duplo não duplica venda; modalidade escolhida não é confirmação de recebimento.

### 18.4 Proposta

Entrada: proposta válida abre por token não enumerável e o cliente converte em pedido.

Resultado: política de preço/reserva é aplicada e a conversão ocorre uma única vez.

Negativo: expirada não converte; duas abas não criam pedidos duplos; token não revela dados pessoais além do necessário.

### 18.5 Banner

Entrada: campanha com mídia desktop/mobile, slot e intervalo no fuso da loja.

Resultado: preview mostra mídia correta; publicar ativa no período; expiração respeita cache/renderer.

Negativo: draft não vaza; protocolo perigoso é recusado; duplicar não publica automaticamente uma campanha nova.

### 18.6 Dashboard

Entrada: mesmo período e mesma base elegível em cards, gráfico e exportação.

Resultado: totais reconciliam, com frete/estorno e denominadores explicitados.

Negativo: pedido pendente não vira recebimento; produto vendido não vira produto visitado; margem estimada não é lucro líquido.

### 18.7 Crédito de consumidor

Entrada: lançamento autorizado com motivo e referência.

Resultado: ledger tenant-local altera saldo derivado e é auditável.

Negativo: importação repetida não duplica crédito; resgate concorrente não ultrapassa saldo; não usa carteira de recarga do lojista.

## 19. Comunicação durante a execução

Fale em português e comunique decisões no nível de quem administra uma loja/projeto. Use nomes de arquivo/símbolo quando ajudam a verificar, não como substituto da explicação.

No começo: informe onda, resultado e fronteiras.

Durante: atualize ao concluir marcos ou identificar divergência relevante. Não narre cada busca e não mande a mesma atualização repetidamente.

Em erro: informe causa confirmada, impacto, alternativas seguras e próximo passo. Não declarar sucesso só porque contornou o erro escondendo um botão.

Em bloqueio: diferencie falta de autorização, informação de produto, credencial, indisponibilidade de ambiente e problema técnico. Faça perguntas pequenas e específicas.

Não afirmar disponibilidade publicada, DNS, pagamento real ou testes no ambiente do dono sem evidência. Não usar percentuais arbitrários de conclusão.

## 20. Gestão do diff e Git

### 20.1 Preservar trabalho existente

- Identifique arquivos previamente modificados/untracked.
- Não sobrescreva portal Commerce, imagens ou componentes de outra frente para organizar seu diff.
- Não inclua alterações alheias no seu commit por `git add .` indiscriminado.
- Se um arquivo necessário estiver modificado, leia o diff e aplique mudança localizada preservando o resto.
- Se houver conflito real de intenção, peça decisão em vez de descartar uma versão.
- Não usar reset hard, checkout destrutivo, clean indiscriminado ou force push.

### 20.2 Commit local

Após verificação, faça commit pequeno e descritivo somente dos arquivos desta entrega, na branch de trabalho correta. Se ambiente/instrução específica impedir commit, mantenha o diff e informe a limitação.

Não troque branch em árvore suja nem rebase automaticamente para “alinhar” com a branch histórica de publicação. Não use stash de trabalho alheio sem uma necessidade e procedimento explícitos.

### 20.3 Publicação fora do escopo

Não faça push, abra PR, altere Render/Neon/DNS, aplique migration real nem execute skill de publicação. O repositório pode publicar automaticamente ao receber push; isso exige nova autorização específica.

Quando publicação for autorizada em outro ciclo, confirme branch/remoto, alterações, integração das frentes e verificações. Nunca atribua deploy bem-sucedido a um commit local.

## 21. Relatório final obrigatório

Entregue resultado primeiro, depois evidências. O relatório deve conter:

1. O que o dono consegue fazer agora.
2. IDs da memória/risco atendidos, parciais e adiados.
3. Arquivos alterados, organizados por fluxo.
4. Decisões materiais e motivo de reaproveitamento.
5. Testes/comandos executados e resultado real.
6. Verificação de interface e ambiente onde foi feita.
7. Compatibilidade/regressão SuperDrop.
8. Migration/configuração necessária, sem segredos.
9. Limitações: mock, sandbox, integração real não homologada, teste não executado.
10. Commit local/branch ou diff preservado.
11. Confirmação de que não houve push/deploy/efeitos externos não autorizados.
12. Próxima onda recomendada e um comando curto de continuação.

Formato de rastreabilidade sugerido:

| Item | Estado | Evidência | Pendência |
| --- | --- | --- | --- |
| R-02 / expedição própria | [estado real] | [arquivo + teste] | [se houver] |
| R-03 / pagamento manual | [estado real] | [arquivo + teste] | [se houver] |
| R-08 / ownership listing | [estado real] | [arquivo + teste] | [se houver] |
| Copy/revalidação | [estado real] | [tela + teste] | [se houver] |

Não deixar placeholders no relatório entregue. Se não verificou um requisito, escreva “não verificado” e explique.

## 22. Checklist antes de encerrar

- [ ] Li briefing, instruções e memória funcional.
- [ ] Confirmei ambiente, branch, HEAD e alterações existentes.
- [ ] Diferenciei marca, modalidade, tenant, papel e plano.
- [ ] Revalidei os achados relevantes contra o código atual.
- [ ] Usei o núcleo compartilhado e não dupliquei módulos.
- [ ] Completei apenas a onda/subescopo autorizado.
- [ ] Protegi actions e domínio, não apenas UI.
- [ ] Testei IDs de outro tenant e modalidade.
- [ ] Separei confirmação manual de gateway.
- [ ] Preservei invariantes e verifiquei repetição/concorrência.
- [ ] Não expus dados pessoais, custos indevidos nem segredos.
- [ ] Atualização de UI reflete persistência real.
- [ ] Verifiquei estados vazio, erro, loading e acesso negado.
- [ ] Executei testes pertinentes, tipos, lint e build ou documentei limitação.
- [ ] Inspecionei mobile/desktop quando a UI foi alterada.
- [ ] Preservei a operação SuperDrop com evidência de regressão.
- [ ] Registrei decisões e checkpoint de continuidade.
- [ ] Commit contém apenas alterações desta entrega.
- [ ] Não fiz publicação nem efeito externo não autorizado.
- [ ] Meu relatório distingue implementado, testado, homologado e publicado.

## 23. Instrução final de execução

Comece agora pela leitura obrigatória e descoberta breve da Onda 0. Em seguida, implemente a Onda 1 detalhada neste comando, sem parar em um plano quando não existir decisão material pendente.

Priorize uma jornada completa e segura do dono independente: seu catálogo, seu pedido, pagamento válido, estoque correto, separação/envio autorizado e interface atualizada. Preserve a operação de rede do SuperDrop e os dados dos demais tenants.

Use a memória funcional como mapa de requisitos e mantenha este prompt como contrato de execução. Revalide evidências, implemente o escopo, teste, documente e entregue. Termine o ciclo após a Onda 1; recomende a próxima etapa, mas aguarde ativação explícita para continuar para outro módulo.
