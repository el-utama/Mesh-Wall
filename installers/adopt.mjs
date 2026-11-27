// Existing installation only. Review, stop known service, then run as engine account.
import {fileURLToPath} from "node:url";
import {previewAdoption,adopt,adoptionStatus,rollbackAdoption} from "./adoption.mjs";
import {guidance} from "./support/catalog.mjs";
import {reviewAdoptionService} from "./setup/adoption-plan.mjs";
const [cmd,root,parent,flag,...rest]=process.argv.slice(2),source=fileURLToPath(new URL("../apps/web/public/",import.meta.url));
try{
 if(cmd==="preview"&&root&&!flag&&!rest.length)console.log(JSON.stringify(await previewAdoption(root,source,parent),null,2));
 else if(cmd==="service"&&root&&parent&&!flag&&!rest.length){const result=await reviewAdoptionService(root,parent);console.log(JSON.stringify(result,null,2));if(result.status!=="verified")process.exitCode=1;}
 else if(cmd==="status"&&root&&!parent)console.log(JSON.stringify(await adoptionStatus(root),null,2));
 else if(cmd==="apply"&&root&&parent&&flag==="--engine-stopped"&&!rest.length){if(process.platform!=="win32"&&process.getuid?.()===0)throw Error("Run as existing engine service account, not root.");console.log(JSON.stringify(await adopt(root,source,parent),null,2));console.log("Restart the known service and verify HTTPS, login, groups and authorized agents. Do not remove backup.");}
 else if(cmd==="rollback"&&root&&parent==="--engine-stopped"&&!flag&&!rest.length){if(process.platform!=="win32"&&process.getuid?.()===0)throw Error("Run as existing engine service account, not root.");console.log(JSON.stringify(await rollbackAdoption(root),null,2));console.log("Restart original server and verify login.");}
 else throw Error("Usage: adopt.mjs preview <root> [private-backup-parent] | service <root> <service-name> | status <root> | apply <root> <private-backup-parent> --engine-stopped | rollback <root> --engine-stopped");
}catch(e){console.error(e.message);console.error(guidance("adoption").next);process.exitCode=1;}
