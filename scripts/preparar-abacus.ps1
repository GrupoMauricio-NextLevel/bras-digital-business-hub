# Prepara uma cópia do projeto para o Abacus (ou outro agente de visual) trabalhar no computador do dono, com segurança (D343).
# Uso (no PowerShell, DENTRO da pasta do projeto já clonada):
#   powershell -ExecutionPolicy Bypass -File scripts/preparar-abacus.ps1
# O que faz:
#   1. confere Node 22+ e Git;
#   2. cria (ou volta para) a branch própria "abacus/visual";
#   3. instala as dependências (npm ci);
#   4. liga os ganchos (tipos e estilo antes de commit e push) e a TRAVA: esta cópia só envia para "abacus/visual",
#      nunca para a branch de publicação (que monta o site no Render e custa minutos);
#   5. avisa se encontrar arquivo .env com endereço de banco real (não deve existir nesta cópia).
# Pode rodar de novo quantas vezes quiser.
param([string]$Branch = "abacus/visual")
$ErrorActionPreference = "Stop"

function Passo($texto) { Write-Host "`n▶ $texto" -ForegroundColor Cyan }
function Erro($texto) { Write-Host "✖ $texto" -ForegroundColor Red; exit 1 }

Passo "Conferindo Node e Git"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Erro "Node não encontrado. Instale o Node 22 (LTS) em nodejs.org e abra um PowerShell novo." }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Erro "Git não encontrado. Instale em git-scm.com e abra um PowerShell novo." }
$versao = (node -v).TrimStart("v")
if ([int]($versao.Split(".")[0]) -lt 22) { Erro "Node $versao é antigo. Instale o Node 22 (LTS)." }
if (-not (Test-Path "package.json") -or -not (Test-Path ".git")) { Erro "Rode este script dentro da pasta do projeto (onde está o package.json)." }
Write-Host "Node $versao e $(git --version) ok."

Passo "Branch própria: $Branch"
git fetch origin --quiet
$existeLocal = git branch --list $Branch
$existeRemota = git ls-remote --heads origin $Branch
if ($existeLocal) { git checkout $Branch }
elseif ($existeRemota) { git checkout -b $Branch "origin/$Branch" }
else { git checkout -b $Branch }
if ($LASTEXITCODE -ne 0) { Erro "Não consegui trocar para a branch $Branch (há arquivos alterados? salve com git stash e rode de novo)." }

Passo "Instalando as dependências (alguns minutos na primeira vez)"
npm ci
if ($LASTEXITCODE -ne 0) { Erro "npm ci falhou. Confira a internet e rode de novo." }

Passo "Ligando os ganchos e a trava de envio"
git config core.hooksPath .githooks
git config nextlevel.branchPermitida $Branch
Write-Host "Commit e push conferem tipos e estilo. Push só vai para '$Branch'."

Passo "Procurando senhas de produção nesta pasta"
$suspeitos = Get-ChildItem -Force -File -Filter ".env*" | Where-Object { $_.Name -ne ".env.example" }
$achou = $false
foreach ($arq in $suspeitos) {
  if (Select-String -Path $arq.FullName -Pattern "neon\.tech|postgres(ql)?://|APP_USR-|re_[A-Za-z0-9]{8}" -Quiet) {
    Write-Host "⚠ $($arq.Name) parece ter senha ou banco real. Apague este arquivo: o visual não precisa dele." -ForegroundColor Yellow
    $achou = $true
  }
}
if (-not $achou) { Write-Host "Nenhuma senha de produção encontrada. ok." }

Write-Host "`n✔ Pronto." -ForegroundColor Green
Write-Host "Ligar a demonstração:  powershell -ExecutionPolicy Bypass -File scripts/dev-demo.ps1"
Write-Host "Abrir:                 http://localhost:3100  (loja virtual em /lojas; perfis em /login, senha demo1234)"
Write-Host "No Abacus: abra esta pasta e cole a primeira mensagem de docs/abacus/COMECE-AQUI.md"
