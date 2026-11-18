# Abacus no computador do dono: começar com segurança (D343)

> **Para que serve:** acelerar a evolução visual com o Abacus (aplicativo de computador) rodando o sistema no seu PC, vendo cada mudança na hora, sem publicar nada por engano e sem expor senhas. O Claude continua na nuvem com lógica, banco, pagamentos, testes e a revisão antes de publicar.

## 1. Preparar o computador (uma vez)
1. Instale o **Node 22 (LTS)** (nodejs.org), o **Git** (git-scm.com) e o **Abacus** (aplicativo de computador).
2. No PowerShell, numa pasta sua (ex.: `Documentos`), baixe o projeto numa pasta **só do Abacus**:
   ```
   git clone https://github.com/GrupoMauricio-NextLevel/bras-digital-business-hub.git nextlevel-abacus
   cd nextlevel-abacus
   git checkout claude/wonderful-cannon-5o38v5
   powershell -ExecutionPolicy Bypass -File scripts/preparar-abacus.ps1
   ```
   O script confere o Node, cria a branch `abacus/visual`, instala tudo, liga a conferência de tipos e estilo e **trava o envio**: esta pasta só consegue mandar para `abacus/visual`. A branch de publicação (que monta o site no Render e custa minutos) fica bloqueada aqui.
3. Ligue a demonstração: `powershell -ExecutionPolicy Bypass -File scripts/dev-demo.ps1` e abra **http://localhost:3100**. Banco de treino em memória; dados reais nunca são tocados. Loja virtual em `/lojas`; perfis em `/login` (senha `demo1234`).

## 2. Regras de segurança
- **Nenhuma senha de produção nesta pasta nem no chat do Abacus:** endereço do Neon, chaves do Render, Mercado Pago, Resend, chave Pix. O visual não precisa de nenhuma. O script avisa se encontrar um `.env` suspeito.
- **Nas configurações do Abacus**, desligue (se existir) o uso dos seus dados e código para treinar o modelo. A pasta tem documentos internos da empresa em `docs/`.
- **Quem envia é você:** o Abacus faz commits; quando você aprovar o que viu no navegador, rode `git push -u origin abacus/visual` e avise o Claude, que revisa, roda a bateria completa e junta à publicação.
- **Área do Abacus = visual:** `src/components/**`, telas em `src/app/**` (só o aspecto), `src/app/globals.css`, `src/lib/themes/**`, `public/**`. Não mexe em `src/lib/domain`, `src/lib/finance`, `src/db`, `drizzle`, `src/app/actions`, pagamentos e permissões.
- **Mesma tela, um de cada vez:** antes de começar uma tela, diga ao Claude qual é, para não haver dois mexendo nela.

## 3. Primeira mensagem para colar no Abacus
```
Você vai trabalhar no visual deste projeto (Next.js 16, React 19, Tailwind v4), rodando localmente em http://localhost:3100.
Antes de qualquer mudança, leia AGENTS.md, CLAUDE.md e docs/abacus/COMECE-AQUI.md, e siga as regras deles.
Regras fixas:
- Trabalhe só na branch abacus/visual. Nunca faça git push, nunca troque de branch, nunca force nada.
- Só visual: componentes, estilos, temas e o aspecto das telas. Não mude regras de negócio, banco, pagamentos, permissões nem testes.
- Textos ao usuário em português claro, sem promessa de ganho. Valores em centavos. Marca vem de getBrand(), nunca fixa.
- Acessibilidade AA e nada de rolagem horizontal em 360 px de largura.
- Antes de cada commit rode: npx tsc --noEmit  e  npx eslint src e2e tests  (precisam passar).
- Commits pequenos, mensagem em português dizendo o que mudou na tela.
- Nunca peça nem use senhas, tokens ou o arquivo .env.
Quando eu aprovar uma etapa, eu mesmo faço o envio.
```

## 4. Imagens geradas no Abacus: como usar
O Abacus gera imagens no mesmo lugar onde mexe no código. Isso resolve os espaços "Imagem em criação" das páginas e as demonstrações dos temas sem passar por outro programa.
- **O que gerar (listas prontas, com nomes de arquivo exatos):** `docs/prompts/imagens-paginas-publicas-gpt.md` (páginas públicas; manifesto em `public/portal/<marca>/v3/MANIFESTO.md`) e `docs/prompts/imagens-temas-gpt.md` (produtos fictícios e banners dos temas). Cole o bloco da seção 2 do documento no Abacus.
- **Regras das imagens:** sem texto, letras ou logotipos dentro; sem marcas, clubes ou pessoas reais; sem rosto reconhecível e sem crianças; assunto no centro (as telas recortam).
- **Converter para o site** (WebP leve, sem metadados, até 250 KB):
  `node scripts/imagens/converter-webp.mjs <pasta-das-imagens> <pasta-de-destino> [largura]`
  ex.: `node scripts/imagens/converter-webp.mjs C:\Users\voce\Downloads\abacus public/theme-demo/arena 1536`
- **Conferir antes de aprovar:** recuse imagem com texto, marca, rosto, mão deformada ou cor diferente da pedida.
- **Direitos:** confira nos termos do Abacus que as imagens podem ser usadas comercialmente e anote a data da geração.

## 5. Quando você aprovar uma etapa
1. `git push -u origin abacus/visual`
2. Avise o Claude: "juntei a etapa X na abacus/visual". Ele revisa, roda tipos, estilo, testes e montagem, junta à publicação e manda o print do site no ar.
