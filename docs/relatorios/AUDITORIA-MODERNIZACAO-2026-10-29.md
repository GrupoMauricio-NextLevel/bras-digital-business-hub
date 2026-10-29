# Auditoria de modernização: E-commerce, painel do lojista e Master (2026-10-29)

**Pedido do dono:** "busca ativa: não quero nada antigo; o Master tem que estar pronto para receber as marcas do grupo; a próxima marca é a NextLevel Soluções."

## Como foi feita
Varredura automática (Playwright) de cada tela dos menus, em computador (1440 px) e celular (390 px). Para cada tela foram conferidos:
- se abre (código HTTP) e se tem título;
- erros no navegador;
- rolagem lateral no celular;
- termos de marca fechada ou antigos ("SuperDrop", "Central", "recarga", "Commerce" sem "E-", "Brás", "Marcas do grupo", "dashboard");
- caixas no desenho antigo.

As capturas foram examinadas uma a uma.

| Área | Telas | Resultado |
|---|---|---|
| Painel do lojista | 30 | Todas abrem, sem erro e sem rolagem lateral. Nenhum termo antigo. |
| Página pública | 14 | Ok. `/duvidas` e `/recuperar-senha` não existem, mas nenhum link aponta para elas. |
| Master | 24 | Termos de marcas fechadas em 8 telas; Templates no desenho antigo, com jargão técnico. |

## O que foi corrigido (D218)
1. **Cadastro único de negócios** (`src/lib/negocios.ts`):
   - estados: aberto, próximo, pausado, em breve;
   - toda tela pergunta "este negócio está aberto?" em vez de citar marcas fixas;
   - a **NextLevel Soluções** entra no seletor como **Próximo**.
2. **Filtro central de marca do Master** (`masterBrandFilter`): com um negócio só aberto, toda lista fica presa nele, e marca fechada nunca aparece.
3. **Telas do Master ajustadas:**
   - **Clientes:** sem filtro de marca (só um negócio aberto), sem "Fornecedores" e sem coluna de marca.
   - **Equipe:** as funções descrevem só o que existe nos negócios abertos.
   - **Financeiro:** o MRR e a composição contam só os negócios abertos; textos sem "recargas" e sem "Commerce" solto.
   - **Assinaturas e Planos:** sem SuperDrop no texto.
4. **Templates → Temas:** a mesma vitrine da página pública (capturas reais, filtro por segmento), com números úteis (à venda, grátis, pagos, lojas usando). Sai o jargão técnico (ThemeVersion, StoreTheme).
5. **Canto do menu do Master:** "Master do grupo · Grupo NextLevel · E-commerce" (lista os negócios abertos).
6. **Página "Quero minha loja":** duas colunas (o que acontece depois, garantias e formulário em cartão).
7. **Rodapé e barra do grupo:** sem "conta de pontos do Club" (coisa da Brás).
8. **Números do topo com 3 itens:** 3 colunas, sem o quadrado cinza vazio.

## Como abrir a NextLevel Soluções no Master (roteiro)
1. Criar a marca de produto da Soluções em `src/lib/brand.ts`. Hoje a Soluções usa o código da holding, `NEXTLEVEL`, e a página `/solucoes`.
2. Incluir a marca em `MASTER_MARCAS` (`src/lib/master-marca.ts`) e marcar `temArea: true` no cadastro de negócios.
3. Criar o menu do escritório da Soluções (como `MASTER_ECOMMERCE_NAV`) e as telas no padrão novo: "Precisa de você agora", fichas e Comercial.
4. Abrir no Render: `MASTER_MARCAS_ATIVAS=NEXTLEVEL_COMMERCE,<código da Soluções>`. O seletor de negócios passa a trocar entre os dois.

## Pendências menores (não bloqueiam)
- O formulário de cadastro da Equipe ainda oferece a função "Contador parceiro" (só faz sentido com a Brás aberta).
- O "Recebido em 30 dias" do Financeiro soma todas as faturas pagas. Em produção só existem as da E-commerce.
- A página `/solucoes` (marca-mãe) ainda cita SuperDrop, Brás e Cargas no menu. Ela será refeita na etapa da Soluções.
