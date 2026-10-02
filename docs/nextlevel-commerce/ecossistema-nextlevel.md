# Ecossistema NextLevel: um sistema central, cada produto no seu domínio

> **CONFIRMADO (D39):** 1 sistema, 1 Render, 1 Neon. Mapa de domínios e passo a passo atualizados em `ligar-escritorio.md`.

**Decisão do dono:** 1 sistema central da NextLevel, com 1 serviço no Render (plano Starter, US$ 7/mês) e 1 banco no Neon. Produtos, cada um com o seu domínio, todos sob uma **gestão Master** única. **O SuperDrop já tem clientes e lojas para subir: não pode sofrer nenhuma regressão.**

## 1. Produtos
| Produto | Para quem | Natureza |
|---|---|---|
| **NextLevel Master** (central) | equipe NextLevel | gestão de todos os produtos, financeiro, planos, equipe |
| **NextLevel Commerce** (motor de lojas virtuais) | lojistas de qualquer lugar | lojas, temas, checkout, frete, pagamentos (base de todos) |
| **SuperDrop** | fornecedores conectando vendedores do Brasil inteiro | dropshipping: catálogo e estoque do fornecedor, carteira Pix, expedição |
| **Brás Digital** | vendedores de varejo e atacado menor do Brás | marketplace/vitrine do atacado (camada sobre lojas e pedidos) |
| **Hub Creators** | influenciadores e vendedores do TikTok e outras redes | links rastreáveis, campanhas, amostras, comissões (a Creator Commerce Platform) |
| **China Hub** | fornecedores e importadores (chineses e brasileiros) | captação e onboarding de fornecedores importadores (mandarim, espanhol, português) |

**Regra de arquitetura (já em vigor):** "marcas e pacotes de módulos sobre o mesmo motor". Uma marca liga módulos (`stores, themes, partners, dropship, wholesale, influencers, marketplace…`). Não se cria tabela, tela ou regra duplicada por marca: estende-se o que existe.

## 2. Como 1 Render + 1 Neon funciona
- **Um deploy atende todos os domínios.** O sistema descobre a marca pelo endereço digitado (`brandForHost`) e entrega logo, textos, menus e regras daquela marca.
- **Cada domínio é adicionado ao mesmo serviço** (US$ 0,25/mês cada, além dos 2 inclusos).
- **Um banco só.** Toda organização, loja e usuário carrega a sua marca (`organizations.brand`); o isolamento de segurança continua sendo por **tenant** (um lojista nunca lê outro), e a marca é a **segunda trava** (uma conta só entra pelo endereço da própria marca; já implementado).
- **Um push atualiza tudo.** Por isso o SuperDrop, que tem clientes, é protegido por testes, ligações **desligadas por padrão** (variáveis por marca) e a regra de nunca mexer no comportamento dele sem teste.

### Mapa de domínios (proposta)
| Produto | Endereço público | Painéis | Estado |
|---|---|---|---|
| SuperDrop | `superdrop.com.br` | `office.superdrop.com.br` | domínios criados; ligar `BRAND_OFFICE_SUPERDROP` |
| NextLevel Commerce | `lojas.nextlevelgroup.com.br` | no próprio endereço (ou `office.nextlevelgroup.com.br`) | `lojas.` aguardando DNS |
| NextLevel Master (central) | — | `master.nextlevelgroup.com.br` (sugestão) | a criar |
| Brás Digital | domínio a comprar | no próprio endereço | marca existe, sem domínio |
| Hub Creators | domínio a comprar | no próprio endereço | marca a criar no código |
| China Hub | domínio a comprar (ex.: `.com` ou `.com.br`) | no próprio endereço | marca a criar no código |

Custo de domínios extras: ~US$ 0,25 por endereço/mês (4 hoje; com Brás, Creators e China ficam ~7 a 8, ≈ US$ 1,5 a 2/mês). Dá para começar com os painéis dentro de cada endereço público e só criar `office.*` onde fizer falta.

## 3. Gestão Master (central) e gestão por produto
| Nível | Quem | Enxerga | Entra por |
|---|---|---|---|
| **Master da holding** | você | todos os produtos, seletor de marca, financeiro consolidado | qualquer endereço (ou `master.`) |
| **Gestor de produto** | quem cuida do SuperDrop, do Brás, do Hub Creators ou do China Hub | só o próprio produto | só o endereço do produto |
| Suporte (futuro) | atendimento | leitura limitada de um produto | conforme o produto |

Só a holding vê: financeiro consolidado, planos e preços globais, Mercado Pago e e-mail da NextLevel, acessos dos gestores.

Implementação: cada usuário Master recebe um **escopo de marcas** (vazio = todas), um único filtro de marca aplicado em todas as listas do Master, e testes provando que o gestor de um produto não vê dados de outro. Início do Master por endereço: no endereço de um produto abre a área daquele produto (já feito para a Commerce).

## 4. Dados compartilhados e separados
- **Compartilhado (motor):** contas e login, lojas e pedidos, catálogo e estoque, pagamentos e frete, temas, e-mail, parceiros/afiliados, financeiro, auditoria.
- **Por marca (camada fina):** textos, logo, módulos ligados, tabela de planos/comissões da marca, idioma, domínio, regras de cadastro.
- **China Hub e Hub Creators têm necessidades próprias**, sem duplicar o motor:
  - China Hub: internacionalização (mandarim/espanhol), cadastro de fornecedor importador com documentos, moeda e prazos de importação, vínculo com SuperDrop e Brás Digital.
  - Hub Creators: o domínio `creator_*` do prompt `creator-commerce-plataforma.md` (fronteira de domínio própria, comunicando-se com o Commerce por eventos), no mesmo repositório e banco por enquanto.

## 5. Riscos do "1 só" e como controlar
| Risco | Controle |
|---|---|
| Um erro de deploy derruba todos os produtos | testes, build e e2e antes de publicar; variáveis por marca desligadas por padrão; rollback no Render |
| Dado de um produto aparece em outro | isolamento por tenant + conta presa à marca + escopo de marcas no Master + testes de isolamento |
| Memória do Starter (512 MB) apertada com 5 produtos | monitorar; subir o plano do Render quando necessário |
| Limite do Neon gratuito (armazenamento e horas) | acompanhar o uso; plano pago do Neon quando passar; backups/branches do Neon antes de mudanças grandes |
| SuperDrop em produção sofrer regressão | nenhuma mudança de comportamento dele sem teste; nova marca só liga por domínio/variável; checklist antes de cada deploy |
| Crescer demais para um serviço | caminho de saída pronto: o mesmo código roda em serviços separados (cada um com `DEFAULT_BRAND` e seu próprio banco), sem reescrever |

## 6. Ordem de construção sugerida
1. **Ligar o que está pronto:** `office.superdrop.com.br` (variável), `lojas.nextlevelgroup.com.br` (variáveis da marca).
2. **Master por produto:** escopo de marcas, filtro em Pedidos, CRM, Parceiros, Financeiro; Master central.
3. **Higiene de segurança:** Master real e remoção dos usuários de demonstração do banco.
4. **Cadastrar as marcas novas no código** (Hub Creators e China Hub: nome, cores, módulos, textos, idioma) com portal próprio.
5. **P1** (etiqueta pela API, rastreio) e o **China Hub** (cadastro de fornecedor importador).
6. **Hub Creators:** diagnóstico e MVP conforme o prompt já salvo.
