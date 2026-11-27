import {existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
import {runInstaller} from "../setup/runner.mjs";
import {launchSetup} from "../setup/launch.mjs";
export {createSetupServer} from "../setup/server.mjs";
const dir=new URL("./",import.meta.url);
function preflight(){
 const checks=[];const check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
 const cmd=(name,args)=>spawnSync(name,args,{encoding:"utf8",timeout:5000,stdio:["ignore","pipe","pipe"]});
 const arch=process.arch, [a,b,c]=process.versions.node.split(".").map(Number);
 check("Node architecture",arch==="arm64"||arch==="x64",arch);
 check("Node version",a>22||(a===22&&(b>21||(b===21&&c>=1))),process.versions.node);
 for(const name of ["npm","tailscale","systemctl","curl","openssl","runuser","useradd","install","getent"]){const r=cmd("sh",["-c","command -v "+name]);check(name,r.status===0,r.status===0?"Available":"Missing");}
 let ts;try{const r=cmd("tailscale",["status","--json"]);ts=JSON.parse(r.stdout);}catch{}
 check("Tailscale login and MagicDNS",ts?.BackendState==="Running"&&!!ts?.Self?.DNSName,ts?.BackendState==="Running"?"Running":"Authenticate Tailscale first");
 check("Fresh install target",!existsSync("/opt/meshwall")&&!existsSync("/etc/systemd/system/meshwall-engine.service"),"Existing/partial installs are refused");
 return {checks,ready:checks.every(c=>c.ok),note:"The installer repeats checks, validates certificate issuance and requires Tailscale HTTPS enabled."};
}
async function main(){
 if(process.platform!=="linux"||process.getuid?.()!==0||!process.stdout.isTTY)throw Error("Start locally in an interactive Linux terminal using sudo.");
 await launchSetup({preflight,runInstall:(input,update)=>runInstaller({command:"bash",args:[fileURLToPath(new URL("install.sh",dir)),"--wizard"],env:{PATH:"/usr/local/bin:/usr/bin:/bin",HOME:"/root",LANG:"C.UTF-8"},encode:i=>i.username+"\n"+i.password+"\n"+i.password+"\n"},input,update)});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
