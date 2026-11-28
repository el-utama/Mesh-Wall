import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,lstat,mkdir} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {freshServiceTarget,serviceInvocation,controlFreshService} from "../scripts/maintenance/service-control.mjs";
const name=process.platform==="win32"?"MeshCentral":"meshwall-engine.service";
const ip="100.64.1.2";
async function fixture(initial="running"){
 const root=await mkdtemp(join(tmpdir(),"mw-svc-")),lock=join(root,".meshwall-maintenance-lock");
 let state=initial;
 const calls=[];
 const deps={target:()=>true,files:async()=>{
  const locked=await lstat(lock).then(()=>true,()=>false);
  return {findings:[...["ROOT","PACKAGE","CONFIG","CERT","KEY","UI","APP"].map(x=>({code:"MW-DIAG-"+x,state:"present"})),{code:"MW-DIAG-LOCK",state:locked?"blocked":"clear"}]};
 },endpoint:async()=>({ip,host:"fixture.example.ts.net"}),interfaces:()=>({test:[{family:"IPv4",internal:false,address:ip}]}),inspect:async()=>({status:"verified",state}),run:async op=>{calls.push(op);state=op==="start"?"running":"stopped";},health:async()=>({status:"page-reachable"}),delay:async()=>{}};
 return {root,lock,calls,deps};
}
test("fixed roots and typed OS dispatch do not use a shell or accept arbitrary operations",()=>{
 assert.equal(freshServiceTarget("/opt/meshwall/engine","meshwall-engine.service",{platform:"linux"}),true);
 assert.equal(freshServiceTarget("/other","meshwall-engine.service",{platform:"linux"}),false);
 assert.equal(freshServiceTarget("/opt/meshwall/engine","other.service",{platform:"linux"}),false);
 assert.equal(freshServiceTarget("C:\\ProgramData\\MeshWall","MeshCentral",{platform:"win32",env:{ProgramData:"C:\\ProgramData"}}),true);
 assert.equal(freshServiceTarget("C:\\ProgramData\\Other","MeshCentral",{platform:"win32",env:{ProgramData:"C:\\ProgramData"}}),false);
 assert.deepEqual(serviceInvocation("stop","meshwall-engine.service",{platform:"linux"}).args,["--system","--no-ask-password","--no-pager","stop","--","meshwall-engine.service"]);
 assert.deepEqual(serviceInvocation("start","MeshCentral",{platform:"win32",env:{SystemRoot:"C:\\Windows"}}).args,["start","MeshCentral"]);
 assert.throws(()=>serviceInvocation("restart","meshwall-engine.service",{platform:"linux"}));
 assert.throws(()=>serviceInvocation("stop","*",{platform:"win32",env:{SystemRoot:"C:\\Windows"}}));
});
test("restart verifies stop then start, no-op start/stop remain bounded",async()=>{
 const f=await fixture();
 try{
  assert.equal((await controlFreshService(f.root,name,"restart",true,f.deps)).status,"page-reachable");
  assert.deepEqual(f.calls,["stop","start"]);
  assert.equal((await controlFreshService(f.root,name,"start",true,f.deps)).changed,false);
  assert.equal((await controlFreshService(f.root,name,"stop",true,f.deps)).status,"stopped");
  assert.equal((await controlFreshService(f.root,name,"stop",true,f.deps)).changed,false);
  assert.deepEqual(f.calls,["stop","start","stop"]);
  await assert.rejects(lstat(f.lock),/ENOENT/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test("rejects missing authorization, mismatch, lock, adoption and unsafe network before dispatch",async()=>{
 const f=await fixture();
 try{
  await assert.rejects(controlFreshService(f.root,name,"restart",false,f.deps),/INPUT/);
  await assert.rejects(controlFreshService(f.root,name,"restart",true,{...f.deps,inspect:async()=>({status:"mismatch"})}),/IDENTITY/);
  await assert.rejects(controlFreshService(f.root,name,"restart",true,{...f.deps,interfaces:()=>({})}),/NETWORK/);
  await mkdir(f.lock);await assert.rejects(controlFreshService(f.root,name,"stop",true,f.deps),/FILES/);await rm(f.lock,{recursive:true});
  await mkdir(join(f.root,".meshwall-adoption"));await assert.rejects(controlFreshService(f.root,name,"stop",true,f.deps),/ADOPTION/);
  assert.deepEqual(f.calls,[]);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test("uncertain stop prevents restart and retains lock; failed health is not success",async()=>{
 const f=await fixture();
 try{
  await assert.rejects(controlFreshService(f.root,name,"restart",true,{...f.deps,run:async op=>{f.calls.push(op);throw Error("timeout");}}),/RECOVERY/);
  assert.deepEqual(f.calls,["stop"]);assert.ok((await lstat(f.lock)).isDirectory());
  await assert.rejects(controlFreshService(f.root,name,"start",true,f.deps),/FILES/);
 }finally{await rm(f.root,{recursive:true,force:true});}
 const g=await fixture("stopped");
 try{
  const result=await controlFreshService(g.root,name,"start",true,{...g.deps,health:async()=>({status:"needs-review"})});
  assert.equal(result.state,"running");assert.equal(result.status,"needs-review");assert.deepEqual(g.calls,["start"]);
  await assert.rejects(lstat(g.lock),/ENOENT/);
 }finally{await rm(g.root,{recursive:true,force:true});}
});
