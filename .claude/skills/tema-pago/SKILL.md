---
name: tema-pago
description: Construir um tema pago de loja (um por vez) com demonstração pública por link, prévia com os produtos do cliente e compra com instalação em 1 clique, valendo para Commerce, SuperDrop e Loja NextLevel. Use quando o dono pedir "criar um template pago", "novo tema", "evoluir o tema X" ou continuar a fila de temas.
---

# Tema pago, um por vez

## Antes de tudo
Leia `docs/prompts/temas-pagos-um-a-um.md` (prompt-mestre, regras e fases) e `docs/design/AUDITORIA-TEMA-STARTER-2026-10.md` (ponto de partida técnico). Se a infraestrutura única (fase I1: loja de exemplo pública, `/temas`, `/demo/<chave>`, prévia com os produtos, compra e instalação em 1 clique) ainda não existe, construa-a PRIMEIRO, uma vez só. Nunca comece o tema N+1 sem o OK do dono no tema N.

## Roteiro de um tema
1. **Briefing** com a "escada": o que este tema acrescenta sobre o anterior. Preço é PROPOSTA (o dono aprova).
2. **Design no motor:** estenda seções com ajustes no editor (`src/lib/themes/presets.ts`, `sections.ts`, `src/components/storefront/sections/*`); só crie seção nova se justificar.
3. **Conteúdo de exemplo** na loja de exemplo (fotos do acervo, produtos EXEMPLO); nada de cliente, depoimento ou métrica inventados.
4. **Conferência**: capturas 360/768/1440 (início, coleção, produto, carrinho, checkout), Lighthouse por página (LCP ≤ 2,5 s; desempenho ≥ 90; acessibilidade e SEO 100), axe, movimento reduzido, editor funcionando, trocar de tema sem perda de dados. Mínimo de 3 rodadas.
5. **Comercial:** licença do tema, compra + instalação ponta a ponta com conta SuperDrop e conta Commerce (e2e), decisão em `docs/design/DECISIONS.md`.
6. **Liberação:** capturas + link `/demo/<chave>` + números ao dono; só depois o tema fica disponível.

## Regras que não mudam
Tenant isolado (a prévia com produtos só para o dono da própria loja); pagamento só vale depois de conferido; compra idempotente; preço do catálogo, nunca fixo na tela; trocar de tema nunca perde dados; SuperDrop em produção não muda sem teste; sem push de tema "disponível" sem aprovação.
