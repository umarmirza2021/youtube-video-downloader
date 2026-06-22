# Run VidInSecs locally for testing (no domain/Cloudflare needed)
# Usage: npm run local

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path", "User")

$Root = Split-Path $PSScriptRoot -Parent
$Port = if ($env:PORT) { $env:PORT } else { "3000" }

Set-Location $Root

if (-not (Test-Path "$Root\client\dist\index.html")) {
  Write-Host "Building frontend..." -ForegroundColor Cyan
  npm.cmd run build:prod
}

Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$env:NODE_ENV = "production"
$env:PORT = $Port
$env:CLIENT_ORIGIN = "http://localhost:$Port"
$env:STATIC_DIR = "$Root\client\dist"

Write-Host ""
Write-Host "VidInSecs running at: http://localhost:$Port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

Set-Location "$Root\server"
node index.js