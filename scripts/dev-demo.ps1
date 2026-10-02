param([int]$Port = 3100)
# Servidor de demonstração local para Windows (PowerShell). Equivale ao scripts/dev-demo.sh.
# Uso (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File scripts/dev-demo.ps1
# Porta: padrão 3100; para uma segunda cópia use  -Port 3101
# Abre em http://localhost:3100 e atualiza a tela sozinho a cada arquivo salvo (Fast Refresh). Não use em produção.
$env:NEXT_PUBLIC_DEMO_MODE = "true"
$env:DEMO_AUTOSEED = "true"
$env:DATABASE_URL = "pglite://memory"
$env:SESSION_SECRET = "teste-local-segredo-1234567890"
$env:CRON_SECRET = "teste-cron-1234567890"
# Para ver no celular (mesmo Wi-Fi), troque -H 127.0.0.1 por -H 0.0.0.0 e abra http://IP-DO-PC:3100
npx next dev -p $Port -H 127.0.0.1
