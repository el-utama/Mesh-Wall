# Shared fixed-root service discovery. Dot source only from trusted local scripts.
function Get-MeshWallService {
 param([Parameter(Mandatory=$true)][string]$Root)
 $engine = [IO.Path]::GetFullPath((Join-Path $Root 'node_modules\meshcentral'))
 $items = @(Get-CimInstance Win32_Service | Where-Object { $_.Name -like 'meshcentral*' -or $_.DisplayName -eq 'MeshCentral' })
 if ($items.Count -ne 1) { throw 'Expected exactly one MeshCentral Windows service.' }
 $path=$items[0].PathName
 if ($path -match '^"([^"]+)"(?:\s|$)') { $exe=$Matches[1] }
 elseif ($path -match '^([^\s]+\.exe)(?:\s|$)') { $exe=$Matches[1] }
 else { throw 'Unrecognized Windows service executable path.' }
 $exe=[IO.Path]::GetFullPath($exe)
 if (!$exe.StartsWith($engine+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Service does not belong to the fresh MeshWall installation.' }
 if (!(Test-Path -LiteralPath $exe -PathType Leaf)) { throw 'Service executable missing.' }
 Get-Service -Name $items[0].Name
}
