# Prompt de desenvolvimento: Fornecedor 360 no Master (cadastro completo, painel de dados e "entrar como")

> Cole este documento como instrução de trabalho. É executável por fases (F0 a F6). Antes de codar, leia `AGENTS.md`, `docs/design/DECISIONS.md` (D1 a D32), `src/app/master/suppliers/*`, `src/lib/domain/provisioning.ts` (`createSupplier`), `src/lib/domain/supplier-page.ts`, `src/lib/domain/own-store.ts`, `src/lib/shipping/providers.ts` e `src/app/supplier/settings/shipping-card.tsx`. Registre as decisões em `docs/design/DECISIONS.md` (D33 em diante).

## 0. PONTO DE PARTIDA (o que existe hoje)
- `/master/suppliers/new` cria fornecedor com **só** nome/marca, cidade, UF, modelo (SuperDrop ou White Label), faixa (Start, Growth, Scale), chave "parceiro fundador" e o administrador (nome e e-mail, senha temporária).
- `/master/suppliers` lista nome, modelo, contrato, lojas, produtos, GMV e status, **sem detalhe**: a linha não leva a lugar nenhum.
- A página pública do fornecedor (`/f/[slug]`, tabela `supplier_pages`: logo, cores, WhatsApp, benefícios, FAQ, depoimentos, cupom) e o Mercado Pago/plataforma de envio do fornecedor (tokens criptografados) só o **próprio fornecedor** configura, depois de entrar.
- O Master não consegue ver a operação do fornecedor nem agir por ele. Não existe "entrar como". Hoje, no ambiente de demonstração, o seletor de perfis troca de usuário sem senha e **nunca** pode existir em produção.

## 1. O QUE O DONO QUER
1. **Cadastro completo do fornecedor** já na criação: subir a logo, criar o **link da página dele** (`/f/<slug>`, slug editável e verificado), conectar o **Mercado Pago** e a **plataforma de envio** (SuperFrete ou Melhor Envio) dele, e mais **opções avançadas de edição**.
2. **Clicar no fornecedor e abrir um painel de dados** da loja e da rede dele, para análise do Master.
3. **Ver a visão dele e entrar no sistema completo dele**, podendo **editar tudo lá dentro**, de forma segura e rastreável.

## 2. PRINCÍPIOS
- **"Entrar como" é privilégio máximo:** só o Master, sempre auditado (quem, quando, onde, o quê), com faixa fixa e visível na tela ("Você está no painel de <fornecedor> como NextLevel · Sair"), sessão com prazo curto, motivo obrigatório e aviso ao fornecedor (registro no sino e, na fase de e-mail, mensagem). Nunca pela troca de perfil da demonstração.
- **Tudo que o Master edita por ele passa pelo mesmo domínio** (mesmas regras, validações e permissões do fornecedor), sem atalhos de gravação direta. O ator continua sendo o fornecedor com um marcador `onBehalfOf`, e os eventos de domínio registram os dois.
- **Segredos nunca voltam para a tela:** tokens do Mercado Pago e da plataforma de envio entram uma vez, são validados na origem, guardados criptografados e exibidos só como "conectado (conta X)". O Master pode conectar, trocar e desconectar; não consegue ler.
- **Cadastro em etapas com rascunho:** o Master pode criar o fornecedor só com o essencial e completar depois; um indicador de completude mostra o que falta para o fornecedor ir ao ar.
- **Dados de um fornecedor jamais vazam para outro** (isolamento por tenant continua valendo em todos os painéis novos).

## 3. CADASTRO COMPLETO (`/master/suppliers/new` e `/master/suppliers/[id]/editar`)
Assistente em etapas, cada uma salvável:
1. **Identidade:** nome/marca, razão social, CNPJ (validado, único), responsável, e-mail e WhatsApp, cidade e UF, endereço da Central (origem do frete).
2. **Marca e página:** upload da **logo** (PNG, JPG ou WebP até 1,5 MB, tipo conferido pelos bytes, já existe em `store_assets`/`assets`), imagem de destaque, cores (com correção de contraste automática), título e subtítulo, benefícios, FAQ, depoimentos, WhatsApp da página, **link** `/f/<slug>` com verificação de disponibilidade em tempo real, **prévia ao vivo** da página em celular e computador, botão publicar/despublicar e **cupom de teste** do fornecedor (7 dias).
3. **Comercial:** modelo (SuperDrop ou White Label), faixa, contrato editável (mensalidade, setup, taxa de volume, mínimo, taxa por pedido, comissão de canal), isenção de fundador com prazo, trava de preço, dia de vencimento e observações internas. Mostra o **simulador de ganhos** da NextLevel com esses valores.
4. **Pagamentos:** Mercado Pago do fornecedor (access token, validação na API, apelido da conta, teste/produção, a mesma conta para recargas e pedidos externos, como já decidido em D25).
5. **Envio:** plataforma de envio (SuperFrete ou Melhor Envio), token validado, remetente, dimensões e peso padrão, transportadoras permitidas.
6. **Operação:** horário de corte por dia (fuso e feriados), estoque mínimo por tamanho para ativação de lojas, grades de tamanho padrão, política de reposição e prazos flexíveis de cobrança (`dunning`) próprios, quando o contrato pedir.
7. **Acesso e equipe:** administrador principal, usuários de expedição, senha temporária **ou convite por e-mail**, exigir troca no primeiro acesso, autenticação em duas etapas (fase futura).
8. **Revisão e publicação:** checklist de completude (logo, página publicada, Mercado Pago, envio, contrato, catálogo com estoque, primeiro pedido) com pendências clicáveis; botão **Criar e enviar acesso**.
Tudo com Zod no servidor, rascunho em `suppliers.onboardingState` (JSON validado), máscaras (CNPJ, telefone, CEP), estados vazios e ajuda em cada campo.

## 4. PAINEL DE DADOS DO FORNECEDOR (`/master/suppliers/[id]`)
Cabeçalho com marca, status, modelo, faixa, contrato e atalhos (**Ver como o fornecedor**, **Abrir página pública**, **Editar cadastro**, **Suspender/reativar**). Abas:
- **Visão geral:** receita gerada para a NextLevel (mensalidade, taxa de volume, setups, comissões), GMV, pedidos, ticket médio, lojas ativas/em teste/bloqueadas, saúde (nota da torre de controle), alertas abertos, comparativo com o mês anterior.
- **Rede de lojas:** lista com plano, acesso, pedidos, GMV, margem, recompra e saúde por loja; filtros e visões salvas; abrir a loja do membro.
- **Catálogo e estoque:** produtos ativos, estoque por tamanho, giro, rupturas, produtos parados, estoque mínimo e pendências que seguram estoque.
- **Pedidos e expedição:** funil por status, atrasos, tempo médio até o envio, pedidos aguardando saldo ou etiqueta, mapa de calor por horário e por estado.
- **Financeiro:** faturas, atrasos e bloqueios, fechamento do mês, comissões de canal, saldo de carteiras da rede, recargas.
- **Página e conversão:** cliques, cadastros e ativações vindos da página `/f/<slug>` e de cupons; funil da página.
- **Configuração:** integrações (conectado/não, conta, última verificação), contrato, equipe, e-mails enviados, registro de acessos do Master ("entrar como").
- **Auditoria:** linha do tempo de tudo (eventos de domínio, edições feitas pelo Master, acessos).
Exportação CSV por aba, período selecionável, gráficos acessíveis, 4 larguras.

## 5. ENTRAR COMO O FORNECEDOR (modo suporte)
- Botão **Entrar no painel dele** abre um diálogo com **motivo obrigatório** e prazo (padrão 60 min, máximo 4 h). Cria `support_sessions` (`masterUserId`, `supplierId`, `reason`, `startedAt`, `expiresAt`, `endedAt`, `ip hash`) e uma sessão especial: `actor` = usuário administrador do fornecedor com `onBehalfOf = master`.
- **Faixa fixa** no topo de todas as telas: "Modo suporte · <fornecedor> · expira em MM:SS · Sair". Cor própria e sempre visível, inclusive no celular.
- **Pode editar tudo** o que o fornecedor edita (produtos, estoque, contrato de página, lojas, equipe, integrações, expedição). Ações **sensíveis exigem confirmação extra** e ficam destacadas no registro: trocar senha ou e-mail do administrador, desconectar Mercado Pago, alterar chave de recebimento, excluir dados, suspender.
- **Limites duros:** não vê senha nem token em claro; não troca a própria função; não abre o Master de outro fornecedor sem encerrar a sessão; a sessão morre no prazo, ao sair ou ao fechar o navegador; um Master por sessão de suporte ativa por fornecedor (evita edição concorrente sem aviso).
- **Auditoria completa:** cada gravação durante o modo suporte gera evento `SUPPORT_ACTION` com a ação, o registro e o Master; o fornecedor vê "Ações feitas pela NextLevel" no painel dele (transparência), e o Master vê o mesmo no painel 360.
- **Entrar na loja do membro** (mesmo modelo) para o Master editar tema, produtos e pedidos de um lojista, com as mesmas regras.
- Em **produção**, o seletor de perfis da demonstração continua desligado; este é o único caminho de "entrar como".

## 6. FASES (cada uma fecha com lint, tipos, testes, build, e2e, capturas e commit)
- **F0 Fundação:** migrações (`suppliers`: CNPJ, razão social, endereço, `onboardingState`, `onboardingCompletedAt`; `support_sessions`; evento `SUPPORT_ACTION`), esquemas Zod, `supplierCompleteness()` (regra pura e testada).
- **F1 Assistente de cadastro:** etapas 1, 2, 3 e 8 com logo, slug verificado, prévia da página, cupom e contrato; rascunho; testes de domínio e e2e do fluxo.
- **F2 Pagamentos e envio pelo Master:** etapas 4 e 5 (conectar, validar, trocar, desconectar sem expor segredo), reaproveitando `connectSupplierMp` e `connectShipping`; testes com provedor simulado.
- **F3 Painel 360 (leitura):** `/master/suppliers/[id]` com as abas de dados, consultas agregadas com índices, exportação CSV, estados vazios, acessibilidade.
- **F4 Modo suporte:** `support_sessions`, faixa fixa, motivo e prazo, confirmação extra para ações sensíveis, marcação `onBehalfOf` em todos os domínios usados pelo painel do fornecedor, auditoria e "Ações feitas pela NextLevel" no painel dele; testes de segurança (sem escalada, expiração, isolamento entre fornecedores, bloqueio em produção do atalho da demonstração).
- **F5 Loja do membro em modo suporte** e edição avançada da rede (mover loja de rede, trocar oferta, prorrogar teste, estornar setup, redefinir senha) com histórico.
- **F6 Acabamento:** e-mail ao fornecedor sobre acessos da NextLevel (quando a plataforma de e-mail existir), documentação (`docs/design/DECISIONS.md` D33, `docs/MAPA.md`), 4 larguras, axe, capturas.

## 7. DECISÕES QUE VOCÊ DEVE PROPOR COM PADRÃO RECOMENDADO (não bloqueie; registre em D33)
| # | Ponto | Padrão recomendado |
|---|---|---|
| 1 | Prazo do modo suporte | 60 min, renovável, máximo 4 h |
| 2 | Aviso ao fornecedor | Registro no painel dele sempre; e-mail quando E-mail transacional estiver ativo |
| 3 | Edição concorrente | Um modo suporte ativo por fornecedor; o fornecedor vê um aviso enquanto o Master estiver dentro |
| 4 | Tokens (Mercado Pago e envio) | Master conecta e troca; ninguém lê em claro |
| 5 | Convite versus senha temporária | Convite por e-mail com link de definição de senha (usa o fluxo de recuperação); senha temporária continua como alternativa |
| 6 | Slug da página | Editável até publicar; depois só com redirecionamento do antigo |
| 7 | Exclusão de fornecedor | Nunca apaga: encerra (`CLOSED`) e preserva histórico |
| 8 | Painel de dados | Só leitura; qualquer edição acontece no modo suporte ou no cadastro |
| 9 | Dupla verificação | Ações sensíveis do modo suporte pedem a senha do Master de novo |
| 10 | Perfil do Master | Um perfil `NEXTLEVEL_SUPPORT` com "entrar como" e sem acesso financeiro pode vir depois; hoje só o Master |

## 8. ACEITE
- O Master cria um fornecedor completo (logo, link, Mercado Pago, envio, contrato) em uma sequência guiada, com rascunho e checklist de completude, e a página `/f/<slug>` abre com a marca dele.
- Clicar no fornecedor abre o painel de dados com visão geral, rede, catálogo, pedidos, financeiro, conversão, configuração e auditoria, com exportação.
- **Entrar no painel dele** exige motivo, mostra a faixa fixa, permite editar tudo, exige confirmação nas ações sensíveis, expira sozinho e deixa tudo registrado, visível para o fornecedor e para o Master.
- Nenhum token aparece em tela, log ou e-mail; um fornecedor nunca vê dados de outro; o atalho de troca de perfil da demonstração não existe em produção.
- Axe sem violações graves; sem rolagem horizontal em 360 px; estados vazios; textos em português claro.

## 9. FORA DE ESCOPO NESTA RODADA
Autenticação em duas etapas, perfil de suporte separado do Master, gravação de tela da sessão de suporte, importação em massa de fornecedores, contrato em PDF com assinatura eletrônica, comparação lado a lado entre fornecedores.
