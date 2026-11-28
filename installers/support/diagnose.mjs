// Bounded read-only evidence for the default fresh-install layout, including partial installs.
import {lstat,open} from "node:fs/promises";
import {constants} from "node:fs";
import {isAbsolute,parse,join,sep,normalize} from "node:path";
import {guidance} from "./catalog.mjs";

const limit=1024*1024;
function rootPath(input){
 if(typeof input!=="string"||input.length>1024||/[\u0000-\u001f\u007f]/u.test(input)||!isAbsolute(input))return null;
 if(process.platform==="win32"){
  if(!/^[a-z]:[\\/]/i.test(input)||/[<>:"|?*]/.test(input.slice(2))||input.slice(3).split(/[\\/]/).some(p=>/[. ]$/.test(p)||/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(p)))return null;
 }else if(input.split("/").some(p=>p==="."||p===".."))return null;
 const value=normalize(input);
 return value===parse(value).root?null:value;
}
function failure(error){
 return error?.code==="ENOENT"?"missing":error?.code==="ENOTDIR"||error?.code==="ELOOP"?"unsafe":"unavailable";
}
async function entry(path,kind){
 try{
  const info=await lstat(path);
  if(info.isSymbolicLink()||(kind==="directory"?!info.isDirectory():!info.isFile()))return {state:"unsafe"};
  if(kind==="file"&&info.size===0)return {state:"empty"};
  return {state:"present",info,path};
 }catch(error){return {state:failure(error)};}
}
async function walk(root,parts,kind){
 let path=root;
 for(let i=0;i<parts.length;i++){
  path=join(path,parts[i]);
  const result=await entry(path,i===parts.length-1?kind:"directory");
  if(result.state!=="present"||i===parts.length-1)return result;
 }
 return entry(path,kind);
}
async function rootEntry(path){
 const {root}=parse(path);
 const drive=await entry(root,"directory");
 if(drive.state!=="present")return drive;
 return walk(root,path.slice(root.length).split(sep).filter(Boolean),"directory");
}
async function json(result,validate){
 if(result.state!=="present")return result.state;
 if(result.info.size>limit)return "oversized";
 let handle;
 try{
  const flags=constants.O_RDONLY|(process.platform==="win32"?0:(constants.O_NOFOLLOW??0)|(constants.O_NONBLOCK??0));
  handle=await open(result.path,flags);
  const info=await handle.stat();
  if(!info.isFile())return "unsafe";
  if(info.size>limit)return "oversized";
  const buffer=Buffer.alloc(limit+1);let offset=0;
  while(offset<buffer.length){
   const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,null);
   if(!bytesRead)break;
   offset+=bytesRead;
  }
  if(offset>limit)return "oversized";
  let value;
  try{value=JSON.parse(buffer.subarray(0,offset).toString("utf8").replace(/^\uFEFF/,""));}
  catch{return "invalid-json";}
  return validate(value);
 }catch(error){return failure(error);}
 finally{await handle?.close();}
}
const object=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const packageState=value=>!object(value)||value.name!=="meshcentral"?"invalid-package":value.version!=="1.3.2"?"unsupported-version":"present";
const configState=value=>object(value)?"present":"invalid-config";
const next={
 missing:"Check the selected root and the interrupted installation stage. Preserve existing files.",
 unsafe:"Unexpected file type, symlink or junction. Stop and inspect the path locally.",
 unavailable:"Check local read permissions and the actual path; do not change ownership blindly.",
 empty:"Expected a nonempty file. Preserve the partial file and inspect the failed stage.",
 oversized:"JSON exceeds the diagnostic size limit. Review it locally without sharing its contents.",
 "invalid-json":"JSON could not be parsed. Preserve the original and review it locally.",
 "invalid-package":"Expected a MeshCentral package manifest. Check the installation root and package step.",
 "unsupported-version":"Expected MeshCentral 1.3.2. Do not force an upgrade or overwrite.",
 "invalid-config":"Expected a JSON configuration object. Review the original locally.",
 blocked:"A maintenance lock exists. Verify the operation and preserve the lock; never clear it blindly.",
 "invalid-root":"Enter an absolute local installation directory, not a drive root or a network path.",
 present:"Expected item found. This is not proof of successful installation.",
 clear:"No lock observed at the time of this check. This does not establish a stopped service."
};
function finding(code,stage,state){return {code,stage,state,next:next[state],help:guidance(stage)};}
export async function diagnoseFresh(input){
 const path=rootPath(input),findings=[];
 const root=path?await rootEntry(path):{state:"invalid-root"};
 findings.push(finding("MW-DIAG-ROOT","recovery",root.state));
 if(root.state==="present"){
  const specs=[
   ["MW-DIAG-PACKAGE","package",["node_modules","meshcentral","package.json"],packageState],
   ["MW-DIAG-CONFIG","configuration",["meshcentral-data","config.json"],configState],
   ["MW-DIAG-CERT","certificate",["meshcentral-data","webserver-cert-public.crt"]],
   ["MW-DIAG-KEY","certificate",["meshcentral-data","webserver-cert-private.key"]],
   ["MW-DIAG-UI","configuration",["meshcentral-web","public","meshwall.html"]],
   ["MW-DIAG-APP","configuration",["meshcentral-web","public","meshwall","app.mjs"]]
  ];
  for(const [code,stage,parts,validate] of specs){
   const result=await walk(path,parts,"file");
   findings.push(finding(code,stage,validate?await json(result,validate):result.state));
  }
  const lock=await walk(path,[".meshwall-maintenance-lock"],"directory");
  findings.push(finding("MW-DIAG-LOCK","maintenance",lock.state==="missing"?"clear":lock.state==="present"?"blocked":lock.state));
 }
 const status=findings.every(item=>["present","clear"].includes(item.state))?"files-present":"needs-review";
 return {format:1,mode:"read-only",scope:"default-fresh-install-files",status,findings,note:"No files were changed. Certificate/key presence is not TLS validation; JSON syntax is not schema validation. Service identity, live process, HTTPS, login, permissions, backups and agent enrollment must be verified separately. Do not resume or remove files based only on this report."};
}


// Internal diagnostic input; never serialize this endpoint into a support report.
export async function readFreshEndpoint(input){
 const path=rootPath(input);
 if(!path||(await rootEntry(path)).state!=="present")return null;
 const config=await walk(path,["meshcentral-data","config.json"],"file");
 const endpoint=await json(config,value=>{
  const settings=value?.settings;
  if(!object(settings))return null;
  const host=settings.cert,ip=settings.portBind;
  if(typeof host!=="string"||host.length>253||!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(host)||settings.port!==8443||
    typeof ip!=="string"||!/^100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(ip)||ip.split(".").some(x=>String(Number(x))!==x||Number(x)>255))return null;
  return {host,ip};
 });
 return object(endpoint)?endpoint:null;
}
