# ADR-0005. Trilha de auditoria, política de conteúdo (CSP) e assinatura do webhook

**Estado:** proposta. **Origem:** documentos 03 §43 a §45, 09 §103, 10 §46.

## 1. Trilha de auditoria geral
Hoje `activities` é a linha do tempo visível e `domain_events` o fluxo de eventos; não há registro único de "quem mudou o quê" (preço, equipe, domínio, dados legais). Proposta: tabela `audit_log` (quem, o quê, antes/depois só de campos não sensíveis, quando, origem), gravada pelo domínio. Aditiva, baixo risco.

## 2. CSP
Os cabeçalhos básicos já estão no ar (nosniff, referrer, frame, permissions). **CSP completa ainda não**: o Next injeta scripts inline e a loja carrega imagens e vídeo de endereços escolhidos pelo lojista. Proposta: começar em modo "somente relatar" por duas semanas, medir, e só então bloquear.

## 3. Assinatura do webhook do Mercado Pago
Hoje o corpo do webhook nunca é confiável: o pagamento é conferido na API. Falta validar a assinatura (`x-signature`) como segunda camada. **Exige o segredo de assinatura gerado pelo dono no painel do Mercado Pago** (item do dono).

## Ordem sugerida
Trilha de auditoria, depois assinatura do webhook (quando o segredo existir), depois CSP em modo relatório.
