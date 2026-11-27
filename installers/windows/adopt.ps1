# Existing installation only. No service mutation; run as authorized operator.
param([Parameter(Mandatory=$true)][string]$MeshCentralRoot,[ValidateSet('preview','status','apply','rollback')][string]$Mode='preview',[string]$BackupParent,[switch]$EngineStopped)
$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot '..\adopt.mjs'
switch ($Mode) {
 'preview' { if ($BackupParent) { & node $script preview $MeshCentralRoot $BackupParent } else { & node $script preview $MeshCentralRoot } }
 'status' { & node $script status $MeshCentralRoot }
 'apply' { if (!$EngineStopped -or !$BackupParent) { throw 'Stop the verified service and supply a separate private BackupParent.' }; & node $script apply $MeshCentralRoot $BackupParent --engine-stopped }
 'rollback' { if (!$EngineStopped) { throw 'Stop the verified service before rollback.' }; & node $script rollback $MeshCentralRoot --engine-stopped }
}
if ($LASTEXITCODE -ne 0) { throw 'Adoption operation failed; see docs/SELF-SUPPORT.md.' }
