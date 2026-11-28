import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,cp,rm,readdir,rename,lstat} from "node:fs/promises";
import {join,resolve} from "node:path";
import {tmpdir} from "node:os";
import {repairUI} from "../scripts/maintenance/repair-ui.mjs";
import {verify} from "../scripts/maintenance/lib.mjs";

const name=process.platform==="win32"?"MeshCentral":"meshwall-engine.service";
async function fixture(){
 const base=await mkdtemp(join(tmpdir(),"mw-repair-")),root=join(base,"engine"),parent=join(base,"backups"),source=resolve("apps/web/public"),dest=join(root,"meshcentral-web","public");
 await mkdir(parent);await mkdir(join(root,"node_modules","meshcentral"),{recursive:true});await mkdir(join(root,"meshcentral-data"));await mkdir(dest,{recursive:true});
 await writeFile(join(root,"node_modules","meshcentral","package.json"),'{"name":"meshcentral","version":"1.3.2"}');
 const config='{"settings":{"cert":"fixture.example.ts.net","portBind":"100.64.1.2","port":8443,"sessionKey":"fixture-secret"}}';
 await writeFile(join(root,"meshcentral-data","config.json"),config);
 for(const f of ["webserver-cert-public.crt","webserver-cert-private.key"])await writeFile(join(root,"meshcentral-data",f),"fixture");
 await cp(source,dest,{recursive:true});await rm(join(dest,"meshwall","app.mjs"));await writeFile(join(dest,"other.html"),"unrelated");
 return {base,root,parent,source,dest,config};
}
test("repair restores missing reviewed UI and keeps verified backup, partial previous state and unrelated data",async()=>{
 const f=await fixture();let checks=0;
 try{
  const r=await repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{checks++;}});
  assert.equal(checks,2);await verify(r.backup);
  assert.deepEqual(await readFile(join(f.dest,"meshwall","app.mjs")),await readFile(join(f.source,"meshwall","app.mjs")));
  assert.equal(await readFile(join(f.root,"meshcentral-data","config.json"),"utf8"),f.config);
  assert.equal(await readFile(join(f.dest,"other.html"),"utf8"),"unrelated");
  await assert.rejects(readFile(join(r.previous,"meshwall","app.mjs")),/ENOENT/);
  await assert.rejects(readFile(join(r.backup,"meshcentral-web","public","meshwall","app.mjs")),/ENOENT/);
 }finally{await rm(f.base,{recursive:true,force:true});}
});
test("repair refuses changed service after backup, different UI and adoption state",async()=>{
 const f=await fixture();
 try{
  let checks=0;
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{if(++checks===2)throw Error("service resumed");}}),/service resumed/);
  assert.equal((await readdir(f.parent)).length,1);
  await assert.rejects(readFile(join(f.dest,"meshwall","app.mjs")),/ENOENT/);
  await writeFile(join(f.dest,"meshwall.html"),"different release");
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{}}),/differs/);
  assert.equal(await readFile(join(f.dest,"meshwall.html"),"utf8"),"different release");
  await mkdir(join(f.root,".meshwall-adoption"));
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{}}),/adoption journal/i);
 }finally{await rm(f.base,{recursive:true,force:true});}
});
test("initial service failure or unverified backup prevents repair",async()=>{
 const f=await fixture();
 try{
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{throw Error("wrong service");},snapshot:async()=>assert.fail("must not back up")}),/wrong service/);
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{},verifySnapshot:async()=>{throw Error("backup invalid");},replace:async()=>assert.fail("must not replace")}),/backup invalid/);
  await assert.rejects(readFile(join(f.dest,"meshwall","app.mjs")),/ENOENT/);
 }finally{await rm(f.base,{recursive:true,force:true});}
});

test("repair refuses stale backup evidence under lock, preserving both active data and snapshot",async()=>{
 const f=await fixture();let calls=0;
 try{
  const configPath=join(f.root,"meshcentral-data","config.json");
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{if(++calls===2)await writeFile(configPath,f.config+"\n");}}),/MW-REPAIR-STALE/);
  assert.equal(await readFile(configPath,"utf8"),f.config+"\n");
  await assert.rejects(readFile(join(f.dest,"meshwall","app.mjs")),/ENOENT/);
  const names=await readdir(f.parent);assert.equal(names.length,1);
  await verify(join(f.parent,names[0]));
  await assert.rejects(lstat(join(f.root,".meshwall-maintenance-lock")),/ENOENT/);
 }finally{await rm(f.base,{recursive:true,force:true});}
});
test("failed UI rollback retains maintenance lock and recovery paths",async()=>{
 const f=await fixture();let moves=0;
 try{
  const {replaceUI}=await import("../scripts/maintenance/ui-release.mjs");
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{},replace:(root,source,options)=>replaceUI(root,source,{...options,move:async(a,b)=>{
   if(++moves>=2)throw Error("injected rename failure");return rename(a,b);
  }})}),/MW-UI-RECOVERY/);
  assert.equal((await lstat(join(f.root,".meshwall-maintenance-lock"))).isDirectory(),true);
  const names=await readdir(f.root);
  assert.ok(names.some(n=>n.startsWith(".meshwall-ui-stage-")));
  assert.ok(names.some(n=>n.startsWith("meshwall-ui-recovery-")));
  await assert.rejects(repairUI(f.root,f.source,f.parent,name,{assertStopped:async()=>{}}),/lock findings/);
  assert.equal((await readdir(f.parent)).length,1);
 }finally{await rm(f.base,{recursive:true,force:true});}
});
