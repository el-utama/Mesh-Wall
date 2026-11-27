import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
test("repository continuity files contain mandatory onboarding and acceptance traceability",async()=>{
 const agents=await readFile("AGENTS.md","utf8"),memory=await readFile("PROJECT_MEMORY.md","utf8"),pr=await readFile(".github/PULL_REQUEST_TEMPLATE.md","utf8");
 assert.match(agents,/PROJECT_MEMORY\.md/);assert.match(agents,/Durable project memory/);assert.match(agents,/mandatory session bootstrap/);
 for(let i=1;i<=15;i++)assert.match(memory,new RegExp("\\| P"+String(i).padStart(2,"0")+" \\|"));
 for(const heading of ["Current state and verified baseline","Durable user requirements","Architectural decisions","Resume queue","Known risks and recovery notes","Owner decisions / external blockers"])assert.ok(memory.includes("## "+heading),heading);
 assert.match(pr,/PROJECT_MEMORY\.md/);
});
