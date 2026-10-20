# Prompt engenheiro mestre: Mapa do Ecossistema vivo no Master

> 20/10/2026 · frente [Grupo] · decisão do dono: "página nova no Master". Origem: o mapa estático `Mapa_do_Ecossistema_NextLevel.html` (18/10, gerado do código) e `docs/mapa/MAPA-ECOSSISTEMA-2026-10-18.md`.
> Leia antes: `CLAUDE.md`, a skill `painel-interno`, D135 (Torre), D142/D147 (Central de qualidade e Mapa vivo das páginas), D173 (seletor de marca), D174 (revisão dos desligados).

## 1. O problema

O mapa de 18/10 é uma fotografia: mostra marcas, sites, painéis e conexões, mas envelhece no dia seguinte e não diz **o que está bem e o que precisa de atenção agora**. O dono quer abrir o Master e ver o ecossistema **vivo**: cada marca com os números de hoje, cada site com a última conferência, cada painel com quantas pessoas usam, cada conexão com o volume real. Cada pedaço deve levar à tela que resolve.

## 2. Princípios (não negociáveis)

1. **Estender, não duplicar.** O mapa é uma camada de leitura sobre o que já existe:
   - números das lojas: `listStoresWithPlan`;
   - visão geral: `getPlatformOverview`;
   - clientes em mais de uma marca: `presenceByDocument` + `ecosystemIndex` da Torre;
   - conferência dos domínios: `qa_runs` DOMINIOS;
   - pronto e desligado: `readyButOff` + `revisao-desligados`;
   - erros abertos: `error_events`;
   - registro das marcas: `brandsFrom`.

   Nenhuma tabela nova.
2. **Só leitura e sem efeito colateral.** Abrir o mapa não cria oportunidades (não chamar `ecosystemTower`, que grava a fila) nem dispara checagem externa.
3. **Uma consulta por bloco.** Contagens agrupadas: usuários por marca e papel numa consulta só; nada de consulta dentro de laço.
4. **Verdade.** Número que não existe aparece como "—" com o motivo, nunca inventado. Dados de demonstração são os do banco.
5. **Permissão no servidor.** Só o Master; a equipe vê o mapa se a função dela abre `/master/mapa`. O mapa não mostra valor de token, chave nem dado pessoal: só contagens e estados.
6. **Marca escolhida no seletor (D173) filtra o mapa.** "Todas" mostra tudo; uma marca destaca o nó dela e filtra as tabelas.
7. **Acessibilidade AA.** O desenho tem alternativa em texto (tabela) e cada nó é um link com nome. Sem rolagem lateral em 360 px. Movimento só decorativo, respeitando `prefers-reduced-motion`.

## 3. O que a página mostra (`/master/mapa`)

| Bloco | Pergunta que responde | Fonte | Leva a |
|---|---|---|---|
| **Constelação** (desenho) | Como as marcas se ligam e qual está saudável? | Registro das marcas + saúde calculada + pares da Torre | Cada nó → página da marca no Master (`/commerce`, `/master/stores?marca=`, `/bras`) |
| **Cartão por marca** | Quantos clientes, quanto vende, o site está no ar? | Lojas e vendas 30 dias, usuários por papel, última conferência do domínio | Lista de lojas / clientes / Central de qualidade |
| **Sites** | Cada endereço respondeu na última conferência? | `qa_runs` DOMINIOS (último) | Central de qualidade → Domínios |
| **Painéis** | Quantas pessoas em cada painel, por marca? | `users` × `organizations.brand` agrupado por papel | Clientes e suporte |
| **Conexões** | Quem já está em duas marcas? | `ecosystemIndex` (pares) | Torre do Ecossistema |
| **Saúde do motor** | Erros abertos, itens desligados sem decisão do mês, última publicação | `error_events`, `readyButOff` + revisão, versão | Erros do sistema, Pronto e desligado |

### Saúde de cada marca (regra pura, testada)

- **Atenção (vermelho):** o domínio falhou na última conferência, OU a marca está no ar e tem erro aberto ligado a ela.
- **Observar (amarelo):** sem conferência do domínio há mais de 7 dias, OU marca no ar sem nenhuma venda ou cadastro em 30 dias.
- **Bem (verde):** o resto.
- **Em preparação (cinza):** a marca ainda não está no ar (`live = false` ou `soon`).

O motivo da cor aparece sempre em texto ao lado. A cor sozinha nunca carrega a informação.

## 4. Desenho da constelação

- SVG feito no servidor, sem biblioteca nova:
  - holding NextLevel no centro;
  - marcas de produto em volta, na ordem do foco 60/25/15 (E-commerce, SuperDrop, Brás, Cargas, Em breve).
- Cada nó traz:
  - um círculo na cor da marca (`accentColor`), com o tamanho proporcional à raiz do número de clientes (mínimo e máximo fixos);
  - um anel com a cor da saúde;
  - o nome e um número principal (lojas ou membros ou transportadoras).
- Linhas:
  - holding → marca, sempre;
  - marca ↔ marca, quando houver clientes em comum, com espessura proporcional ao número e o número escrito na linha.
- Movimento: um pulso suave no anel das marcas em "atenção" (desligado com movimento reduzido).
- No celular o desenho encolhe (`viewBox`) e, abaixo de 480 px, vira a lista de cartões (o desenho some e a tabela fica).

## 5. Fases

- **M0 (este pacote):**
  - domínio `src/lib/domain/ecossistema/mapa.ts` com `mapaDoEcossistema(db, actor, agora)` e as regras puras `saudeDaMarca` e `raioDoNo`;
  - testes;
  - página `/master/mapa` com constelação, cartões por marca, sites, painéis e conexões;
  - item no menu do Master ("Mapa do ecossistema", comum a todas as marcas);
  - link no Dashboard;
  - decisão D175.
- **M1:**
  - linha do tempo do ecossistema: decisões recentes por frente, lidas de um resumo gerado no build a partir de `DECISIONS.md` (as tags `[E-commerce]` etc. da D174), e o "Esforço do mês por frente" contra a meta 60/25/15;
  - fluxo do dinheiro por marca (receita NextLevel do mês por marca).
- **M2:**
  - botão "Conferir agora", que roda `checkDomains` e atualiza a constelação;
  - histórico de 30 dias da saúde (uma linha por marca);
  - alerta no Resumo do dia quando uma marca fica vermelha.
- **M3:** exportar o mapa como página estática (o HTML de 18/10, agora gerado com os dados de hoje) para mandar a sócios ou investidores, sem dados pessoais.

## 6. Contrato de dados (M0)

```ts
type SaudeMarca = { nivel: "BEM" | "OBSERVAR" | "ATENCAO" | "PREPARACAO"; motivo: string };
type NoMarca = {
  code: BrandCode; nome: string; cor: string; endereco: string; noAr: boolean;
  clientes: number;               // lojas (EC, SD), membros (Brás), transportadoras (Cargas)
  rotuloClientes: string;         // "lojas", "membros", "transportadoras"
  vendas30d: { pedidos: number; gmv: number } | null; // só onde há pedido de loja
  usuariosPorPapel: { papel: string; rotulo: string; n: number }[];
  site: { ok: boolean | null; quando: string | null; detalhe: string | null };
  saude: SaudeMarca;
  href: string;                   // tela do Master que cuida da marca
};
type MapaEcossistema = {
  geradoEm: string;
  marcas: NoMarca[];
  pares: { a: BrandCode; b: BrandCode; n: number }[];  // clientes em comum
  motor: { errosAbertos: number; desligadosSemDecisao: number; desligados: number; ultimaConferencia: string | null };
};
```

## 7. Aceitação

- Teste de domínio:
  - as regras de saúde (cada nível com o motivo);
  - o mapa num banco semeado: marcas na ordem do foco, números batendo com `listStoresWithPlan`, pares batendo com `ecosystemIndex`;
  - abrir o mapa não grava nada (o número de oportunidades cruzadas não muda);
  - lojista e fornecedor não acessam.
- Navegador:
  - `/master/mapa` em 1440 e 360 px, sem rolagem lateral;
  - cada nó é um link;
  - o seletor "SuperDrop" destaca o nó do SuperDrop;
  - capturas examinadas antes de apresentar.
- Tipos, estilo, build e a bateria completa passam.

## 8. Fora do escopo

- Editar qualquer coisa a partir do mapa: ele aponta, não opera.
- Nova checagem externa automática (a Central de qualidade continua sendo o lugar de conferir).
- Dados de clientes individuais: só contagens.
