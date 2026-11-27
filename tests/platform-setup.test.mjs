import test from "node:test";import assert from "node:assert/strict";import {windowsInput,windowsSetupCommand} from "../installers/windows/setup.mjs";import {runInstaller} from "../installers/setup/runner.mjs";
test("Windows setup credentials travel in JSON stdin, not command arguments",()=>{const i={username:"lab",password:"Quoted-'Password\\with space"};const spec=windowsSetupCommand("C:\\Windows");assert.ok(spec.args.includes("-NonInteractive"));assert.ok(!JSON.stringify(spec).includes(i.password));assert.deepEqual(JSON.parse(windowsInput(i)),{...i,confirmation:i.password,authorized:true});});
test("shared runner accepts only verified ready marker and handles stdin",async()=>{const i={username:"lab",password:"Fixture-Password-123"};const stages=[];const script='let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{if(JSON.parse(s).username!=="lab")process.exit(1);console.log("MW_STAGE verification");console.log("MW_READY https://fixture.example.ts.net:8443/meshwall.html")})';const spec={command:process.execPath,args:["-e",script],env:process.env,encode:windowsInput};assert.equal(await runInstaller(spec,i,x=>stages.push(x)),"https://fixture.example.ts.net:8443/meshwall.html");assert.deepEqual(stages,["verification"]);await assert.rejects(runInstaller({...spec,args:["-e","console.log('MW_READY https://evil.invalid/')"]},i,()=>{}));});

test("wizard selects only absolute local path syntax on both platforms",async()=>{
 const {validAdoptionPath}=await import("../installers/setup/model.mjs");
 assert.equal(validAdoptionPath("/srv/custom engine","linux"),"/srv/custom engine");
 assert.equal(validAdoptionPath("/srv/../engine","linux"),null);
 assert.equal(validAdoptionPath("C:/Local Programs/MeshCentral","win32"),"C:\\Local Programs\\MeshCentral");
 for(const path of [String.raw`\\remote\share\server`,String.raw`\\?\C:\local`,"C:relative","C:/parent/../server","C:/root:stream","C:/NUL.ext", "C:/bad. /server"]){
  assert.equal(validAdoptionPath(path,"win32"),null,path);
 }
});
