import {spawnSync} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
import {join} from "node:path";
import {launchSetup} from "../setup/launch.mjs";
import {runInstaller} from "../setup/runner.mjs";
export function windowsSetupCommand(systemRoot=process.env.SystemRoot){
 if(!systemRoot)throw Error("Windows SystemRoot missing");
 return {command:join(systemRoot,"System32","WindowsPowerShell","v1.0","powershell.exe"),args:["-NoProfile","-NonInteractive","-File",fileURLToPath(new URL("install.ps1",import.meta.url))]};
}
export function windowsInput(input){return JSON.stringify({username:input.username,password:input.password,confirmation:input.password,authorized:true});}
async function main(){
 if(process.platform!=="win32"||!process.stdout.isTTY)throw Error("Run from an interactive elevated Windows PowerShell.");
 const spec=windowsSetupCommand(),env={...process.env};delete env.meshcentral_pass;
 const preflight=()=>{const r=spawnSync(spec.command,[...spec.args,"-Preflight"],{env,encoding:"utf8",timeout:20000,windowsHide:true});const ok=r.status===0&&r.stdout?.split(/\r?\n/).includes("MW_PREFLIGHT_OK");return {ready:ok,checks:[{name:"Windows x64 / administrator / dependencies / private network",ok,detail:ok?"Compatible":"Check elevated terminal, Node.js, Tailscale, port 8443 and existing installs."}],note:"The installer repeats checks and verifies the Tailscale certificate before provisioning. No credentials are passed in process arguments."};};
 await launchSetup({preflight,runInstall:(input,update)=>runInstaller({...spec,args:[...spec.args,"-Wizard"],env,encode:windowsInput},input,update)});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
