# Start YouTube Downloader locally + Cloudflare Quick Tunnel (free public URL)
# Usage: npm run tunnel
#        npm run tunnel:build

param([switch]$Build)

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path", "User")
$Root = Split-Path $PSScriptRoot -Parent
$Bin = Join-Path $PSScriptRoot "bin"
$Cloudflared = Join-Path $Bin "cloudflared.exe"
$Port = if ($env:PORT) { $env:PORT } else { "3001" }

function Ensure-Cloudflared {
  if (Test-Path $Cloudflared) { return }
  Write-Host "Downloading cloudflared..." -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path $Bin | Out-Null
  curl.exe -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -o $Cloudflared
  if (-not (Test-Path $Cloudflared)) { throw "Failed to download cloudflared" }
}

function Test-Command($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    Write-Host "Missing: $name - install with: winget install yt-dlp.yt-dlp Gyan.FFmpeg" -ForegroundColor Yellow
    return $false
  }
  return $true
}

Set-Location $Root

Write-Host ""
Write-Host "=== YouTube Downloader + Cloudflare Tunnel ===" -ForegroundColor Green

$hasYtdlp = Test-Command yt-dlp
$hasFfmpeg = Test-Command ffmpeg
if (-not $hasYtdlp -or -not $hasFfmpeg) {
  Write-Host "yt-dlp and ffmpeg are required for downloads." -ForegroundColor Red
}

if ($Build -or -not (Test-Path "$Root\client\dist\index.html")) {
  Write-Host "Building frontend..." -ForegroundColor Cyan
  npm.cmd run build:prod
}

Ensure-Cloudflared

Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Host "Starting server on http://localhost:$Port ..." -ForegroundColor Cyan
$machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$serverJob = Start-Job -ScriptBlock {
  param($Root, $Port, $MachinePath, $UserPath)
  $env:Path = "$MachinePath;$UserPath"
  Set-Location (Join-Path $Root "server")
  $env:NODE_ENV = "production"
  $env:PORT = $Port
  $env:CLIENT_ORIGIN = "*"
  $env:TUNNEL_MODE = "1"
  $env:STATIC_DIR = (Join-Path $Root "client\dist")
  node index.js
} -ArgumentList $Root, $Port, $machinePath, $userPath

Start-Sleep -Seconds 2

try {
  $health = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec 10
  Write-Host "Server ready (ytdlp: $($health.engines.ytdlp))" -ForegroundColor Green
} catch {
  Stop-Job $serverJob -ErrorAction SilentlyContinue
  Remove-Job $serverJob -ErrorAction SilentlyContinue
  throw "Server failed to start on port $Port"
}

Write-Host ""
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan
Write-Host "Your public URL will appear below. Keep this window open." -ForegroundColor Yellow
Write-Host ""

$publicUrl = $null
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  & $Cloudflared tunnel --url "http://localhost:$Port" 2>&1 | ForEach-Object {
    $line = "$_"
    Write-Host $line
    if ($line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
      $publicUrl = $Matches[0]
      Write-Host ""
      Write-Host ('PUBLIC URL: ' + $publicUrl) -ForegroundColor Green
      Write-Host ""
    }
  }
} finally {
  $ErrorActionPreference = $prevEap
}

Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue