# Projeto 100% pelo Abacus Desktop: conexões e regras (D346)

> **Decisão do dono (18/11/2026):** depois de testar, o projeto inteiro passa a ser tocado pelo Abacus Desktop no computador do dono. As regras de `AGENTS.md` e `CLAUDE.md` continuam valendo igual.

## 1. GitHub (onde o projeto fica guardado)
1. No Abacus: **+ → Conectores → GitHub** (ou **Adicionar do GitHub**). Na tela do GitHub, escolha **"Only select repositories"** e marque só `bras-digital-business-hub`.
2. No computador, o Git pede o login do GitHub no primeiro envio (abre o navegador).
3. No modo **Código**, peça:
   ```
   git clone -b claude/wonderful-cannon-5o38v5 https://github.com/GrupoMauricio-NextLevel/bras-digital-business-hub.git nextlevel
   cd nextlevel
   npm ci
   git config core.hooksPath .githooks
   ```
   **Não rode `scripts/preparar-abacus.ps1` nesta cópia** (ele liga a trava que só deixa enviar para `abacus/visual`). Já rodou numa pasta? `git config --unset nextlevel.branchPermitida`.

## 2. Render (onde o site fica no ar)
- **Publicar não precisa de conexão:** cada envio para `claude/wonderful-cannon-5o38v5` publica sozinho.
- A conexão só serve para ler os erros do site no ar: Render → **Account Settings → API Keys → Create API Key**; cole a chave **só no campo do conector** do Abacus, nunca no chat. Sem conector de Render no Abacus, deixe sem (os erros aparecem no painel do Render).

## 3. Neon (o banco com os dados reais)
- O banco se atualiza sozinho a cada publicação (as migrações rodam quando o site liga, `src/db/client.ts`). **O Abacus não precisa do Neon para programar nem para publicar.**
- Precisou consultar dados reais? Crie no Neon um **usuário só de leitura** (Roles) ou uma **cópia do banco** (Branches → Create branch). Nunca o usuário principal.
- No dia a dia, o banco de treino do computador: `powershell -ExecutionPolicy Bypass -File scripts/dev-demo.ps1` → http://localhost:3100.

## 4. Ensinar o Abacus a trabalhar como o Claude trabalhava
1. Em **Projetos**, crie "NextLevel", suba o pacote de contexto (`node scripts/gerar-pacote-abacus.mjs` gera `contexto-nextlevel-abacus.md`; gere de novo quando houver decisões novas) e use o modo **Código** com a pasta `nextlevel`.
2. Instruções fixas (cole no começo de cada conversa ou nas instruções do Projeto):
   ```
   Você é o engenheiro do projeto NextLevel. Antes de qualquer mudança, leia AGENTS.md, CLAUDE.md e docs/ESTADO.md e siga tudo.
   Os procedimentos (retomar, encerrar, publicar, conferir telas, criar migração) estão em .claude/skills/*/SKILL.md: leia o do assunto antes de fazer.
   Regras que não podem quebrar:
   - Branch de publicação: claude/wonderful-cannon-5o38v5. Antes de cada envio: git pull --rebase, npx tsc --noEmit, npx eslint src e2e tests e os testes dos arquivos mexidos. Nunca --force.
   - Cada envio publica no Render e custa minutos: no máximo 3 publicações de código por dia; commit só de documentos leva [skip render].
   - Decisão nova em docs/design/DECISIONS.md (número = a seguinte à última), citada em docs/conhecimento/BC0-INVENTARIO.md; depois rode node scripts/gerar-novidades.mjs.
   - Mudança de comportamento exige teste. Página que consulta o banco declara export const dynamic = "force-dynamic".
   - Nunca peça, mostre ou grave senhas no código, no chat ou em log.
   - A cada etapa, me mostre um print real da tela no navegador.
   Fale comigo em português simples, sem jargão.
   ```

## 5. Primeiro teste de ponta a ponta
Peça uma mudança pequena (um texto numa tela) e confira: print da tela, tipos e estilo passando, envio publicado e montagem verde no Render. Funcionou, o caminho está provado.

## Sempre
- Senhas só em conector ou no painel do Render.
- **GitHub Actions** continua conferindo tudo depois de cada envio; X vermelho no GitHub = corrigir antes de seguir.

## 6. Prioridade atual: páginas de venda (dono, 18/11/2026)
O pacote de contexto já traz o racional completo (`docs/vendas/RACIONAL-COMERCIAL-E-PAGINAS.md`) na Parte 2B. Comando para colar no modo **Código**, numa conversa nova:
```
Prioridade: as páginas de venda da NextLevel. A fonte de tudo é docs/vendas/RACIONAL-COMERCIAL-E-PAGINAS.md
(preços na Parte 1, implantação na Parte 2, gestor na Parte 3, serviços e agências na Parte 4, combos na Parte 5,
pontos cegos na Parte 6, mapa, molde e copy de cada página na Parte 7). Leia também AGENTS.md, CLAUDE.md, docs/ESTADO.md
e docs/design/DECISOES-VIGENTES.md.

Antes de escrever código, me mostre o plano: quais componentes que já existem você vai reaproveitar
(PaginaDeFrente, CabecalhoTech, ec-cartao e os de src/components/portal/frentes) e como fica UM componente
de "página de plano" alimentado por dados, em vez de uma página escrita à mão para cada plano.

Depois, uma página por vez, na ordem da Parte 7, seção 7.4: /planos e /implantacao primeiro.
Regras:
- copy exatamente como no racional, em português claro, sem promessa de ganho e sem citar concorrentes;
- preços lidos da tabela do Master (getPriceBook e catálogo), nunca fixos no código; se o valor ainda não existir lá, pare e me avise;
- prints reais do sistema de docs/vendas/prints (convertidos para WebP com scripts/imagens/converter-webp.mjs),
  dentro de moldura de computador ou celular, com a legenda "imagem real do sistema, dados de demonstração";
- nada de print com preço antigo ou com a Black (lista no Apêndice do racional);
- acessibilidade AA e nada de rolagem horizontal em 360 px;
- antes de cada commit: npx tsc --noEmit e npx eslint src e2e tests;
- ao terminar cada página, me mostre um print em 1440 px e em 360 px e espere a minha aprovação antes da próxima.
```
