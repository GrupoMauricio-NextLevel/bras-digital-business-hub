# NextLevel Business para academias: racional amplo de algo inédito

> Pedido do dono (16/11/2026, D306): "Não quero concorrer com sistemas que eles já têm, como catraca e pagamentos. O NextLevel Business precisa se adequar a isso. Lembra que falamos sobre o Club: precisamos de uma comunidade de usuários com diversos benefícios. E precisamos do mesmo sistema de parceiros que temos no Master, para a academia captar clientes com parceiros."
> **Substitui o escopo** de `docs/prompts/business-piloto-academia.md` (D305): saem cobrança, check-in de controle e catraca. Ficam a jornada de captação, a farmácia como próximo segmento e as perguntas da P0.
> Autoridade: Constituição > `DECISIONS.md` > este documento. Nada daqui vale como regra até virar D-número.
> Legenda: **[fato]** está no código; **[mercado]** a conferir na fonte; **[inferência]** conclusão; **[hipótese]** o piloto confirma ou derruba.

---

## 1. A ideia em uma frase
**O sistema de gestão cuida de quem já é aluno. A NextLevel Business traz aluno novo e faz o aluno ficar**, com uma comunidade de benefícios (o Club) e uma rede de parceiros que indicam a academia, funcionando sozinha, por cima do sistema que a academia já usa.

## 2. Onde não vamos entrar (e por quê)
| A academia já tem | Exemplos [mercado] | Nossa postura |
|---|---|---|
| Catraca e controle de acesso | Henry, Topdata, catracas integradas aos sistemas | **Não fazemos.** No máximo lemos "o aluno veio hoje" se o sistema dela permitir |
| Cobrança recorrente, maquininha, boleto | Sistema de gestão, banco, adquirente | **Não cobramos o aluno.** Nunca passamos dinheiro da mensalidade |
| Sistema de gestão (contrato, ficha, treino, agenda) | Tecnofit, Next Fit, EVO (W12), Pacto, Cloud Gym | **Somos complemento, não substituto.** Importamos o mínimo (quem está ativo) |
| Agregadores de acesso corporativo | Wellhub (Gympass), TotalPass | **Não vendemos acesso à academia.** Eles levam funcionário de empresa; nós trazemos o bairro e a comunidade |

**Por que isso é bom [inferência]:** trocar de sistema de gestão é doloroso (dados, contratos, recepção treinada); somar uma camada de crescimento não é. A conversa de venda deixa de ser "troque seu sistema" e vira **"continue com o seu sistema; a gente traz mais alunos e segura os que você tem"**.

## 3. O que é inédito (as cinco peças juntas)
Isoladas, cada peça existe em algum lugar. **Juntas, num produto só, ligadas a um clube de benefícios do bairro e operando sozinhas**, não conhecemos quem faça para academia de bairro [hipótese a conferir em P0].

1. **Club da academia:** comunidade com pontos, níveis, desafios e benefícios reais no comércio do bairro e nas marcas do grupo.
2. **Programa de parceiros da academia:** personal, nutricionista, fisioterapeuta, influenciador, loja de suplemento, empresa vizinha e o próprio aluno indicam com link e cupom rastreados, e ganham comissão ou benefício.
3. **Rede de benefícios do bairro:** o comércio local dá vantagem ao aluno em troca de cliente novo. A academia vira o centro de uma rede, não só um lugar de treino.
4. **Captação com origem:** página da academia, aula experimental, links rastreados e retorno às plataformas de anúncio de quem virou aluno (a Meta aprende a achar gente parecida).
5. **Liga entre academias:** desafios entre alunos, turmas e academias da rede NextLevel (ex.: "Liga do Bairro: 30 dias de treino"), sem sorteio, com prêmios por meta.

**O efeito de rede [inferência]:** cada academia que entra traz alunos para os comércios; cada comércio que entra deixa o Club mais valioso para os alunos de todas as academias. Isso é difícil de copiar por um sistema de gestão, porque não é software: é rede.

## 4. Peça 1: o Club da academia (comunidade de benefícios)
**[fato]** O motor já existe no Brás Digital Club (D113 a D122): pontos em razão que não se reescreve (`club_ledger`), regras editáveis com versão (D115), cartão com QR, vales, níveis, missões, ranking, balcão para o comércio validar o benefício e acerto entre empresas. **Não é sistema novo: é o mesmo Club com o rosto da academia.**

**Como o aluno ganha pontos (sem depender da catraca):**
| Ação | Como o sistema sabe | Observação |
|---|---|---|
| Treinar (frequência) | (a) integração com o sistema de gestão, onde existir; (b) o aluno lê o **QR do Club** na recepção para "marcar presença e ganhar pontos" | É opcional e voluntário: não controla entrada, só premia |
| Indicar um amigo que matriculou | Link ou cupom do aluno (peça 2) | Só vale quando o indicado fica ativo (regra de garantia, como D271) |
| Completar desafio do mês | Presenças e metas | Ex.: 12 treinos no mês, 4 semanas seguidas |
| Aniversário de matrícula | Data de entrada | Fidelidade |
| Avaliar a academia, postar marcando o @ | Confirmação simples | Prova social para a captação |

**O que o aluno troca:**
- benefícios da própria academia (camiseta, aula avulsa para um amigo, mês com desconto que a academia aplica no sistema dela);
- **benefícios no comércio do bairro** (peça 3), validados no balcão pelo QR;
- benefícios nas marcas do grupo (lojas da Commerce, Megatron).

**Níveis e identidade:** Iniciante, Constante, Atleta, Lenda (nomes a testar), com selo no cartão e no ranking. O nível não se perde por um mês fraco (cai devagar), para não punir.

**Regras que não quebram [fato, D115]:** ponto não é dinheiro, não se saca, não se transfere e vence. Sem sorteio (sorteio exige autorização federal [mercado]); prêmios só por meta ou ranking.

**Por que segura o aluno [inferência]:** quem tem nível, sequência, amigos no ranking e economia acumulada mostrada em reais tem um motivo a mais para não cancelar. O painel mostra à academia "alunos com Club ativo cancelam X% menos" (medido no piloto, nunca prometido).

## 5. Peça 2: programa de parceiros da academia (o mesmo do Master)
**[fato]** O motor já existe: parceiros com tipos (`partners.kind`: afiliado/influenciador, representante, agência…), link e cupom rastreados, atribuição que não muda depois (D-atribuição em `stores.partner_id`), comissões, bônus gamificado com teto (D271), missões, sequência, selos e ranking (D272), página pública de comissões (D272), executivos de rua (D273, D274). **A academia ganha o mesmo motor, com as regras dela.**

**Quem pode ser parceiro da academia:**
| Parceiro | Por que indica | O que pode ganhar |
|---|---|---|
| Aluno embaixador | Treinar com amigo | Pontos, mês com desconto |
| Personal trainer | Precisa de lugar para atender | Comissão ou benefício |
| Nutricionista, fisioterapeuta | Paciente precisa treinar | Comissão ou troca de indicação |
| Influenciador fitness local | Conteúdo e público | Comissão por matrícula |
| Loja de suplementos, roupa fitness | Cliente dela treina | Troca: ela indica a academia, a academia indica a loja no Club |
| Empresa do bairro (convênio) | Benefício para os funcionários | Condição especial para o grupo |

**Como a matrícula é confirmada sem passar pela cobrança (regra de ouro D304 + D306):**
1. O indicado chega pelo link ou cupom do parceiro e deixa contato (ou agenda a experimental).
2. A matrícula é confirmada por uma destas formas, a que a academia escolher: integração com o sistema de gestão; um toque da recepção no painel ("matriculou"); ou o primeiro QR do Club lido na recepção.
3. A comissão só fica liberada depois de um prazo de garantia (ex.: 30 dias ativo), configurável pela academia.

**Como o parceiro recebe:** a NextLevel **não paga nem recebe** a comissão. O sistema calcula, mostra o extrato ao parceiro e à academia, e a academia paga por fora (Pix) e marca como paga; ou a academia escolhe pagar em benefício (pontos, mês grátis). Nada de promessa de ganho nos textos.

## 6. Peça 3: rede de benefícios do bairro
- O comércio (suplemento, açaí, restaurante saudável, roupa fitness, fisioterapia, salão, ótica) entra **sozinho** por uma página: escolhe o benefício (ex.: 10% para aluno nível Constante), horário e limite.
- O aluno mostra o cartão do Club; o comércio lê o QR no celular (**[fato]** o balcão do Club já existe) e o benefício é registrado.
- O comércio vê quantos clientes a rede trouxe. A academia vê quanto os alunos economizaram. O aluno vê a economia dele em reais.
- Um comércio pode atender os alunos de várias academias da rede: é aqui que a rede cresce sozinha.
- **Como a NextLevel ganha aqui [hipótese]:** plano do comércio para aparecer em destaque ou alcançar mais academias; o básico é grátis para a rede crescer.

## 7. Peça 4: captação com origem (já pronta em grande parte)
**[fato]** O sistema já tem: links rastreados e origem de cada contato (D290, D294), quem está no site agora (D291, D292), Pixel da Meta e Google com consentimento (D295) e retorno às plataformas de quem virou cliente (D298).
- Página da academia (feita com o motor de páginas e temas, como a vitrine da Commerce): fotos, modalidades, horários, "agendar aula experimental", depoimentos, benefícios do Club.
- Funil automático: interessado → experimental marcada → veio → matriculou → ativo no Club. A etapa vem dos fatos, como no CRM da loja (D207).
- Mensagens automáticas: lembrete da experimental, "não veio, quer remarcar?", boas-vindas ao Club.
- Painel: de onde vêm os alunos (Instagram, anúncio, parceiro X, aluno Y, Google), custo por aluno quando há anúncio.

## 8. Peça 5: liga entre academias e comunidade
- **Desafios mensais** com ranking por aluno, por turma e por academia (Liga do Bairro).
- **Eventos da rede:** aulão aberto, corrida do bairro, desafio solidário; a inscrição gera contato novo para a academia (captação).
- **Mural de conquistas:** o aluno compartilha o selo no Instagram com o @ da academia (prova social que traz o próximo aluno).
- Tudo sem expor dado pessoal além do apelido escolhido pelo aluno.

## 9. Como conversa com o sistema que a academia já tem
Do mais simples ao mais completo, a academia escolhe:
1. **Sem integração:** a academia cola ou envia a lista de alunos ativos (planilha) uma vez por mês, e a recepção confirma matrículas com um toque. Funciona no dia 1.
2. **Planilha automática:** exportação do sistema de gestão importada sozinha (formato padrão).
3. **Integração:** onde o sistema de gestão tiver API ou aviso automático, lemos "aluno ativo", "aluno saiu" e "veio hoje" [mercado: conferir API pública de Tecnofit, Next Fit, EVO e Pacto]. Só leitura; nunca escrevemos no sistema dela.

**Constituição [fato]:** integração não define o núcleo (seção 31); entra por fronteira controlada, e o produto funciona sem ela.

## 10. Como fica no motor (sem duplicar)
| Peça | Reaproveita | Novo só para a Business |
|---|---|---|
| Conta da academia | Tenant do mesmo tipo da loja (login, equipe, isolamento) | Segmento "academia" como capacidade (Constituição, seção 28) |
| Club | `club/*` (pontos, regras, balcão, ranking, indicações) | O Club passa a ter "dono" por academia, sem misturar saldos entre academias quando a academia quiser regra própria |
| Parceiros | `partners`, links, cupons, bônus, missões | Parceiro ligado à academia, não à NextLevel; comissão só calculada (não paga pela NextLevel) |
| Captação | `trafego/*`, CRM da loja, páginas e temas | Etapas do funil de academia |
| Rede do bairro | Balcão do Club, cadastro de fornecedor/prestador | Página de entrada do comércio e o benefício configurável |

Isolamento: uma academia nunca vê alunos, parceiros ou números de outra; o comércio só vê o que a rede trouxe para ele (contagem), nunca a lista de alunos.

## 11. Dados e regras (LGPD e consumidor)
- O aluno entra no Club **por vontade própria**, com aceite claro; pode sair e apagar os dados.
- Nada de dado de saúde (peso, medidas, atestado) na Business.
- Mensagens com consentimento e opção de parar.
- Sem sorteio; prêmio por meta ou ranking.
- Textos sem promessa de ganho para parceiros (regra do projeto).

## 12. Como a NextLevel ganha [hipótese, testar no piloto]
- **Academia:** mensalidade da Business por faixa de alunos ativos no Club, com grátis para começar (o padrão "grátis para começar, paga quando cresce" do ecossistema).
- **Comércio da rede:** básico grátis; plano para destaque e alcance em mais academias.
- **Grupo:** alunos e comércios entram no ecossistema (lojas da Commerce, Megatron, Club+).
- O aluno **nunca paga** pelo Club da academia.

## 13. Piloto reestruturado (substitui as fases P1 a P4 do D305)
| Fase | Entrega | Pronto quando |
|---|---|---|
| **A0, conversa** | Academia escolhida; 1 h com o dono dela (seção 15); lista de alunos; 5 a 10 comércios do entorno mapeados | Respostas em mãos |
| **A1, captação** | Página da academia, aula experimental, links rastreados, funil e origem | Um aluno novo aparece com a origem, da página até "matriculou" |
| **A2, parceiros** | Programa de parceiros da academia: convite, link e cupom, extrato de comissão, confirmação da matrícula | Uma matrícula real vinda de parceiro, com a comissão calculada |
| **A3, Club** | Cartão do aluno, pontos por QR na recepção e por indicação, níveis, desafio do mês | 30% dos alunos ativos no Club [meta a validar] |
| **A4, rede do bairro** | Página do comércio, benefício, validação no balcão | 5 comércios ativos e benefícios usados |
| **A5, avaliação (30 a 60 dias)** | Antes x depois; preço; abrir para outras academias | Metas da seção 14 avaliadas |

## 14. Como medir
- Alunos novos por mês e de onde vieram (antes e depois).
- Matrículas vindas de parceiros e de alunos embaixadores.
- Cancelamentos: alunos no Club x fora do Club.
- Benefícios usados no comércio e economia dos alunos em reais.
- A academia usou sozinha, sem pedir ajuda à NextLevel? (regra de ouro).
- Ela pagaria? Quanto? Os comércios pagariam por destaque?

## 15. Perguntas para o dono da academia (A0)
1. Qual sistema de gestão e qual catraca usa hoje? O sistema exporta a lista de alunos?
2. Quantos alunos ativos e quantos novos por mês? Quantos cancelam?
3. De onde vêm os alunos novos hoje? Faz aula experimental?
4. Já trabalha com personal, nutricionista ou influenciador indicando? Paga algo por isso?
5. Quais comércios do entorno os alunos mais frequentam?
6. Faria desafio entre alunos ou contra outras academias?
7. Quanto pagaria por mês por "mais alunos e menos cancelamento"?

## 16. Depois da academia
O mesmo trio (**Club + parceiros + captação**, por cima do sistema que o cliente já tem) serve para estúdio, pilates, luta, natação, clínica de estética, salão e, com os cuidados de regulação, farmácia (recompra de uso contínuo, fidelidade e rede de benefícios). Cada segmento muda o rosto e as regras; o motor é o mesmo.
