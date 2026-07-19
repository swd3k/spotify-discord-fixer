#Requires -Version 5.1
<#
.SYNOPSIS
  Publish Spotify Discord Fixer (Photino UI) for all Windows RIDs.
#>
param(
  [switch]$SelfContained,
  [switch]$SkipZip,
  [switch]$AllowOversize,
  [double]$MaxSizeMb = 8
)

$ErrorActionPreference = "Stop"
$slnRoot = Split-Path -Parent $PSScriptRoot
$distRoot = Join-Path $slnRoot "dist"
$uiProj = "src\SpotifyDiscordFixer.Ui\SpotifyDiscordFixer.Ui.csproj"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

$targets = @(
  @{ Rid = "win-x64";   Label = "64-bit (x64 / Intel & AMD)" },
  @{ Rid = "win-x86";   Label = "32-bit (x86)" },
  @{ Rid = "win-arm64"; Label = "ARM64 (Windows on ARM)" }
)

$scFlag = if ($SelfContained) { "true" } else { "false" }

Write-Host "=== Spotify Discord Fixer multi-arch publish ===" -ForegroundColor Cyan
Write-Host "SelfContained=$scFlag"
Write-Host "Output root: $distRoot"
Write-Host ""

if (-not (Test-Path $distRoot)) {
  New-Item -ItemType Directory -Force -Path $distRoot | Out-Null
}

function Get-DirSizeMb([string]$path) {
  $sum = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
  if (-not $sum) { return 0 }
  return [math]::Round($sum / 1MB, 2)
}

function Get-PeMachine([string]$exePath) {
  try {
    $bytes = [System.IO.File]::ReadAllBytes($exePath)
    $peOffset = [BitConverter]::ToInt32($bytes, 0x3C)
    $machine = [BitConverter]::ToUInt16($bytes, $peOffset + 4)
    switch ($machine) {
      0x014c { return "i386 (x86)" }
      0x8664 { return "AMD64 (x64)" }
      0xAA64 { return "ARM64" }
      default { return ("0x{0:X4}" -f $machine) }
    }
  } catch {
    return "unknown"
  }
}

function Publish-One([string]$project, [string]$rid, [string]$outDir) {
  if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null

  Push-Location $slnRoot
  try {
    & dotnet publish $project `
      -c Release `
      -r $rid `
      --self-contained $scFlag `
      -p:PublishSingleFile=$false `
      -p:PublishTrimmed=$false `
      -p:DebugType=None `
      -p:DebugSymbols=false `
      -o $outDir
    if ($LASTEXITCODE -ne 0) {
      throw "dotnet publish failed: $project RID=$rid"
    }
  } finally {
    Pop-Location
  }
}

$results = @()
$failed = @()

foreach ($t in $targets) {
  $rid = $t.Rid
  $uiOut = Join-Path $distRoot "SpotifyDiscordFixer-$rid"

  Write-Host ""
  Write-Host "=== $($t.Label)  RID=$rid ===" -ForegroundColor Green

  try {
    Write-Host "  UI  → $uiOut"
    Publish-One $uiProj $rid $uiOut

    $ico = Join-Path $slnRoot "src\SpotifyDiscordFixer.Ui\Assets\app.ico"
    if (Test-Path $ico) {
      Copy-Item $ico (Join-Path $uiOut "logo.ico") -Force -ErrorAction SilentlyContinue
    }
    $lic = Join-Path $slnRoot "LICENSE"
    if (-not (Test-Path $lic)) { $lic = Join-Path (Split-Path $slnRoot -Parent) "LICENSE" }
    if (Test-Path $lic) { Copy-Item $lic (Join-Path $uiOut "LICENSE") -Force }

    $exe = Join-Path $uiOut "SpotifyDiscordFixer.exe"
    if (-not (Test-Path $exe)) { throw "SpotifyDiscordFixer.exe missing in $uiOut" }

    $pe = Get-PeMachine $exe
    $mb = Get-DirSizeMb $uiOut
    Write-Host "  UI  PE=$pe  size=$mb MB"

    if (-not $SelfContained -and -not $AllowOversize -and $mb -gt $MaxSizeMb) {
      throw "UI package $mb MB exceeds gate $MaxSizeMb MB (pass -AllowOversize)"
    }

    if (-not $SkipZip) {
      $zip = Join-Path $distRoot "Spotify-Discord-Fixer-$rid.zip"
      if (Test-Path $zip) { Remove-Item $zip -Force }
      Compress-Archive -Path (Join-Path $uiOut "*") -DestinationPath $zip -Force
      $zmb = [math]::Round((Get-Item $zip).Length / 1MB, 2)
      Write-Host "  ZIP $zip  ($zmb MB)"
    }

    # Alias default x64 folder
    if ($rid -eq "win-x64") {
      $alias = Join-Path $distRoot "SpotifyDiscordFixer"
      if (Test-Path $alias) { Remove-Item $alias -Recurse -Force }
      Copy-Item $uiOut $alias -Recurse -Force
    }

    $results += [pscustomobject]@{ Rid = $rid; Label = $t.Label; Pe = $pe; Mb = $mb; Status = "OK" }
  } catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failed += $rid
    $results += [pscustomobject]@{ Rid = $rid; Label = $t.Label; Pe = "-"; Mb = 0; Status = "FAIL" }
  }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

if ($failed.Count -gt 0) {
  Write-Host "Failed RIDs: $($failed -join ', ')" -ForegroundColor Red
  exit 1
}

Write-Host "All architectures published under: $distRoot" -ForegroundColor Green
exit 0
