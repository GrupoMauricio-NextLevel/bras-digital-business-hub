# Brás Digital Club — Fases E0 e E1 (D112, D113)

## Em 5 linhas (para o dono)
- **Starline pronta para entrar:** em Brás → Empresas do grupo, o cadastro dela como ônibus de excursão já vem preenchido; falta só contato e WhatsApp.
- **Autorizações com selo:** cada transportadora informa as autorizações. Você confere, e aparece "documentação em dia" enquanto estiverem válidas.
- **O cliente de qualquer importadora escolhe a transportadora no pedido**, num catálogo com ônibus e transportadoras, e a importadora já recebe essa escolha ao chamar a coleta.
- **Painel de frete único (Meu Brás → Fretes):** pedido, coleta e entrega na mesma linha do tempo, para ônibus ou transportadora.
- **"Minha transportadora não está aqui":** o cliente indica a que já usa e recebe o convite pronto para o WhatsApp; quando ela entra e faz a primeira entrega, a indicação conta (os pontos chegam na E4).

## Entregue
| Função | Para quem | Onde |
|---|---|---|
| Empresas do grupo (Starline, Mega Tron, NextLevel) e cadastro pré-preenchido da Starline | Master | Brás → Empresas do grupo |
| Regras da Excursão (tamanhos P/M/G, taxa por fardo, capacidade, nota obrigatória) | Master | Brás → Ônibus de excursão |
| Tipo "ônibus de excursão" e autorizações com conferência | Transportadora e Master | Perfil da transportadora; Brás → Transportadoras → Gerenciar |
| Selos "empresa do grupo" e "documentação em dia" | Todos | Catálogos e listas |
| Catálogo de transportadoras no pedido | Membro | Fazer pedido |
| Escolha do cliente na coleta | Importadora | Transportadoras → Chamar |
| Painel de frete, catálogo por estado, indicação | Membro | Meu Brás → Fretes |
| Indicadas por clientes (convite e recusa) | Master | Brás → Transportadoras |

## Ficou para depois e por quê
- **Rotas, viagens e fardos dos ônibus (painel tipo app):** fase E2, a próxima.
- **Pontos do Club e painel gamificado:** fase E4. As indicações já são registradas e mudam de etapa sozinhas.
- **Arquivo (PDF ou foto) da autorização:** por enquanto número, órgão e validade; o anexo vem na próxima rodada.
- **CNPJ da Mega Tron e da NextLevel:** a completar por você em Empresas do grupo.

## O que depende de você
1. Completar contato e WhatsApp da Starline e clicar em "Cadastrar transportadora" (Empresas do grupo).
2. Cadastrar as autorizações da Starline (Transportadoras → Gerenciar → Autorizações).
3. CNPJ da Mega Tron e da NextLevel.
4. As perguntas da seção 13 do prompt continuam valendo; sigo com os padrões em rascunho.

## Verificação
- Tipos, estilo, build e a bateria completa de testes ok.
- Testes novos: 14 (`cargas-excursao-e0`, `frete-painel-e1`).
- E2E `bras-portal` inteiro com o passo 9 (grupo, regras, painel de frete, catálogo e indicação) e axe em 390 e 1440 px.

## Próxima fase
E2: rotas, viagens e fardos, e o painel do dono do ônibus em modo app.
