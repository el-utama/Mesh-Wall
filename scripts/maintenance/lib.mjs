import {createHash,randomBytes} from "node:crypto";
import {createReadStream} from "node:fs";
import {lstat,readdir,mkdir,copyFile,readFile,writeFile,rename,rm,realpath,chmod,rmdir} from "node:fs/promises";
import {join,resolve,relative,isAbsolute,dirname,basename} from "node:path";
import {constants} from "node:fs";
const VERSION="1.3.2";
const roots=["meshcentral-data","meshcentral-files","meshcentral-web"];
const stamp=()=>new Date().toISOString().replace(/[:.]/g,"-")+"-"+randomBytes(5).toString("hex");
const safeName=name=>typeof name==="string"&&name.length>0&&!/[\\:\u0000-\u001f]/.test(name)&&name!=="."&&name!==".."&&!name.includes("/");
function validRelative(p){return typeof p==="string"&&p.length<=4096&&p.split("/").every(safeName)&&roots.includes(p.split("/")[0]);}
async function exists(p){try{await lstat(p);return true;}catch(e){if(e.code==="ENOENT")return false;throw e;}}
async function directory(p){const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error("Expected a regular directory: "+p);}
async function rootPath(p){const full=resolve(p);await directory(full);const actual=await realpath(full);if(process.platform!=="win32"&&actual!==full)throw Error("Symlinked root refused");return actual;}
function inside(parent,child){const r=relative(parent,child);return r===""||(!r.startsWith(".."+(process.platform==="win32"?"\\":"/"))&&r!==".."&&!isAbsolute(r));}
async function hash(path){const h=createHash("sha256");for await(const chunk of createReadStream(path))h.update(chunk);return h.digest("hex");}
async function walk(base,rel,entries){if(!validRelative(rel))throw Error("Unsafe path");const full=join(base,...rel.split("/")),s=await lstat(full);if(s.isSymbolicLink())throw Error("Symbolic links are not supported: "+rel);if(s.isDirectory()){entries.push({path:rel,type:"directory"});for(const n of (await readdir(full)).sort()){if(!safeName(n))throw Error("Unsupported filename");await walk(base,rel+"/"+n,entries);}}else if(s.isFile()){entries.push({path:rel,type:"file",size:s.size,sha256:await hash(full)});}else throw Error("Special file refused: "+rel);}
async function inventory(base){const entries=[];for(const name of roots)if(await exists(join(base,name)))await walk(base,name,entries);return entries;}
async function checkEngine(root){const p=JSON.parse(await readFile(join(root,"node_modules/meshcentral/package.json"),"utf8"));if(p.version!==VERSION)throw Error("Unsupported MeshCentral version: "+p.version);}
async function checkLocalDatabase(base){
 const conf=JSON.parse(await readFile(join(base,"meshcentral-data/config.json"),"utf8"));const settings=conf.settings||{};
 const unsupported=Object.keys(settings).find(k=>/^(mongodb|mongodbname|mongodbcol|mysql|mariadb|postgres|postgresql|sqlite3|acebase|dbtype|database|datapath|filespath|recordpath|recordingpath|webpath)$/i.test(k)&&settings[k]);
 if(unsupported)throw Error("External or alternate data storage requires its own backup procedure: "+unsupported);
}
async function privateDir(path){await mkdir(path,{mode:0o700});}
async function copyEntries(src,dest,entries){for(const entry of entries){const a=join(src,...entry.path.split("/")),b=join(dest,...entry.path.split("/"));if(entry.type==="directory"){await privateDir(b);}else{await copyFile(a,b,constants.COPYFILE_EXCL);if(process.platform!=="win32")await chmod(b,0o600);}}}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
async function lock(root,fn){const path=join(root,".meshwall-maintenance-lock");await privateDir(path);try{return await fn();}finally{await rmdir(path);}}
export async function backup(rootArg,parentArg){
 const root=await rootPath(rootArg),parent=await rootPath(parentArg);if(inside(root,parent)||inside(parent,root))throw Error("Backup parent must be outside and separate from installation");
 await checkEngine(root);await checkLocalDatabase(root);
 return lock(root,async()=>{const id=stamp(),staging=join(parent,".meshwall-staging-"+id),dest=join(parent,"meshwall-"+id);await privateDir(staging);
 try{const entries=await inventory(root);if(!entries.some(x=>x.path==="meshcentral-data/config.json"&&x.type==="file"))throw Error("Configuration missing");await copyEntries(root,staging,entries);
 if(!same(entries,await inventory(staging))||!same(entries,await inventory(root)))throw Error("Source changed or copied data differs; stop the engine first");
 await writeFile(join(staging,"manifest.json"),JSON.stringify({format:1,engine:VERSION,created:new Date().toISOString(),entries},null,2)+"\n",{mode:0o600,flag:"wx"});await rename(staging,dest);return dest;
 }catch(e){await rm(staging,{recursive:true,force:true});throw e;}});
}
export async function verify(backupArg){
 const dir=await rootPath(backupArg),manifestPath=join(dir,"manifest.json"),st=await lstat(manifestPath);if(!st.isFile()||st.isSymbolicLink()||st.size>64*1024*1024)throw Error("Invalid manifest");
 const m=JSON.parse(await readFile(manifestPath,"utf8"));if(m.format!==1||m.engine!==VERSION||!Array.isArray(m.entries)||!m.entries.length)throw Error("Unsupported backup format");
 const seen=new Set();for(const e of m.entries){if(!e||!validRelative(e.path)||seen.has(e.path)||!["file","directory"].includes(e.type))throw Error("Invalid manifest entry");seen.add(e.path);if(e.type==="file"&&(!Number.isSafeInteger(e.size)||e.size<0||!/^[a-f0-9]{64}$/.test(e.sha256)))throw Error("Invalid manifest digest");}
 const actual=await inventory(dir);if(!same(m.entries,actual))throw Error("Backup content does not match manifest");
 if(!seen.has("meshcentral-data/config.json"))throw Error("Backup lacks config");await checkLocalDatabase(dir);return {dir,manifest:m};
}
export async function restore(rootArg,backupArg){
 const root=await rootPath(rootArg),{dir,manifest}=await verify(backupArg);if(inside(root,dir)||inside(dir,root))throw Error("Backup and install must be separate");await checkEngine(root);await checkLocalDatabase(root);
 return lock(root,async()=>{const id=stamp(),stage=join(root,".meshwall-restore-"+id),previous=join(root,"meshwall-recovery-"+id);await privateDir(stage);await privateDir(previous);
 const moved=[],installed=[];
 try{
  await copyEntries(dir,stage,manifest.entries);if(!same(manifest.entries,await inventory(stage)))throw Error("Restore staging verification failed");
  // Refuse symlink/special paths and collect original state before any swap.
  await inventory(root);
  for(const name of roots){const dst=join(root,name);if(await exists(dst)){await rename(dst,join(previous,name));moved.push(name);}if(await exists(join(stage,name))){await rename(join(stage,name),dst);installed.push(name);}}
  if(!same(manifest.entries,await inventory(root)))throw Error("Restored data verification failed");
  await rm(stage,{recursive:true,force:true});return previous;
 }catch(e){
  // Roll back only paths actually moved/installed. Preserve both folders if rollback fails.
  try{for(const name of installed.reverse())await rename(join(root,name),join(stage,name));for(const name of moved.reverse())await rename(join(previous,name),join(root,name));await rm(stage,{recursive:true,force:true});await rm(previous,{recursive:true,force:true});}catch{throw Error("Restore and rollback failed. Keep recovery folders: "+stage+" and "+previous);}
  throw e;
 }});
}
