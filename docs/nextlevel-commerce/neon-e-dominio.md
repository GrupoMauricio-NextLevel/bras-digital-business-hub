# Conectar o Neon e o domínio (passo a passo do dono)

Este guia liga o banco de dados de verdade (Neon) e coloca a NextLevel Commerce num endereço seu para você ver publicada. Tudo é feito nos sites do Neon, do Render e do provedor do domínio; eu não tenho acesso às suas contas.

## Antes de começar: um aviso sobre o domínio
Hoje `nextlevelgroup.com.br` **já tem um site no ar** ("NEXTLEVEL | Experiência Estratégica", atrás da Cloudflare). Se apontarmos o endereço principal para a plataforma, esse site sai do ar. Por isso a recomendação é usar um **subdomínio** para as lojas virtuais:

**`lojas.nextlevelgroup.com.br`** (o site atual continua intacto).

O sistema já reconhece qualquer subdomínio de `nextlevelgroup.com.br` como NextLevel Commerce. Quando comprar `nextlevelcommerce.com.br`, basta adicionar no Render do mesmo jeito.

## Parte 1: Neon (banco de dados)
1. Entre em **neon.tech**, crie a conta e clique em **Create project**. Nome: `nextlevel-commerce`. Região: **AWS South America (São Paulo)**.
2. No painel do projeto, clique em **Connect**. Deixe **Connection pooling** ligado e copie a **connection string**. Ela parece com:
   `postgresql://usuario:senha@ep-xxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require`
   Trate como senha: não cole em conversa, e-mail ou no código.
3. No **Render**, abra o serviço (`superdrop`), vá em **Environment** e crie ou edite:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a connection string do Neon |
| `SESSION_SECRET` | texto aleatório com 32+ caracteres (gere em um gerenciador de senhas) |
| `CRON_SECRET` | outro texto aleatório |
| `MASTER_EMAIL` | seu e-mail de administrador |
| `MASTER_PASSWORD` | senha forte (mínimo 10 caracteres) |
| `SEED_DEMO` | `true` **só por enquanto**, para o banco novo nascer com lojas de exemplo e você ver como ficou |

4. Salve. O Render publica de novo; ao iniciar, o sistema **cria as tabelas sozinho** e o usuário Master.
5. Confira: abra `https://SEU-ENDERECO/api/health`. Deve aparecer `"ok":true` e `"driver":"postgres"`.

**Antes de receber lojistas de verdade:** crie um banco novo e limpo no Neon (**Branches/Databases → novo**), troque o `DATABASE_URL` e **remova** `SEED_DEMO`. Assim as lojas de exemplo não se misturam com clientes reais. O plano gratuito do Neon atende o início; o banco "dorme" quando ninguém usa e acorda em poucos segundos.

## Parte 2: domínio
1. No **Render**, serviço → **Settings → Custom Domains → Add Custom Domain** → `lojas.nextlevelgroup.com.br`. O Render mostra o registro a criar (normalmente um **CNAME** apontando para o endereço `*.onrender.com` do serviço). **Siga exatamente o que o Render mostrar.**
2. Descubra **onde está o DNS** do `nextlevelgroup.com.br` (Hostinger ou Cloudflare; o site atual passa pela Cloudflare). É ali que você cria o registro:
   - tipo **CNAME**, nome **lojas**, valor o que o Render indicou;
   - se for na Cloudflare, deixe a nuvem **cinza (somente DNS)** até o certificado do Render ficar verificado.
3. Não mexa nos registros do domínio principal nem nos de e-mail (MX, TXT).
4. No Render, espere o domínio ficar **Verified** e o certificado HTTPS ser emitido (de minutos a algumas horas).

## Parte 3: ver publicado
- `https://lojas.nextlevelgroup.com.br` deve mostrar o portal da **NextLevel Commerce**.
- Login do Master: `/login` com `MASTER_EMAIL` e `MASTER_PASSWORD`.
- Para ver uma loja de exemplo: `https://lojas.nextlevelgroup.com.br/store/mantos-shop` (existe só com `SEED_DEMO=true`).
- Para testar a conta simples (abrir loja sem fornecedor), ligue `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true` no Render e abra `/cadastro`. Antes de vender de verdade, conecte o Mercado Pago da NextLevel no Master.
- Opcional: `NEXT_PUBLIC_SUPPORT_WHATSAPP` e `NEXT_PUBLIC_SUPPORT_EMAIL` para os botões de contato, e `RESEND_API_KEY` + `EMAIL_FROM` para os e-mails.

## Cuidados
- **Render Free** dorme após minutos sem uso (o primeiro acesso demora) e não tem disco; com o Neon isso já não perde dados, mas para o lançamento o ideal é o plano pago.
- Não defina `APP_URL` se quiser que os links dos e-mails usem o endereço de cada marca.
- Se algo não abrir, me mande o que aparece em `/api/health` e o estado do domínio no Render (sem a connection string).
