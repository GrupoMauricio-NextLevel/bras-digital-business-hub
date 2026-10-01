# Ligar o endereço dos painéis (escritório) por marca

O código já separa **endereço público** e **endereço dos painéis** de cada marca. Por padrão **nada muda**: a separação só liga quando você define a variável da marca no Render (depois de o domínio estar "Verified" com certificado emitido).

## Desenho
| Marca | Público (portal, vitrines, lojas dos fornecedores) | Painéis (login, Master, fornecedor, lojista, afiliado) |
|---|---|---|
| SuperDrop | `superdrop.com.br` | `office.superdrop.com.br` |
| NextLevel Commerce | `lojas.nextlevelgroup.com.br` | a definir (sugestão: `office.nextlevelgroup.com.br`) |

No endereço dos painéis: `/` e o login são a porta de entrada; `/f/<fornecedor>`, `/loja/<nome>` e `/afiliado` são **links de convite** que abrem o login (depois de entrar, cada pessoa cai no painel do seu nível). No endereço público: `/loja/<nome>` abre a vitrine do vendedor e `/f/<fornecedor>` a loja do fornecedor; qualquer caminho de painel vai para o endereço dos painéis.

## Passo a passo (ordem importa)
1. **Render → Custom Domains:** adicione `office.superdrop.com.br` (e, para a Commerce, `lojas.nextlevelgroup.com.br` e o endereço dos painéis dela).
2. **DNS:** crie o CNAME que o Render mostrar para cada um. Espere ficar **Verified** e **Certificate Issued**.
3. **Render → Environment** (só depois do passo 2):
   - SuperDrop: `BRAND_OFFICE_SUPERDROP=https://office.superdrop.com.br`
   - Commerce: `BRAND_URL_NEXTLEVEL_COMMERCE=https://lojas.nextlevelgroup.com.br`, `BRAND_DOMAINS_NEXTLEVEL_COMMERCE=lojas.nextlevelgroup.com.br,office.nextlevelgroup.com.br` e, quando o endereço dos painéis estiver verificado, `BRAND_OFFICE_NEXTLEVEL_COMMERCE=https://office.nextlevelgroup.com.br`
4. Salve (o Render publica de novo) e confira:
   - `superdrop.com.br/login` leva a `office.superdrop.com.br/login`;
   - `office.superdrop.com.br/planos` volta para `superdrop.com.br/planos`;
   - `superdrop.com.br/loja/<nome>` abre a vitrine.
5. **Desfazer, se algo der errado:** apague a variável `BRAND_OFFICE_*` e tudo volta a funcionar no endereço público.

## Cuidados
- Quem usa `app.superdrop.com.br` hoje deve ser avisado: ele continua funcionando enquanto estiver no Render, mas o endereço novo é `office.superdrop.com.br`.
- A sessão (login) vale só no endereço dos painéis. Depois do cadastro no endereço público, a pessoa é levada ao login do escritório com o aviso "Conta criada".
- Conta de uma marca só entra pelo endereço da própria marca (a equipe NextLevel entra em qualquer um).
