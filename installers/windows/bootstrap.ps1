#Requires -RunAsAdministrator
# Optional prerequisite bootstrap; no silent elevation, no public ingress.
$ErrorActionPreference='Stop'
$BootStage='preflight'
trap { Write-Warning "MW-BOOTSTRAP [$BootStage]: Check the local failure above. Preserve partial files. See docs/SELF-SUPPORT.md (available without Node.js or internet)."; throw }
if (![Environment]::Is64BitOperatingSystem -or ![Environment]::Is64BitProcess -or $env:PROCESSOR_ARCHITECTURE -ne 'AMD64') { throw 'Run native 64-bit PowerShell on Windows x64.' }
$root=Join-Path $env:ProgramData 'MeshWall'
if (Test-Path -LiteralPath $root) { throw 'Existing or partial install; use maintenance.' }
if (Get-Service | Where-Object { $_.Name -like 'meshcentral*' -or $_.DisplayName -eq 'MeshCentral' }) { throw 'Existing MeshCentral service; use adoption.' }
$node=Join-Path $env:ProgramFiles 'nodejs\node.exe'
$npm=Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
$ts=Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe'
$needNode=!(Test-Path -LiteralPath $node -PathType Leaf)
$needTS=!(Test-Path -LiteralPath $ts -PathType Leaf)
if (!$needNode) {
 & $node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);process.exit(process.arch==="x64"&&(a>22||(a===22&&(b>21||(b===21&&c>=1))))?0:1)'
 if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $npm)) { throw 'Existing Node.js is incompatible; upgrade the official system-wide installation first.' }
}
$BootStage='system-packages'
if ($needNode -or $needTS) {
 $winget=Get-Command winget.exe -CommandType Application -ErrorAction SilentlyContinue
 if (!$winget) { throw 'WinGet unavailable. Install official Node.js LTS and Tailscale manually, then run setup.ps1.' }
 Write-Host "Missing official packages: Node.js=$needNode Tailscale=$needTS. WinGet will install from its winget source."
 if ((Read-Host 'Proceed on this authorized test host? [y/N]') -notin @('y','Y')) { throw 'Cancelled.' }
 function Install-PackageById([string]$id) {
  & $winget.Source install --id $id --exact --source winget --scope machine --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) { throw "WinGet installation failed for $id. Inspect before retrying." }
 }
 if ($needNode) { Install-PackageById 'OpenJS.NodeJS.LTS' }
 if ($needTS) { Install-PackageById 'Tailscale.Tailscale' }
}
$BootStage='runtime-verification'
foreach ($p in @($node,$npm,$ts)) { if (!(Test-Path -LiteralPath $p -PathType Leaf)) { throw "Missing prerequisite: $p. Reopen elevated PowerShell after installation if necessary." } }
& $node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);process.exit(process.arch==="x64"&&(a>22||(a===22&&(b>21||(b===21&&c>=1))))?0:1)'
if ($LASTEXITCODE -ne 0) { throw 'Installed Node version is incompatible.' }
# Explicit system paths; do not depend on the newly installed package refreshing PATH.
$env:Path=(Split-Path $node)+';'+(Split-Path $ts)+';'+$env:Path
$BootStage='tailscale-authentication'
$state=(& $ts status --json | Out-String | ConvertFrom-Json)
if ($LASTEXITCODE -ne 0 -or $state.BackendState -ne 'Running') {
 Write-Host 'Authenticate Tailscale in its official browser flow.'
 & $ts up
 if ($LASTEXITCODE -ne 0) { throw 'Tailscale login did not complete.' }
}
Write-Host 'Enable MagicDNS and HTTPS certificates in the Tailscale admin console before completing the wizard.'
$BootStage='wizard'
& $node (Join-Path $PSScriptRoot 'setup.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Setup did not complete; inspect local diagnostics.' }
