// Explicit local service control for the default fresh installation. No shell or elevation.
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {join,normalize,win32} from "node:path";
import {lstat,mkdir,rmdir} from "node:fs/promises";
import {setTimeout as sleep} from "node:timers/promises";
import {networkInterfaces} from "node:os";
import {diagnoseFresh,readFreshEndpoint} from "../../installers/support/diagnose.mjs";
import {inspectAdoptionService,validServiceName} from "../../installers/support/adoption-service.mjs";
import {diagnoseHealth} from "../../installers/support/health.mjs";
const exec=promisify(execFile);
const actions=new Set(["start","stop","restart"]);
export function freshServiceTarget(root,name,{platform=process.platform,env=process.env}={}){
 if(typeof root!=="string"||!validServiceName(name,platform))return false;
 if(platform==="linux")return root==="/opt/meshwall/engine"&&name==="meshwall-engine.service";
 if(platform!=="win32"||!env.ProgramData||!/^[a-z]:[\\/]/i.test(env.ProgramData))return false;
 return /^[a-z]:[\\/]/i.test(root)&&!root.split(/[\\/]/).some(x=>x==="."||x==="..")&&win32.normalize(root).toLowerCase()===win32.join(env.ProgramData,"MeshWall").toLowerCase();
}
export function serviceInvocation(action,name,{platform=process.platform,env=process.env}={}){
 if(!["start","stop"].includes(action)||!validServiceName(name,platform))throw Error("MW-SERVICE-INPUT: unsupported operation");
 if(platform==="linux")return {command:"/usr/bin/systemctl",args:["--system","--no-ask-password","--no-pager",action,"--",name],env:{LANG:"C",SYSTEMD_PAGER:"cat"}};
 if(platform==="win32"&&typeof env.SystemRoot==="string"&&/^[a-z]:[\\/]/i.test(env.SystemRoot))return {command:win32.join(env.SystemRoot,"System32","sc.exe"),args:[action,name],env};
 throw Error("MW-SERVICE-INPUT: unsupported platform");
}
async function invoke(action,name){
 const spec=serviceInvocation(action,name);
 await exec(spec.command,spec.args,{env:spec.env,timeout:30000,maxBuffer:65536,windowsHide:true});
}
async function noAdoption(root){
 try{await lstat(join(root,".meshwall-adoption"));throw Error("MW-SERVICE-ADOPTION: inspect adoption journal before any operation");}
 catch(error){if(error.code!=="ENOENT")throw error;}
}
function verifiedState(info){
 if(info?.status!=="verified"||!["running","stopped","transitioning"].includes(info.state))throw Error("MW-SERVICE-IDENTITY: registered service could not be matched; inspect locally");
 return info.state;
}
function requiredFiles(report,starting,locked=false){
 const need=starting?["ROOT","PACKAGE","CONFIG","CERT","KEY","UI","APP"]:["ROOT","PACKAGE"];
 if(!need.every(code=>report.findings.some(x=>x.code==="MW-DIAG-"+code&&x.state==="present"))||
 !report.findings.some(x=>x.code==="MW-DIAG-LOCK"&&x.state===(locked?"blocked":"clear")))throw Error("MW-SERVICE-FILES: resolve required file or lock findings first");
}
export async function controlFreshService(root,name,action,confirmed,{
 target=freshServiceTarget,files=diagnoseFresh,endpoint=readFreshEndpoint,interfaces=networkInterfaces,
 inspect=inspectAdoptionService,run=invoke,health=diagnoseHealth,delay=sleep
}={}){
 if(confirmed!==true||!actions.has(action)||!target(root,name))throw Error("MW-SERVICE-INPUT: use the default fresh root, exact service and explicit downtime confirmation");
 root=normalize(root);
 const starting=action!=="stop";
 requiredFiles(await files(root),starting);
 await noAdoption(root);
 const lock=join(root,".meshwall-maintenance-lock");
 await mkdir(lock,{mode:0o700});
 let uncertain=false,changed=false,finalState;
 try{
  await noAdoption(root);
  requiredFiles(await files(root),starting,true);
  if(starting){
   const p=await endpoint(root);
   if(!p||!Object.values(interfaces()).flat().some(x=>x?.family==="IPv4"&&!x.internal&&x.address===p.ip))throw Error("MW-SERVICE-NETWORK: expected configured local private endpoint; inspect Tailscale before start");
  }
  let state=verifiedState(await inspect(root,name));
  if(state==="transitioning")throw Error("MW-SERVICE-BUSY: service changing state; inspect and retry manually");
  async function transition(operation,expected){
   // Recheck exact identity and source state immediately before dispatch.
   const before=verifiedState(await inspect(root,name));
   if(before!==state)throw Error("MW-SERVICE-CHANGED: service state changed before dispatch");
   uncertain=true;
   try{
    await run(operation,name);
    for(let i=0;i<4;i++){
     const current=verifiedState(await inspect(root,name));
     if(current===expected){uncertain=false;changed=true;state=current;return;}
     if(i!==3)await delay(1000);
    }
   }catch{}
   throw Error("MW-SERVICE-RECOVERY: operation outcome uncertain; preserve maintenance lock and inspect actual service state before any further action");
  }
  if(action==="restart"&&state!=="running")throw Error("MW-SERVICE-STATE: restart requires a running service; use start explicitly");
  if((action==="stop"||action==="restart")&&state==="running")await transition("stop","stopped");
  if(starting&&state==="stopped"){
   // Revalidate prerequisites after downtime and before starting.
   requiredFiles(await files(root),true,true);
   await noAdoption(root);
   await transition("start","running");
  }
  finalState=state;
 }finally{if(!uncertain)await rmdir(lock);}
 const report=starting?await health(root,name):null;
 return {operation:action,changed,state:finalState,health:report,
 status:starting?(report?.status==="page-reachable"?"page-reachable":"needs-review"):"stopped",
 note:"Service state and page readiness are separate observations. Verify authenticated login and an authorized device after start. No automatic retry, rollback, privilege elevation or lock clearing."};
}
