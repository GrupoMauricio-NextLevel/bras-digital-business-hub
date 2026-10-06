# Fila de prompts de desenvolvimento

Cada arquivo é uma instrução executável por fases, escrita para ser colada numa sessão de trabalho. As ideias novas entram primeiro na seção **Ideias soltas**; quando amadurecem, viram um prompt próprio e saem da lista.

## Prompts prontos
| Prompt | Assunto | Estado |
|---|---|---|
| `auditoria-dono-paineis-e-paginas.md` | **Rodada do dono:** navegação e lógica por marca e papel, suporte com troca de negócio e de painel (modo suporte auditado), identidade das marcas nos painéis, Master × marcas, páginas públicas de alto nível | **A fazer (próxima)** |
| `imagens-paginas-publicas-gpt.md` | **Prompt para o GPT** gerar as fotos das páginas públicas SuperDrop e Commerce (lotes, nomes, proporções) | **Salvo** (você leva ao GPT; depois me traga as imagens) |
| `programa-parceiros.md` | Programa de Parceiros (afiliados) | Feito (PA0 a PA7, D30) |
| `demandas-2026-09-fase-longa.md` | Demandas da fase longa (fornecedor, loja do membro, temas, Master) | Feito (D22 a D32) |
| `email-transacional.md` | Plataforma de e-mail em três camadas (SuperDrop, fornecedor, membro) | **A fazer** (base pronta: layout, fila simples, avisos) |
| `nextlevel-commerce-plataforma.md` | **Documento-mestre (N0 feita, D33):** NextLevel Commerce, plataforma de lojas virtuais (marca, módulos, fases N0 a N10). Base: `docs/nextlevel-commerce/aproveitamento-superdrop.md` | **Em andamento (N0 concluída)** |
| `editor-templates-evolucao.md` | **Editor de temas e Templates** (T0 a T9): 10 temas (4 grátis e 6 avançados), editor v2, régua de qualidade, loja de temas, Theme Store aberta | **A fazer** |
| `imagens-temas-gpt.md` | **Prompt para o GPT** gerar imagens fictícias (produtos, banners, lookbook) dos 10 temas, com lotes, formatos e manifesto | **Salvo** (você leva ao GPT quando quiser; depois me traga as imagens) |
| `pesquisa-tiktok-shop-integracao.md` | **Pesquisa para o GPT** sobre integração máxima com o TikTok Shop (elegibilidade, API, afiliados, teste controlado). A resposta volta para cá e vira `tiktok-shop-integracao.md` | **Salvo** (aguardando a pesquisa) |
| `promessas-commerce.md` | **Promessas da NextLevel Commerce** (P0 a P6): conta simples, frete e pagamentos, atacado B2B, influenciadores, feed e live shop, Theme Engine v2 | **P0 feito (D34)**; próximo: P1 (frete e pagamentos) e P5 (tema) |
| `hub-creators-consolidado.md` | **Hub Creators: projeto único e consolidado** (creators, influenciadores, campanhas, atribuição, comissões, amostras, vídeo, lives, TikTok). **Fonte única**; os dois prompts abaixo viram detalhe de referência | **ADIADO (D42)**: fora da fila ativa |
| `creator-commerce-plataforma.md` | **Creator Commerce Platform**: produto independente do ecossistema NextLevel (fronteira de domínio, feed em vídeo, creators, campanhas, amostras, lives, canais 24/7, atribuição e comissões por eventos). **Substitui** a visão de módulo interno; reconciliar com P3/P4 | **Salvo** (começa pelo diagnóstico e contrato de fronteira) |
| `creator-hub-tiktok.md` | **Creator Hub + TikTok** (fundação de creators, campanhas, links rastreáveis, atribuição, comissões, amostras; OAuth, Pixel/Events API, TikTok One e Shop como fases opcionais). Estende `partners`/P3, não duplica | **Detalhamento**, subordinado ao prompt abaixo | **Salvo** (implementar com calma; começa pelo diagnóstico) |
| `automacao-e-observabilidade.md` | **Automação e proteção da produção** (A0 a A8): agendador das rotinas de cobrança, monitor com alerta, painel de erros, resumo da manhã, teste sintético de compra, regressão visual, cache das públicas, backup, custos | **Em andamento**: A0 a A3 feitas (rotinas registradas, monitor, painel de erros, resumo do dia); faltam A4 a A8 e o que depende do dono (Render, canal de alerta, Neon) |
| `home-commerce-pagina-viva.md` | **A Página Viva**: home da Commerce em que o visitante usa o produto na página (loja real no celular, editor ao vivo com temas reais, desempenho medido na visita, painel real por robô, rolagem coreografada). Prompt de engenharia em 7 fases com orçamento de desempenho | **Salvo, não implementado** (pedido do dono em 2026-10-03) |
| `fornecedor-360-master.md` | Cadastro completo de fornecedor, painel de dados e "entrar como" | **A fazer** |
| `evolucao-visual-v1.md`, `novo-nivel-visual-v3.md`, `racional-operacao-v2.md`, `historico-design.md`, `mvp-original-v0.md` | Histórico de design e operação | Referência |

## Ideias soltas (ainda sem prompt)
- Compra de etiqueta pela API da plataforma de envio (SuperFrete/Melhor Envio), com débito na carteira do membro.
- Materiais de divulgação para parceiros (banners e textos enviados pelo Master).
- Personalização do dashboard e visões salvas nas listas.
- Evolução dos temas esportivos (guia de tamanhos, barra de frete grátis, diferenciação Arena/Editorial/Signature).
- Cobrança recorrente automática das mensalidades e comissão dos fornecedores fundadores.
- Trocar o banco para Neon e a hospedagem para plano pago (checklist de produção).
- Revisão jurídica e contábil (termos, privacidade, RPA/nota das comissões).

## Como usar
1. Escolha um prompt e peça: "desenvolva `docs/prompts/<arquivo>` da fase X".
2. Cada fase fecha com lint, tipos, testes, build e e2e; as decisões vão para `docs/design/DECISIONS.md`.
3. Novas dúvidas ou pedidos: acrescente em **Ideias soltas** (ou peça para criar o prompt).

- `temas-pagos-um-a-um.md`: loja de temas pagos, um por vez (infraestrutura feita; primeiro tema: Lume, em aprovação). Skill: `/tema-pago`.
- `constituicao-correcoes-e-fundacao.md`: correções e fundação segundo a Constituição (número do pedido, piso da grade, isolamento entre redes, eventos, loja pronta para vender, Central oculta, privacidade, ramos de design). SALVO, aguardando ordem do dono.

## A estudar (pendente)
- **Command center antigo (GPT Sites):** páginas e código do sistema anterior do dono, hospedado no GPT Sites (`painel`, `studio`, `creators`, `idesa`, `mauricio` em `nextlevelgroup.com.br`). Estudar o que dá para aproveitar no ecossistema NextLevel, sem apagar nem sobrescrever os endereços existentes.

## Etapa futura: Hub Creators, Brás Digital e China Hub
Decisão do dono: **só entram no ar (domínio + DNS) quando já houver código desenvolvido.** O que existe hoje é apenas uma página "em breve" com lista de espera, já pronta no código mas **desligada na prática** (sem domínio apontado). Foco atual: SuperDrop (em produção, clientes e lojas para subir), NextLevel Commerce (lojas virtuais: P0 e P1a feitos) e o Master central. Ordem sugerida quando chegar a hora: Hub Creators (`creator-commerce-plataforma.md` e `creator-hub-tiktok.md`), China Hub (cadastro de fornecedor importador, mandarim/espanhol), Brás Digital (marketplace sobre lojas e pedidos).

- `codex-avaliacao-profunda.md`: prompt para o Codex fazer uma avaliação profunda, só leitura, do Commerce e entregar relatório.
