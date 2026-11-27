#Requires -RunAsAdministrator
$ErrorActionPreference='Stop'
$node=(Get-Command node.exe -CommandType Application).Source
if (!$node.StartsWith($env:ProgramFiles+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Use system-wide Node.js under Program Files.' }
& $node (Join-Path $PSScriptRoot 'setup.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Setup failed; review local diagnostics.' }
