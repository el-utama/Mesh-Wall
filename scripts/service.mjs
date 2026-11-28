// Local operator CLI; run only in an authorized maintenance window from a reviewed checkout.
import {controlFreshService} from "./maintenance/service-control.mjs";
const [action,root,name,confirmation,...extra]=process.argv.slice(2);
try{
 if(extra.length||confirmation!=="--confirm-downtime")throw Error("Usage: node scripts/service.mjs <start|stop|restart> <default-install-root> <registered-service-name> --confirm-downtime");
 if(process.platform==="linux"&&process.getuid?.()!==0)throw Error("Use an authorized administrator terminal; no automatic elevation.");
 const result=await controlFreshService(root,name,action,true);
 console.log(JSON.stringify(result,null,2));
 if(result.status==="needs-review")process.exitCode=1;
}catch(error){console.error(typeof error?.message==="string"&&error.message.startsWith("MW-")?error.message:"Service operation refused or unavailable. Inspect local permissions, maintenance lock and service state; never clear the lock blindly.");process.exitCode=1;}
