# Existing installation only; does not install a Windows service.
param([Parameter(Mandatory=$true)][string]$MeshCentralRoot)
$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "..\adopt.mjs"
& node $script $MeshCentralRoot
if ($LASTEXITCODE -ne 0) { throw "MeshWall adoption failed." }
