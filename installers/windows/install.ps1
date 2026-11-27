# Alpha fresh install. Windows x64, private Tailscale network, elevated PowerShell.
# Uses upstream MeshCentral Windows Service. Run only from a trusted reviewed checkout.
#Requires -RunAsAdministrator
param([switch]$Wizard,[switch]$Preflight)
if ($Wizard -and $Preflight) { throw 'Choose one mode.' }
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:ProgramData 'MeshWall'
$src = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$engine = Join-Path $root 'node_modules\meshcentral'
$port = 8443
function Require-Success([string]$step) { if ($LASTEXITCODE -ne 0) { throw "$step failed (exit $LASTEXITCODE)." } }
if (Test-Path -LiteralPath $root) { throw 'Existing or partial MeshWall installation; refuse overwrite.' }
if (Get-Service | Where-Object { $_.Name -like 'meshcentral*' -or $_.DisplayName -eq 'MeshCentral' }) { throw 'Existing MeshCentral service; use adoption instead.' }
$node = (Get-Command node.exe -CommandType Application).Source
$npm = (Get-Command npm.cmd -CommandType Application).Source
$ts = (Get-Command tailscale.exe -CommandType Application -ErrorAction SilentlyContinue)
if ($null -eq $ts) { $tsPath = Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe'; if (!(Test-Path -LiteralPath $tsPath)) { throw 'Install and authenticate Tailscale first.' } } else { $tsPath = $ts.Source }
# Do not install a persistent system service using a user-writable Node installation.
if (!$node.StartsWith($env:ProgramFiles + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Install system-wide Node.js under Program Files before proceeding.' }
& $node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);process.exit(process.arch==="x64"&&(a>22||(a===22&&(b>21||(b===21&&c>=1))))?0:1)'
Require-Success 'Node version / architecture'
$status = (& $tsPath status --json | Out-String | ConvertFrom-Json); Require-Success 'Tailscale status'
if ($status.BackendState -ne 'Running' -or !$status.Self.DNSName) { throw 'Tailscale must be running with MagicDNS.' }
$dnsName = $status.Self.DNSName.TrimEnd('.')
$ip = (& $tsPath ip -4 | Out-String).Trim(); Require-Success 'Tailscale IP'
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is already in use." }
& $node -e 'const [h,ip]=process.argv.slice(1);if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(h)||!/^100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(ip)||ip.split(".").some(x=>Number(x)>255))process.exit(1)' $dnsName $ip
Require-Success 'Private network validation'
if ($Preflight) { [Console]::WriteLine('MW_PREFLIGHT_OK'); exit 0 }
$secure=$null; $again=$null; $temp=$null; $inputData=$null
if ($Wizard) {
 [Console]::InputEncoding=[Text.UTF8Encoding]::new($false)
 $raw=[Console]::In.ReadToEnd()
 if ($raw.Length -gt 4096) { throw 'Invalid setup input.' }
 $inputData=ConvertFrom-Json -InputObject $raw
 $raw=$null
 if ($inputData.authorized -ne $true -or $inputData.username -isnot [string] -or $inputData.password -isnot [string] -or $inputData.confirmation -isnot [string]) { throw 'Invalid setup input.' }
 $adminName=$inputData.username; $password=$inputData.password; $confirmation=$inputData.confirmation; $inputData=$null
} else {
Write-Host "Fresh MeshCentral 1.3.2, binding only to $ip port $port. Tailscale HTTPS certificates must be enabled; DNS name may be publicly logged in certificate transparency."
if ((Read-Host 'Proceed on this authorized test host? [y/N]') -notin @('y','Y')) { throw 'Cancelled.' }
$adminName = Read-Host 'Initial administrator username'
if ($adminName -cnotmatch '^[a-zA-Z][a-zA-Z0-9_.-]{2,31}$') { throw 'Invalid username.' }
$secure = Read-Host 'Password (16–128 characters, include a letter)' -AsSecureString
$again = Read-Host 'Repeat password' -AsSecureString
function Plain([Security.SecureString]$value) {
 $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
 try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
$password = Plain $secure
$confirmation = Plain $again
}
if ($adminName -cnotmatch '^[a-zA-Z][a-zA-Z0-9_.-]{2,31}$') { throw 'Invalid username.' }
try {
 if ($password.Length -lt 16 -or $password.Length -gt 128 -or $password -cne $confirmation -or $password -notmatch '[a-zA-Z]' -or $password.StartsWith('-') -or $password -match '[\r\n\x00]') { throw 'Password does not meet requirements.' }
 [Console]::WriteLine('MW_STAGE certificate')
 New-Item -ItemType Directory -Path $root | Out-Null
 # Restrict installation and all inherited child ACLs to local Administrators and SYSTEM.
 & icacls.exe $root /inheritance:r /grant:r '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-18:(OI)(CI)F' | Out-Null
 Require-Success 'Restrict installation ACL'
 $temp = Join-Path $root '.setup'
 New-Item -ItemType Directory -Path $temp | Out-Null
 $chain = Join-Path $temp 'chain.pem'; $key = Join-Path $temp 'key.pem'
 & $tsPath cert --cert-file $chain --key-file $key $dnsName
 Require-Success 'Tailscale certificate'
 $prepared = Join-Path $temp 'prepared'
 & $node (Join-Path $src 'scripts\maintenance\certificates.mjs') $chain $key $dnsName $prepared
 Require-Success 'Certificate validation'
 [Console]::WriteLine('MW_STAGE package')
 & $npm install --prefix $root --omit=dev --no-audit --no-fund 'meshcentral@1.3.2'
 Require-Success 'MeshCentral package install'
 [Console]::WriteLine('MW_STAGE configuration')
 $data = Join-Path $root 'meshcentral-data'
 New-Item -ItemType Directory -Path $data | Out-Null
 Get-ChildItem -LiteralPath $prepared -File | Copy-Item -Destination $data
 $json = & $node (Join-Path $src 'installers\linux\config.mjs') $dnsName $ip $port
 Require-Success 'Private configuration'
 [IO.File]::WriteAllText((Join-Path $data 'config.json'), ($json -join "`n"), [Text.UTF8Encoding]::new($false))
 & $node (Join-Path $src 'installers\adopt.mjs') $root
 Require-Success 'MeshWall static UI'
 [Console]::WriteLine('MW_STAGE administrator')
 Push-Location $root
 try {
   $env:meshcentral_pass = $password
   try { $out = & $node $engine --createaccount $adminName; Require-Success 'Administrator creation'; if (($out -join "`n") -notmatch '(?m)^Done\.') { throw 'Account creation not confirmed.' } }
   finally { Remove-Item Env:meshcentral_pass -ErrorAction SilentlyContinue }
   $out = & $node $engine --adminaccount $adminName
   Require-Success 'Administrator promotion'
   if (($out -join "`n") -notmatch '(?m)^Done\.') { throw 'Administrator promotion not confirmed.' }
   [Console]::WriteLine('MW_STAGE service')
   & $node $engine --install
   Require-Success 'Upstream Windows Service installation'
 } finally { Pop-Location }
 $services = @(Get-Service | Where-Object { $_.Name -like 'meshcentral*' -or $_.DisplayName -eq 'MeshCentral' })
 if ($services.Count -ne 1) { throw 'Windows service registration not confirmed.' }
 $service = $services[0]
 if ($service.Status -ne 'Running') { Start-Service -Name $service.Name }
 $url = "https://${dnsName}:${port}/meshwall.html"
 [Console]::WriteLine('MW_STAGE verification')
 $reachable = $false
 for ($i=0; $i -lt 60; $i++) {
   try { $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 4; if ($r.StatusCode -eq 200 -and $r.Content -match '<title>MeshWall</title>') { $reachable=$true; break } } catch {}
   Start-Sleep -Seconds 2
 }
 if (!$reachable) { throw 'HTTPS readiness failed. Inspect Windows service/event log; no insecure TLS fallback.' }
 [Console]::WriteLine("MW_READY $url")
 Write-Host "MeshWall reachable: $url"
 Write-Host 'Validate login, enrollment and an authorized PC session. This is an alpha installer.'
} finally {
 $password=$null; $confirmation=$null; if ($secure) { $secure.Dispose() }; if ($again) { $again.Dispose() }
 Remove-Item Env:meshcentral_pass -ErrorAction SilentlyContinue
 if ($temp -and (Test-Path -LiteralPath $temp)) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
