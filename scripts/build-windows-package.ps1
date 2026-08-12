param(
    [string]$OutputDirectory = "",
    [switch]$SkipZip
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$distRoot = Join-Path $root "dist"
if (-not $OutputDirectory) {
    $OutputDirectory = Join-Path $distRoot "OverlayDesignerWindows"
}

$distFull = [System.IO.Path]::GetFullPath($distRoot)
$outputFull = [System.IO.Path]::GetFullPath($OutputDirectory)
if (-not $outputFull.StartsWith($distFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "OutputDirectory must stay inside $distFull"
}

if (Test-Path -LiteralPath $outputFull) {
    Remove-Item -LiteralPath $outputFull -Recurse -Force
}
New-Item -ItemType Directory -Path $outputFull | Out-Null

$files = @(
    "panel-server.py",
    "preview-frame.py",
    "render-wrapper.py",
    "gps_alignment.py",
    "enable-gps-alignment.py",
    "enable-mapbox-provider.py",
    "install-gopro-overlay-windows.ps1",
    "setup-and-start.bat",
    "start-panel.ps1",
    "start-panel.bat",
    "requirements.txt",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "VERSION"
)
foreach ($file in $files) {
    Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $outputFull $file)
}
Copy-Item -LiteralPath (Join-Path $root "web") -Destination (Join-Path $outputFull "web") -Recurse
Copy-Item -LiteralPath (Join-Path $root "docs") -Destination (Join-Path $outputFull "docs") -Recurse
Copy-Item -LiteralPath (Join-Path $root "config") -Destination (Join-Path $outputFull "config") -Recurse

if (-not $SkipZip) {
    $zipPath = Join-Path $distRoot "OverlayDesignerWindows.zip"
    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }
    Compress-Archive -LiteralPath $outputFull -DestinationPath $zipPath -CompressionLevel Optimal
    Write-Host "Windows package: $zipPath"
}

Write-Host "Package directory: $outputFull"
Write-Host "On the target PC, install Python 3.11+ and double-click setup-and-start.bat."
Write-Host "FFmpeg is not bundled; add it to PATH or select its bin folder in Settings."
