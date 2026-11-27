// Shared advisory fresh-install guard; no mutations or raw process arguments.
import {discover} from "./discovery.mjs";
try{const found=await discover();if(found.length){console.error("MW-DISCOVERY: Existing MeshCentral candidate detected. Run node scripts/doctor.mjs and follow docs/ADOPTION.md.");process.exitCode=1;}}catch{console.error("MW-DISCOVERY: Unable to complete discovery. Inspect before fresh installation.");process.exitCode=1;}
