#Requires -RunAsAdministrator
# Local renewal for fresh MeshWall installations. No scheduled task or network listener.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'service.ps1')
$root=Join-Path $env:ProgramData 'MeshWall'
$src=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$node=(Get-Command node.exe -CommandType Application).Source
if (!$node.StartsWith($env:ProgramFiles+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Use system-wide Node.js.' }
$ts=Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe'
if (!(Test-Path -LiteralPath $ts -PathType Leaf)) { throw 'Official Tailscale installation required.' }
$service=Get-MeshWallService -Root $root
if ($service.Status -ne 'Running') { throw 'Engine must be running before renewal.' }
function Invoke-TlsTool { $output=& $node (Join-Path $src 'scripts\tls.mjs') @args; if ($LASTEXITCODE -ne 0) { throw 'TLS tool failed. Inspect local diagnostics.' }; return ($output -join "`n").Trim() }
$status=Invoke-TlsTool status $root | ConvertFrom-Json
if ($status.daysRemaining -gt 30) { Write-Host "Certificate valid for $($status.daysRemaining) more days."; exit 0 }
$state=(& $ts status --json | Out-String | ConvertFrom-Json)
if ($LASTEXITCODE -ne 0 -or $state.BackendState -ne 'Running' -or $state.Self.DNSName.TrimEnd('.') -ne $status.host) { throw 'Tailnet hostname or state mismatch.' }
$ip=(& $ts ip -4 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $ip -notmatch '^100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$') { throw 'Invalid tailnet IP.' }
$hostName=$status.host
$conf=Get-Content -Raw -LiteralPath (Join-Path $root 'meshcentral-data\config.json') | ConvertFrom-Json
if ($conf.settings.portBind -ne $ip) { throw 'Configured private bind differs from current tailnet IP.' }
$tmp=Join-Path $root ('.tls-input-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
 & icacls.exe $tmp /inheritance:r /grant:r '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-18:(OI)(CI)F' | Out-Null
 if ($LASTEXITCODE -ne 0) { throw 'Could not restrict temporary certificate ACL.' }
 $chain=Join-Path $tmp 'chain.pem'; $key=Join-Path $tmp 'key.pem'
 & $ts cert --cert-file $chain --key-file $key $hostName
 if ($LASTEXITCODE -ne 0) { throw 'Certificate issuance failed.' }
 $candidate=Invoke-TlsTool inspect $root $chain $key | ConvertFrom-Json
 if (!$candidate.changed) { Write-Host 'Same certificate returned; no restart. Recheck before expiry.'; exit 0 }
 function Wait-Ready([string]$fingerprint) {
  for ($i=0;$i -lt 30;$i++) {
   try {
    & $node (Join-Path $src 'scripts\maintenance\tls-peer.mjs') $ip $hostName $fingerprint
    if ($LASTEXITCODE -eq 0) {
     $r=Invoke-WebRequest -UseBasicParsing -Uri "https://${hostName}:8443/meshwall.html" -TimeoutSec 4
     if ($r.StatusCode -eq 200 -and $r.Content -match '<title>MeshWall</title>') { return $true }
    }
   } catch {}
   Start-Sleep -Seconds 2
  }
  return $false
 }
 function Stop-KnownService {
  $s=Get-MeshWallService -Root $root
  Stop-Service -Name $s.Name
  $s.WaitForStatus([ServiceProcess.ServiceControllerStatus]::Stopped,[TimeSpan]::FromSeconds(30))
 }
 Stop-KnownService
 $recovery=Invoke-TlsTool rotate $root $chain $key --engine-stopped
 if ($recovery -eq 'UNCHANGED') { Start-Service -Name $service.Name; if (!(Wait-Ready $status.fingerprint)) { throw 'HTTPS readiness failed.' }; exit 0 }
 if ([IO.Path]::GetDirectoryName($recovery) -ne [IO.Path]::GetFullPath($root) -or [IO.Path]::GetFileName($recovery) -notmatch '^meshwall-tls-recovery-[a-f0-9]{24}$') { throw 'Unexpected recovery path; inspect before restarting.' }
 $ready=$false
 try { Start-Service -Name $service.Name; $ready=Wait-Ready $candidate.fingerprint } catch {}
 if ($ready) { Write-Host "Renewed certificate. Previous material retained at $recovery"; exit 0 }
 Stop-KnownService
 Invoke-TlsTool rollback $root $recovery --engine-stopped | Out-Null
 Start-Service -Name $service.Name
 if (!(Wait-Ready $status.fingerprint)) { throw 'Rollback HTTPS verification failed; inspect recovery directories.' }
 throw 'Renewal failed; previous certificate restored and HTTPS verified.'
} finally { Remove-Item -LiteralPath $tmp -Recurse -Force }
