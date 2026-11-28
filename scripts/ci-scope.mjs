// Conservative CI scope. Missing/ambiguous Git evidence always selects the full suite.
import {execFileSync} from "node:child_process";
import {readFileSync,appendFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const full=reason=>({integration:true,visual:true,windows:true,reason});
const docs=new Set(["README.md","README.id.md","CHANGELOG.md","PROJECT_MEMORY.md","AGENTS.md","ARCHITECTURE.md","ROADMAP.md","SECURITY.md"]);
const cliOnly=new Set(["scripts/service.mjs","scripts/maintenance/service-control.mjs","tests/service-control.test.mjs"]);
const doc=path=>docs.has(path)||/^(?:docs\/|\.agents\/skills\/)[A-Za-z0-9_./-]+\.md$/.test(path);
export function classifyPaths(paths){
 if(!Array.isArray(paths)||!paths.length||paths.some(p=>typeof p!=="string"||!p||p.includes("\ufffd")||p.includes("\\")||p.split("/").some(x=>x===".."||x==="."||!x)))return full("unknown-paths");
 if(paths.every(doc))return {integration:false,visual:false,windows:false,reason:"documentation-only"};
 if(paths.every(p=>doc(p)||cliOnly.has(p)))return {integration:true,visual:false,windows:true,reason:"isolated-service-cli"};
 return full("runtime-or-unknown-change");
}
const sha=value=>typeof value==="string"&&/^[a-f0-9]{40}$/i.test(value)&&!/^0+$/.test(value);
function git(args){return execFileSync("git",args,{encoding:"utf8",maxBuffer:8*1024*1024,timeout:15000,stdio:["ignore","pipe","pipe"]});}
export function selectScope({eventName,event,head,ref},run=git){
 if(eventName==="workflow_dispatch"||String(ref).startsWith("refs/tags/"))return full("explicit-full-regression");
 if(!["pull_request","push"].includes(eventName))return full("unknown-event");
 const base=eventName==="pull_request"?event?.pull_request?.base?.sha:event?.before;
 if(!sha(base)||!sha(head))return full("missing-commit-evidence");
 try{
  // The checked-out PR merge commit must actually include the selected base.
  if(run(["rev-parse","HEAD"]).trim()!==head)return full("checkout-mismatch");
  run(["merge-base","--is-ancestor",base,head]);
  const diff=run(["diff","--no-renames","--name-only","-z",base,head,"--"]);
  if(typeof diff!=="string"||!diff.endsWith("\0"))return full("empty-or-invalid-diff");
  return classifyPaths(diff.slice(0,-1).split("\0"));
 }catch{return full("git-evidence-unavailable");}
}
function main(){
 let scope=full("event-unavailable");
 try{scope=selectScope({eventName:process.env.GITHUB_EVENT_NAME,event:JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,"utf8")),head:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF});}catch{}
 console.log("CI scope: "+scope.reason+" (integration="+scope.integration+", visual="+scope.visual+", windows="+scope.windows+")");
 if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,Object.entries(scope).map(([key,value])=>key+"="+value+"\n").join(""));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
