import test from "node:test";
import assert from "node:assert/strict";
import {recoveryPlan,formatRecoveryPlan} from "../installers/support/recovery-plan.mjs";
const files={ROOT:"present",LOCK:"clear",PACKAGE:"present",CONFIG:"present",CERT:"present",KEY:"present",UI:"present",APP:"present"};
const report=(prefix,values)=>({findings:Object.entries(values).map(([code,state])=>({code:prefix+code,state,next:"fixture-secret"}))});
function fixture({first={},second={},policy={},service="running",https="reachable",adopt=false,target=true}={}){
 const calls=[];
 return {calls,deps:{
 files:async()=>{calls.push("files");return report("MW-DIAG-",{...files,...first});},
 hasAdoption:async()=>{calls.push("adoption");return adopt;},
 target:()=>target,
 config:async()=>{calls.push("config");return {findings:[...report("MW-CONFIG-",{POLICY:"baseline-matches",ENDPOINT:"endpoint-present",...policy}).findings,{code:"MW-TLS-LEAF",state:policy.LEAF??"leaf-key-match"}]};},
 health:async()=>{calls.push("health");return {...report("MW-DIAG-",{...files,...first,...second,SERVICE:service,HTTPS:https}),status:https==="reachable"?"page-reachable":"needs-review"};}
 }};
}
const run=f=>recoveryPlan("fixture-root","fixture-service",f.deps);
test("root, maintenance lock, adoption, target and package block further checks",async()=>{
 for(const [options,expected] of [[{first:{ROOT:"missing"}},"root"],[{first:{LOCK:"blocked"}},"lock"],[{adopt:true},"adoption"],[{target:false},"target"],[{first:{PACKAGE:"unsupported-version"}},"package"]]){
  const f=fixture(options);assert.equal((await run(f)).next.id,expected);assert.ok(!f.calls.includes("health"));assert.ok(!f.calls.includes("config"));
 }
});
test("planner selects an ordered conservative step",async()=>{
 for(const [options,expected] of [
 [{second:{LOCK:"blocked"}},"lock"],[{second:{UI:"missing"}},"unavailable"],[{service:"transitioning"},"busy"],[{service:"mismatch",policy:{POLICY:"baseline-mismatch"}},"service"],
 [{policy:{POLICY:"custom-review"}},"config"],[{policy:{ENDPOINT:"invalid-endpoint"}},"endpoint"],[{policy:{LEAF:"expired"}},"tls"],
 [{first:{UI:"missing",APP:"missing"},service:"stopped",https:"skipped"},"ui"],[{first:{UI:"unsafe"}},"uiReview"],
 [{service:"stopped",https:"skipped"},"stopped"],[{https:"tls"},"https"],[{policy:{LEAF:"renew-soon"}},"renewal"],[{},"ready"]]){
  assert.equal((await run(fixture(options))).next.id,expected);
 }
});
test("report is bounded and bilingual, no raw evidence, unknown and exceptions fail closed",async()=>{
 const f=fixture();const result=await run(f);assert.equal(result.status,"checks-observed");
 const raw=JSON.stringify(result);for(const secret of ["fixture-root","fixture-service","fixture-secret"])assert.ok(!raw.includes(secret));
 assert.match(formatRecoveryPlan(result,"id"),/Langkah berikutnya/);assert.match(formatRecoveryPlan(result,"en"),/Next step/);
 assert.equal((await run(fixture({service:"raw-secret"}))).next.id,"service");
 f.deps.health=async()=>{throw Error("raw-secret");};
 const failed=await run(f);assert.equal(failed.next.id,"unavailable");assert.ok(!JSON.stringify(failed).includes("raw-secret"));
});
