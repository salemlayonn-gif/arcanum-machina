# Arcanum Machina - desktop launcher
#
# Makes a Desktop shortcut that opens the game in its own window, with no
# browser bars, and creates a folder for your savegame files. Nothing is
# installed system-wide and nothing needs admin rights.
#
#   powershell -ExecutionPolicy Bypass -File .\tools\install-desktop.ps1
#
# Options:
#   -Fullscreen        start the window already full screen
#   -Local             run from this folder instead of the web (offline copy)
#   -SaveFolder <path> where the savegame files go

param(
  [string]$Url        = "https://salemlayonn-gif.github.io/arcanum-machina/",
  [string]$SaveFolder = "$env:USERPROFILE\Documents\Arcanum Machina\savegames",
  [string]$Name       = "Arcanum Machina",
  [switch]$Fullscreen,
  [switch]$Local
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "  ARCANUM MACHINA - desktop launcher" -ForegroundColor Yellow
Write-Host "  -----------------------------------"

# 1. the savegames folder
if (-not (Test-Path $SaveFolder)) {
  New-Item -ItemType Directory -Path $SaveFolder -Force | Out-Null
  Write-Host "  savegames folder created" -ForegroundColor Green
} else {
  Write-Host "  savegames folder already there" -ForegroundColor DarkGray
}
Write-Host "    $SaveFolder"

# 2. find a browser that can open an app window
$candidates = @(
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  Write-Host "  No Edge or Chrome found. Open this in your browser instead:" -ForegroundColor Red
  Write-Host "    $Url"
  exit 1
}
Write-Host "  browser: $(Split-Path -Leaf $browser)" -ForegroundColor DarkGray

# 3. what the shortcut opens
$target = $Url
if ($Local) {
  $index = Join-Path $repo "index.html"
  if (-not (Test-Path $index)) { Write-Host "  index.html not found next to this script." -ForegroundColor Red; exit 1 }
  $target = ([Uri]$index).AbsoluteUri
  Write-Host "  running from this folder (offline; the service worker stays off on file:// pages)" -ForegroundColor DarkGray
}

$argline = "--app=$target"
if ($Fullscreen) { $argline += " --start-fullscreen" }

# 4. the shortcut
$icon = Join-Path $repo "icon.ico"
$lnk  = Join-Path ([Environment]::GetFolderPath("Desktop")) "$Name.lnk"
$shell = New-Object -ComObject WScript.Shell
$s = $shell.CreateShortcut($lnk)
$s.TargetPath       = $browser
$s.Arguments        = $argline
$s.WorkingDirectory = Split-Path -Parent $browser
$s.Description      = "Arcanum Machina - Echoes of the First Age"
if (Test-Path $icon) { $s.IconLocation = $icon }
$s.Save()

Write-Host "  shortcut created on your Desktop" -ForegroundColor Green
Write-Host "    $lnk"
Write-Host ""
Write-Host "  In the game: CONFIG -> SAVEGAME FILES -> SAVE TO FILE," -ForegroundColor Cyan
Write-Host "  and point it at the savegames folder above. After the first time," -ForegroundColor Cyan
Write-Host "  saving again is one click - it remembers the file." -ForegroundColor Cyan
Write-Host ""
Write-Host "  F11 toggles full screen." -ForegroundColor DarkGray
Write-Host ""
