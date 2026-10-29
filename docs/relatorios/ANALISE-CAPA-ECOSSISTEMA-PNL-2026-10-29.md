# Análise: "Painel como camada do ecossistema" (PNL-001 a PNL-014)

> **Fontes:** `especificacao-e-prompts.md` e `nextlevel-painel-ecossistema-tecnico-v1.pdf` (30 páginas, 14 prints do painel da Hostinger), enviados pelo dono em 2026-10-29.
> **Método:** cada seção do documento foi comparada com o código atual (casca dos painéis, Master, parceiros, soluções, planos, checkout, notificações) e com as regras do projeto: Constituição, `DIRECAO-VISUAL-V4.md` e as decisões até a D197.
> **Resumo em uma linha:** o documento é bom e honesto, separando o que se vê, o que é estimado e o que é proposto. **Cerca de 70% do que ele pede já existe no sistema com outros nomes.** O que falta de verdade é a "capa" visual (moldura, faixa e cantos) e cinco comportamentos. Há **um ponto que precisa da sua decisão** antes: o quanto parecer com a Hostinger.

---

## 1. O ponto de decisão: "muito próxima da Hostinger"

O documento pede proximidade alta: moldura escura, **faixa roxa**, roxo `#673DE6` como cor de ação, raios e densidade iguais. Há três problemas nisso.

1. **Risco de imitação de marca.** O conjunto "moldura escura + faixa roxa + roxo de ação + mesmo arranjo" é a identidade visual da Hostinger. Copiar a geometria e a organização é legítimo e é o que todo mundo faz. Copiar cor e conjunto pode virar questionamento de imitação de identidade (trade dress) e, pior, faz o cliente achar que somos "uma Hostinger". O próprio documento proíbe logos, textos e dados, mas não as cores.
2. **Conflito com uma decisão já aprovada por você.** A direção "mesa do atacadista" (`DIRECAO-VISUAL-V4.md`) usa **uma cor de sinal por marca**: azul na E-commerce, verde no SuperDrop, as cores da Brás e da Cargas. Trocar tudo para roxo apaga a identidade de cada marca, que é justamente o que diferencia o ecossistema.
3. **Custo:** repintar todos os painéis com outra paleta tem semanas de retrabalho e de reconferência de contraste em cada tela.

**Recomendação:** copiar a **arquitetura** e não a **pintura**.
- **Igual à referência:**
  - a faixa do ecossistema no topo e a moldura com cantos amplos;
  - o menu com rolagem própria e o menu do recurso;
  - os cartões, os popovers e a densidade;
  - a conta em popover, as notificações e a vitrine de soluções.
- **Diferente da referência:**
  - a cor: a faixa e o destaque usam a cor de sinal da marca em que a pessoa está;
  - a moldura escura usa o "tinta" da marca (quase preto azulado na E-commerce, quase preto esverdeado no SuperDrop);
  - assim o resultado fica com a mesma sensação de produto maduro, mas com a nossa identidade.

> **Pergunta 1:** seguimos assim (estrutura igual, cores de cada marca)? Ou você quer mesmo a paleta roxa em tudo, sabendo dos riscos acima?

---

## 2. O que o documento pede × o que já temos

| Seção | O que pede | O que já existe | O que falta | Tamanho |
|---|---|---|---|---|
| 02 Anatomia | Faixa do ecossistema + moldura + menu + menu contextual + camada de sobreposição | Casca única de todos os painéis (`AppShell`/`OperationalShell`, DS3); **barra do ecossistema** com as marcas (`BarraEcossistema`, D-lançador); camadas de z-index centrais | **A moldura** (corpo com cantos de 28 px "encaixado" na faixa) e a faixa com benefício/chamada de parceiros | Médio |
| 03 Rolagem independente | Menu e conteúdo rolando separados; rodapé do menu fixo | **Já existe**: menu `sticky` com altura da tela e lista com rolagem própria (`.ds-nav`); rodapé "Ver loja / Recolher" fixo | Lembrar a posição de rolagem por tela; `overscroll-behavior: contain` | Pequeno |
| 04 Sistema visual | Tokens claro/escuro, raios, escala | Tokens claro e escuro por marca (`brand-palette.ts`, `tokens.css`), contraste calculado | Raios maiores na moldura e nos cartões grandes; superfícies "lilás" viram superfícies na cor da marca | Pequeno |
| 05 Conta e tema | Popover da conta com perfil, acessos, faturas, segurança, atividade, notificações, idioma, tema, sair | Tema **claro/escuro/sistema** já funciona; segurança da conta (2 etapas, sair dos outros aparelhos, D183); equipe e acessos; financeiro; "conta do grupo" (D100) | **Juntar tudo num popover só** ancorado no avatar, com o tema dentro; o idioma entra quando houver idiomas | Pequeno |
| 06 Contexto (marca → negócio → recurso) | Seletor pesquisável, troca segura, cache por contexto | Seletor de marca do Master (R2), troca entre marcas do grupo (`ProductSwitcher`), permissões no servidor e tenant isolado | Busca no seletor, "recentes" e aviso de alteração não salva ao trocar | Pequeno/médio |
| 07 Notificações e tarefas | Separar notificação de tarefa; leitura guardada no servidor | Sino com avisos (`NotificationsMenu`); **fila do dia** como tarefas (D125) | A leitura hoje fica **só no navegador** (localStorage): passar para o servidor, com "marcar tudo como lido" por marca e preferências por categoria | Médio |
| 08 Parceiros e indicações | Indicação simples × parceiro; atribuição; comissão pendente → aprovada → paga → estornada | **Programa completo** (PA0 a PA7, FM4): tipos de parceiro, regras de comissão versionadas, carência, estorno, atribuição, painel `/partner` com links, indicações, CRM e financeiro | **Popover rápido "Indique e ganhe" na faixa** (copiar link + ver extrato), presente em todos os painéis | Pequeno |
| 09 Vitrine de soluções | Catálogo com filtros, destaque, cards, página interna | **Vitrine de Soluções** pública com catálogo do Master (D90, VS S0–S8) e páginas por solução | **Vitrine dentro do painel** (o lojista contrata sem sair), com o estado real: "contratado → Gerenciar" | Médio |
| 10 Preços, anual e comparação | Ciclos, equivalente mensal, economia, tabela detalhada | Preço versionado por ciclo, anual com economia (`economiaDoAnual`), simulador de planos | **Tabela de comparação detalhada** por recurso, com cabeçalho fixo e o mesmo esquema de recursos nos cards e na tabela | Médio |
| 11 Checkout rápido | Modal com período, add-on, cupom, total; idempotência; estados separados de pagamento e ativação | **Checkout corporativo idempotente** (FM2): Mercado Pago e Pagar.me, webhook conferido na API, expiração, ativação de direitos | **Modal de checkout dentro do painel** (hoje é página), com o período escolhido preservado | Médio |
| 12 Arquitetura | Pacotes `@nextlevel/ui` e `@nextlevel/shell`, feature flags | Já é **um repositório só** com o design system em `src/design-system` | **Não criar pacotes**: aqui não há vários apps para compartilhar | Nenhum |

---

## 3. O que eu NÃO faria (está no documento, mas não serve para nós)
- **Pacotes separados (`@nextlevel/ui`, `@nextlevel/shell`) e microfrontends:** somos um sistema só (regra anti-duplicação do CLAUDE.md). Seria complexidade sem ganho.
- **Iframe:** o próprio documento desaconselha; concordo.
- **Ciclos de 24 e 48 meses:** são da hospedagem. Para loja virtual, mensal e anual bastam (o anual já tem economia real).
- **Conteúdos da Hostinger**: créditos, "especialistas", memória de IA, domínios como tenant. Só entram se existirem no nosso produto.
- **"Hostinger Agente" com fluxos complexos de formulário em etapas** antes de a IA estar ligada: a nossa IA já segue o padrão (D194 a D197).

---

## 4. Ordem recomendada (fatias que você vê funcionando)
| Fatia | Entrega | Depende de | Tamanho |
|---|---|---|---|
| **C1. Capa** | Moldura com cantos de 28 px, faixa do ecossistema com o benefício do momento e "Indique e ganhe", conta em popover com tema, rolagem refinada | Pergunta 1 | 1 a 2 dias |
| **C2. Notificações de verdade** | Leitura guardada no servidor, separação aviso × tarefa, "marcar tudo" por marca, preferências por categoria; inclui o **som de conversa nova da Central da IA** | Nada | 1 a 2 dias |
| **C3. Indique e ganhe** | Popover na faixa (copiar link, quantos indicou, quanto tem a receber) usando o programa que já existe | Nada | Meio dia |
| **C4. Planos e comparação** | Tabela detalhada por recurso e cards a partir do mesmo esquema; anual em destaque quando a economia é real | Lista de recursos por plano (já temos em `features`) | 1 a 2 dias |
| **C5. Soluções dentro do painel** | Vitrine no painel com o estado real (contratado → Gerenciar) e o **checkout em modal** com o período preservado | C4 | 2 a 3 dias |

**Prioridade sugerida:** C1 → C3 → C2 → C4 → C5. A capa dá o salto de percepção mais rápido. "Indique e ganhe" é crescimento direto e quase pronto. Notificações reais apoiam a Central da IA.

---

## 5. Perguntas para você
1. **Cores:** estrutura igual à referência com as cores de cada marca (recomendado) ou paleta roxa em tudo?
2. **Faixa do topo:** qual mensagem fixa? Sugestão: "Indique e ganhe" à esquerda, a oferta do momento no centro (vem do Master), e o Maurício, as notificações e a conta à direita.
3. **Indique e ganhe:** vale para **lojistas** indicarem outros lojistas, ou só para parceiros cadastrados? O programa atual é dos parceiros.
4. **Ordem das fatias:** C1 → C3 → C2 → C4 → C5 está bom?

## 6. Riscos e cuidados
- **Prints com dados da sua conta Hostinger:** o PDF é para uso interno; não vai para o repositório nem para nenhuma página.
- **SuperDrop em produção:** a capa muda a casca de todos os painéis. Ela entra atrás de uma chave no Master (liga/desliga sem publicar de novo) e passa pela conferência de contraste e 360 px em cada marca.
- **Fidelidade sem conferência:** cada fatia vem com prints lado a lado com o PNL correspondente, como o documento pede.
