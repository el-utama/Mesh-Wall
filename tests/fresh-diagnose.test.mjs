import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {diagnoseFresh} from "../installers/support/diagnose.mjs";
const state=(report,code)=>report.findings.find(item=>item.code==="MW-DIAG-"+code)?.state;
async function fixture(root,relative,content){
 const parts=relative.split("/"),file=join(root,...parts);
 await mkdir(join(root,...parts.slice(0,-1)),{recursive:true});
 await writeFile(file,content);
 return file;
}
test("fresh diagnosis distinguishes missing root and partially installed files without mutation",async()=>{
 const base=await mkdtemp(join(tmpdir(),"mw-diagnose-"));
 try{
  assert.equal(state(await diagnoseFresh("relative"),"ROOT"),"invalid-root");
  assert.equal(state(await diagnoseFresh(join(base,"absent")),"ROOT"),"missing");
  const report=await diagnoseFresh(base);
  assert.equal(report.status,"needs-review");
  for(const code of ["PACKAGE","CONFIG","CERT","KEY","UI","APP"])assert.equal(state(report,code),"missing");
  assert.equal(state(report,"LOCK"),"clear");
  await mkdir(join(base,".meshwall-maintenance-lock"));
  assert.equal(state(await diagnoseFresh(base),"LOCK"),"blocked");
 }finally{await rm(base,{recursive:true,force:true});}
});
test("checks package and JSON, never includes paths, config values or private key content",async()=>{
 const base=await mkdtemp(join(tmpdir(),"mw-diagnose-"));
 try{
  const pkg=await fixture(base,"node_modules/meshcentral/package.json",'{"name":"meshcentral","version":"1.2.0"}');
  const config=await fixture(base,"meshcentral-data/config.json",'{"sessionKey":"fixture-secret"');
  const report=await diagnoseFresh(base);
  assert.equal(state(report,"PACKAGE"),"unsupported-version");
  assert.equal(state(report,"CONFIG"),"invalid-json");
  assert.ok(!JSON.stringify(report).includes("fixture-secret"));
  assert.ok(!JSON.stringify(report).includes(base));
  await writeFile(pkg,'{"name":"meshcentral","version":"1.3.2"}');
  await writeFile(config,"[]");
  assert.equal(state(await diagnoseFresh(base),"CONFIG"),"invalid-config");
  await writeFile(config,"x".repeat(1024*1024+1));
  assert.equal(state(await diagnoseFresh(base),"CONFIG"),"oversized");
  const expected='{"sessionKey":"fixture-secret"}';
  await writeFile(config,expected);
  for(const path of ["meshcentral-data/webserver-cert-public.crt","meshcentral-data/webserver-cert-private.key","meshcentral-web/public/meshwall.html","meshcentral-web/public/meshwall/app.mjs"])await fixture(base,path,"fixture-key-content");
  const complete=await diagnoseFresh(base);
  assert.equal(complete.status,"files-present");
  assert.ok(!JSON.stringify(complete).includes("fixture-key-content"));
  assert.equal(await readFile(config,"utf8"),expected);
  assert.match(complete.note,/not TLS validation/);
 }finally{await rm(base,{recursive:true,force:true});}
});
test("refuses symlinked or junctioned directories and nonregular expected files",async()=>{
 const base=await mkdtemp(join(tmpdir(),"mw-diagnose-"));
 try{
  const outside=join(base,"outside"),root=join(base,"root");
  await mkdir(outside);await mkdir(root);
  await fixture(outside,"config.json",'{"sessionKey":"never-read"}');
  await symlink(outside,join(root,"meshcentral-data"),process.platform==="win32"?"junction":"dir");
  assert.equal(state(await diagnoseFresh(root),"CONFIG"),"unsafe");
  assert.equal(state(await diagnoseFresh(join(root,"meshcentral-data")),"ROOT"),"unsafe");
  await mkdir(join(root,"node_modules","meshcentral","package.json"),{recursive:true});
  assert.equal(state(await diagnoseFresh(root),"PACKAGE"),"unsafe");
 }finally{await rm(base,{recursive:true,force:true});}
});
