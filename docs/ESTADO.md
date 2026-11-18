# Estado de hoje

> **Primeira coisa que toda conversa lê** (a skill `/retomar` faz isso). Uma página só: o que está no ar, o que está em andamento, o que vem em seguida e o que espera o dono. **Quem termina uma conversa atualiza este arquivo** (skill `/encerrar`). Histórico não fica aqui: decisões vão para `docs/design/DECISIONS.md` e as regras em vigor para `docs/design/DECISOES-VIGENTES.md`.

**Atualizado em:** 18/11/2026 · **Última decisão:** D345 · **Última migração:** 0118 · **Branch de publicação:** `claude/wonderful-cannon-5o38v5`

## No ar (o que mudou nos últimos dias)
- Quatro portas e um painel: páginas `/sites` e `/business`, 50% no segundo produto, cartão do ecossistema (D336).
- Meu negócio: funil em quadro, "Hoje" e "Pede pro Maurício" no contato (D337); Captação com página de campanha, links e QR (D339).
- Painel da Agência (base do NextLevel Business): personalizável para qualquer segmento (D340) e contratos a 100% (D342).
- Painéis com vida no lojista, no Master e na agência (D331 a D335); cadastro de produto completo (D328); editor de temas no modo suporte (D329); o carregamento não trava mais (D330).
- Banco que dorme (D338); Next 16.4.1 com a correção de segurança; verificação Google e Bing pronta, esperando o código do dono (D343).

## Frentes ativas (uma conversa por frente)
| Frente | Próximo passo | Não mexer em |
|---|---|---|
| **Business = Painel da Agência** (D344) | ligar o cartão "NextLevel Business" do Meu negócio ao painel personalizável; trazer as telas novas para o visual "com vida" | planos da loja |
| **Meu negócio / Sites** | Captação: Pixel e link curto por loja (fica para depois da D339) | painel da agência |
| **Loja virtual** | ajustes que os lojistas reais pedirem | Business |
| **Planos tudo em um (D345)** | rodada 1: tabela de preços, catálogo e implantação como produto (seção 13) | Business por dentro |

## Esperando o dono
1. **Precificação tudo em um aprovada (D345):** falta o "pode começar" da rodada 1 do sistema (seção 13 de `docs/precificacao/PRECIFICACAO-TUDO-EM-UM.md`), para estar no ar em 01/12.
2. **Neon:** limitar o processamento a no máximo 1 CU e acompanhar o consumo (D338).
3. **Google e Bing:** criar a propriedade no Search Console e colar o código no Render (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`) (D343).
4. **Master:** criar o usuário da equipe pedido na conversa do editor de temas (Equipe do Master, sem Financeiro) e mandar o e-mail.
5. **Comercial:** plano e valor dos dois lojistas, origem do Bazar Prime, autorização de uso do nome e depoimento (plano comercial, branch `claude/cool-hamilton-xfcd23`).

## Branches fora do ar
- **Juntar só o documento quando der:** `claude/peaceful-fermi-m20pc2` (checklist do dono), `claude/cool-hamilton-xfcd23` (plano comercial), `claude/fabrica-conteudo-redes-sociais-sxu3ne` (fábrica de conteúdo).
- **Conferir antes:** `claude/design-content-audit-kfs4gm` (auditoria fase 1; pode já estar superada).
- **Descartadas (D344), não juntar:** `claude/vigilant-bell-neurpc` (preço pelos concorrentes, abandonado em 18/11), `claude/upbeat-babbage-ianepy` (academia), `claude/eloquent-ramanujan-rfizdl` (Club), `revisao/ecommerce-home-imersiva` (versão antiga da caixa de entrada).
- **Adiadas:** atualizações do TypeScript 7 e do ESLint 10 (dependabot).

## Filas guardadas (prompts prontos para quando a frente voltar)
- Painéis com vida, PV0 a PV10: `docs/prompts/paineis-com-vida-prompt-mestre.md`.
- Integrações I-01 a I-32 (próxima: Rodada A, só configuração): `docs/prompts/integracoes-aplicativos-fila.md`.
- Auditoria do dono nos painéis e páginas: `docs/prompts/auditoria-dono-paineis-e-paginas.md`.
- Ecossistema e Business: `docs/prompts/ecossistema-tudo-em-um-aproveitamento.md` (o `nextlevel-business-coracao-do-negocio.md` vale só onde não contradiz D324, D336 e D344).
- Editor de temas: `docs/prompts/editor-templates-evolucao.md` · Público, personas e preço: `docs/prompts/publico-personas-precos-ecossistema.md`.

## Pausado (não gastar tempo até as 10 pagantes)
Academia e Club · UPClips além do que existe · Brás · Cargas · SuperDrop · Hub Creators · China Hub.
