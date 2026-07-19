#Requires -Version 5.1
param(
  [string[]]$Rid = @("win-x64", "win-x86", "win-arm64"),
  [string]$Version = "2.0.1",
  [switch]$PublishFirst,
  [switch]$SelfContained,
  [string]$IsccPath = ""
)

$ErrorActionPreference = "Stop"
if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$slnRoot = Split-Path -Parent $PSScriptRoot
$iss = Join-Path $slnRoot "installer\SpotifyDiscordFixer.iss"
$outDir = Join-Path $slnRoot "dist\installers"

if (-not (Test-Path $iss)) {
  throw "Missing Inno script: $iss"
}

function Resolve-Iscc {
  param([string]$Hint)
  if ($Hint -and (Test-Path $Hint)) { return (Resolve-Path $Hint).Path }
  $candidates = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
    "${env:LOCALAPPDATA}\Programs\Inno Setup 6\ISCC.exe"
  )
  foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { return $c }
  }
  $cmd = Get-Command ISCC.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw "Inno Setup 6 (ISCC.exe) not found."
}

function Get-ArchFromRid([string]$rid) {
  switch ($rid.ToLowerInvariant()) {
    "win-x64"   { return "x64" }
    "win-x86"   { return "x86" }
    "win-arm64" { return "arm64" }
    default     { throw "Unsupported RID: $rid" }
  }
}

$ver = $Version.Trim()
if ($ver.StartsWith("v") -or $ver.StartsWith("V")) { $ver = $ver.Substring(1) }
if ($ver -notmatch '^\d+\.\d+\.\d+') {
  throw "Version must look like 2.0.0 (got: $Version)"
}

if ($PublishFirst) {
  $pub = Join-Path $PSScriptRoot "publish-all.ps1"
  Write-Host "=== Publish packages first ===" -ForegroundColor Cyan
  if ($SelfContained) {
    & $pub -SelfContained -AllowOversize
  } else {
    & $pub
  }
  if ($LASTEXITCODE -ne 0) { throw "publish-all.ps1 failed" }
}

$iscc = Resolve-Iscc -Hint $IsccPath
Write-Host "ISCC: $iscc" -ForegroundColor Cyan
Write-Host "Version: $ver"
Write-Host "RIDs: $($Rid -join ', ')"
Write-Host ""

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$built = @()
$failed = @()

foreach ($r in $Rid) {
  $arch = Get-ArchFromRid $r
  $sourceDir = Join-Path $slnRoot "dist\SpotifyDiscordFixer-$r"
  $outName = "Spotify-Discord-Fixer-Setup-$ver-$r"
  $exePath = Join-Path $outDir ($outName + ".exe")

  Write-Host "=== Build Setup $r ($arch) ===" -ForegroundColor Green

  if (-not (Test-Path $sourceDir)) {
    Write-Host "  SKIP: missing publish folder - run publish-all or -PublishFirst" -ForegroundColor Yellow
    $failed += $r
    continue
  }

  $uiExe = Join-Path $sourceDir "SpotifyDiscordFixer.exe"
  if (-not (Test-Path $uiExe)) {
    Write-Host "  FAIL: SpotifyDiscordFixer.exe not found" -ForegroundColor Red
    $failed += $r
    continue
  }

  $sourceAbs = (Resolve-Path $sourceDir).Path
  $isccArgs = @(
    $iss,
    "/DArch=$arch",
    "/DSourceDir=$sourceAbs",
    "/DOutName=$outName",
    "/DMyAppVersion=$ver",
    "/Q"
  )

  & $iscc @isccArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL: ISCC exit $LASTEXITCODE" -ForegroundColor Red
    $failed += $r
    continue
  }

  if (-not (Test-Path $exePath)) {
    Write-Host "  FAIL: expected output missing" -ForegroundColor Red
    $failed += $r
    continue
  }

  $mb = [math]::Round((Get-Item $exePath).Length / 1MB, 2)
  Write-Host "  OK: $exePath size=${mb}MB" -ForegroundColor Green
  $built += [pscustomobject]@{ Rid = $r; Path = $exePath; Mb = $mb }
}

Write-Host ""
Write-Host "=== INSTALLER SUMMARY ===" -ForegroundColor Cyan
$built | Format-Table -AutoSize

if ($failed.Count -gt 0) {
  Write-Host "Failed: $($failed -join ', ')" -ForegroundColor Red
  exit 1
}

Write-Host "All Setup.exe under: $outDir" -ForegroundColor Green
exit 0
