// Bounded read-only local discovery. No whole-disk scan, shell, config content or service mutation.
import {lstat,readFile,realpath} from "node:fs/promises";
import {join,resolve} from "node:path";
import {homedir} from "node:os";
import {serviceCandidates} from "./service-discovery.mjs";
export function candidateRoots(platform=process.platform,env=process.env,cwd=process.cwd()){
 const home=homedir(), roots=[cwd,join(home,"meshcentral"),join(home,"MeshCentral")];
 if(platform==="linux")roots.push("/opt/meshcentral","/opt/meshwall/engine","/srv/meshcentral","/var/lib/meshcentral","/usr/local/meshcentral");
 if(platform==="win32"){for(const base of [env.ProgramData,env.SystemDrive&&env.SystemDrive+"\\",env.ProgramFiles])if(base)roots.push(join(base,"MeshCentral"),join(base,"MeshWall"));}
 return [...new Set(roots.map(x=>resolve(x)))];
}
export async function inspectRoot(input){
 try{
  const root=await realpath(resolve(input));const s=await lstat(root);if(!s.isDirectory())return null;
  const pkg=join(root,"node_modules","meshcentral","package.json"),data=join(root,"meshcentral-data"),config=join(data,"config.json");
  const p=await lstat(pkg);if(!p.isFile()||p.isSymbolicLink()||p.size>1024*1024)return null;
  const manifest=JSON.parse(await readFile(pkg,"utf8"));if(manifest.name!=="meshcentral"||typeof manifest.version!=="string"||!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-z0-9.-]+)?$/i.test(manifest.version))return null;
  const d=await lstat(data).catch(()=>null),c=await lstat(config).catch(()=>null);
  const hasData=!!d?.isDirectory()&&!d.isSymbolicLink(),hasConfig=!!c?.isFile()&&!c.isSymbolicLink();
  const ui=await lstat(join(root,"meshcentral-web","public","meshwall.html")).catch(()=>null);
  return {root,version:manifest.version,hasData,hasConfig,meshwall:!!ui,compatible:manifest.version==="1.3.2"&&hasData&&hasConfig};
 }catch{return null;}
}
export async function discover(roots){
 if(roots===undefined)roots=[...await serviceCandidates(),...candidateRoots()];
 const found=[],seen=new Set();for(const p of roots.slice(0,48)){const r=await inspectRoot(p);if(r&&!seen.has(r.root)){seen.add(r.root);found.push(r);}}return found;
}
