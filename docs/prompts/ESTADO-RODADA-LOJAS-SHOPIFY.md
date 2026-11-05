# Estado da rodada "lojas no nível Shopify" (para continuar sem perda)

Última atualização: 03/11/2026, à noite.

## Respostas do dono (03/11)
1. Aprovado o adicional **Marca Completa: R$ 19,90/mês com 3 caixas de e-mail**; caixa extra a **R$ 6,90/mês**.
2. Provedor de e-mail: **Hostinger**.
   - Achado da pesquisa: a API da Hostinger cria e troca a senha de caixas, aliases e encaminhamentos (`/api/mail/v1/orders/{orderId}/mailboxes`).
   - Ela também compra itens da categoria EMAIL (`POST /api/billing/v1/orders`).
   - Porém, ligar o domínio do cliente a um pedido de e-mail novo só se faz no hPanel. Ou seja, **não fica 100% automático**.
   - Levar ao dono duas saídas: (a) um provedor com API completa de domínio e caixa, como Migadu ou Purelymail; (b) a Hostinger com 1 passo manual por cliente.
3. **O cliente registra o próprio domínio e conecta sozinho.** Ajuda técnica é cobrada à parte, com parceiros oficiais indicados.
   - Regra do dono: "nada pode depender da gente". O domínio é automático; o Render entra pela chave de API.
4. O dono vai criar a chave de API do Render. Isso já aparece em **Master → Agora → "Suas pendências"** (`src/lib/domain/pendencias-dono.ts`).
5. Avançar nas fases L1 a L6 (`lojas-nivel-shopify-temas-banners-chat-central.md`).
6. Serviços de parceiros com comissão: **PENDENTE, não executar** (`servicos-parceiros-afiliados.md`).

## Feito e publicado
- D233: Black (versão e6cf1ae).
- D234: domínio próprio (versão 68f1b09).

## L1 (D237): feito; publicado neste commit
- `src/lib/themes/loja-completa.ts`:
  - `garantirLojaCompleta` instala, uma vez, o tema grátis da família (trama, moda) com as fotos de exemplo dos pacotes, na loja E-commerce sem nada salvo.
  - O gatilho fica em `resolveTemplate` e `resolveGlobals` (`store.ts`).
  - `instalando` evita o laço com `applyThemeToStore` (`install.ts`).
- `levels.ts`: liberações para o N1 (grátis):
  - reordenar e acrescentar seções;
  - carrossel de 3;
  - mosaico, cartões, banner por categoria, cupom;
  - perguntas, chamada, contagem regressiva, imagem com texto.
  - O vídeo foi para o N2 e a agenda de campanha para o N3.
- `sections.ts`: novos limites por nível.
  - slides [3,4,6,6]; mosaico [3,4,5,5]; cartões [2,4,4,4]; banner por categoria [4,8,12,12].
  - O início e o fim da campanha agora pedem N3.
- `presets-familia.ts`: o N1 virou uma home completa.
- Outros, também desta rodada:
  - "Suas pendências" no Master → Agora;
  - o domínio próprio repete o cadastro na hospedagem na verificação;
  - textos sem dependência da equipe.
- **Testes atualizados para as regras novas** (1219 passando).
- A reordenação e o acréscimo de seções continuam do N3 em diante, para não mudar o SuperDrop.

## Próximas fases (seguir nesta ordem)
- **L2: feito (D238).**
- **L3: feito (D239).** Falta a IA generativa no chat; o dono precisa decidir se ela conta na cota do plano.
- **L4: feito (D240).** Falta: endereços salvos, favoritos e pedido de troca formal.
- **L5: a fazer.** Cache da vitrine com renovação ao publicar e mudar preço ou estoque; imagens por CDN; medição Lighthouse antes e depois.
- **L6: textos feitos (D240).** Faltam recursos novos de N3/N4: compre o look, pacote com desconto e recomendação.

## Respostas do dono (04/11), D241
- E-mail: trocar a Hostinger por um provedor com API completa.
- IA: os planos mais caros absorvem o custo; nos básicos, o cliente usa a própria chave de API. Falta consolidar a lógica.

## 04/11: BF4 feito (D242); regra da IA aprovada (D243)
Próximos passos, nesta ordem:
1. Implementar a IA por plano (D243): cota, tela "Use sua chave" e IA no chat da loja para Pro e Scale.
2. Adicional Marca Completa: pesquisar Migadu, Purelymail e Zoho, escolher e implementar a contratação em 1 clique.
3. L5: medir a velocidade, ligar o cache e medir de novo.
4. Parceiros: fases PV0–PV8.

## 04/11: IA por plano feita (D244); e-mail grátis guiado e Marca Completa bloqueado (D245)
Feito: L5 (D246), PV6 (D247), PV0 comissões D226 + 100% na Black (D248), PV2 níveis + bônus do representante (D249), regra dos 6 meses (D250), PV1+PV3 CRM de parceiros no Master (D251).
Próximos passos: PV4 captação, PV5 /i/anasouza, PV7, PV8.
