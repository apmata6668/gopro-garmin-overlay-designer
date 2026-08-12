$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$python = Join-Path $PSScriptRoot "venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $python)) {
  Write-Host "The local Python environment is missing." -ForegroundColor Yellow
  Write-Host "Run install-gopro-overlay-windows.ps1 first."
  exit 1
}

& $python (Join-Path $PSScriptRoot "panel-server.py")
