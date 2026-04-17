$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$defaultPgBin = "C:\Program Files\PostgreSQL\15\bin"

function Resolve-PgTool {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ToolName
  )

  $cmd = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidate = Join-Path $defaultPgBin "$ToolName.exe"
  if (Test-Path $candidate) {
    return $candidate
  }

  throw "Nao encontrei '$ToolName'. Instale o PostgreSQL 15 antes de continuar."
}

function Ensure-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

  if (-not $isAdmin) {
    throw "Abra o PowerShell como Administrador para executar este bootstrap."
  }
}

Ensure-Admin

$pgIsReady = Resolve-PgTool -ToolName "pg_isready"
$createdb = Resolve-PgTool -ToolName "createdb"

$env:PGPASSWORD = "postgres"

Write-Host "Verificando servico PostgreSQL em localhost:5432..."
& $pgIsReady -h localhost -p 5432 -U postgres

if ($LASTEXITCODE -ne 0) {
  throw "PostgreSQL nao esta respondendo em localhost:5432."
}

Write-Host "Garantindo banco lenhardt_db..."
& $createdb -h localhost -p 5432 -U postgres lenhardt_db 2>$null

Push-Location $projectRoot
try {
  Write-Host "Validando conexao do backend..."
  npm run db:check

  Write-Host "Aplicando migrations..."
  npm run migrate

  Write-Host ""
  Write-Host "Banco pronto. Agora crie um admin com:"
  Write-Host "npm run create-admin -- seuemail@empresa.com suaSenha123"
} finally {
  Pop-Location
}
