# Optional: permanent Cloudflare Tunnel with your own domain
# Prerequisites:
#   1. Free Cloudflare account — https://dash.cloudflare.com/sign-up
#   2. A domain added to Cloudflare (can buy cheap on Cloudflare Registrar)
#
# Usage:
#   .\scripts\setup-named-tunnel.ps1 -TunnelName youtube-dl -Hostname dl.yourdomain.com

param(
  [string]$TunnelName = "youtube-downloader",
  [Parameter(Mandatory = $true)]
  [string]$Hostname
)

$ErrorActionPreference = "Stop"
$Bin = Join-Path $PSScriptRoot "bin"
$Cloudflared = Join-Path $Bin "cloudflared.exe"
$ConfigDir = Join-Path $env:USERPROFILE ".cloudflared"
$Port = if ($env:PORT) { $env:PORT } else { "3001" }

if (-not (Test-Path $Cloudflared)) {
  Write-Host "Run 'npm run tunnel' first to download cloudflared, or install via winget." -ForegroundColor Red
  exit 1
}

Write-Host "`n=== Named Cloudflare Tunnel Setup ===" -ForegroundColor Green
Write-Host "Tunnel: $TunnelName"
Write-Host "Hostname: $Hostname"
Write-Host ""

Write-Host "Step 1: Login to Cloudflare (browser will open)..." -ForegroundColor Cyan
& $Cloudflared tunnel login

Write-Host "`nStep 2: Creating tunnel '$TunnelName'..." -ForegroundColor Cyan
& $Cloudflared tunnel create $TunnelName

$credFile = Get-ChildItem "$ConfigDir\*.json" | Where-Object { $_.Name -ne 'cert.pem' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $credFile) { throw "Tunnel credentials not found in $ConfigDir" }

$configPath = Join-Path $ConfigDir "config-$TunnelName.yml"
@"
tunnel: $TunnelName
credentials-file: $($credFile.FullName)

ingress:
  - hostname: $Hostname
    service: http://localhost:$Port
  - service: http_status:404
"@ | Set-Content $configPath -Encoding UTF8

Write-Host "`nStep 3: Routing DNS $Hostname -> tunnel..." -ForegroundColor Cyan
& $Cloudflared tunnel route dns $TunnelName $Hostname

Write-Host @"

=== Setup complete ===

1. Start your server:
   npm run build:prod
   `$env:NODE_ENV='production'; `$env:CLIENT_ORIGIN='https://$Hostname'; npm start

2. Run the tunnel (keep open):
   & '$Cloudflared' tunnel --config '$configPath' run $TunnelName

Your site will be live at: https://$Hostname

"@ -ForegroundColor Green