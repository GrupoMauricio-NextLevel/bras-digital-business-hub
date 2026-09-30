---
name: desenvolver-prompt
description: Desenvolver uma fase de um prompt salvo em docs/prompts (por exemplo email-transacional, fornecedor-360-master). Use quando o dono pedir para "desenvolver o prompt X da fase Y" ou continuar a fila de prompts.
---

# Desenvolver uma fase de um prompt salvo

1. Leia `docs/prompts/README.md` (fila e estado) e o prompt pedido inteiro, mais as seções de decisões `docs/design/DECISIONS.md` citadas nele.
2. Confirme a fase com o dono se ela não foi dita; se foi, não pergunte: use os padrões recomendados da tabela de decisões do prompt e registre-os.
3. Explore o código existente que o prompt cita antes de escrever (não reescreva o que já existe; estenda).
4. Implemente só a fase pedida, com: domínio + testes de Vitest, telas no design system atual, e2e em `e2e/`, acessibilidade (`axe`), estados vazios, textos em português.
5. Feche com a skill `publicar` (tipos, lint, testes, build, decisão nova em `DECISIONS.md`, commit, push).
6. Atualize `docs/prompts/README.md` (estado do prompt) e o próprio prompt se algo mudou de rumo.
7. Reporte ao dono em português simples: o que ficou pronto, o que depende dele (configurações, decisões) e qual é a próxima fase.
