// Offline, non-overwriting adoption of the pinned npm layout. No service control.
import {lstat,realpath,readFile,readdir,mkdir,writeFile,copyFile,link,rename,unlink,rmdir} from "node:fs/promises";
import {constants} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
import {backup,verify} from "../scripts/maintenance/lib.mjs";
const VERSION="1.3.2";
const FILES=["meshwall.html","meshwall/account-view.mjs","meshwall/accounts.mjs","meshwall/admin.mjs","meshwall/app.mjs","meshwall/control.mjs","meshwall/desktop.mjs","meshwall/management.mjs","meshwall/model.mjs","meshwall/panels.mjs","meshwall/style.css","meshwall/tile-view.mjs","meshwall/ui.mjs","meshwall/wall.mjs"];
const exists=async p=>{try{return await lstat(p);}catch(e){if(e.code==="ENOENT")return null;throw e;}};
async function regularDir(p){const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error("Unsafe directory: "+p);return p;}
async function regularFile(p){const s=await lstat(p);if(!s.isFile()||s.isSymbolicLink())throw Error("Unsafe file: "+p);return p;}
const digest=async p=>createHash("sha256").update(await readFile(await regularFile(p))).digest("hex");
async function context(arg){
 const root=await realpath(await regularDir(resolve(arg)));
 for(const p of ["node_modules","node_modules/meshcentral","meshcentral-data"])await regularDir(join(root,p));
 const pkg=JSON.parse(await readFile(await regularFile(join(root,"node_modules/meshcentral/package.json")),"utf8"));if(pkg.version!==VERSION)throw Error("Unsupported engine version; expected "+VERSION);
 await regularFile(join(root,"meshcentral-data/config.json"));
 const web=join(root,"meshcentral-web"),pub=join(web,"public");for(const p of [web,pub])if(await exists(p))await regularDir(p);
 return {root,web,pub,journal:join(root,".meshwall-adoption"),lock:join(root,".meshwall-maintenance-lock")};
}
async function sourceManifest(arg){const source=await realpath(await regularDir(resolve(arg)));await regularDir(join(source,"meshwall"));const names=(await readdir(join(source,"meshwall"))).map(x=>"meshwall/"+x).concat("meshwall.html").sort();if(JSON.stringify(names)!==JSON.stringify([...FILES].sort()))throw Error("Unexpected release files");return Promise.all(FILES.map(async path=>({path,sha256:await digest(join(source,path))})));}
async function noCollision(c){for(const n of ["meshwall.html","meshwall"])if(await exists(join(c.pub,n)))throw Error("Existing MeshWall path; use update-ui or recovery");if(await exists(c.journal))throw Error("Existing adoption journal; inspect recovery first");if(await exists(c.lock))throw Error("Maintenance lock exists; inspect before continuing");}
export async function previewAdoption(root,source){const c=await context(root),files=await sourceManifest(source);await noCollision(c);return {root:c.root,version:VERSION,files:files.map(x=>x.path),changes:"Add MeshWall static files only; no configuration, account or agent changes",requires:"Stopped engine, verified separate backup and authorized service account"};}
async function manifest(c){await regularDir(c.journal);const m=JSON.parse(await readFile(await regularFile(join(c.journal,"manifest.json")),"utf8"));if(m.format!==1||m.version!==VERSION||!Array.isArray(m.files)||JSON.stringify(m.files.map(x=>x.path))!==JSON.stringify(FILES)||m.files.some(x=>!/^[a-f0-9]{64}$/.test(x.sha256)))throw Error("Invalid adoption manifest");return m;}
async function matches(p,sha){const s=await exists(p);return !s?false:s.isFile()&&!s.isSymbolicLink()&&await digest(p)===sha;}
async function inspect(c,m){
 const stage=join(c.journal,"stage");await regularDir(stage);await regularDir(join(stage,"meshwall"));
 const folder=join(c.pub,"meshwall");if(await exists(folder))await regularDir(folder);
 const entries=[];for(const {path,sha256} of m.files){const p=join(c.pub,path),s=join(stage,path);const a=await exists(p);if(a&&!await matches(p,sha256))throw Error("Unexpected or modified active file; preserve state: "+path);if(!await matches(s,sha256))throw Error("Staging verification failed: "+path);entries.push({path,active:!!a});}
 if(await exists(folder)){const allowed=new Set(FILES.filter(x=>x.startsWith("meshwall/")).map(x=>x.slice(9)));if((await readdir(folder)).some(n=>!allowed.has(n)))throw Error("Unexpected active UI files; preserve state");}
 return entries;
}
async function removeOwned(c,m){const entries=await inspect(c,m);for(const e of entries.filter(x=>x.active).reverse())await unlink(join(c.pub,e.path));if(await exists(join(c.pub,"meshwall")))await rmdir(join(c.pub,"meshwall"));return entries.filter(x=>x.active).length;}
async function writeMarker(c,name){await writeFile(join(c.journal,name),"1\n",{flag:"wx",mode:0o600});}
export async function adopt(root,source,backupParent,{afterCopy=()=>{}}={}){
 const c=await context(root);await previewAdoption(root,source);const files=await sourceManifest(source);
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
   try{const m=await manifest(c);await removeOwnedLinks(c,m);await writeMarker(c,"rolled-back");}
   catch{throw Error("MW-ADOPT-RECOVERY: automatic cleanup refused; inspect journal and backup. "+c.journal);}
  }
  throw Error("MW-ADOPT: adoption failed; backup retained; inspect journal before retry. "+e.message);
 }finally{await rmdir(c.lock);}
}
async function removeOwnedLinks(c,m){
 const entries=await inspect(c,m);
 // Matching content alone is not proof of ownership. Verify inode/device against staged hard link.
 for(const e of entries.filter(x=>x.active)){const a=await lstat(join(c.pub,e.path)),b=await lstat(join(c.journal,"stage",e.path));if(a.ino!==b.ino||a.dev!==b.dev||a.nlink<2)throw Error("File identity changed; manual review required");}
 return removeOwned(c,m);
}
export async function adoptionStatus(root){
 const c=await context(root);if(!await exists(c.journal))return {state:"none"};
 const m=await manifest(c),entries=await inspect(c,m);
 return {state:await exists(join(c.journal,"rolled-back"))?"rolled-back":await exists(join(c.journal,"complete"))?"complete":"interrupted",activeFiles:entries.filter(x=>x.active).length,totalFiles:m.files.length,maintenanceLocked:!!await exists(c.lock)};
}
export async function rollbackAdoption(root){
 const c=await context(root);if(await exists(c.lock))throw Error("Maintenance lock exists: verify no other operation, inspect journal locally; do not clear blindly");
 await mkdir(c.lock,{mode:0o700});
 try{const m=await manifest(c);if(await exists(join(c.journal,"rolled-back")))return {removed:0};const removed=await removeOwnedLinks(c,m);await writeMarker(c,"rolled-back");return {removed};}finally{await rmdir(c.lock);}
}
