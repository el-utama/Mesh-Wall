// Offline, non-overwriting adoption of the pinned npm layout. No service control.
import {lstat,realpath,readFile,readdir,mkdir,writeFile,copyFile,link,rename,unlink,rmdir} from "node:fs/promises";
import {constants} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
import {backup,backupLocation,checkLocalDatabase,verify} from "../scripts/maintenance/lib.mjs";
const VERSION="1.3.2";
const FILES=["meshwall.html","meshwall/account-view.mjs","meshwall/accounts.mjs","meshwall/admin.mjs","meshwall/app.mjs","meshwall/control.mjs","meshwall/desktop.mjs","meshwall/management.mjs","meshwall/model.mjs","meshwall/panels.mjs","meshwall/style.css","meshwall/tile-view.mjs","meshwall/ui.mjs","meshwall/wall.mjs"];
const exists=async p=>{try{return await lstat(p);}catch(e){if(e.code==="ENOENT")return null;throw e;}};
async function regularDir(p){const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error("Unsafe directory: "+p);return p;}
async function regularFile(p){const s=await lstat(p);if(!s.isFile()||s.isSymbolicLink())throw Error("Unsafe file: "+p);return p;}
const digest=async p=>createHash("sha256").update(await readFile(await regularFile(p))).digest("hex");
function adoptionError(code,message){return Object.assign(Error(message),{code});}
async function context(arg){
 const full=resolve(arg),root=await realpath(await regularDir(full));
 if(process.platform!=="win32"&&root!==full)throw Error("Symlinked root refused");
 for(const p of ["node_modules","node_modules/meshcentral","meshcentral-data"])await regularDir(join(root,p));
 const packageFile=await regularFile(join(root,"node_modules/meshcentral/package.json"));
 if((await lstat(packageFile)).size>1024*1024)throw Error("Unexpected package manifest size");
 const pkg=JSON.parse(await readFile(packageFile,"utf8"));if(pkg?.name!=="meshcentral"||pkg.version!==VERSION)throw Error("Unsupported engine version or package; expected MeshCentral "+VERSION);
 await regularFile(join(root,"meshcentral-data/config.json"));
 const web=join(root,"meshcentral-web"),pub=join(web,"public");for(const p of [web,pub])if(await exists(p))await regularDir(p);
 return {root,web,pub,journal:join(root,".meshwall-adoption"),lock:join(root,".meshwall-maintenance-lock")};
}
async function checkAdoptionConfig(root,maxConfigBytes){
 const config=await checkLocalDatabase(root,maxConfigBytes);
 const sections=Object.entries(config).flatMap(([name,value])=>{
  switch(name.toLowerCase()){
   case "settings":
   case "domaindefaults": return [value];
   case "domains": return Object.values(value??{});
   default: return [];
  }
 });
 if(sections.some(section=>!section||typeof section!=="object"||Array.isArray(section)))throw Error("Expected configuration sections to be objects");
 if(sections.some(section=>Object.entries(section).some(([key,value])=>/^webpublicpath$/i.test(key)&&value)))throw Error("Custom web public path requires manual review");
}
async function sourceManifest(arg){const source=await realpath(await regularDir(resolve(arg)));await regularDir(join(source,"meshwall"));const names=(await readdir(join(source,"meshwall"))).map(x=>"meshwall/"+x).concat("meshwall.html").sort();if(JSON.stringify(names)!==JSON.stringify([...FILES].sort()))throw Error("Unexpected release files");return Promise.all(FILES.map(async path=>({path,sha256:await digest(join(source,path))})));}
async function noCollision(c){
 if(await exists(c.lock))throw adoptionError("ADOPTION_LOCK","Maintenance lock exists; inspect before continuing");
 if(await exists(c.journal))throw adoptionError("ADOPTION_JOURNAL","Existing adoption journal; inspect recovery first");
 for(const name of ["meshwall.html","meshwall"])if(await exists(join(c.pub,name)))throw adoptionError("ADOPTION_COLLISION","Existing MeshWall path; use update-ui or recovery");
}
export async function previewAdoption(root,source,backupParent,{maxConfigBytes}={}){
 const c=await context(root);
 await noCollision(c);
 try{await checkAdoptionConfig(c.root,maxConfigBytes);}
 catch(error){throw adoptionError("ADOPTION_CONFIG",error instanceof SyntaxError?"Invalid config.json JSON":error.message);}
 const files=await sourceManifest(source);
 let backupDirectory=null;
 if(backupParent!==undefined){
  try{backupDirectory=(await backupLocation(c.root,backupParent)).parent;}
  catch(error){throw adoptionError("ADOPTION_BACKUP",error.message);}
 }
 return {root:c.root,version:VERSION,files:files.map(x=>x.path),backupDirectory,changes:"Add MeshWall static files only; no configuration, account or agent changes",requires:"Stopped engine, verified separate backup and authorized service account"};
}
async function manifest(c){await regularDir(c.journal);const m=JSON.parse(await readFile(await regularFile(join(c.journal,"manifest.json")),"utf8"));if(m.format!==1||m.version!==VERSION||!Array.isArray(m.files)||JSON.stringify(m.files.map(x=>x.path))!==JSON.stringify(FILES)||m.files.some(x=>!/^[a-f0-9]{64}$/.test(x.sha256)))throw Error("Invalid adoption manifest");return m;}
async function matches(p,sha){const s=await exists(p);return !s?false:s.isFile()&&!s.isSymbolicLink()&&await digest(p)===sha;}
async function inspect(c,m){
 const stage=join(c.journal,"stage");await regularDir(stage);await regularDir(join(stage,"meshwall"));
 const folder=join(c.pub,"meshwall");if(await exists(folder))await regularDir(folder);
 const entries=[];for(const {path,sha256} of m.files){const p=join(c.pub,path),s=join(stage,path);const a=await exists(p);if(a&&!await matches(p,sha256))throw Error("Unexpected or modified active file; preserve state: "+path);if(!await matches(s,sha256))throw Error("Staging verification failed: "+path);entries.push({path,active:!!a});}
 if(await exists(folder)){const allowed=new Set(FILES.filter(x=>x.startsWith("meshwall/")).map(x=>x.slice(9)));if((await readdir(folder)).some(n=>!allowed.has(n)))throw Error("Unexpected active UI files; preserve state");}
 return entries;
}
async function writeMarker(c,name){await writeFile(join(c.journal,name),"1\n",{flag:"wx",mode:0o600});}
export async function adopt(root,source,backupParent,{afterCopy=()=>{}}={}){
 const c=await context(root);await previewAdoption(root,source,backupParent);const files=await sourceManifest(source);
 // backup() uses the same lock, so snapshot before taking adoption lock. Engine must remain stopped.
 const snapshot=await backup(c.root,backupParent);await verify(snapshot);await noCollision(c);
 await mkdir(c.lock,{mode:0o700});let prepared=false,ownsFolder=false;
 try{
  await mkdir(c.journal,{mode:0o700});const stage=join(c.journal,"stage");await mkdir(stage,{mode:0o700});await mkdir(join(stage,"meshwall"),{mode:0o700});
  for(const {path,sha256} of files){const p=join(stage,path);await copyFile(join(source,path),p,constants.COPYFILE_EXCL);if(await digest(p)!==sha256)throw Error("Stage changed");}
  await writeFile(join(c.journal,"manifest.json"),JSON.stringify({format:1,version:VERSION,files,snapshot},null,2),{flag:"wx",mode:0o600});prepared=true;
  for(const n of ["meshwall.html","meshwall"])if(await exists(join(c.pub,n)))throw Error("Unexpected active UI collision");
  await mkdir(c.pub,{recursive:true});await regularDir(c.web);await regularDir(c.pub);
  await mkdir(join(c.pub,"meshwall"));ownsFolder=true;
  // Hard-link an already verified staged file: atomic, exclusive, same volume. Retain staging for recovery.
  for(const {path} of files){await link(join(stage,path),join(c.pub,path));await afterCopy(path);}
  if((await inspect(c,{files})).some(x=>!x.active))throw Error("Adoption verification failed");
  await writeMarker(c,"complete");return {snapshot,journal:c.journal,files:files.length};
 }catch(e){
  // Only remove files if they are the exact staged hard links created by this transaction.
  // A pre-stage failure cannot have modified active UI.
  if(prepared&&ownsFolder){
   try{const m=await manifest(c);await removeOwnedLinks(c,m,{ownsFolder:true});await writeMarker(c,"rolled-back");}
   catch{throw Error("MW-ADOPT-RECOVERY: automatic cleanup refused; inspect journal and backup. "+c.journal);}
  }
  throw Error("MW-ADOPT: adoption failed; backup retained; inspect journal before retry. "+e.message);
 }finally{await rmdir(c.lock);}
}
async function removeOwnedLinks(c,m,{ownsFolder=false}={}){
 const active=(await inspect(c,m)).filter(entry=>entry.active);
 // Matching content alone is not proof of ownership. Verify inode/device against staged hard link.
 for(const {path} of active){
  const actual=await lstat(join(c.pub,path),{bigint:true}),staged=await lstat(join(c.journal,"stage",path),{bigint:true});
  if(actual.ino!==staged.ino||actual.dev!==staged.dev||actual.nlink<2n)throw Error("File identity changed; manual review required");
 }
 for(const {path} of active.toReversed())await unlink(join(c.pub,path));
 const folder=join(c.pub,"meshwall");
 // An empty folder on disk might belong to a different operation. Remove it only with evidence of ownership.
 if((ownsFolder||active.some(({path})=>path.startsWith("meshwall/")))&&await exists(folder))await rmdir(folder);
 return active.length;
}
export async function adoptionStatus(root){
 const c=await context(root),maintenanceLocked=!!await exists(c.lock);if(!await exists(c.journal))return {state:"none",maintenanceLocked};
 const m=await manifest(c),entries=await inspect(c,m);
 const activeFiles=entries.filter(x=>x.active).length,totalFiles=m.files.length;
 const rolledBack=await exists(join(c.journal,"rolled-back")),applied=await exists(join(c.journal,"complete"));
 const state=(rolledBack&&activeFiles!==0)||(applied&&!rolledBack&&activeFiles!==totalFiles)?"inconsistent":rolledBack?"rolled-back":applied?"complete":"interrupted";
 return {state,activeFiles,totalFiles,maintenanceLocked};
}
export async function rollbackAdoption(root){
 const c=await context(root);if(await exists(c.lock))throw Error("Maintenance lock exists: verify no other operation, inspect journal locally; do not clear blindly");
 await mkdir(c.lock,{mode:0o700});
 try{const m=await manifest(c);if(await exists(join(c.journal,"rolled-back")))return {removed:0};const removed=await removeOwnedLinks(c,m);await writeMarker(c,"rolled-back");return {removed};}finally{await rmdir(c.lock);}
}
