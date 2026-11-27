// Verify a named service's registered launch and state. This module never starts a process from service metadata.
import {execFile} from "node:child_process";
import {posix,win32,join} from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

const exec = promisify(execFile);
const systemd = "org.freedesktop.systemd1";
const startProperties = ["Id","LoadState","ActiveState","MainPID","User","DynamicUser","NeedDaemonReload","WorkingDirectory","RootDirectory","RootImage","Environment","EnvironmentFiles","PassEnvironment","ExecStartPre","ExecStartPost","ExecCondition"];
const windowsProbe = fileURLToPath(new URL("../windows/inspect-adoption-service.ps1",import.meta.url));

export function validServiceName(value,platform=process.platform){
  if(typeof value!=="string"||value.length>128)return false;
  return platform==="linux" ? /^[a-z0-9][a-z0-9_.@:-]*\.service$/i.test(value)
    : platform==="win32" && /^[a-z0-9][a-z0-9_. -]*$/i.test(value) && value.trim()===value;
}

async function run(command,args,env,timeout=4000){
  const {stdout}=await exec(command,args,{env,timeout,maxBuffer:128*1024,windowsHide:true});
  return stdout.trim();
}

async function readLinux(_root,name){
  const env={LANG:"C",SYSTEMD_PAGER:"cat"};
  const args=["--system","show","--all","--no-pager",...startProperties.map(key=>"--property="+key),"--",name];
  let description;
  try{description=await run("/usr/bin/systemctl",args,env);}
  catch(error){if(error.stdout?.split("\n").includes("LoadState=not-found"))return null;throw error;}
  const fields=Object.fromEntries(description.split("\n").filter(line=>line.includes("=")).map(line=>{
    const eq=line.indexOf("=");
    return [line.slice(0,eq),line.slice(eq+1)];
  }));
  if(fields.LoadState==="not-found")return null;
  if(fields.LoadState!=="loaded")return {fields};
  const bus=["--system","--json=short","--timeout=3s"];
  const unit=JSON.parse(await run("/usr/bin/busctl",[...bus,"call",systemd,"/org/freedesktop/systemd1",systemd+".Manager","LoadUnit","s",name],env));
  const [path]=unit.data??[];
  if(unit.type!=="o"||!/^\/org\/freedesktop\/systemd1\/unit\/[A-Za-z0-9_]+$/.test(path))throw Error("Unknown systemd unit object");
  const launch=JSON.parse(await run("/usr/bin/busctl",[...bus,"get-property",systemd,path,systemd+".Service","ExecStart"],env));
  if(launch.type!=="a(sasbttttuii)"||!Array.isArray(launch.data))throw Error("Unknown systemd launch format");
  return {fields,commands:launch.data};
}

async function readWindows(root,name){
  if(!process.env.SystemRoot)throw Error("Windows SystemRoot missing");
  const powershell=join(process.env.SystemRoot,"System32","WindowsPowerShell","v1.0","powershell.exe");
  const stdout=await run(powershell,["-NoProfile","-NonInteractive","-File",windowsProbe],{
    ...process.env,MESHWALL_INSPECT_ROOT:root,MESHWALL_INSPECT_SERVICE:name
  },15000);
  return JSON.parse(stdout);
}

function linuxResult(root,name,{fields,commands}){
  if(fields.Id!==name||fields.LoadState!=="loaded"||fields.NeedDaemonReload!=="no")return {status:"unsupported"};
  if(!Array.isArray(commands)||commands.length!==1)return {status:"unsupported"};
  const [binary,argv]=commands[0];
  if(!posix.isAbsolute(binary)||!/^node(?:js)?$/.test(posix.basename(binary))||!Array.isArray(argv)||argv[0]!==binary)return {status:"unsupported"};
  const engine=posix.join(root,"node_modules/meshcentral");
  if(![engine,posix.join(engine,"meshcentral.js")].includes(argv[1]))return {status:"mismatch"};
  if(fields.DynamicUser==="yes"||!["",root,engine].includes(fields.WorkingDirectory??""))return {status:"unsupported"};
  const overrides=["RootDirectory","RootImage","EnvironmentFiles","PassEnvironment","ExecStartPre","ExecStartPost","ExecCondition"];
  if(overrides.some(key=>fields[key])||!/^(?:HOME=(?:\/[^\s"'\\]+))?$/.test(fields.Environment??""))return {status:"unsupported"};
  if(argv.length!==2&&!(argv.length===3&&argv[2]==="--launch"))return {status:"unsupported"};
  const state=fields.ActiveState==="active"&&Number(fields.MainPID)>0?"running":
    ["inactive","failed"].includes(fields.ActiveState)&&fields.MainPID==="0"?"stopped":"transitioning";
  return verified(name,state,fields.User||"root");
}

function sameWindowsPath(value,expected){
  return typeof value==="string"&&/^[a-z]:[\\/]/i.test(value)&&win32.normalize(value).toLowerCase()===expected.toLowerCase();
}

function windowsResult(root,name,evidence){
  const {Name,PathName,State,ProcessId,StartName,Launch}=evidence;
  if(typeof Name!=="string"||Name.toLowerCase()!==name.toLowerCase())return {status:"unsupported"};
  const binary=/^(?:"([^"]+)"|([^\s"]+))\s*$/.exec(PathName??"");
  const engine=win32.join(root,"node_modules","meshcentral");
  if(!binary)return {status:"unsupported"};
  if(!sameWindowsPath(binary[1]??binary[2],win32.join(engine,"daemon","meshcentral.exe")))return {status:"mismatch"};
  if(!Launch||Launch.Unexpected||!Array.isArray(Launch.Args))return {status:"unsupported"};
  const [wrapper,fileFlag,script,...options]=Launch.Args;
  if(fileFlag!=="--file"||!sameWindowsPath(script,win32.join(engine,"winservice.js")))return {status:"unsupported"};
  if(!sameWindowsPath(wrapper,win32.join(engine,"node_modules","node-windows","lib","wrapper.js")))return {status:"unsupported"};
  if(!/^[a-z]:[\\/].*[\\/]node\.exe$/i.test(Launch.Executable??""))return {status:"unsupported"};
  if(![root,engine,win32.join(engine,"daemon")].some(path=>sameWindowsPath(Launch.WorkingDirectory,path)))return {status:"unsupported"};
  const flags=new Set(["--log","--grow","--wait","--maxrestarts","--abortonerror","--stopparentfirst","--maxretries"]);
  if(options.length%2||options.some((value,index)=>index%2===0?!flags.has(value):typeof value!=="string"||value.startsWith("--")))return {status:"unsupported"};
  const state=State==="Running"&&ProcessId>0?"running":State==="Stopped"&&ProcessId===0?"stopped":"transitioning";
  return verified(Name,state,StartName||"LocalSystem");
}

function verified(name,state,account){
  if(typeof account!=="string"||account.length>256||/[\u0000-\u001f\u007f]/.test(account))return {status:"unsupported"};
  return {status:"verified",name,state,account};
}

export async function inspectAdoptionService(root,name,{platform=process.platform,read}={}){
  if(!validServiceName(name,platform))return {status:"invalid"};
  try{
    const evidence=await (read??(platform==="linux"?readLinux:readWindows))(root,name);
    if(!evidence)return {status:"missing"};
    return platform==="linux"?linuxResult(root,name,evidence):windowsResult(root,name,evidence);
  }catch{
    return {status:"unavailable"};
  }
}

export async function requireStoppedAdoptionService(root,name,inspect=inspectAdoptionService){
  const result=await inspect(root,name);
  if(result.status==="verified"&&result.state==="stopped")return;
  const next={
    invalid:"Enter the registered service name.",
    missing:"Confirm the registered name in the local service manager.",
    mismatch:"The service points to another installation. Verify the root and service name.",
    unsupported:"Inspect the effective launch and storage paths in the local service manager.",
    unavailable:"Check local service manager access and repeat the read-only service check.",
    verified:"Stop the named service and wait for it to reach stopped state before retrying."
  };
  throw Object.assign(Error("MW-ADOPT-SERVICE: "+(next[result.status]??next.unavailable)),{code:"ADOPTION_SERVICE"});
}
