import test from "node:test";
import assert from "node:assert/strict";
import {classifyPaths,selectScope} from "../scripts/ci-scope.mjs";
const base="a".repeat(40),head="b".repeat(40);
const ctx={eventName:"pull_request",event:{pull_request:{base:{sha:base}}},head,ref:"refs/pull/1/merge"};
const all=scope=>assert.deepEqual([scope.integration,scope.visual,scope.windows],[true,true,true]);
test("only explicit documentation and isolated service CLI paths are eligible for savings",()=>{
 assert.deepEqual(classifyPaths(["README.md","docs/SELF-SUPPORT.md",".agents/skills/meshwall-testing/SKILL.md"]),{integration:false,visual:false,windows:false,reason:"documentation-only"});
 assert.deepEqual(classifyPaths(["scripts/service.mjs","tests/service-control.test.mjs","PROJECT_MEMORY.md"]),{integration:true,visual:false,windows:true,reason:"isolated-service-cli"});
 for(const paths of [[],["docs/a.md","apps/web/public/meshwall.html"],["installers/support/health.mjs"],["scripts/maintenance/lib.mjs"],[".github/workflows/check.yml"],["scripts/ci-scope.mjs"],["package.json"],["docs/../scripts/service.mjs"],["docs/\ufffd.md"],["unknown.md"]])all(classifyPaths(paths));
});
test("scope checks checkout identity and ancestry, uses no-rename NUL diff, and fails closed",()=>{
 const calls=[];
 const run=args=>{calls.push(args);return args[0]==="rev-parse"?head+"\n":args[0]==="diff"?"README.md\0":"";};
 assert.equal(selectScope(ctx,run).reason,"documentation-only");
 assert.deepEqual(calls,[["rev-parse","HEAD"],["merge-base","--is-ancestor",base,head],["diff","--no-renames","--name-only","-z",base,head,"--"]]);
 assert.equal(selectScope({...ctx,eventName:"push",event:{before:base},ref:"refs/heads/main"},run).reason,"documentation-only");
 for(const c of [{...ctx,eventName:"workflow_dispatch"},{...ctx,ref:"refs/tags/v1"},{...ctx,eventName:"push",event:{before:"0".repeat(40)}},{...ctx,head:"bad"}])all(selectScope(c,()=>assert.fail("must not invoke git")));
 all(selectScope(ctx,()=>{throw Error("missing history");}));
 all(selectScope(ctx,args=>args[0]==="rev-parse"?base+"\n":"README.md\0"));
 all(selectScope(ctx,args=>args[0]==="rev-parse"?head+"\n":args[0]==="diff"?"README.md":""));
});
