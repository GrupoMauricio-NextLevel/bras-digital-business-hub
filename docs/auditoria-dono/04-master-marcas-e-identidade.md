# Fases 3, 4 e 5 — Identidade dos painéis, Master × marcas e páginas públicas

## Fase 3 — Cada painel com a cara da sua marca

| Painel | Antes | Agora |
|---|---|---|
| Master (NextLevel) | Barra lateral clara, igual às outras | Barra **navy** também no modo claro, amarelo NextLevel no item ativo; logo e seletor de negócio na versão para fundo escuro |
| SuperDrop (lojista, fornecedor, expedição, parceiro) | Fundo neutro | Barra lateral com um toque do verde SuperDrop (9% da cor sobre o fundo); no escuro, fundo e cartões levemente esverdeados |
| NextLevel Commerce | Fundo neutro | Mesmo princípio com o azul Commerce |

Regra: a cor vem só do contrato de cores (`src/design-system/themes.ts`); nenhum componente pergunta "qual empresa é". O contraste mínimo (AA) de texto, texto secundário e item ativo da barra é conferido por teste em todas as marcas e nos dois modos (`tests/design-system.test.ts`).

Capturas: `capturas/id-*.png` (Master, lojista e fornecedor SuperDrop, dono Commerce; claro e escuro; 1440 e 390 px).

## Fase 4 — Master × marcas

- **Cartões "Seus negócios"** mostram os números de cada marca: vendas pagas (sem frete), pedidos pagos e lojas no ar. A soma das marcas bate com o "Volume da rede" (teste `tests/master-numeros.test.ts`).
- **Página de cada marca** (`/master/marcas/superdrop`, `/master/marcas/commerce`): logo, lojas ativas, vendas pagas, pedidos pagos, clientes com alerta, lista "Precisa de atenção" com o botão **Ver como cliente** (modo suporte) e atalhos (SuperDrop: lojas da marca, fornecedores, pedidos, parceiros, planos; Commerce: console, lojas, vendas, interessados, planos).
- O **seletor de negócio** (topo da barra lateral) leva a essas páginas.
- **Clientes e suporte** (`/master/clientes`): busca qualquer cliente de qualquer marca e papel e entra em modo suporte com motivo (fase 2, `03-suporte.md`).
- O atalho para o console Commerce no endereço do Master voltou a funcionar (antes caía no login).

## Fase 5 — Páginas públicas SuperDrop e Commerce

- Nova seção em mosaico nas duas páginas iniciais (SuperDrop: "Bastidores"; Commerce: "Sua marca, sua operação"), com três peças grandes de fotografia e legendas que só descrevem o que o sistema faz hoje.
- Enquanto a foto não existe, aparece um quadro discreto **"Imagem em criação"** com a mesma proporção (a página não "pula" quando a foto chegar). Em demonstração, o quadro mostra o nome do arquivo esperado.
- **Como trocar pela foto:** gere a imagem com o prompt de `docs/prompts/imagens-paginas-publicas-gpt.md`, salve em `public/portal/<superdrop|commerce>/v3/<nome>.webp` (ou `.avif`/`.png`) e publique. A lista de nomes está em `public/portal/<marca>/v3/MANIFESTO.md`.
- Conferido em 360, 768 e 1440 px: sem rolagem lateral (`capturas/pub-*-mosaico-*.png`).
