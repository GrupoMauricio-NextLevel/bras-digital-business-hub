# Domínio novo da NextLevel E-commerce: nextlevelcommerce.com.br

Ordem segura (nada quebra para quem já usa o endereço antigo).

## 1. Render (o dono)
1. Render → serviço **nextlevel-plataforma** → **Settings** → **Custom Domains** → **Add Custom Domain**.
2. Adicione `nextlevelcommerce.com.br`. Depois adicione `www.nextlevelcommerce.com.br`.
3. O Render mostra o que cadastrar no DNS de cada um. Mande o print dessa tela para conferência.

## 2. registro.br (o dono)
1. registro.br → o domínio → **DNS** → usar os servidores do Registro.br → **Editar zona**.
2. Cadastre exatamente o que o Render mostrou. Em geral:
   - `nextlevelcommerce.com.br` (sem nada antes): registro **A** com o endereço que o Render indicar;
   - `www`: registro **CNAME** para `superdrop.onrender.com` (o endereço técnico do serviço).
3. Salve. A propagação leva de minutos a algumas horas. O Render marca **Verified** e emite o certificado (cadeado) sozinho.

## 3. Troca do endereço principal (Claude, em horário de pouco movimento)
Só depois do **Verified** e com o código do D281 publicado:
- `BRAND_URL_NEXTLEVEL_COMMERCE=https://nextlevelcommerce.com.br`;
- se `BRAND_DOMAINS_NEXTLEVEL_COMMERCE` estiver definida no Render, incluir `nextlevelcommerce.com.br,www.nextlevelcommerce.com.br`;
- `EC_DOMINIO_PRINCIPAL=1`: liga o redirecionamento permanente do endereço antigo para o novo (só páginas; `/api/*`, avisos do Mercado Pago e formulários continuam no endereço em que chegarem);
- `APP_URL`: conferir antes. Ele vale para os links de todas as marcas; só troca se hoje apontar para o endereço da E-commerce.

## 4. Depois da troca
- Avisar os lojistas reais (Anderson e quem estiver testando): no endereço novo, entra-se de novo com o mesmo e-mail e senha (o login é guardado por endereço).
- Google Search Console: adicionar o domínio novo e pedir a mudança de endereço (plano de busca S0, `docs/prompts/busca-e-ia-visibilidade-organica.md`).
- Atualizar os QR codes dos materiais (série do YouTube) com o domínio novo.
