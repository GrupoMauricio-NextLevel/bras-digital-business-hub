# Brás Digital — plano de design da Fase 0

**Estado:** fundação de design; não é tela de negócio nem publicação.  
**Marca:** `BRAS_DIGITAL`; a interface deve obter textos por `getBrand()`.  
**Restrição:** usar os primitivos acessíveis do design system existente, sem herdar a casca visual do SuperDrop ou do NextLevel Commerce.

## Passagem 1 — direção compacta

### Conceito

**“Quadro de expedição vivo.”** A experiência traduz o ritmo do atacado: números de caixas são o elemento dominante; decisão, estado e próxima ação ficam evidentes à distância. O visual é operacional e calmo, não uma decoração de galpão.

### Paleta

| Papel | Token proposto | Valor |
|---|---|---|
| Ação e foco da marca | `--bras-700` | `#B34D00` |
| Ação em fundo escuro | `--bras-400` | `#FB8342` |
| Superfície clara | `--bd-papel` | `#F4F1E9` |
| Informação estrutural | `--bd-navy` | `#101B34` |
| Estado disponível | `--bd-disponivel` | **[CONFIRMAR contraste final]** |
| Estado de ocorrência | `--bd-ocorrencia` | **[CONFIRMAR contraste final]** |

Cores de estado sempre serão acompanhadas de texto e ícone. A implementação deve medir contraste AA antes de fixar os tokens de estado.

### Tipografia e números

- Texto de interface: família sem serifa legível e já licenciada pelo projeto.
- Estoque, preço e quantidade: numerais tabulares.
- Números de caixas: escala grande, alto contraste e leitura rápida; não usar monoespaçada como rótulo geral.
- Textos corridos: largura máxima aproximada de 80 caracteres.

### Forma, espaçamento e movimento

- Espaçamento baseado em múltiplos de 4 px.
- Raios distintos por hierarquia: controle compacto, bloco operacional e mídia; não aplicar um único raio a tudo.
- Elevação somente para indicar camada ou ação pendente.
- Movimento só comunica mudança de estoque, reserva, confirmação ou esgotamento; respeita `prefers-reduced-motion`.

### Wireframes de referência

```
ESTÚDIO / HOJE (desktop)
┌────────────────────────────────────────────────────────────────────┐
│ Hoje             [Aprovações 3] [Live 19:00] [Comando ⌘K]          │
├──────────────────┬──────────────────────────┬──────────────────────┤
│ Gravar agora     │ Publicar                  │ Alertas operacionais │
│ roteiro / local  │ fila de vídeos            │ estoque / pagamentos │
├──────────────────┴──────────────────────────┴──────────────────────┤
│ Membros aguardando aprovação · ações auditadas · próximos passos   │
└────────────────────────────────────────────────────────────────────┘

BALCÃO / EXPEDIÇÃO (tablet)
┌─────────────────────────────────────────────┐
│ Retirada #BD-8K2Q              [Escanear QR]│
├─────────────────────────────────────────────┤
│ 12 CAIXAS                                     │
│ SKU 342 · corredor B · confirmar conferência │
├─────────────────────────────────────────────┤
│ [Registrar ocorrência]    [Confirmar retirada]│
└─────────────────────────────────────────────┘

MEU BRÁS / FEED (celular)
┌───────────────────────┐
│ vídeo / produto        │
│                         │
│ 37 caixas disponíveis  │
│ mínimo 1 caixa          │
│ [Reservar caixas]       │
└───────────────────────┘
```

## Passagem 2 — crítica contra o briefing

A primeira direção evita o “kit SaaS” porque não organiza tudo em cartões idênticos: cada tela tem uma tarefa operacional dominante. Também evita o visual de jornal e a terracota automática; o laranja é usado como marca e foco, não como textura decorativa.

O elemento memorável é o número de caixas, que precisa continuar legível em celular, tablet de galpão e desktop. Elementos secundários permanecem silenciosos para que estoque, reserva e retirada não disputem atenção.

## Regras de implementação

1. Criar tokens Brás sobre os primitivos existentes, sem modificar visual de outras marcas.
2. Implementar galeria em `/dev/design` antes das telas de negócio.
3. Testar contraste AA, teclado, foco visível e largura de 320 px.
4. Tratar vazio, carregando, erro, esgotado e sem conexão como estados de primeira classe.
5. Nunca exibir preço, estoque, importadora ou vídeo completo a visitante ou membro não aprovado.
6. Não criar condicionais por empresa em componentes compartilhados; usar configuração de marca, tema ou módulo.

## Pendências [CONFIRMAR]

- Famílias tipográficas disponíveis/licenciadas no projeto.
- Valores finais dos tokens de estado após teste de contraste.
- Se os neutros compartilhados satisfazem os painéis Brás em claro e escuro.
- Composição definitiva do Estúdio dentro do Master, a registrar em D92.
