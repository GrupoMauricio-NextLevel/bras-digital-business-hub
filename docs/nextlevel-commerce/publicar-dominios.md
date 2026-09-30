# Publicar a NextLevel Commerce nos domínios (passo a passo do dono)

O mesmo serviço do Render (`superdrop`) responde por várias marcas. A marca vem do endereço acessado (`src/lib/brand.ts`). Hoje:

| Endereço | Marca | Estado |
|---|---|---|
| `superdrop.com.br` | SuperDrop | no ar (cadastro de lojas com fornecedor, parceiros, tudo como antes) |
| `nextlevelgroup.com.br` (e `www.`) | **NextLevel Commerce** | portal novo, com lista de espera "Quero minha loja" |
| `nextlevelcommerce.com.br` (quando comprar) | NextLevel Commerce | já previsto: basta apontar o domínio |
| Brás Digital | Brás Digital | sem domínio; configure `BRAND_DOMAINS_BRAS_DIGITAL` quando tiver |

## 1. No Render (serviço `superdrop`)
1. **Settings → Custom Domains → Add Custom Domain**: adicione `nextlevelgroup.com.br` e `www.nextlevelgroup.com.br` (e, quando comprar, `nextlevelcommerce.com.br` e `www.`).
2. O Render mostra os registros DNS a criar. Anote-os (normalmente um `CNAME` para `superdrop.onrender.com` no `www` e um registro `A`/`ALIAS` no domínio raiz; **siga exatamente o que o Render mostrar**, pois pode mudar).
3. Aguarde o certificado (HTTPS) ficar "Verified" (minutos a algumas horas).

## 2. No provedor do domínio (Hostinger, Registro.br…)
Crie os registros DNS que o Render indicou. **Não apague** registros de e-mail (MX, TXT) se já usar e-mail no domínio. Se o `nextlevelgroup.com.br` já tem um site hoje, ele será substituído por este portal: confirme antes.

## 3. Variáveis de ambiente (Render → Environment) — opcionais
- `DEFAULT_BRAND` (padrão `SUPERDROP`): marca dos endereços desconhecidos (ex.: o endereço técnico `*.onrender.com`).
- `BRAND_DOMAINS_NEXTLEVEL_COMMERCE` (padrão `nextlevelgroup.com.br,nextlevelcommerce.com.br`), `BRAND_DOMAINS_SUPERDROP`, `BRAND_DOMAINS_BRAS_DIGITAL`: listas separadas por vírgula.
- `BRAND_URL_NEXTLEVEL_COMMERCE` (padrão `https://nextlevelgroup.com.br`): endereço usado nos links dos e-mails da marca. Quando o `nextlevelcommerce.com.br` estiver no ar, troque aqui.
- `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true`: abre o cadastro direto de lojas na NextLevel Commerce (**só depois da fase N1**, a "conta simples"; hoje o cadastro depende de um fornecedor).
- `BRAND_PARTNERS_NEXTLEVEL_COMMERCE=true`: abre o programa de parceiros nessa marca (**só depois de planos e comissões próprios da marca**).
- **Não defina `APP_URL`** se quiser que os links de e-mail usem o endereço de cada marca (se definir, vale um endereço só para todas).
- `NEXT_PUBLIC_SUPPORT_WHATSAPP` e `NEXT_PUBLIC_SUPPORT_EMAIL`: aparecem nos botões "Falar no WhatsApp" do portal novo.

## 4. Conferir
1. `https://nextlevelgroup.com.br` mostra "NextLevel Commerce" (logo, título e texto da loja virtual).
2. `https://superdrop.com.br` continua com o portal do SuperDrop.
3. Em `Quero minha loja`, envie um cadastro de teste e veja em **Master → CRM → Interessados por marca**.
4. Em **Master → Lojas** e **Escritório virtual** use o filtro de marca.

## 5. Pontos de atenção
- Lojas dos membros ainda abrem em `/store/<nome>` (subdomínios por loja, como `loja.superdrop.com.br`, exigem `SUPERDROP_ROOT_DOMAIN` e um certificado curinga; ficam para a fase de domínios).
- Login, painéis e áreas de membros funcionam em qualquer marca; o visual dos painéis ainda é o mesmo. A identidade visual completa da NextLevel Commerce (logo própria) entra com a nova logo.
- Os cadastros feitos em cada endereço ficam marcados com a marca de origem e aparecem separados nos filtros do Master.
