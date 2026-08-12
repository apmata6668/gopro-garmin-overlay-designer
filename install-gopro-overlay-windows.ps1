$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python was not found. Install Python 3.11 or newer and enable Add Python to PATH."
}

python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)"
if ($LASTEXITCODE -ne 0) {
    throw "Python 3.11 or newer is required."
}

if (-not (Test-Path -LiteralPath ".\venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .\venv
    if ($LASTEXITCODE -ne 0) { throw "Could not create the Python virtual environment." }
}

Write-Host "Upgrading pip..."
.\venv\Scripts\python.exe -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "Could not upgrade pip." }

Write-Host "Installing pinned dependencies..."
.\venv\Scripts\python.exe -m pip install -r .\requirements.txt
if ($LASTEXITCODE -ne 0) { throw "Could not install the pinned dependencies." }

Write-Host "Applying Overlay Designer compatibility modules..."
.\venv\Scripts\python.exe .\enable-mapbox-provider.py
if ($LASTEXITCODE -ne 0) { throw "Could not enable the Mapbox provider." }
.\venv\Scripts\python.exe .\enable-gps-alignment.py
if ($LASTEXITCODE -ne 0) { throw "Could not enable GPS alignment and comparison." }

Write-Host ""
Write-Host "Checking ffmpeg..."
try {
    ffmpeg -version | Select-Object -First 1
    Write-Host "ffmpeg was found in PATH."
} catch {
    Write-Host "ffmpeg was not found in PATH."
    Write-Host "Download the essentials build from https://www.gyan.dev/ffmpeg/builds/"
    Write-Host "Then select its bin folder in Overlay Designer Settings."
}

Write-Host ""
Write-Host "Installation complete. Double-click start-panel.bat to launch."
