# Meus comandos mais usados (para guardar no bloco de notas)

Cole cada bloco na ferramenta indicada. **Codex** = design visual no meu computador. **Claude Code** = o resto (regras, pagamentos, frete, banco, domínios, testes). Troque o que estiver entre [colchetes].

---
## 1. PARA OS DOIS (começar e terminar o dia)

**Começar a sessão**
```
Leia AGENTS.md, CLAUDE.md e docs/design/BRIEFING-CODEX.md. Rode git status e git log -5 --oneline e me diga em português simples: em que branch estamos, se há algo sem salvar e qual foi o último trabalho feito.
```

**Fechar o dia / registrar o estado**
```
Faça um resumo do que foi feito hoje, em português simples: o que mudou, o que foi publicado, o que ficou pendente e qual o próximo passo. Registre no arquivo docs/prompts/README.md (seção "Estado atual") o que for importante para a próxima sessão.
```

**Explicar sem jargão**
```
Explique o que você acabou de fazer como se eu não fosse técnico: o que mudou para quem usa o sistema, o que eu devo olhar na tela e o que pode dar errado.
```

**Quando aparecer um erro (cole o print ou o texto)**
```
Este erro apareceu: [cole o erro ou descreva a tela]. Diga em português simples o que significa, descubra a causa, corrija sem mexer no que não for necessário, rode as verificações e me diga como conferir.
```

---
## 2. CODEX (design visual, no meu computador)

**Primeira vez: auditoria e plano (ele não mexe em telas)**
```
Leia PRIMEIRO docs/design/BRIEFING-CODEX.md. Depois leia AGENTS.md e CLAUDE.md. Resuma em 10 linhas o que entendeu e siga a primeira tarefa do prompt (auditoria e plano), sem mexer em telas. Escreva o plano em docs/design/plano-visual.md e espere eu aprovar.
```

**Trazer as novidades que o Claude publicou**
```
Rode git fetch origin e git merge origin/claude/wonderful-cannon-5o38v5. Se houver conflito, resolva mantendo o trabalho dos dois e me avise o que foi. Depois confirme que o servidor em localhost:3100 continua funcionando.
```

**Aprovar o plano e começar uma etapa**
```
Plano aprovado. Comece pela etapa [1: cores e logos por marca nos painéis]. Trabalhe na branch codex/visual, faça commits pequenos, não publique nada e me avise quando eu puder olhar em http://localhost:3100.
```

**Pedir ajuste no que já está na tela**
```
Na tela [nome da tela, endereço no localhost], ajuste: [o que quero: ex. azul mais escuro no botão, mais espaço entre os cartões, texto menor]. Mantenha tudo o mais como está e me avise quando atualizar.
```

**Ver como fica em outra marca**
```
Mostre-me como esta tela fica no SuperDrop (http://localhost:3100) e na NextLevel Commerce (http://localhost:3100/lojas) e no celular (360 px de largura). Aponte qualquer diferença que quebre a identidade de cada marca.
```

**Desfazer a última mudança (ainda não publicada)**
```
Desfaça a sua última mudança visual na branch codex/visual (git revert do último commit, sem apagar histórico) e me avise.
```

**Publicar uma etapa aprovada**
```
Aprovado, pode publicar. Faça: git fetch origin, git rebase origin/claude/wonderful-cannon-5o38v5, rode npx tsc --noEmit e npx eslint src e2e tests, e se tudo passar rode git push origin codex/visual:claude/wonderful-cannon-5o38v5 (sem force). Depois me avise que o envio foi feito e quando eu devo olhar no endereço publicado (3 a 6 minutos).
```

**Próximas tarefas de design (uma por vez)**
```
Refine o portal da NextLevel Commerce (src/components/portal/commerce-home.tsx) com nível de Shopify: hero, seções, temas e planos, responsivo. Sem números inventados e mantendo "em breve" no que ainda não existe.
```
```
Redesenhe o início do painel do lojista da conta simples (src/app/merchant/page.tsx), o checklist "no ar" e o menu, para quem acabou de abrir loja sem fornecedor: o que fazer primeiro, em linguagem simples.
```
```
Dê ao Master central uma identidade própria da holding, com seletor de produto no topo e a área NextLevel Commerce em destaque, sem mudar dados nem regras.
```

---
## 3. CLAUDE CODE (regras de negócio, pagamentos, frete, domínios, testes)

**Continuar de onde paramos**
```
Leia CLAUDE.md e docs/prompts/README.md. Diga em português simples o que está pronto, o que está em andamento e o que falta, e proponha a próxima etapa em ordem de prioridade (SuperDrop em produção, depois NextLevel Commerce, depois Master central).
```

**Frete: etiqueta pela API e rastreio (P1b)**
```
Siga o /desenvolver-prompt: docs/prompts/promessas-commerce.md fase P1b: compra de etiqueta pela API (SuperFrete e Melhor Envio) com rastreio automático e e-mails ao cliente. Não invente endpoints: marque o que precisa validar com token real. Com testes, e2e e decisão em DECISIONS.md.
```

**Pagamentos e cupom (P1c e P1d)**
```
Siga o /desenvolver-prompt: docs/prompts/promessas-commerce.md fases P1c (PaymentProvider) e P1d (cupom de desconto do consumidor, estendendo a tabela coupons). Com testes e sem quebrar o checkout atual.
```

**Master por produto (escopo de marca)**
```
Faça o escopo de dados do Master por produto: Pedidos, CRM, Parceiros e Financeiro filtrados pela marca do endereço, com "todas" na holding, e a trava de gestor de marca (Master por escopo de marcas). Com testes de isolamento: um gestor de produto não vê dados de outro. Avise o Codex antes de mexer em src/app/master para não colidirmos.
```

**Conferir a produção**
```
Verifique o site publicado: /api/health, superdrop.com.br, lojas.nextlevelgroup.com.br e master.nextlevelgroup.com.br (redirecionamentos, login, portal) e me diga em português simples o que está funcionando e o que não está.
```

**Publicar com segurança**
```
/publicar
```
(roda tipos, lint, testes e build, envia para a branch e confere o site.)

**Rodar só as verificações**
```
Rode npx tsc --noEmit, npx eslint src e2e tests e npx vitest run e me diga o resultado em português simples.
```

**Abrir o cadastro de lojas da Commerce (quando for a hora)**
```
Confira se a NextLevel Commerce está pronta para abrir o cadastro de lojas (BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true): Mercado Pago da NextLevel conectado, usuários de demonstração removidos do banco, Master real criado, e-mail configurado. Liste o que falta, na ordem, e me diga o que eu faço no Render.
```

**Estudar o command center antigo (GPT Sites)**
```
Vou colar o código/páginas do meu sistema antigo (command center). Estude e me diga, em português simples, o que dá para aproveitar no ecossistema NextLevel sem duplicar o que já existe, e proponha um plano de aproveitamento. Não apague nem sobrescreva nada.
```

**Salvar uma ideia como prompt para fazer depois**
```
Salve este pedido como prompt avançado em docs/prompts/[nome-do-assunto].md, com fases, o que já existe no código para reaproveitar, testes e critérios de aceite, e acrescente à fila em docs/prompts/README.md. Não implemente agora: [descreva a ideia].
```

---
## 4. POWERSHELL (no meu computador)

**Ligar a demonstração ao vivo** (deixe a janela aberta; `Ctrl + C` desliga)
```
cd C:\Users\Pichau\Documents\Projetos\bras-digital-business-hub
powershell -ExecutionPolicy Bypass -File scripts/dev-demo.ps1
```
Abra http://localhost:3100 (SuperDrop) e http://localhost:3100/lojas (Commerce).

**Pegar as novidades que o Claude publicou** (em outra janela)
```
cd C:\Users\Pichau\Documents\Projetos\bras-digital-business-hub
git fetch origin
git merge origin/claude/wonderful-cannon-5o38v5
```

**Ver em que branch estou e se há algo sem salvar**
```
git status
git branch --show-current
```

**Se aparecer "execução de scripts desabilitada"**
```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---
## 5. RENDER E DOMÍNIOS (o que só eu faço)
- **Variáveis (Render → Environment):** `MASTER_EMAIL`, `MASTER_PASSWORD`, `BRAND_OFFICE_SUPERDROP=https://office.superdrop.com.br`, `MASTER_HOST_ONLY=true` (só depois de conseguir entrar em master.nextlevelgroup.com.br), `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true` (quando for abrir cadastro de lojas).
- **Domínios:** `master.`, `lojas.` (nextlevelgroup.com.br) e `superdrop.com.br`, `office.superdrop.com.br`. Hub Creators, Brás Digital e China Hub só quando houver código. CNAME na Hostinger: nome (`master`, `lojas`…), valor `superdrop.onrender.com`. Nunca mexer nos registros do `@`, `www`, `creators`, `painel`, `studio`, `mauricio`, `idesa` nem nos TXT (sites antigos).
- **Conferir publicação:** abrir `/api/health` do site e olhar o Render → Events/Logs.
- **Voltar atrás (se algo quebrar no ar):** pedir ao Claude Code: "Reverta o último commit publicado (git revert, sem apagar histórico), rode as verificações e publique".

---
## 6. REGRAS DE OURO
1. Nunca dois envios (push) ao mesmo tempo: um agente termina e avisa, o outro continua.
2. O Codex só mexe no **visual**; o Claude Code no **resto**. Quem precisar mexer na área do outro, faz o mínimo e avisa.
3. O Codex trabalha na `codex/visual` e **só publica depois do meu "aprovado"**.
4. Nada de "em breve" virar pronto: só é pronto o que está no ar e testado.
5. SuperDrop é produção: nenhuma mudança no comportamento dele sem teste.
