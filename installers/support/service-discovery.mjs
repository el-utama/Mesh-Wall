// Advisory discovery: never execute discovered command lines or change service state.
import {spawnSync} from "node:child_process";
import {readdir,readFile,readlink} from "node:fs/promises";
import {win32,posix,join} from "node:path";
export function rootsFromEvidence(rows,platform){
 const p=platform==="win32"?win32:posix,roots=new Set();
 for(const row of rows.slice(0,512)){
  if(typeof row!=="string"||row.length>8192)continue;
  // npm package directory (including Windows node-windows service wrapper under it).
  const pattern=platform==="win32"?/([a-z]:[\\/][^"\r\n]*?)[\\/]node_modules[\\/]meshcentral(?=[\\/"\s]|$)/ig:/([^\s"'{};]+)\/node_modules\/meshcentral(?=[/\s"'\x00]|$)/g;
  for(const m of row.matchAll(pattern)){if(p.isAbsolute(m[1]))roots.add(p.normalize(m[1]));}
  if(roots.size>=24)break;
 }
 return [...roots].slice(0,24);
}
function cmd(exe,args){const r=spawnSync(exe,args,{encoding:"utf8",timeout:4000,maxBuffer:1024*1024,windowsHide:true,stdio:["ignore","pipe","ignore"]});return r.status===0?r.stdout:"";}
export async function serviceCandidates(platform=process.platform){
 let evidence=[];
 if(platform==="linux"){
  // Read bounded named units, not arbitrary ExecStart strings as shell commands.
  const list=cmd("/usr/bin/systemctl",["list-unit-files","--type=service","--no-legend","--no-pager"]);
  const units=list.split("\n").map(s=>s.trim().split(/\s+/)[0]).filter(x=>/^[a-zA-Z0-9_.@-]+\.service$/.test(x)&&/meshcentral|meshwall/i.test(x)).slice(0,16);
  for(const unit of units){const s=cmd("/usr/bin/systemctl",["show",unit,"-p","WorkingDirectory","-p","ExecStart","--no-pager"]);evidence.push(s);const wd=s.split("\n").find(x=>x.startsWith("WorkingDirectory="))?.slice(17);if(wd&&posix.isAbsolute(wd))evidence.push(wd+"/node_modules/meshcentral");}
  // Inspect a bounded subset of local processes; only matching MeshCentral argv; never return raw argv.
  try{const ids=(await readdir("/proc")).filter(x=>/^\d+$/.test(x)).slice(0,1024);for(const id of ids){try{const a=await readFile("/proc/"+id+"/cmdline","utf8");if(!a.includes("meshcentral")&&!a.includes("meshwall"))continue;evidence.push(a.replaceAll("\x00"," "));const cwd=await readlink("/proc/"+id+"/cwd");if(posix.isAbsolute(cwd))evidence.push(cwd+"/node_modules/meshcentral");}catch{}}}catch{}
 }else if(platform==="win32"){
  const root=process.env.SystemRoot;if(!root)return [];
  const script="@(Get-CimInstance Win32_Service | Where-Object { $_.Name -match 'meshcentral|meshwall' -or $_.DisplayName -match 'meshcentral|meshwall' } | Select-Object -First 32 -ExpandProperty PathName); @(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'meshcentral' } | Select-Object -First 64 -ExpandProperty CommandLine)";
  evidence=cmd(join(root,"System32","WindowsPowerShell","v1.0","powershell.exe"),["-NoProfile","-NonInteractive","-Command",script]).split(/\r?\n/);
 }
 return rootsFromEvidence(evidence,platform);
}
