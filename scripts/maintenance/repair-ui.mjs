// Narrow local repair: never overwrite different UI content; verified full backup and stopped-service guard.
import {backup,verify,assertSnapshotMatches} from "./lib.mjs";
import {replaceUI} from "./ui-release.mjs";
import {diagnoseFresh} from "../../installers/support/diagnose.mjs";
import {readFreshEndpoint} from "../../installers/support/diagnose.mjs";
import {requireStoppedAdoptionService,validServiceName} from "../../installers/support/adoption-service.mjs";
import {realpath,lstat} from "node:fs/promises";
import {join,resolve} from "node:path";

export async function repairUI(root,source,parent,name,{inspectFiles=diagnoseFresh,endpoint=readFreshEndpoint,assertStopped=requireStoppedAdoptionService,snapshot=backup,verifySnapshot=verify,matchSnapshot=assertSnapshotMatches,replace=replaceUI}={}){
 if(!validServiceName(name))throw Error("MW-REPAIR-SERVICE: use the exact registered service name");
 const report=await inspectFiles(root);
 const expected=["ROOT","PACKAGE","CONFIG","CERT","KEY"];
 if(!expected.every(code=>report.findings.some(item=>item.code==="MW-DIAG-"+code&&item.state==="present"))||
  !report.findings.some(item=>item.code==="MW-DIAG-LOCK"&&item.state==="clear"))throw Error("MW-REPAIR-FILES: resolve file and lock findings first");
 for(const code of ["UI","APP"]){
  const item=report.findings.find(x=>x.code==="MW-DIAG-"+code);
  if(!item||!["present","missing"].includes(item.state))throw Error("MW-REPAIR-FILES: unsafe or empty UI entry; preserve state");
 }
 if(!await endpoint(root))throw Error("MW-REPAIR-CONFIG: expected default fresh private configuration");
 const actual=await realpath(resolve(root));
 try{await lstat(join(actual,".meshwall-adoption"));throw Error("MW-REPAIR-ADOPTION: adoption journal exists; use adoption guidance");}
 catch(error){if(error.code!=="ENOENT")throw error;}
 const guard=path=>assertStopped(path,name);
 await guard(actual);
 const saved=await snapshot(actual,parent);
 await verifySnapshot(saved);
 try{
  const previous=await replace(actual,source,{repair:true,assertStopped:guard,assertSnapshot:async path=>matchSnapshot(path,saved)});
  return {backup:saved,previous};
 }catch(error){
  throw Error("MW-REPAIR: UI repair not completed; preserve the verified backup at "+saved+". Inspect local recovery before retrying. "+error.message);
 }
}
