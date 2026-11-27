import {lstat,readdir,mkdir,copyFile,rename,rm,readFile,realpath,rmdir} from "node:fs/promises";
import {join,resolve,dirname,relative,isAbsolute} from "node:path";
import {randomBytes} from "node:crypto";
import {constants} from "node:fs";
const version="1.3.2";
const allowed=new Set(["meshwall.html","meshwall/app.mjs","meshwall/admin.mjs","meshwall/control.mjs","meshwall/desktop.mjs","meshwall/management.mjs","meshwall/model.mjs","meshwall/panels.mjs","meshwall/style.css","meshwall/tile-view.mjs","meshwall/ui.mjs","meshwall/wall.mjs"]);
const exists=async p=>{try{await lstat(p);return true;}catch(e){if(e.code==="ENOENT")return false;throw e;}};
async function dir(p){const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error("Unsafe directory: "+p);return await realpath(p);}
async function list(p){
 await dir(p);const result=[];for(const name of await readdir(p)){if(name==="meshwall.html"){const s=await lstat(join(p,name));if(!s.isFile()||s.isSymbolicLink())throw Error("Invalid UI entry");result.push(name);}else if(name==="meshwall"){await dir(join(p,name));for(const file of await readdir(join(p,name))){const s=await lstat(join(p,name,file));if(!s.isFile()||s.isSymbolicLink()||!/^[a-z][a-z.-]+\.(mjs|css)$/.test(file))throw Error("Unsafe UI file: "+file);result.push("meshwall/"+file);}}}
 return result.sort();
}
function inside(a,b){const p=relative(a,b);return p===""||(!isAbsolute(p)&&p!==".."&&!p.startsWith(process.platform==="win32"?"..\\":"../"));}
export async function replaceUI(rootArg,sourceArg,{rollback=false}={}){
 const root=await dir(resolve(rootArg)),source=await dir(resolve(sourceArg)),p=JSON.parse(await readFile(join(root,"node_modules/meshcentral/package.json"),"utf8"));if(p.version!==version)throw Error("Engine version mismatch");
 const web=join(root,"meshcentral-web"),dest=join(web,"public");await dir(web);await dir(dest);
 if(inside(dest,source)||inside(source,dest))throw Error("Source must be separate from active public directory");
 const sourceFiles=await list(source);
 if(!rollback&&(sourceFiles.length!==allowed.size||sourceFiles.some(f=>!allowed.has(f))))throw Error("Unexpected release files; use a reviewed compatible checkout");
 if(rollback&&(!sourceFiles.includes("meshwall.html")||!sourceFiles.includes("meshwall/app.mjs")))throw Error("Invalid recovery UI");
 const existing=await list(dest);if(!existing.includes("meshwall.html")||!existing.includes("meshwall/app.mjs"))throw Error("Existing MeshWall installation required");
 const lock=join(root,".meshwall-maintenance-lock");await mkdir(lock,{mode:0o700});
 const id=randomBytes(8).toString("hex"),stage=join(root,".meshwall-ui-stage-"+id),recovery=join(root,"meshwall-ui-recovery-"+id);
 const moved=[],installed=[];
 try{
  await mkdir(stage,{mode:0o700});await mkdir(recovery,{mode:0o700});await mkdir(join(stage,"meshwall"),{mode:0o700});
  for(const name of sourceFiles){const from=join(source,name),to=join(stage,name);await copyFile(from,to,constants.COPYFILE_EXCL);}
  for(const name of sourceFiles){const a=await readFile(join(source,name)),b=await readFile(join(stage,name));if(!a.equals(b))throw Error("UI copy verification failed");}
  for(const name of ["meshwall.html","meshwall"]){await rename(join(dest,name),join(recovery,name));moved.push(name);await rename(join(stage,name),join(dest,name));installed.push(name);}
  await rmdir(stage);return recovery;
 }catch(e){try{for(const name of installed.reverse())await rename(join(dest,name),join(stage,name));for(const name of moved.reverse())await rename(join(recovery,name),join(dest,name));await rm(stage,{recursive:true,force:true});await rm(recovery,{recursive:true,force:true});}catch{throw Error("UI rollback failed; preserve "+stage+" and "+recovery);}throw e;}
 finally{await rmdir(lock).catch(()=>{});}
}
