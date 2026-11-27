// Local read-only support tool, independent of running MeshCentral. Requires Node.
import {candidateRoots,discover} from "../installers/support/discovery.mjs";
import {guidance,stages} from "../installers/support/catalog.mjs";
const args=process.argv.slice(2);
if(args[0]==="help"&&args.length<=2){if(args[1]&&!Object.hasOwn(stages,args[1])){console.error("Unknown stage. Available: "+Object.keys(stages).join(", "));process.exitCode=1;}else console.log(JSON.stringify(args[1]?guidance(args[1]):Object.keys(stages).map(x=>guidance(x)),null,2));}
else if(!args.length||args[0]==="discover"&&args.length<=2){
 const candidates=await discover(args[1]?[args[1]]:candidateRoots());
 const [a,b,c]=process.versions.node.split(".").map(Number);
 console.log(JSON.stringify({mode:"read-only",platform:process.platform,architecture:process.arch,node:process.versions.node,nodeCompatible:a>22||(a===22&&(b>21||(b===21&&c>=1))),candidates,note:candidates.length?"Confirm the actual service and root before adoption.":"No candidate found in checked locations; custom paths may be missed. Use discover <root>."},null,2));
}else{console.error("Usage: node scripts/doctor.mjs [discover [root] | help [stage]]");process.exitCode=1;}
