# Especificação: níveis, capacidades, licenças e compatibilidade

Código: `src/lib/themes/levels.ts` (níveis e capacidades), `policy.ts` (política pura, usada pelo editor e pelo servidor), `license.ts` (contexto da loja a partir do banco), `catalog.ts` (catálogo central). Testes: `tests/temas-politica.test.ts`.

## 1. Cinco conceitos separados

| Conceito | Onde fica | Decide |
|---|---|---|
| Plano operacional (oferta) | `stores.offer` + `features.ts` | Se a loja tem loja virtual; serviços, equipe, domínio, relatórios |
| Nível do tema (N1–N4) | `ThemeInfo.level` | Capacidades de apresentação e de edição |
| Identidade (família) | `ThemeInfo.family` + `SectionSchema.families` | Composição, tipografia, cartões e seções exclusivas da família |
| Segmento | `FAMILY_INFO[family].segment` | Conteúdo inicial e loja de demonstração |
| Licença | `entitlements` (`THEME_<KEY>`) | Direito daquela loja de instalar e editar aquele tema |

A edição deriva do **tema ativo** e da licença dele, não do plano. Comprar um tema N2 numa loja SuperDrop de subdomínio libera os recursos N2 daquele tema, sem upgrade de plano.

## 2. Níveis (cumulativos)

| | N1 Grátis | N2 NextLevel Commerce | N3 Commerce PRO | N4 Commerce ULTIMATE |
|---|---|---|---|---|
| Estrutura | Fixa (edita e oculta espaços opcionais) | + até 3 espaços extras aprovados por página; a composição do tema mantém a ordem | Adicionar, mover, duplicar e remover qualquer seção do nível | + modelos de página e campanha |
| Destaque | 1 imagem (computador e celular) | Até 2 slides | Carrossel até 6, automático opcional | Vídeo com capa |
| Banners | 4 posições na home (destaque, dois de apoio, faixa) | + posições extras e variantes de formato | Mosaico, banners entre vitrines | Agendamento (horário de Brasília) e condição por categoria |
| Estilo | Logo, cores e fontes | Cantos, botões e compra rápida | — | Movimento ao rolar |
| Conteúdo | Textos, vitrines, selos | Imagem com texto, FAQ, chamada | Lookbook, depoimentos, contagem | — |
| Navegação | Menu e categorias | Categorias com imagem | Ordenação | Menu grande e busca com sugestões |

Recursos de todos os níveis, que nunca são incentivo comercial:
- segurança, acessibilidade, histórico e restauração;
- adequação ao celular, catálogo e checkout;
- recorte, foco, imagem de celular, descrição e link dos banners.

Lista completa de capacidades: `CAPABILITY_LEVEL` em `levels.ts`.

## 3. Política (uma só)

`policy.ts` responde, com motivo legível:
- **`canPurchase` / `canInstall`**: liberação, licença e loja virtual;
- **`sectionAvailability`**: nível, família, módulo operacional e página;
- **`structureRights` / `blockLimit` / `settingAllowed`**: o que o editor mostra e trava;
- **`checkTemplateChange`**: conferência ao salvar; compara o documento novo com o atual;
- **`checkPublishable`**: conferência ao publicar; cada seção precisa ser permitida agora ou já ter existido com direito (publicado ou histórico).

Motivos distintos: `NO_STOREFRONT`, `NOT_RELEASED`, `NO_LICENSE`, `CAPABILITY_LOCKED`, `FAMILY_ONLY`, `MODULE_UNAVAILABLE`, `INCOMPATIBLE`, `LIMIT`. No servidor, eles viram os códigos `THEME_LOCKED`, `THEME_LIMIT`, `THEME_INVALID`, `THEME_NOT_RELEASED`, `THEME_NOT_OWNED` e `DRAFT_CONFLICT`. Dado inválido é recusado, não "corrigido" em silêncio.

## 4. Compatibilidade (direitos já vendidos)

1. **O que já está no documento continua valendo**: mesmo id e mesmo tipo de seção podem ser editados, mesmo acima do nível atual. Isso cobre lojas que ganharam seções antes da política.
2. **Ajuste acima do nível pode voltar ao padrão ou ser desligado**, mas não pode ganhar valor novo.
3. **Oferta "Loja própria"** (`LEGACY_PLAN_GRANTS`) mantém o que o "Editor avançado" vendia:
   - reorganizar, adicionar e duplicar seções da base;
   - cantos, botões, compra rápida e movimento.

   Ela **não** libera seções de temas pagos.
4. **Concessões do catálogo** (`ThemeInfo.grants`): o Editorial mantém o vídeo que anunciava antes da classificação.
5. **Licença comprada não se perde** quando o tema volta para revisão: quem tem a licença instala.
6. **Restaurar uma versão de outro tema** reativa esse tema, se a loja tiver a licença.

## 5. Dependências operacionais

Um bloco de tema pode exigir um módulo da plataforma (`SectionSchema.module`). Hoje há um só: `wholesale` (atacado), ainda não implementado. O editor mostra a seção travada com a explicação "o tema sozinho não liga esse serviço", e a loja não a desenha sem o módulo. O tema nunca concede módulo operacional.

## 6. Liberação

`release`:
- **`released`**: vendido e instalado;
- **`review`**: só demonstração por link; compra e instalação recusadas no servidor;
- **`draft`**: não aparece em público.

O catálogo é a fonte única de preço, liberação e capacidades para a home, `/temas`, o painel do lojista e a Loja NextLevel.

## 7. Concorrência e publicação

- Cada página e o grupo global têm `revision`. Salvar com revisão antiga gera `DRAFT_CONFLICT`, sem sobrescrever. O editor mostra o aviso e oferece recarregar.
- Publicar é uma transação única (todas as páginas e os globais) e também confere as revisões que o editor conhece. Nunca sai cabeçalho de uma revisão com home de outra.
- Instalar um tema guarda os rascunhos no histórico como `kind: "draft"`, com o tema anterior, e sobe as revisões.

## 8. Retorno (rollback)

- **Migração `0040_temas_modulares`**: só adiciona colunas com padrão e uma tabela. Voltar o código para o commit anterior funciona com o banco migrado, porque as colunas novas são ignoradas.
- **Pelo histórico**: "Antes de instalar X" e "Rascunho guardado antes de instalar X" restauram o estado anterior, com troca de tema, se houver licença.
