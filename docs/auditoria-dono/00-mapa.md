# Fase 0 — Mapa do sistema (marcas, papéis, painéis, caminhos)

Levantado em 07/10/2026 a partir de `src/lib/nav.ts`, `src/lib/brand.ts`, `src/components/app/role-layout.tsx`, `src/app/**` e das contas de demonstração (`src/db/*`). Links completos: `docs/LINKS.md`.

## 1. Marcas e onde ficam

| Marca | Endereço | Estado | Painéis que existem nela |
|---|---|---|---|
| NextLevel (grupo) | master.nextlevelgroup.com.br | no ar | Master, console Commerce (`/commerce`), central de clientes (`/master/clientes`) |
| SuperDrop | superdrop.com.br · office.superdrop.com.br | no ar, com clientes | Lojista, Fornecedor, Expedição, Parceiro |
| NextLevel Commerce | lojas.nextlevelgroup.com.br | no ar | Loja (dono e equipe), administração Commerce |
| China Hub | chinahubglobal.com.br | página "em breve" | — |
| Brás Digital, Hub Creators | domínio não ligado | código "em breve" | — |

A marca de um painel vem da **organização da loja** (não do endereço): uma loja Commerce aberta pelo endereço do SuperDrop continua Commerce (`brandOfStore`).

## 2. Papéis × painéis × menu

| Papel (`users.role`) | Painel | Entrada | Grupos do menu |
|---|---|---|---|
| `NEXTLEVEL_MASTER` | Master | `/master` | Plataformas (Commerce) · Operação (Dashboard, **Clientes e suporte**, Pedidos, Resumo do dia, Erros, Integridade, CRM) · Rede (Fornecedores, Redes, Lojas, Catálogo) · Negócio (Parceiros, Escritório, Financeiro, Templates, Planos, Configurações) |
| `NEXTLEVEL_MASTER` (escopo Commerce) | Administração Commerce | `/commerce` | Visão geral, Lojas, Vendas, Catálogo, Interessados, Planos, Configurações + "Voltar ao Master" |
| `SUPPLIER_ADMIN` | Fornecedor | `/supplier` | Operação (Esteira, Pedidos, Corte) · Financeiro (Recargas, Faturas, Financeiro) · Rede (Lojistas, Minha loja, Equipe) · Catálogo (Produtos, Estoque, Conteúdo) · Conta |
| `SUPPLIER_DISPATCH` | Expedição (tela mínima, toque) | `/supplier/dispatch` | Fila, Imprimir etiquetas, Enviados |
| `STORE_OWNER` SuperDrop | Lojista (Lite/Pro conforme oferta) | `/merchant` | Vendas · Catálogo · Loja virtual · Financeiro; itens com cadeado conforme o plano |
| `STORE_OWNER` + `storeRole=STAFF` | Equipe da loja | `/merchant` | só operação (pedidos, catálogo, clientes, etiquetas, pós-venda, avaliações, avise-me, conteúdo) |
| `STORE_OWNER` Commerce | Painel da loja Commerce | `/merchant` | menu em sanfona (Vendas, Catálogo, Marketing, Loja virtual, Gestão, Configurações) |
| `AFFILIATE` | Parceiro | `/partner` | Início, Links, Cupons, Indicações, Financeiro, Perfil |
| Fornecedor com loja própria | troca de contexto | `/supplier` ⇄ `/merchant` | "Entrar na minha loja" / "Voltar ao fornecedor" (`own-store.ts`) |

## 3. Contas de demonstração (senha `demo1234`, só em modo demonstração)

| Conta | Papel | Marca |
|---|---|---|
| master@nextlevel.demo | Master | grupo |
| megatron@superdrop.demo, central@centralsports.demo, alpha@demo.superdrop.com.br, mantosshop@demo.superdrop.com.br | Fornecedor | SuperDrop |
| expedicao@megatron.demo, expedicao@centralsports.demo | Expedição | SuperDrop |
| loja@mrssports.demo, dono@arena10.demo, dono@futclassics.demo, dono@mantosshop.demo | Lojista | SuperDrop |
| parceira@demo.superdrop.com.br | Parceiro | SuperDrop |
| completo@commerce.demo (Casa Aurora, dados ricos), lojista@commerce.demo | Dono de loja | Commerce |
| paulo@casaaurora.demo, sofia@casaaurora.demo, equipe@commerce.demo | Equipe da loja | Commerce |

**Lacunas:** não há conta de demonstração de parceiro no Commerce (o programa de parceiros é só SuperDrop hoje) nem de equipe de loja SuperDrop.

## 4. Caminhos do dono até um cliente (antes × depois desta rodada)

```
ANTES
Master ─► /commerce/stores ─► "Entrar como lojista" (só Commerce, sem motivo, sem registro, cookie de volta SEM assinatura)
Master ─► fornecedores/lojas SuperDrop: só leitura de dados; não havia como ver o painel do cliente

DEPOIS (fase 2)
Master ─► Clientes e suporte (/master/clientes) ─► busca (nome, e-mail, loja, fornecedor) + filtro de marca e papel
        └► "Ver como cliente" ─► motivo ─► painel do cliente com faixa de modo suporte (somente leitura)
             ├► "Agir em nome do cliente" (2º passo, confirmado e registrado)
             └► "Sair do modo suporte" ─► volta exatamente para a busca de onde saiu
Console Commerce ─► Lojas ─► "Ver como lojista" (mesmo mecanismo)
```
Cliques do Master até o painel de qualquer cliente: **3** (menu → busca/linha → confirmar motivo).

## 5. Achados da fase 0

| # | Achado | Gravidade | Situação |
|---|---|---|---|
| 0.1 | Volta do "Entrar como lojista" confiava em um cookie com o código do Master **sem assinatura**: um lojista que soubesse esse código poderia forjar o cookie e virar Master | **Crítica** (segurança) | Corrigido na fase 2: permissão assinada, presa à sessão, com prazo e auditoria; cookie antigo removido |
| 0.2 | Suporte só existia para lojas Commerce; SuperDrop (em produção) não tinha como ver o painel do cliente | Alta (operação) | Corrigido: central de clientes cobre lojista, equipe, fornecedor, expedição e parceiro de todas as marcas |
| 0.3 | Acesso de suporte não ficava registrado nem tinha motivo | Alta (confiança) | Corrigido: motivo obrigatório, trilha visível ao dono da loja e no Master |
| 0.4 | Sem conta de demonstração para equipe de loja SuperDrop e parceiro Commerce | Baixa | Pendente (fase 1) |
| 0.5 | Seletor de contas de demonstração não troca de marca (depende do endereço) | Média | Pendente (fase 2/4) |
