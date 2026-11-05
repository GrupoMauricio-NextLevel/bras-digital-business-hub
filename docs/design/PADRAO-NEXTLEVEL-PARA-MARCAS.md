# Padrão NextLevel: como levar o que foi feito na E-commerce para as outras marcas

> Pedido do dono (05/11/2026): "Esse progresso visual que fizemos, tudo o que aplicamos, módulos novos, páginas públicas e painéis internos, está salvo na memória para começar a avançar em outras marcas?"
> Este é o mapa único para isso. A fonte da verdade continua sendo o código e o `DECISIONS.md` (D210 a D252). Aqui fica **o que levar, onde está e como ligar** numa marca nova.

Marcas do sistema (`src/lib/brand.ts`, `BRAND_CODES`):
- NEXTLEVEL_COMMERCE (a referência, em produção);
- SUPERDROP (comportamento congelado: não muda sem teste, D216);
- BRAS_DIGITAL;
- CREATORS_HUB;
- CHINA_HUB;
- NEXTLEVEL_CARGAS;
- NEXTLEVEL (holding e Master).

---

## 1. Visual (o "kit de tecnologia")

| Peça | Onde | Decisão | Para outra marca |
|---|---|---|---|
| Tipografia de tecnologia (display + mono nos rótulos) | `src/app/layout.tsx` (fontes), `--nl-font-display` | D222 | Já é global; a marca só escolhe o peso e o tamanho |
| Blocos de informação (`ec-cartao`, `ec-painel`, `ec-icone`, `ec-tag`, `ec-cabecalho`, `ec-perguntas`) | `src/components/imersiva/imersiva.css` (`.im-tema-ecommerce`) | D222/D223 | Criar `.im-tema-<marca>` com as **mesmas classes** e só trocar as cores (`--ec-marinho`, sinal, apoio) |
| Páginas públicas imersivas (seções, movimento, campos de cor alternados) | `src/components/imersiva/*`, `src/components/portal/commerce/imersiva/*` | D219/D223 | Reaproveitar `secao-imersiva.tsx`, `foto.tsx`, `jornada.tsx` |
| Painéis: capa no padrão Hostinger, abertura em vidro colorido, "Precisa de você agora" | `src/components/app/role-layout.tsx`, `precisa-de-voce.tsx`, `src/design-system/*` | D210, D212, D215, D224, D225 | Já servem a todas as marcas. A cor vem de `brand-palette.ts` (`--brand-*`) |
| Tema da Black (preto, neon verde e ciano), faixa e contagem | `campanha-black.ts`, componentes da faixa | D229–D233 | A campanha é única; ligar a faixa por marca na configuração |
| Selos e provas (com prompts para o gerador de imagem) | `docs/marca/SELOS-E-PROVAS.md` | D221 | Gerar os selos próprios da marca |

**Regra:** a cor de cada marca vem de `src/lib/brand-palette.ts` e de `--brand-*`. Nunca copie CSS com cor fixa. O roxo é só do Master e da NextLevel marca-mãe.

---

## 2. Módulos novos (o que existe e se já serve para outra marca)

**Legenda:**
- ✅ já é por marca ou geral;
- 🔧 precisa ligar ou ajustar por marca;
- 🛒 é próprio de loja virtual.

| Módulo | Domínio (lógica) | Decisão | Situação para outras marcas |
|---|---|---|---|
| Comparativo e placar da goleada (súmula no Master) | `comparativo-ecommerce.ts`, `placar.ts` | D219, D221, D230 | 🔧 Uma súmula por marca (rivais daquela marca) |
| Planos com benefícios numa tabela só, com travas | `beneficios-plano.ts` | D247 | 🔧 Hoje lê os planos `COMMERCE_*`; outra marca precisa da sua chave de configuração |
| Black Friday (campanha, preço agendado, contagem) | `campanha-black.ts` | D229 | ✅ Campanha única do grupo |
| Domínio próprio automático | `dominio-proprio.ts`, `src/proxy.ts` | D234, D236 | 🛒 Qualquer marca que tenha loja |
| E-mail com o domínio, sem custo | `email-marca.ts` | D245 | 🛒 |
| Loja completa no tema grátis, banners, área Banners | `themes/loja-completa.ts`, `pontos-banner.ts` | D237, D238 | 🛒 Temas por família (SuperDrop congelado) |
| Chat da loja com dados reais + IA | `assistente-loja.ts` | D239 | 🛒 |
| Minha conta do cliente final (código por e-mail) | `conta-cliente.ts` | D240 | 🛒 |
| Kit Black da loja | `kit-black-loja.ts` | D242 | 🛒 |
| IA por plano (cota, chave da loja) | `ia-por-plano.ts`, `ia.ts` | D243, D244 | 🔧 Cotas por plano de cada marca |
| Velocidade da vitrine (consultas em paralelo, cache por requisição) | `store/[slug]/layout.tsx`, `catalog.ts` | D246 | ✅ Vale para toda vitrine |
| Comissões versionadas + 100% na Black | `revisao-d226.ts`, `corporate-commissions.ts` | D248 | 🔧 Regras por família de produto; criar a família da marca |
| Níveis de parceiro + bônus do representante | `niveis-parceiro.ts`, `finance/niveis-regras.ts` | D249 | 🔧 O cálculo é geral; a recorrência por nível é da família `COMMERCE_PLAN` |
| Regra dos 6 meses; sem meta mensal na E-commerce | `niveis-parceiro.ts`, `partners.ts` | D250, D252 | 🔧 Hoje a isenção do corte mensal é só da E-commerce |
| CRM de parceiros no Master (funil, ficha 360, segmentos, desafio) | `crm-parceiros.ts`, `master/partners/*` | D251 | ✅ Já mostra todos os parceiros; filtro por marca é o próximo passo |
| Página de captação de parceiros (perfis, escada, simulador, cadastro em etapas) | `captacao-parceiros.ts`, `finance/captacao-regras.ts`, `portal/commerce/parceiros/*` | D252 | 🔧 Textos e regras da marca; o cadastro em etapas já é genérico |
| Atacado (planejado) | `docs/prompts/atacado-nextlevel-ecommerce.md` | D250 | 🛒 Planejado (AT0–AT8) |

---

## 3. Como levar para uma marca (roteiro)

1. **Decidir o que a marca é** e escrever a decisão no `DECISIONS.md`: loja virtual? fornecedor? serviço? Isso diz quais módulos 🛒 entram.
2. **Marca e cores:** conferir `brand.ts`, `brand-palette.ts`, `brand-server.ts` (domínio e recursos ligados, `requireBrandFeature`).
3. **Visual:** criar `.im-tema-<marca>` em `imersiva.css` com as mesmas classes `ec-*` (só as cores mudam) e usar os mesmos componentes de seção.
4. **Páginas públicas:** seguir a skill `pagina-de-vendas` (manifesto de ativos, nada inventado, 3 rodadas de capturas). Reaproveitar a estrutura da E-commerce:
   - topo;
   - prova;
   - comparativo com fonte;
   - planos;
   - parceiros;
   - dúvidas.
5. **Painéis:** já recebem a marca pela conta. Conferir com a skill `painel-interno` que cada marca vê só o que existe para ela.
6. **Planos e benefícios:** criar a chave de benefícios da marca (padrão D247) e as regras de comissão da família de produto (padrão D248).
7. **Parceiros:** regras por família, textos da captação e a decisão "tem meta mensal ou não" (D252).
8. **SuperDrop:** qualquer mudança em código compartilhado precisa de teste provando que o SuperDrop não mudou.
9. **Fechar** com a skill `publicar`: tipos, lint, testes, build, decisão nova, conferência em produção.

---

## 4. Onde a memória está (para qualquer sessão continuar sem perda)

- **Este arquivo:** o mapa de reaproveitamento.
- **`docs/design/DECISIONS.md`:** o porquê de cada coisa. A próxima decisão está em `CLAUDE.md`.
- **`docs/prompts/README.md`:** a fila de prompts e o estado de cada um.
- **`docs/prompts/ESTADO-RODADA-LOJAS-SHOPIFY.md`:** o estado da rodada atual.
- **Prompts com o engenheiro mestre:**
  - parceiros (`parceiros-v2-crm-niveis-planos.md`);
  - atacado (`atacado-nextlevel-ecommerce.md`);
  - lojas no nível Shopify (`lojas-nivel-shopify-temas-banners-chat-central.md`);
  - serviços de parceiros (`servicos-parceiros-afiliados.md`, bloqueado).
- **Skills do projeto** (`.claude/skills/`):
  - `levar-para-marca` (este roteiro);
  - `pagina-de-vendas`;
  - `painel-interno`;
  - `desenvolver-prompt`;
  - `nova-migracao`;
  - `publicar`;
  - `qa-visual`;
  - `desempenho`.
