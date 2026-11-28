import test from "node:test";
import assert from "node:assert/strict";
import {createSetupServer} from "../installers/linux/setup.mjs";
import {validateSetup,validReadyURL} from "../installers/linux/setup-model.mjs";
const data={username:"labadmin",password:"Strong-Example-Password",confirmation:"Strong-Example-Password",authorized:true};
test("setup validates strict input and ready URL",()=>{assert.equal(validateSetup(data).username,"labadmin");assert.throws(()=>validateSetup({...data,password:"bad"}));assert.throws(()=>validateSetup({...data,authorized:false}));assert.equal(validReadyURL("https://host.example.ts.net:8443/meshwall.html"),"https://host.example.ts.net:8443/meshwall.html");assert.equal(validReadyURL("https://evil.test:8443/meshwall.html"),null);});
test("local wizard authenticates requests, enforces origin and starts exactly one job",async()=>{let calls=0;const token="a".repeat(64);const server=createSetupServer({token,discover:async()=>[],preflight:()=>({ready:true}),install:async()=>{calls++;return "https://host.example.ts.net:8443/meshwall.html";}});await new Promise(r=>server.listen(0,"127.0.0.1",r));const url="http://127.0.0.1:"+server.address().port;const auth={Authorization:"Bearer "+token};const post=(origin,body)=>fetch(url+"/api/install",{method:"POST",headers:{...auth,Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(body)});try{assert.equal((await fetch(url+"/api/status")).status,401);assert.equal((await fetch(url+"/api/preflight",{headers:auth})).status,200);assert.equal((await post("http://evil.test",data)).status,403);assert.equal((await post(url,{...data,authorized:false})).status,400);assert.equal((await post(url,data)).status,202);assert.equal((await post(url,data)).status,409);const state=await (await fetch(url+"/api/status",{headers:auth})).json();assert.equal(state.status,"complete");assert.equal(calls,1);assert.ok(!JSON.stringify(state).includes(data.password));}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}});

test("discovery blocks fresh install and exposes only static safe support guidance",async()=>{const token="b".repeat(64);let calls=0;const server=createSetupServer({token,preflight:()=>({ready:true}),discover:async()=>[{root:"fixture",version:"1.3.2",compatible:true}],install:async()=>{calls++;}});await new Promise(r=>server.listen(0,"127.0.0.1",r));const url="http://127.0.0.1:"+server.address().port,auth={Authorization:"Bearer "+token};try{assert.equal((await fetch(url+"/api/discovery")).status,401);assert.equal((await (await fetch(url+"/api/discovery",{headers:auth})).json()).candidates.length,1);const res=await fetch(url+"/api/install",{method:"POST",headers:{...auth,Origin:url,"Content-Type":"application/json"},body:JSON.stringify(data)});assert.equal(res.status,409);assert.equal(calls,0);const report=await(await fetch(url+"/api/support",{headers:auth})).json();assert.equal(report.guidance.code,"MW-PREFLIGHT");assert.ok(!JSON.stringify(report).includes(data.password));}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}});

test("adoption preview requires an authenticated same-origin request and never changes the installation",async()=>{
 const {mkdtemp,mkdir,writeFile,readdir,realpath,rm}=await import("node:fs/promises");
 const {tmpdir}=await import("node:os");
 const {join}=await import("node:path");
 const base=await mkdtemp(join(await realpath(tmpdir()),"mw-wizard-"));
 const root=join(base,"custom engine");
 const engine=join(root,"node_modules","meshcentral");
 const config=join(root,"meshcentral-data","config.json");
 const backups=join(base,"private backups");
 const token="c".repeat(64);
 let installs=0;
 const server=createSetupServer({token,preflight:()=>({ready:true}),discover:async()=>[],install:async()=>{installs++;},
  inspectService:async(_,name)=>({status:"verified",name,state:"stopped",account:"local-fixture-operator"})
 });
 try{
  await mkdir(engine,{recursive:true});
  await mkdir(join(root,"meshcentral-data"));
  await mkdir(backups);
  await writeFile(join(engine,"package.json"),'{"name":"meshcentral","version":"1.3.2"}');
  await writeFile(config,"{}");
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const origin="http://127.0.0.1:"+server.address().port;
  const auth={Authorization:"Bearer "+token};
  const post=(path,body,headers={})=>fetch(origin+path,{
   method:"POST",headers:{...auth,Origin:origin,"Content-Type":"application/json",...headers},body:JSON.stringify(body)
  });
  const preview="/api/adoption/preview";
  assert.equal((await post(preview,{root},{Authorization:"Bearer incorrect"})).status,401);
  assert.equal((await post(preview,{root},{Origin:"http://invalid.test"})).status,403);
  assert.equal((await post(preview,{root,apply:true})).status,400);
  assert.equal((await post(preview,{root:"relative-root"})).status,422);
  assert.equal((await post(preview,{root,backupParent:root})).status,422);
  const response=await post(preview,{root,backupParent:backups});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.preview.root,await realpath(root));
  assert.equal(data.preview.backupDirectory,await realpath(backups));
  assert.equal(data.preview.files.length,14);
  assert.equal(data.existingCandidate,true);
  const serviceResponse=await post(preview,{root,serviceName:"fixture-meshcentral.service"});
  assert.equal(serviceResponse.status,200);
  assert.equal((await serviceResponse.json()).preview.service.account,"local-fixture-operator");
  assert.equal((await post("/api/adoption/apply",{root})).status,404);
  assert.equal((await post("/api/install",{username:"labadmin",password:"Fixture-Safe-Password",confirmation:"Fixture-Safe-Password",authorized:true})).status,409);
  assert.equal(installs,0);
  const privateValue="secret-fixture-value";
  await writeFile(config,JSON.stringify({settings:{MongoDB:privateValue}}));
  const blocked=await post(preview,{root});
  assert.equal(blocked.status,422);
  const blockedText=await blocked.text();
  assert.match(blockedText,/MW-ADOPT-CONFIG/);
  assert.ok(!blockedText.includes(privateValue));
  const reportText=await (await fetch(origin+"/api/support",{headers:auth})).text();
  assert.match(reportText,/MW-ADOPT/);
  assert.ok(!reportText.includes(data.preview.root));
  assert.ok(!reportText.includes(privateValue));
  assert.ok(!reportText.includes("local-fixture-operator"));
  assert.ok(!reportText.includes("fixture-meshcentral.service"));
  assert.deepEqual((await readdir(root)).sort(),["meshcentral-data","node_modules"]);
  assert.deepEqual(await readdir(backups),[]);
 }finally{
  if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  await rm(base,{recursive:true,force:true});
 }
});

test("maintenance-only wizard authenticates, serializes diagnosis and denies mutation routes",async()=>{
 const token="d".repeat(64),name=process.platform==="win32"?"MeshCentral":"meshwall-engine.service";
 let calls=0,release,entered;
 const started=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
 const server=createSetupServer({token,maintenanceOnly:true,planner:async()=>{calls++;entered();await gate;return {status:"needs-review",next:{id:"lock"},observed:{"MW-DIAG-LOCK":"blocked"}};},install:async()=>assert.fail("must not install")});
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 const origin="http://127.0.0.1:"+server.address().port,auth={Authorization:"Bearer "+token};
 const post=(path,body,headers={})=>fetch(origin+path,{method:"POST",headers:{...auth,Origin:origin,"Content-Type":"application/json",...headers},body:JSON.stringify(body)});
 const route="/api/maintenance/plan";
 try{
  assert.match(await(await fetch(origin)).text(),/Maintenance center/);
  assert.equal((await post(route,{serviceName:name},{Authorization:"Bearer wrong"})).status,401);
  assert.equal((await post(route,{serviceName:name},{Origin:"http://evil.test"})).status,403);
  assert.equal((await post(route,{serviceName:name,root:"/other"})).status,400);
  assert.equal((await post(route,{serviceName:"*"})).status,400);
  assert.equal((await post("/api/install",data)).status,404);
  assert.equal((await post("/api/adoption/preview",{root:"/other"})).status,404);
  const pending=post(route,{serviceName:name});await started;
  assert.equal((await post(route,{serviceName:name})).status,409);
  release();assert.equal((await pending).status,200);assert.equal(calls,1);
 }finally{release();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
