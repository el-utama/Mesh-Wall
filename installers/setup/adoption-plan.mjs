import {execFile} from "node:child_process";
import {lstat} from "node:fs/promises";
import {join,parse,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import {previewAdoption} from "../adoption.mjs";
import {inspectRoot} from "../support/discovery.mjs";
import {validAdoptionPath} from "./model.mjs";

const exec = promisify(execFile);
const source = fileURLToPath(new URL("../../apps/web/public/",import.meta.url));
const blocked = {
 ADOPTION_LOCK: "MW-ADOPT-LOCK · Maintenance lock exists. Inspect the local operation and journal before any retry.",
 ADOPTION_JOURNAL: "MW-ADOPT-JOURNAL · An adoption journal already exists. Inspect it with the local status command.",
 ADOPTION_COLLISION: "MW-ADOPT-COLLISION · MeshWall files already exist. Review UI update or recovery in docs/OPERATIONS.md.",
 ADOPTION_CONFIG: "MW-ADOPT-CONFIG · The configuration could not be validated for default local storage and UI paths. Review config.json and service overrides locally.",
 ADOPTION_BACKUP: "MW-ADOPT-BACKUP · Choose an existing private backup directory outside the installation and its parent chain."
};

async function checkFixedDrive(drive) {
 const system = process.env.SystemRoot;
 if(!system)throw Error("SystemRoot unavailable");
 const powershell = join(system,"System32","WindowsPowerShell","v1.0","powershell.exe");
 const script = "[IO.DriveInfo]::GetDrives() | Where-Object DriveType -eq Fixed | ForEach-Object { $_.Name }";
 const {stdout} = await exec(powershell,["-NoProfile","-NonInteractive","-Command",script],{timeout:4000,maxBuffer:8192,windowsHide:true});
 if(!stdout.split(/\r?\n/).some(row=>row.trim().toUpperCase()===drive.toUpperCase()))throw Error("Fixed local drive required");
}

async function checkDirectory(input) {
 const path = validAdoptionPath(input);
 if(!path)throw Error("Absolute local path required");
 let {root} = parse(path);
 if(process.platform==="win32")await checkFixedDrive(root);
 for(const name of path.slice(root.length).split(sep).filter(Boolean)){
  root=join(root,name);
  const entry=await lstat(root);
  if(!entry.isDirectory()||entry.isSymbolicLink())throw Error("Regular directory required");
 }
 return path;
}

export async function planAdoption({root,backupParent},onCandidate) {
 try{root=await checkDirectory(root);}
 catch{return {error:"MW-ADOPT-ROOT · Enter an existing absolute local installation directory without symbolic links or junctions."};}
 const candidate=await inspectRoot(root);
 if(!candidate)return {error:"MW-ADOPT-ROOT · No MeshCentral npm package found at this path. Enter the directory that contains node_modules and meshcentral-data."};
 onCandidate();
 if(!candidate.compatible)return {error:"MW-ADOPT-LAYOUT · This installation needs review. The wizard supports MeshCentral 1.3.2 with the default npm layout and local config.json."};
 if(backupParent!==undefined){
  try{backupParent=await checkDirectory(backupParent);}
  catch{return {error:blocked.ADOPTION_BACKUP};}
 }
 try{
  const {root:canonicalRoot,version,files,backupDirectory}=await previewAdoption(root,source,backupParent,{maxConfigBytes:1024*1024});
  return {preview:{root:canonicalRoot,version,files,backupDirectory}};
 }catch(error){
  return {error:blocked[error.code]??"MW-ADOPT-REVIEW · Preview could not validate the layout or release files. Run local preview for details and preserve the installation."};
 }
}
