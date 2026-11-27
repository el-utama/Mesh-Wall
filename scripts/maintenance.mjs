// Offline local maintenance only. Run as the service account after stopping MeshCentral.
import {backup,verify,restore} from "./maintenance/lib.mjs";
import {replaceUI} from "./maintenance/ui-release.mjs";
import {fileURLToPath} from "node:url";
const [cmd,a,b,ack,...rest]=process.argv.slice(2);
try{
 if(cmd==="verify"&&a&&!b){const r=await verify(a);console.log("Verified",r.manifest.entries.length,"entries for MeshCentral",r.manifest.engine);}
 else if((cmd==="backup"||cmd==="restore")&&a&&b&&ack==="--engine-stopped"&&!rest.length){if(process.platform!=="win32"&&process.getuid?.()===0)throw Error("Run as the engine service account, not root; prevents ownership changes.");console.log(cmd==="backup"?"Backup created:":"Restore complete; original data retained at:",await (cmd==="backup"?backup(a,b):restore(a,b)));if(cmd==="restore")console.log("Start engine and verify TLS, authentication and authorized device access before removing recovery data.");}
 else if(cmd==="update-ui"&&a&&b==="--engine-stopped"&&!ack&&!rest.length){if(process.platform!=="win32"&&process.getuid?.()===0)throw Error("Run as the engine service account.");const source=fileURLToPath(new URL("../apps/web/public/",import.meta.url));console.log("UI updated; previous UI retained at:",await replaceUI(a,source));}
 else if(cmd==="rollback-ui"&&a&&b&&ack==="--engine-stopped"&&!rest.length){if(process.platform!=="win32"&&process.getuid?.()===0)throw Error("Run as the engine service account.");console.log("UI restored; replaced UI retained at:",await replaceUI(a,b,{rollback:true}));}
 else throw Error("Usage: node scripts/maintenance.mjs backup <install-root> <private-backup-parent> --engine-stopped | verify <backup-dir> | restore <install-root> <backup-dir> --engine-stopped | update-ui <install-root> --engine-stopped | rollback-ui <install-root> <ui-recovery-dir> --engine-stopped");
}catch(e){console.error(e.message);process.exitCode=1;}
