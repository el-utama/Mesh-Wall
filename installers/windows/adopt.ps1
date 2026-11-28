# Existing installation only. No service mutation; run as authorized operator.
param([Parameter(Mandatory=$true)][string]$MeshCentralRoot,[ValidateSet('preview','service','status','apply','rollback')][string]$Mode='preview',[string]$BackupParent,[switch]$EngineStopped,[string]$ServiceName)
$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot '..\adopt.mjs'
$offlineArgs=@('--engine-stopped')
if ($Mode -in @('apply','rollback') -and $PSBoundParameters.ContainsKey('ServiceName')) {
 if (!$ServiceName) { throw 'Supply the registered ServiceName for the service check.' }
 $offlineArgs += @('--service',$ServiceName)
}
switch ($Mode) {
 'preview' { if ($BackupParent) { & node $script preview $MeshCentralRoot $BackupParent } else { & node $script preview $MeshCentralRoot } }
 'service' { if (!$ServiceName) { throw 'Supply the registered ServiceName.' }; & node $script service $MeshCentralRoot $ServiceName }
 'status' { & node $script status $MeshCentralRoot }
 'apply' { if (!$EngineStopped -or !$BackupParent) { throw 'Stop the verified service and supply a separate private BackupParent.' }; & node $script apply $MeshCentralRoot $BackupParent @offlineArgs }
 'rollback' { if (!$EngineStopped) { throw 'Stop the verified service before rollback.' }; & node $script rollback $MeshCentralRoot @offlineArgs }
}
if ($LASTEXITCODE -ne 0) { throw 'Adoption operation failed; see docs/SELF-SUPPORT.md.' }
