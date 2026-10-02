---
name: qa-visual
description: Conferir telas por capturas reais no navegador (Playwright) em 360, 768 e 1440 px, com rolagem, interações, acessibilidade e comparação com a referência, antes de apresentar ao dono. Use após qualquer mudança visual ou de interação, nunca declare qualidade só porque compilou.
---

# QA visual

## Rotina
1. **Servidor:** `bash scripts/restart-demo.sh` (porta 3100, demonstração, banco em memória). Não rode `npm run build` ao mesmo tempo. Dev server bloqueia origens diferentes de `localhost`; para ver a marca Commerce use `http://localhost:3100/lojas` (cookie `nl-brand`) e `/lojas/sair` para voltar.
2. **Script descartável** em `e2e/_algo.mjs` (apague depois), com `playwright-core` e `executablePath: "/opt/pw-browsers/chromium"`. Capturas para `/tmp/claude-0/shots/…`.
3. **Larguras:** 360×780, 768×1024, 1440×900. Topo + pelo menos 5 pontos de rolagem (`window.scrollTo`, esperar ~700 ms para animações por rolagem). Sticky/fixed aparecem no meio das capturas de página inteira: prefira capturas por posição de rolagem ou desligue o cabeçalho com `addStyleTag`.
4. **Interações:** menu do celular (abre, Esc fecha), abas, passos, perguntas, formulários; clique real, não só leitura de DOM.
5. **Checagens automáticas:** rolagem horizontal (`scrollWidth - clientWidth ≤ 0`), imagens quebradas (`complete && naturalWidth === 0`), erros de console e de página, links vazios. Para telas autenticadas, entrar em `/login` com conta de demonstração (senha `demo1234`; campos `input[type=email]` e `input[type=password]`, Enter envia).
6. **Acessibilidade e desempenho:** Lighthouse (skill `desempenho`) e contraste AA; `readableOn` para texto sobre cor de marca.
7. **Olhar de verdade:** abra cada captura (ferramenta de leitura de imagem), liste defeitos (corte de texto, sobreposição, vazio, hierarquia), corrija e repita. Mínimo de 3 rodadas em trabalho de alto nível; comparar lado a lado com a referência.
8. **Teste permanente:** quando a tela for importante, deixe um `e2e/<nome>.mjs` com asserções (como `e2e/commerce-home.mjs`).
9. **Entrega:** envie as capturas examinadas (SendUserFile), liste o que foi e o que **não** foi verificado. Nunca invente captura ou medição.

## Armadilhas já vistas
- `pkill -f`/`pgrep -f` com padrão presente no próprio comando mata o shell: use arquivo `.sh`.
- Chromium não confia no proxy para sites externos (erro de certificado): não desative a verificação; use `curl` para HTML externo.
- Primeiro carregamento após editar arquivo pode mostrar erro de hidratação transitório no dev server; confirme em segundo carregamento.
