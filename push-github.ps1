<#
  Push the resume repository (with project sources) to GitHub using portable Git.

  Usage:
    powershell -ExecutionPolicy Bypass -File .\push-github.ps1 -Username LOGIN -Token TOKEN

  This script:
    1. locates git (PATH, or portable MinGit used by the assistant)
    2. clones https://github.com/<LOGIN>/<REPO>.git into a temp dir
    3. copies the staged content of this folder into the clone
    4. commits and pushes to branch "main"

  Token needs "repo" scope (classic) or Contents: Read and write (fine-grained).

  ASCII-only on purpose: Windows PowerShell 5.1 parses BOM-less .ps1 as ANSI.
#>
param(
  [Parameter(Mandatory=$true)][string]$Username,
  [Parameter(Mandatory=$true)][string]$Token,
  [string]$Repo = "resume",
  [string]$Branch = "main",
  [string]$GitPath = "",
  [string]$Message = "Add project sources (Gonka_2, BottleSort, Garage 3D, AR fitting room)"
)

$ErrorActionPreference = "Stop"

function Resolve-Git {
  param([string]$Explicit)
  if ($Explicit -and (Test-Path $Explicit)) { return $Explicit }
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $portable = Join-Path (Split-Path $PSScriptRoot -Parent) ".openclaw\tmp\tools\mingit\cmd\git.exe"
  if (Test-Path $portable) { return $portable }
  throw "git not found. Pass -GitPath <path to git.exe>."
}

$git = Resolve-Git $GitPath
Write-Host "git: $git"

$work = Join-Path $env:TEMP ("resume-push-" + [guid]::NewGuid().ToString("N"))
$remote = "https://$Username" + ":" + $Token + "@github.com/$Username/$Repo.git"

Write-Host "1/4 Cloning $Username/$Repo ..."
& $git clone --quiet $remote $work 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "    clone failed (empty repo?) - initializing a new one"
  New-Item -ItemType Directory -Force -Path $work | Out-Null
  Push-Location $work
  & $git init --quiet --initial-branch=$Branch
  & $git remote add origin $remote
  Pop-Location
}

Write-Host "2/4 Copying staged files ..."
$exclude = @(".git")
Get-ChildItem -Path $PSScriptRoot -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $work -Recurse -Force
}

Write-Host "3/4 Committing ..."
Push-Location $work
& $git config user.email "resume@local"
& $git config user.name  "resume-publisher"
& $git checkout --quiet -B $Branch
& $git add -A
& $git commit --quiet -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "    nothing to commit" }

Write-Host "4/4 Pushing to origin/$Branch ..."
& $git push --quiet origin $Branch
$ok = $LASTEXITCODE -eq 0
Pop-Location

Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue

if ($ok) {
  Write-Host ""
  Write-Host "Done.  https://github.com/$Username/$Repo"
} else {
  Write-Host "[ERROR] push failed - check the token scope and value."
  exit 1
}
