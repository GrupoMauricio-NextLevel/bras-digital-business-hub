---
name: levar-para-marca
description: Levar o visual, os módulos, as páginas públicas e os painéis feitos na NextLevel E-commerce para outra marca do grupo (Brás Digital, Creators Hub, China Hub, Cargas…). Use quando o dono pedir para "avançar em outra marca" ou "aplicar o mesmo padrão" numa marca.
---

# Levar o padrão da E-commerce para outra marca

1. Leia `docs/design/PADRAO-NEXTLEVEL-PARA-MARCAS.md` inteiro: é o mapa do que existe, onde está e se já serve para outra marca.
2. Leia as decisões citadas na linha de cada módulo que vai usar (`docs/design/DECISIONS.md`) e a D216 (SuperDrop congelado).
3. Confirme com o dono o que a marca é (loja virtual, fornecedor, serviço) só se ele não disse; isso decide os módulos de loja.
4. Reaproveite, não copie:
   - classes `ec-*` com um `.im-tema-<marca>` só de cores;
   - os mesmos componentes de seção;
   - as tabelas de configuração por marca (benefícios D247, comissões D248, súmula D230).
5. Páginas públicas pela skill `pagina-de-vendas`. Painéis pela skill `painel-interno`. Dados novos pela skill `nova-migracao`.
6. Código compartilhado: teste provando que o SuperDrop e a E-commerce não mudaram.
7. Feche com a skill `publicar` e atualize o mapa (`PADRAO-NEXTLEVEL-PARA-MARCAS.md`) com o que a marca nova passou a usar.
