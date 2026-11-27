# Read-only CIM/WinSW inspection. Both inputs are passed as data in environment variables.
function Read-MeshWallWinSW {
  param([string]$Config)
  $settings = New-Object System.Xml.XmlReaderSettings
  $settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
  $settings.XmlResolver = $null
  $settings.MaxCharactersInDocument = 65536
  $reader = [System.Xml.XmlReader]::Create($Config, $settings)
  try {
    $xml = New-Object System.Xml.XmlDocument
    $xml.XmlResolver = $null
    $xml.Load($reader)
    return @{
      Executable = [string]$xml.SelectSingleNode('/service/executable').InnerText
      WorkingDirectory = [string]$xml.SelectSingleNode('/service/workingdirectory').InnerText
      Args = @($xml.SelectNodes('/service/argument') | ForEach-Object { $_.InnerText })
      Unexpected = ($xml.SelectNodes('/service/executable').Count -ne 1 -or [bool]$xml.SelectSingleNode('/service/arguments | /service/startarguments | /service/env | /service/prestart | /service/poststart | /service/extensions | /service/download'))
    }
  } finally { $reader.Dispose() }
}

if ($MyInvocation.InvocationName -eq '.') { return }
$ErrorActionPreference = 'Stop'
$serviceName = $env:MESHWALL_INSPECT_SERVICE
$root = $env:MESHWALL_INSPECT_ROOT
$service = Get-CimInstance Win32_Service | Where-Object { $_.Name -eq $serviceName } | Select-Object -First 1
if (!$service) { 'null'; exit 0 }

$record = $service | Select-Object Name, PathName, State, ProcessId, StartName
$engine = Join-Path $root 'node_modules\meshcentral'
$daemon = Join-Path $engine 'daemon'
$expectedExe = Join-Path $daemon 'meshcentral.exe'
$exe = $service.PathName.Trim().Trim('"')
if ($exe -eq $expectedExe) {
  $config = Join-Path $daemon 'meshcentral.xml'
  $safe = $true
  foreach ($path in @((Join-Path $root 'node_modules'), $engine, $daemon, $expectedExe, $config)) {
    $item = Get-Item -LiteralPath $path -ErrorAction SilentlyContinue
    if (!$item -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { $safe = $false; break }
    if ($path -eq $config -and ($item.PSIsContainer -or $item.Length -gt 65536)) { $safe = $false; break }
  }
  if ($safe) { $record | Add-Member -NotePropertyName Launch -NotePropertyValue (Read-MeshWallWinSW $config) }
}
$record | ConvertTo-Json -Depth 4 -Compress
