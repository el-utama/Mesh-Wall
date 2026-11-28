// Minimal local install history; no passwords, URL, roots, logs or raw exceptions.
import {mkdirSync,lstatSync,writeFileSync,renameSync,readFileSync,readdirSync,unlinkSync} from "node:fs";
import {join,resolve} from "node:path";
import {homedir} from "node:os";
import {randomBytes} from "node:crypto";
import {stages,guidance} from "./catalog.mjs";
const statuses=new Set(["running","failed","complete"]);
const maxEvents=32;
function event(stage,status,at){return {stage,status,at};}
function safeEvents(value){
 if(value.events===undefined)return [event(value.stage,value.status,new Date(value.updated).toISOString())];
 if(!Array.isArray(value.events)||!value.events.length||value.events.length>maxEvents)return null;
 const entries=[];
 for(const item of value.events){
  if(!item||!Object.hasOwn(stages,item.stage)||!statuses.has(item.status)||typeof item.at!=="string"||!Number.isFinite(Date.parse(item.at)))return null;
  entries.push(event(item.stage,item.status,new Date(item.at).toISOString()));
 }
 const last=entries.at(-1);
 return last.stage===value.stage&&last.status===value.status&&last.at===new Date(value.updated).toISOString()?entries:null;
}
function recoveryNote(status){
 return status==="running"?"Last recorded running; the process may have stopped. Verify the process and host state before retrying.":status==="failed"?"Preserve partial files. Inspect the last stage and actual host state before any retry or recovery.":"HTTPS readiness was recorded. Verify login and an authorized device separately.";
}
export const journalDirectory=()=>join(homedir(),".meshwall-support");
function directory(dir,create=false){
 const p=resolve(dir);if(create)mkdirSync(p,{recursive:false,mode:0o700});
 const s=lstatSync(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error("Unsafe support journal directory");
 if(process.platform!=="win32"&&(s.uid!==process.getuid()||(s.mode&0o077)!==0))throw Error("Support journal directory must be private and owned by this operator");
 return p;
}
export function createJournal(dir=journalDirectory()){
 let base;try{base=directory(dir,true);}catch(e){if(e.code!=="EEXIST")throw e;base=directory(dir);}
 const id=randomBytes(16).toString("hex"),file=join(base,"install-"+id+".json"),created=new Date().toISOString();let current;
 function record(stage,status){
  if(!Object.hasOwn(stages,stage)||!statuses.has(status))throw Error("Invalid journal state");
  const updated=new Date().toISOString();
  const events=[...(current?.events??[]),event(stage,status,updated)].slice(-maxEvents);
  const value={format:1,id,created,updated,stage,status,events};
  const tmp=file+"."+randomBytes(6).toString("hex")+".tmp";
  try{writeFileSync(tmp,JSON.stringify(value)+"\n",{flag:"wx",mode:0o600});renameSync(tmp,file);current=value;}
  catch(e){try{unlinkSync(tmp);}catch{}throw e;}
  return value;
 }
 record("preflight","running");
 return {record,get current(){return current;}};
}
export function readJournals(dir=journalDirectory()){
 let base;try{base=directory(dir);}catch(e){if(e.code==="ENOENT")return [];throw e;}
 const entries=[];for(const name of readdirSync(base).filter(x=>/^install-[a-f0-9]{32}\.json$/.test(x)).slice(0,512)){
  try{const p=join(base,name),s=lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>4096)continue;
   const x=JSON.parse(readFileSync(p,"utf8"));if(x.format!==1||name!=="install-"+x.id+".json"||!Object.hasOwn(stages,x.stage)||!statuses.has(x.status)||!Number.isFinite(Date.parse(x.updated))||!Number.isFinite(Date.parse(x.created)))continue;
   const events=safeEvents(x);if(!events)continue;
   entries.push({id:x.id,stage:x.stage,status:x.status,created:new Date(x.created).toISOString(),updated:new Date(x.updated).toISOString(),events,help:guidance(x.stage),recoveryNote:recoveryNote(x.status)});
  }catch{}
 }
 return entries.sort((a,b)=>b.updated.localeCompare(a.updated)).slice(0,20);
}
