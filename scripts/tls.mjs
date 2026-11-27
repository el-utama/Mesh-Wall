import {certificateStatus,rotateTLS,rollbackTLS} from "./maintenance/tls-rotation.mjs";
const [cmd,root,a,b,flag,...rest]=process.argv.slice(2);
try{
 if(process.platform!=="win32"&&process.getuid?.()===0)throw Error("Run as the engine account, not root.");
 if(cmd==="status"&&root&&!a)console.log(JSON.stringify(await certificateStatus(root)));
 else if(cmd==="rotate"&&root&&a&&b&&flag==="--engine-stopped"&&!rest.length)console.log((await rotateTLS(root,a,b))||"UNCHANGED");
 else if(cmd==="rollback"&&root&&a&&b==="--engine-stopped"&&!flag)console.log(await rollbackTLS(root,a));
 else throw Error("Usage: tls.mjs status <root> | rotate <root> <chain> <key> --engine-stopped | rollback <root> <recovery> --engine-stopped");
}catch(e){console.error(e.message);process.exitCode=1;}
