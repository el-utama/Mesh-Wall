import test from "node:test";
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {Readable} from "node:stream";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {diagnoseHealth,probePrivatePage} from "../installers/support/health.mjs";
import {readFreshEndpoint} from "../installers/support/diagnose.mjs";
const name=process.platform==="win32"?"MeshCentral":"meshwall-engine.service";
const target={host:"fixture.example.ts.net",ip:"100.64.1.2"};
const evidence={status:"files-present",findings:[{code:"MW-DIAG-ROOT",state:"present"},{code:"MW-DIAG-PACKAGE",state:"present"}]};
const dependencies={files:async()=>evidence,endpoint:async()=>target,inspect:async()=>({status:"verified",state:"running",account:"fixture-secret"}),interfaces:()=>({test:[{family:"IPv4",internal:false,address:target.ip}]}),probe:async()=> "reachable"};
const state=(report,code)=>report.findings.find(x=>x.code==="MW-DIAG-"+code).state;
test("health checks require matched running service, valid local endpoint and file evidence",async()=>{
 const root=tmpdir();
 const ready=await diagnoseHealth(root,name,dependencies);
 assert.equal(ready.status,"page-reachable");assert.equal(state(ready,"SERVICE"),"running");
 assert.ok(!JSON.stringify(ready).includes("fixture-secret"));assert.ok(!JSON.stringify(ready).includes(target.host));assert.ok(!JSON.stringify(ready).includes(target.ip));
 const never=async()=>assert.fail("unexpected network probe");
 for(const [info,expected] of [[{status:"missing"},"missing"],[{status:"mismatch"},"mismatch"],[{status:"verified",state:"stopped"},"stopped"]]){
  const report=await diagnoseHealth(root,name,{...dependencies,inspect:async()=>info,probe:never});
  assert.equal(state(report,"SERVICE"),expected);assert.equal(state(report,"HTTPS"),"skipped");
 }
 for(const [overrides,expected] of [[{interfaces:()=>({})},"not-local"],[{endpoint:async()=>null},"invalid-endpoint"],[{files:async()=>({...evidence,status:"needs-review"})},"skipped"]]){
  const report=await diagnoseHealth(root,name,{...dependencies,...overrides,probe:never});
  assert.equal(state(report,"HTTPS"),expected);assert.equal(report.status,"needs-review");
 }
 const denied=await diagnoseHealth(root,"--invalid",{...dependencies,inspect:never,probe:never});
 assert.equal(state(denied,"SERVICE"),"invalid");assert.equal(state(denied,"HTTPS"),"skipped");
});
test("endpoint accepts only the expected private fresh configuration",async()=>{
 const root=await mkdtemp(join(tmpdir(),"mw-health-"));
 try{
  await mkdir(join(root,"meshcentral-data"));const file=join(root,"meshcentral-data","config.json");
  const settings={cert:target.host,portBind:target.ip,port:8443,sessionKey:"fixture-secret"};
  await writeFile(file,JSON.stringify({settings}));
  assert.deepEqual(await readFreshEndpoint(root),target);
  for(const change of [{port:443},{cert:"external.example.org"},{portBind:"127.0.0.1"},{portBind:"100.64.999.1"},{portBind:"100.64.01.1"}]){
   await writeFile(file,JSON.stringify({settings:{...settings,...change}}));assert.equal(await readFreshEndpoint(root),null);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
test("HTTPS probe enforces TLS, fixed destination, response bounds and no redirects",async()=>{
 function mock({status=200,body="<title>MeshWall</title>",error,stall=false}={}){
  return (options,cb)=>{
   assert.equal(options.hostname,target.ip);assert.equal(options.servername,target.host);assert.equal(options.rejectUnauthorized,true);
   assert.equal(options.port,8443);assert.equal(options.path,"/meshwall.html");assert.equal(options.agent,false);
   const req=new EventEmitter();req.destroy=()=>{};
   if(!stall)queueMicrotask(()=>{
    if(error){req.emit("error",{code:error});return;}
    const res=Readable.from([Buffer.from(body)]);res.statusCode=status;cb(res);
   });
   return req;
  };
 }
 for(const [options,expected] of [[{},"reachable"],[{status:302},"http-status"],[{body:"wrong page"},"unexpected-page"],[{error:"CERT_HAS_EXPIRED"},"tls"],[{error:"ECONNREFUSED"},"refused"],[{body:"x".repeat(300)},"oversized"],[{stall:true},"timeout"]]){
  assert.equal(await probePrivatePage(target,{request:mock(options),maxBytes:256,timeoutMs:50}),expected);
 }
});
