// Existing installation only. Review, stop known service, then run as engine account.
import {fileURLToPath} from "node:url";
import {previewAdoption,adopt,adoptionStatus,rollbackAdoption} from "./adoption.mjs";
import {guidance} from "./support/catalog.mjs";
import {requireStoppedAdoptionService,validServiceName} from "./support/adoption-service.mjs";
import {reviewAdoptionService} from "./setup/adoption-plan.mjs";

const [command,root,...args]=process.argv.slice(2);
const source=fileURLToPath(new URL("../apps/web/public/",import.meta.url));
const usage="Usage: adopt.mjs preview <root> [private-backup-parent] | service <root> <service-name> | status <root> | apply <root> <private-backup-parent> --engine-stopped [--service <name>] | rollback <root> --engine-stopped [--service <name>]";

function offlineOptions([confirmation,flag,name,...rest]){
 if(confirmation!=="--engine-stopped"||rest.length)throw Error(usage);
 if(flag===undefined)return {};
 if(flag!=="--service"||!validServiceName(name))throw Error(usage);
 return {assertStopped:root=>requireStoppedAdoptionService(root,name)};
}

function log(value){console.log(JSON.stringify(value,null,2));}

try{
 if(!root)throw Error(usage);
 if(command==="preview"&&args.length<=1)log(await previewAdoption(root,source,args[0]));
 else if(command==="service"&&args.length===1){
  const result=await reviewAdoptionService(root,args[0]);
  log(result);
  if(result.status!=="verified")process.exitCode=1;
 }else if(command==="status"&&!args.length)log(await adoptionStatus(root));
 else if(command==="apply"||command==="rollback"){
  const options=offlineOptions(command==="apply"?args.slice(1):args);
  if(process.platform!=="win32"&&process.getuid?.()===0)throw Error("Run as existing engine service account, not root.");
  if(command==="apply")log(await adopt(root,source,args[0],options));
  else log(await rollbackAdoption(root,options));
  console.log("Restart the known service and verify HTTPS and the original login, groups, and authorized devices. Keep the backup.");
 }else throw Error(usage);
}catch(error){console.error(error.message);console.error(guidance("adoption").next);process.exitCode=1;}
