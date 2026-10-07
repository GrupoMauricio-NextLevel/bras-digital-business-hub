# Relatório da rodada do dono — painéis, suporte, marcas e páginas públicas (07/10/2026)

Prompt: `docs/prompts/auditoria-dono-paineis-e-paginas.md`. Decisões: D80 (modo suporte) e D81 (identidade e Master por marca).

## O que ficou pronto

| Fase | Entrega | Detalhes |
|---|---|---|
| 0 | Mapa de marcas, papéis, painéis e contas | `00-mapa.md` |
| 1 | Varredura de navegação de 8 contas (computador e celular), inconsistências corrigidas, lógica do negócio ligada aos testes | `01-inconsistencias.md`, `02-logica-e-testes.md` |
| 2 | **Modo suporte**: o Master acha qualquer cliente em `/master/clientes` e entra no painel dele com motivo, somente leitura, prazo de 1 hora e registro visível ao cliente; corrigida uma falha de segurança no antigo "Entrar como lojista" | `03-suporte.md` |
| 3 | Cada painel com a cor da sua marca (barra lateral), Master navy com logo legível | `04-master-marcas-e-identidade.md` |
| 4 | Master por marca: cartões com números de cada marca e páginas `/master/marcas/superdrop` e `/master/marcas/commerce` | idem |
| 5 | Páginas públicas SuperDrop e Commerce com seção em mosaico e espaços "Imagem em criação" | idem |
| 6 | Testes, varreduras e publicação | abaixo |

## Problemas reais encontrados e corrigidos

1. **Segurança (alta):** o retorno ao Master confiava num cookie sem assinatura. Agora é uma permissão assinada e presa à sessão.
2. **Dinheiro (alta):** o cartão SuperDrop do Master mostrava o volume da rede inteira, incluindo Commerce e pedidos não pagos. Agora cada marca tem seus números, só vendas pagas e sem frete, e a soma bate com o total.
3. **Dinheiro (alta):** "Vendas · 30 dias" podia dar um valor no início do lojista e outro na Análise. Agora as duas telas usam a mesma janela.
4. **Navegação (alta):** o atalho "NextLevel Commerce" no Master caía no login.
5. **Confiança (média):** o histórico de mudanças da loja mostrava texto técnico (`role: null → "STAFF"`). Agora aparece em português.
6. **Acessibilidade (baixa/média):** faltavam títulos em 2 telas; uma pílula de contagem tinha pouco contraste no modo escuro da loja Commerce; o logo e o seletor de negócio ficavam invisíveis na barra navy do Master.

## Verificações

- Tipos e estilo: sem erro.
- Testes automáticos: **581 de 581 passaram** (77 arquivos), mais o teste novo dos números do Master (3 de 3).
- Modo suporte de ponta a ponta (`e2e/modo-suporte.mjs`): 21 de 21, em 1440 e 390 px, com lojista, expedição, parceiro e lojista Commerce; cookie forjado é recusado.
- Acabamento e acessibilidade (`e2e/polish-v8.mjs`): 14 páginas públicas e 31 telas de painel, em 4 larguras, sem violação grave.
- Amostra do design system (`e2e/design-system-qa.mjs --so-amostra`): a 1ª rodada achou a pílula sem contraste; depois da correção, **176 renderizações sem problema** (todas as contas, claro e escuro, 4 larguras). A única diferença de tamanho é a da Expedição (botões maiores para toque, decidido em D78).
- Páginas públicas com mosaico: sem rolagem lateral em 360, 768 e 1440 px.
- Build de produção: ok.

## Limites (o que não foi medido)

- Não há conta de demonstração de **equipe de loja SuperDrop** nem de **parceiro Commerce**; esses papéis foram conferidos só pela regra de menu.
- A varredura passa por até 70 telas por conta (34 no Master); telas de detalhe numerosas (pedidos, produtos) foram amostradas.
- Não rodei o fluxo de compra completo com Mercado Pago simulado nesta rodada (`npm run e2e`); os testes de pagamento automáticos passaram.

## O que depende só do dono

1. **Gerar as 6 imagens que já têm lugar** (3 por página: os três primeiros nomes de cada MANIFESTO; as demais são para as próximas seções) com o prompt `docs/prompts/imagens-paginas-publicas-gpt.md` e salvar com os nomes de `public/portal/<marca>/v3/MANIFESTO.md`. Assim que o arquivo existe, a foto substitui o quadro "Imagem em criação" sozinha.
2. Experimentar o modo suporte no ar: Master → **Clientes e suporte** → **Ver como cliente**.
3. As configurações de produção que já estavam pendentes (Neon, Resend, Mercado Pago da NextLevel, domínios) continuam em `docs/PENDENCIAS-DO-DONO.md`.
