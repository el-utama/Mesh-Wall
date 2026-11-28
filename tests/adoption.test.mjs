import test from "node:test";import assert from "node:assert/strict";import {mkdtemp,mkdir,writeFile,readFile,rm,lstat,realpath,readdir} from "node:fs/promises";import {execFileSync,spawnSync} from "node:child_process";import {join,resolve} from "node:path";import {tmpdir} from "node:os";import {previewAdoption,adopt,adoptionStatus,rollbackAdoption} from "../installers/adoption.mjs";import {verify} from "../scripts/maintenance/lib.mjs";
import {requireStoppedAdoptionService} from "../installers/support/adoption-service.mjs";
async function fixture(fn){const base=await mkdtemp(join(tmpdir(),"mw-adopt-")),root=join(base,"engine"),backups=join(base,"backups"),pub=join(root,"meshcentral-web/public");try{await mkdir(join(root,"node_modules/meshcentral"),{recursive:true});await mkdir(join(root,"meshcentral-data"));await mkdir(pub,{recursive:true});await mkdir(backups);await writeFile(join(root,"node_modules/meshcentral/package.json"),'{"name":"meshcentral","version":"1.3.2"}');await writeFile(join(root,"meshcentral-data/config.json"),"{}");await writeFile(join(root,"meshcentral-data/fixture.db"),"original");await writeFile(join(pub,"unrelated.html"),"unrelated");await fn({root,backups,pub,source:resolve("apps/web/public")});}finally{await rm(base,{recursive:true,force:true});}}
test("adoption preview is read-only, verified backup and rollback preserve original data",()=>fixture(async({root,backups,pub,source})=>{assert.equal((await previewAdoption(root,source)).files.length,14);assert.equal((await adoptionStatus(root)).state,"none");const result=await adopt(root,source,backups);await verify(result.snapshot);assert.equal((await adoptionStatus(root)).activeFiles,14);assert.equal((await adoptionStatus(root)).state,"complete");assert.equal(await readFile(join(pub,"unrelated.html"),"utf8"),"unrelated");assert.equal((await rollbackAdoption(root)).removed,14);assert.equal((await adoptionStatus(root)).state,"rolled-back");assert.equal(await readFile(join(root,"meshcentral-data/fixture.db"),"utf8"),"original");await assert.rejects(lstat(join(pub,"meshwall.html")));}));
test("injected failure after exclusive placement rolls back only owned files",()=>fixture(async({root,backups,pub,source})=>{await assert.rejects(adopt(root,source,backups,{afterCopy:()=>{throw Error("fixture failure");}}),/MW-ADOPT/);assert.equal((await adoptionStatus(root)).state,"rolled-back");assert.equal((await adoptionStatus(root)).activeFiles,0);assert.equal(await readFile(join(pub,"unrelated.html"),"utf8"),"unrelated");}));
test("collision is refused; modified active content refuses rollback",()=>fixture(async({root,backups,pub,source})=>{await writeFile(join(pub,"meshwall.html"),"original UI");await assert.rejects(previewAdoption(root,source),/Existing MeshWall/);assert.equal(await readFile(join(pub,"meshwall.html"),"utf8"),"original UI");await rm(join(pub,"meshwall.html"));await adopt(root,source,backups);await writeFile(join(pub,"meshwall.html"),"changed");await assert.rejects(rollbackAdoption(root),/Unexpected or modified/);assert.equal(await readFile(join(pub,"meshwall.html"),"utf8"),"changed");}));

test("preview rejects alternate storage and public paths without exposing configuration values",()=>fixture(async({root,backups,source})=>{
 const config=join(root,"meshcentral-data/config.json");
 const value="private-fixture-value";
 await writeFile(config,JSON.stringify({Settings:{MongoDB:value}}));
 await assert.rejects(previewAdoption(root,source),error=>error.code==="ADOPTION_CONFIG"&&!error.message.includes(value));
 await assert.rejects(adopt(root,source,backups),{code:"ADOPTION_CONFIG"});
 await writeFile(config,JSON.stringify({domains:{"":{webPublicPath:value}}}));
 await assert.rejects(previewAdoption(root,source),{code:"ADOPTION_CONFIG"});
 await writeFile(config,"{malformed");
 await assert.rejects(previewAdoption(root,source),/Invalid config.json JSON/);
 assert.deepEqual(await readdir(backups),[]);
 assert.equal((await adoptionStatus(root)).state,"none");
}));

test("both preview and apply refuse a nested backup parent",()=>fixture(async({root,backups,source})=>{
 assert.equal((await previewAdoption(root,source,backups)).backupDirectory,await realpath(backups));
 await assert.rejects(previewAdoption(root,source,root),{code:"ADOPTION_BACKUP"});
 await assert.rejects(adopt(root,source,root),{code:"ADOPTION_BACKUP"});
 assert.equal((await adoptionStatus(root)).state,"none");
 assert.deepEqual(await readdir(backups),[]);
}));

test("interrupted process retains lock, backup and partial paths and refuses rollback",()=>fixture(async({root,backups,pub,source})=>{
 const child=(
  'import {adopt} from "./installers/adoption.mjs";' +
  'await adopt(...process.argv.slice(1),{afterCopy:()=>process.exit(79)});'
 );
 assert.throws(()=>execFileSync(process.execPath,["--input-type=module","-e",child,root,source,backups]),{status:79});
 const status=await adoptionStatus(root);
 assert.equal(status.state,"interrupted");
 assert.equal(status.activeFiles,1);
 assert.equal(status.maintenanceLocked,true);
 assert.equal((await readdir(backups)).length,1);
 await assert.rejects(previewAdoption(root,source),{code:"ADOPTION_LOCK"});
 await assert.rejects(rollbackAdoption(root),/Maintenance lock exists/);
 assert.equal((await adoptionStatus(root)).activeFiles,1);
 assert.equal(await readFile(join(pub,"unrelated.html"),"utf8"),"unrelated");
}));

test("a completion marker with a missing active file reports inconsistent state",()=>fixture(async({root,backups,pub,source})=>{
 await adopt(root,source,backups);
 await rm(join(pub,"meshwall.html"));
 assert.equal((await adoptionStatus(root)).state,"inconsistent");
 assert.equal((await rollbackAdoption(root)).removed,13);
 assert.equal((await adoptionStatus(root)).state,"rolled-back");
}));

test("rollback preserves a replacement file even when its content matches the staged original",()=>fixture(async({root,backups,pub,source})=>{
 await adopt(root,source,backups);
 const file=join(pub,"meshwall.html");
 const original=await readFile(file);
 await rm(file);
 await writeFile(file,original);
 await assert.rejects(rollbackAdoption(root),/File identity changed/);
 assert.deepEqual(await readFile(file),original);
 assert.ok(await lstat(join(pub,"meshwall","app.mjs")));
}));

test("guarded apply refuses a running service before taking a backup",()=>fixture(async({root,backups,pub,source})=>{
 const assertStopped=path=>requireStoppedAdoptionService(path,"fixture",async()=>({status:"verified",state:"running"}));
 await assert.rejects(adopt(root,source,backups,{assertStopped}),{code:"ADOPTION_SERVICE"});
 assert.deepEqual(await readdir(backups),[]);
 assert.deepEqual(await readdir(pub),["unrelated.html"]);
 assert.deepEqual(await adoptionStatus(root),{state:"none",maintenanceLocked:false});
}));

test("guarded apply keeps its verified backup when the service resumes before placement",()=>fixture(async({root,backups,pub,source})=>{
 let calls=0;
 const canonical=await realpath(root);
 const assertStopped=async path=>{
  assert.equal(path,canonical);
  await requireStoppedAdoptionService(path,"fixture",async()=>({status:"verified",state:++calls===1?"stopped":"running"}));
 };
 await assert.rejects(adopt(root,source,backups,{assertStopped}),/MW-ADOPT-SERVICE.*verified backup was retained/);
 assert.equal(calls,2);
 const [snapshot]=await readdir(backups);
 await verify(join(backups,snapshot));
 assert.deepEqual(await readdir(pub),["unrelated.html"]);
 assert.deepEqual(await adoptionStatus(root),{state:"none",maintenanceLocked:false});
}));

test("guarded rollback refuses a service mismatch and succeeds after a stopped service is verified",()=>fixture(async({root,backups,pub,source})=>{
 await adopt(root,source,backups);
 let observed={status:"mismatch"};
 const assertStopped=path=>requireStoppedAdoptionService(path,"fixture",async()=>observed);
 await assert.rejects(rollbackAdoption(root,{assertStopped}),/points to another installation/);
 assert.equal((await adoptionStatus(root)).activeFiles,14);
 assert.ok(await lstat(join(pub,"meshwall.html")));
 observed={status:"verified",state:"stopped"};
 assert.equal((await rollbackAdoption(root,{assertStopped})).removed,14);
 assert.equal((await adoptionStatus(root)).state,"rolled-back");
}));

test("guarded adoption preserves an interrupted placement when cleanup can no longer verify a stopped service",()=>fixture(async({root,backups,source})=>{
 let stopped=true;
 const assertStopped=path=>requireStoppedAdoptionService(path,"fixture",async()=>({status:"verified",state:stopped?"stopped":"transitioning"}));
 const afterCopy=()=>{stopped=false;throw Error("fixture interrupted placement");};
 await assert.rejects(adopt(root,source,backups,{assertStopped,afterCopy}),/MW-ADOPT-RECOVERY/);
 assert.deepEqual(await adoptionStatus(root),{state:"interrupted",activeFiles:1,totalFiles:14,maintenanceLocked:false});
 const [snapshot]=await readdir(backups);
 await verify(join(backups,snapshot));
}));

test("the local CLI rejects a missing or malformed service argument instead of falling back to manual apply",{
 skip:process.platform!=="win32"&&process.getuid?.()===0
},()=>fixture(async({root,backups})=>{
 const call=(...flags)=>spawnSync(process.execPath,["installers/adopt.mjs","apply",root,backups,"--engine-stopped",...flags],{
  encoding:"utf8",windowsHide:true
 });
 assert.match(call("--service").stderr,/Usage:/);
 const missing=call("--service",process.platform==="win32"?"meshwall-fixture-unregistered":"meshwall-fixture-unregistered.service");
 assert.equal(missing.status,1);
 assert.match(missing.stderr,/MW-ADOPT-SERVICE/);
 assert.deepEqual(await readdir(backups),[]);
 assert.equal((await adoptionStatus(root)).state,"none");
}));
