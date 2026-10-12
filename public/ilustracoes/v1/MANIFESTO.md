# Ilustrações dos painéis (v1)

Prompt de origem: `docs/prompts/imagens-auditoria-geral-gpt.md` (lote D, entregue em 2026-10-12). Ilustração plana, fundo transparente, 1024×1024, mesmas cores para todas as marcas (navy, off-white, cinza e um acento azul-acinzentado `#5B7BA6`).
Formatos: `.webp` com transparência (qualidade 90, transparência 100) e o `.png` original como reserva. Entram pelo componente `Ilustracao` (`src/components/app/ilustracao.tsx`), sempre decorativas (`alt` vazio: o texto ao lado já diz tudo). **Sem arquivo, a ilustração some e o estado vazio continua com o ícone.**

| Arquivo | Onde aparece | Proporção |
|---|---|---|
| ui-vazio-pedidos | Lista de pedidos sem pedido (lojista, fornecedor, Master) | 1:1 |
| ui-vazio-produtos | Lista de produtos do fornecedor vazia | 1:1 |
| ui-vazio-campanhas | Campanhas da loja sem campanha | 1:1 |
| ui-vazio-expedicao | Expedição sem onda (fornecedor) | 1:1 |
| ui-vazio-indicados | Parceiro sem indicado | 1:1 |
| ui-vazio-descobertas | Estúdio da Brás sem descoberta | 1:1 |
| ui-boas-vindas-loja | Início do painel da loja Commerce no primeiro acesso (ainda sem venda), à direita da saudação; some no celular | 1:1 |
| ui-fase-fundacao | Jornada da Loja NextLevel → fase Fundação | 1:1 |
| ui-fase-lancamento | Jornada → fase Lançamento | 1:1 |
| ui-fase-aquisicao | Jornada → fase Aquisição | 1:1 |
| ui-fase-otimizacao | Jornada → fase Otimização | 1:1 |
| ui-fase-escala | Jornada → fase Escala | 1:1 |
