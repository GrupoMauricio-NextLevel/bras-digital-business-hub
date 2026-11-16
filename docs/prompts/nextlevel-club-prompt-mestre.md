# NextLevel Club
## Racional de produto e prompt mestre para Claude Code

### Como usar

Coloque este arquivo no workspace do repositório que mantém a NextLevel Commerce e envie ao Claude Code:

> Leia `NEXTLEVEL-CLUB-PROMPT-MESTRE.md` por inteiro. Execute a seção **Prompt mestre para Claude Code** sobre o repositório atual. Use as skills disponíveis que forem pertinentes, valide o que já está implementado e avance até entregar um fluxo funcional dentro do escopo.

## 1. Decisão de produto

O **NextLevel Club** é o aplicativo de relacionamento e benefícios da NextLevel Commerce. Um estabelecimento consegue captar clientes, trazer pessoas de volta e divulgar ofertas. O consumidor consegue ativar uma carteirinha, indicar pessoas, encontrar benefícios e resgatá-los pelo celular.

**Academias e farmácias são os primeiros perfis comerciais.** O cadastro, o vínculo do consumidor com o estabelecimento, as permissões, a identidade visual, as ofertas e os resgates precisam servir também a outros negócios. O segmento define sugestões de configuração e módulos disponíveis. Uma padaria ou um pet shop deve conseguir ativar o núcleo com a configuração genérica, mesmo sem um pacote vertical dedicado.

O aplicativo é o canal permanente. Um mutirão ou evento mensal é uma ferramenta opcional de aquisição. A inscrição deve poder levar à ativação no Club, a uma visita, a uma aula experimental ou a outro objetivo escolhido pelo negócio. A operação do Club continua entre os eventos e funciona em unidades que optem por operar sem eles.

### Duas experiências de marca

| Configuração | Experiência do consumidor | Oferta comercial |
|---|---|---|
| **NextLevel Club** | Marca NextLevel, com identidade da unidade e acesso aos benefícios elegíveis de parceiros. | Adesão mais simples para negócios locais. |
| **Marca própria** | Nome, logotipo, cores, ícone e endereço da empresa conforme recursos contratados. | Implantação e mensalidade compatíveis com configuração e suporte. |

As duas experiências compartilham a base, as regras e as correções. Aproveite temas, domínios e configuração por empresa existentes. Defina de forma explícita se a unidade participa de ofertas entre parceiros e quais benefícios aparecem em cada experiência. Em domínio próprio, confirme a origem da sessão, as permissões e a identidade do estabelecimento. Se houver PWA, valide ícone, nome, armazenamento e isolamento de cache por origem. Publicação nativa pode virar oferta comercial posterior.

## 2. O que reaproveitar

O briefing relata operação em produção com loja, catálogo, checkout Pix/cartão, CRM, indicações, Club com pontos/vales/carteirinha QR, acerto entre parceiros, temas, assinaturas, painel Master e isolamento por empresa. Confirme a implementação e a cobertura de cada função antes de usá-la. O código e a configuração efetivamente em uso têm precedência sobre esta descrição.

O briefing registrava uma restrição histórica de ativação do Club às marcas Brás Digital e Cargas. Verifique se ela ainda existe, preserve os vínculos e as regras legadas e ofereça habilitação por empresa através do mecanismo administrativo já adotado. O objetivo desta entrega é permitir que qualquer negócio elegível seja configurado, com ativação explícita e verificável. Contas atuais conservam sua experiência e seus dados durante a expansão.

Aproveite os mecanismos existentes de atribuição, Pix e auditoria. Verifique se o rastreamento por empresa está pronto antes de prometer conversões para Meta e Google. Ficha de treino, agenda completa, catraca, notificações e entregas locais avançadas seguem como incrementos conforme o estado do código e a aderência comercial.

## 3. Jornadas e configuração por segmento

| Perfil | Jornada prioritária | Recursos específicos e evolução |
|---|---|---|
| **Academia** | Indicação, QR ou campanha → pedido de aula experimental → confirmação pela recepção → matrícula registrada → ativação da carteirinha → indicação ou resgate. | Começar com registro manual quando o sistema atual permitir. Evoluir agenda, horários, ficha de treino, check-in e integrações com gestão somente conforme demanda e encaixe técnico. |
| **Farmácia** | QR na loja ou oferta de parceiro → cupom → resgate no balcão ou compra/retirada de item elegível → recompra. | Começar por higiene, beleza e conveniência. Usar o motor de loja e retirada se estiverem prontos. Evoluir entrega por bairro, taxa, prazo e despacho quando a farmácia conseguir cumprir o nível de serviço. |
| **Negócio genérico** | Convite ou QR → vínculo com a empresa → oferta elegível → resgate → histórico. | Configurar textos, marca, ofertas, permissões e módulos sem depender de uma entidade específica de academia ou farmácia. |

**Oferta entre negócios.** Exemplo de validação: um aluno resgata um cupom de higiene na farmácia, o balcão confirma o resgate e o painel mostra o resultado comercial por oferta. Defina quem publica, quem financia, quem valida, quantidade disponível, validade e regra de reversão. O estabelecimento acompanha a operação própria e os dados mínimos dos resgates que está autorizado a validar.

**Benefícios de saúde.** Prever no catálogo um formato de benefício externo para teleconsulta, ginecologia, exames laboratoriais e atendimento domiciliar. O prestador confirma área atendida, preço, condições e agenda. Uma oferta como consulta + revisão ou exames com preço negociado só aparece após confirmação comercial. Fluxos de atendimento, prescrições, laudos, diagnósticos e pagamentos clínicos permanecem no prestador no primeiro ciclo. Aplicação domiciliar é eventual, sob avaliação individual, prescrição quando aplicável e aceite do prestador. O Club pode mostrar o canal de agendamento. Dados clínicos e informações que revelem o interesse individual em um serviço de saúde ficam fora de pontos, CRM comercial, pixels, exportações e relatórios de parceiros.

**Operação da farmácia.** O catálogo inicial atende bens de higiene, beleza e conveniência. Medicamentos, propaganda, prescrição e entrega exigem escopo próprio validado com a farmácia e seu responsável técnico, com consulta às regras vigentes da Anvisa antes da ativação. O atendimento automatizado pode orientar sobre pedido, disponibilidade ou contato e encaminhar questões de saúde ao farmacêutico.

## 4. Preço e sinais para validar

Separar o valor do software para a empresa, o preço de cada serviço para o consumidor e a remuneração por vendas atribuíveis. Os preços abaixo são hipóteses comerciais, configuráveis e sujeitos ao piloto.

| Oferta | Referência | O que precisa ser medido |
|---|---:|---|
| Consumidor | **R$ 0 de adicional pelo acesso básico** | Ativação, retorno, indicação e resgate. |
| Academia com foco em captação | **R$ 397/mês por unidade** | Leads qualificados, aulas experimentais, matrículas confirmadas e custo por matrícula. |
| Academia com captação e Club | **R$ 597 a R$ 797/mês por unidade** | Uso do Club, matrículas por indicação e margem adicional. |
| Marca própria | **Sob proposta** | Custo de implantação, personalização e suporte por unidade. |
| Farmácia | **Sob proposta no piloto** | Pedidos ou resgates, margem após desconto, recompra e custo operacional. |
| Campanha de lançamento | **R$ 1.500 a R$ 3.000 quando contratada** | Escopo de produção, ativações e conversão. Verba de mídia em separado. |

Uma condição fundadora de até 90 dias pode facilitar a entrada. Percentual sobre venda ou valor por matrícula exigem atribuição, definição de elegibilidade, conciliação de cancelamentos e acordo comercial. Avalie quais cobranças fazem sentido juntas e use o catálogo e as permissões por plano que o sistema já oferece. A disposição a pagar do consumidor deve ser medida por tipo de benefício e compra real. Uma assinatura premium depende de demanda e custo do benefício confirmados.

## 5. Prompt mestre para Claude Code

> Você é o engenheiro responsável pela evolução do NextLevel Club dentro da NextLevel Commerce em produção. Use as seções anteriores como requisitos de produto e parta do repositório real. Entregue um incremento funcional de ponta a ponta com os recursos já implementados. Escolha arquitetura, componentes, modelo de dados e ordem técnica conforme a evidência do código.

### 5.1 Descoberta e skills

1. Leia `CLAUDE.md`, `AGENTS.md`, regras aplicáveis, documentação técnica, scripts, instruções de branch e skills oferecidas no projeto e no workspace. Verifique o estado do Git e preserve mudanças em andamento. Confirme a branch de trabalho conforme o fluxo do repositório.
2. Descubra e aplique as **skills realmente disponíveis** que contribuam para a tarefa. Use as pertinentes para arquitetura e leitura de código, frontend mobile e acessibilidade, dados e migrações, revisão defensiva de permissões e privacidade, testes e revisão. Use skills de cobrança ou integrações somente se esse código entrar na entrega. Siga a documentação de cada skill. Se alguma capacidade estiver ausente, prossiga com o fluxo normal do repositório.
3. Trace os fluxos de produção relevantes da interface até a persistência. Localize configuração da empresa e da unidade, vínculo de membro, ofertas, carteira, pontos, QR, resgate, indicação, tracking, checkout, autenticação, permissões, temas e auditoria. Para cada requisito, classifique o estado encontrado em **operacional**, **parcial** ou **pendente**, com referências do código.
4. Escolha o menor incremento que entregue os fluxos abaixo com o reaproveitamento adequado. Explique decisões que afetem compatibilidade, dados ou operações. Prossiga da análise para a implementação quando houver caminho seguro no workspace. Quando uma integração externa impedir um trecho, entregue e valide os fluxos independentes e documente o ponto exato de integração que ficou pendente.

### 5.2 Entrega prioritária

1. **Habilitação e identidade.** Uma empresa autorizada pode receber o Club por configuração existente ou extensão compatível. Ofereça perfis Academia, Farmácia e Genérico, com recursos opcionais e configuração de marca compartilhada ou própria. Aproveite o painel e as políticas de acesso já estabelecidos.
2. **Área do membro no celular.** Ativação pelo mecanismo existente de cadastro ou convite, vínculo com a empresa, carteirinha, ofertas elegíveis, detalhes da oferta e histórico básico. Mostre ações e estados claros para benefício disponível, vencido, indisponível ou já usado.
3. **Operação do estabelecimento.** O responsável autorizado consegue configurar ou consultar ofertas e verificar resgates. O balcão recebe os dados mínimos para confirmar um resgate. Reaproveite o mecanismo de pontos e acertos existente quando a oferta exigir.
4. **Demonstração das verticais.** Em ambiente de desenvolvimento, demonstre indicação ou pedido de aula experimental com registro de matrícula para uma academia e cupom de conveniência resgatado para uma farmácia. Demonstre também um negócio genérico usando o núcleo. Use dados fictícios.
5. **Medição.** Reaproveite o mecanismo existente para registrar ativações, indicações confirmadas e resgates. Defina a origem e o denominador de cada métrica. Use fluxos comerciais elegíveis em relatórios e campanhas de cada empresa. Benefícios de saúde seguem as regras de privacidade da seção 3.

### 5.3 Invariantes e critérios de aceite

- O servidor resolve a empresa e a autorização de cada operação. Valide papéis de gestão central, responsável do negócio, balcão e membro conforme a estrutura existente. Uma segunda empresa fornece um cenário defensivo de verificação de isolamento de ofertas privadas, clientes, resgates e relatórios.
- Um membro encontra a identidade, a carteirinha e as ofertas da empresa correta. O mesmo núcleo atende Academia, Farmácia e Genérico. Valide ambas as configurações de marca nas superfícies que a entrega efetivamente cobre.
- O resgate respeita elegibilidade, validade, saldo ou limite e empresa responsável. Duplo clique, repetição da requisição e concorrência preservam o limite e evitam duplicação de resgate, pontos ou acerto. Vincule reversões ao evento original segundo as regras existentes.
- Dados antigos continuam utilizáveis. Caso haja migração, verifique o resultado com dados anteriores, migração nova, estratégia de reversão compatível com o banco e impacto nas marcas já ativas. Use habilitação gradual onde a plataforma suportar.
- Formulários e navegação atendem uso no celular e por teclado. Confira estados vazios, carregamento, falha e sucesso. Rode verificações do repositório, incluindo tipagem, lint, testes e build conforme disponíveis. Acrescente testes voltados às novas regras onde os existentes deixarem lacunas.
- Integrações e cobranças reais requerem contas, credenciais e ambiente autorizados. Valide com sandbox ou dados fictícios quando apropriado. Trate a validação local, o deploy e a ativação de clientes reais como etapas distintas ao relatar o estado da entrega.

### 5.4 Como encerrar a execução

Entregue um resumo com funcionalidades reaproveitadas e implementadas, arquivos e migrações relevantes, comandos e resultados de verificação, como ativar e demonstrar cada perfil, decisões técnicas relevantes e o próximo incremento. Identifique explicitamente o que foi verificado de ponta a ponta e o que ainda depende de acesso, configuração ou contratação.

## 6. Como avaliar o piloto

| Horizonte sugerido | Academia | Farmácia | Club |
|---|---|---|---|
| **Primeiros 30 dias** | Pedidos de aula, comparecimento e conversão em matrícula. | Cupons emitidos e resgatados, pedidos e margem após desconto. | Ativações, primeiro resgate e falhas do fluxo. |
| **Até 90 dias** | Matrículas por origem, custo e renovação das primeiras turmas ou coortes elegíveis. | Recompra, custo de atendimento, margem e pedidos por origem. | Uso recorrente, resgates entre negócios e valor percebido da marca própria. |

Registre uma linha de base antes de cada piloto. Diferencie **matrículas atribuídas** de **matrículas incrementais**. Para estimar resultado incremental, compare com histórico equivalente ou com um grupo comparável quando houver volume. Use os resultados para decidir se vale ampliar o número de parceiros, desenvolver integrações específicas ou testar uma assinatura premium.
