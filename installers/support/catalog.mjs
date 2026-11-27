// Static, local guidance. A stage failure identifies where to investigate, not a confirmed root cause.
export const stages=Object.freeze({
 bootstrap:["MW-BOOTSTRAP","Prepare system dependencies","Check administrator privileges, supported 64-bit OS, free disk and official package sources.","If a package install failed, inspect its local output. Do not disable repository signature checks or delete a partial runtime."],
 discovery:["MW-DISCOVERY","Find an existing server","Check detected candidates and confirm the actual installation root.","Do not run fresh install over an existing server. Use manual root selection if detection missed a custom location."],
 preflight:["MW-PREFLIGHT","Check compatibility","Resolve failed architecture, runtime, dependency, private network or existing-install checks.","Run preflight again only after resolving the reported blockers. No automatic overwrite."],
 certificate:["MW-TLS","Issue and validate TLS","Check Tailscale login, MagicDNS, HTTPS certificate permission and clock.","Do not bypass TLS verification. Check whether any installation files were created before retrying."],
 package:["MW-PACKAGE","Install the pinned engine","Check official package connectivity, disk space, permissions and local package manager output.","A partial service account or directory may exist. Preserve it; do not blindly repeat bootstrap."],
 configuration:["MW-CONFIG","Configure the server","Check file ownership/ACL, write access, private bind and configuration validity.","Preserve configuration and certificates; inspect partial files before recovery."],
 administrator:["MW-ADMIN","Create the initial account","Check upstream account creation/promotion results and password policy.","Do not recreate accounts blindly or share passwords. Check existing account state through authorized local tools."],
 service:["MW-SERVICE","Register and start service","Check the actual service identity, dependency failures, bind conflicts and local service logs.","Do not stop unrelated services. Preserve existing server and inspect before retry."],
 verification:["MW-VERIFY","Verify HTTPS readiness","Check service status, hostname, certificate, private bind and the actual HTTPS page.","A reachable page is not proof of working login or agent. Do not use insecure TLS."],
 ready:["MW-READY","Validate first use","Sign in, create or select an authorized group, enroll one test PC and approve required consent.","Increase concurrent sessions only after measuring resource usage."],
 adoption:["MW-ADOPT","Adopt existing server","Confirm pinned engine version, correct root, backup and stopped service.","Use adopt.mjs preview/status and the offline apply/rollback commands. Preserve the journal and verified backup; never clear a maintenance lock blindly."],
 enrollment:["MW-ENROLL","Enroll authorized device","Check invitation expiry, group access, network reachability and official agent status.","Generate a new authorized invitation if needed; never publish invite URLs."],
 streaming:["MW-STREAM","View authorized screen","Distinguish agent online, consent, relay connection and decoded image; check session limit and selected monitor.","Stop and retry explicitly only with authorization. Reduce active count/quality when resources are constrained."],
 maintenance:["MW-MAINT","Maintain server","Identify correct service, verify backup, available space and recovery path before changes.","Use supported local maintenance commands; never mutate a live database."],
 recovery:["MW-RECOVERY","Recover from failure","Preserve original files, stage evidence and identify the failed operation before changing state.","Use verified backup/rollback where supported. Power loss or ambiguous state requires authorized manual inspection."]
});
export function guidance(stage,platform=process.platform){
 const key=Object.hasOwn(stages,stage)?stage:"recovery", [code,title,check,next]=stages[key];
 const os=platform==="win32"?"Windows":"Linux";
 const diagnostic=os==="Windows"?"Inspect Get-Service and Event Viewer for the identified service.":"Inspect systemctl status and journalctl for the identified service.";
 return {stage:key,code,title,check,next,diagnostic};
}
export function supportReport({stage,status},platform=process.platform){
 return {format:1,platform:platform==="win32"?"windows":platform==="linux"?"linux":"other",status:["idle","running","failed","complete"].includes(status)?status:"unknown",guidance:guidance(stage,platform)};
}
