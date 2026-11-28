import test from "node:test";import assert from "node:assert/strict";import {mkdtemp,rm,mkdir,writeFile} from "node:fs/promises";import {join} from "node:path";import {tmpdir} from "node:os";import {createJournal,readJournals} from "../installers/support/journal.mjs";
test("local wizard history survives reopening and includes only allowlisted stage metadata",async()=>{const base=await mkdtemp(join(tmpdir(),"mw-history-")),dir=join(base,"history");try{assert.deepEqual(readJournals(dir),[]);const j=createJournal(dir);j.record("service","running");const a=readJournals(dir);assert.equal(a[0].stage,"service");assert.equal(a[0].status,"running");assert.throws(()=>j.record("secret-password","failed"));j.record("service","failed");assert.equal(readJournals(dir)[0].help.code,"MW-SERVICE");assert.equal(readJournals(dir)[0].status,"failed");assert.ok(!JSON.stringify(readJournals(dir)).includes("secret-password"));}finally{await rm(base,{recursive:true,force:true});}});

test("journal retains a bounded ordered stage trail and explains incomplete work",async()=>{
 const base=await mkdtemp(join(tmpdir(),"mw-trail-")),dir=join(base,"history");
 try{const j=createJournal(dir);j.record("package","running");j.record("service","running");j.record("service","failed");
 const result=readJournals(dir)[0];assert.deepEqual(result.events.map(({stage,status})=>[stage,status]),[["preflight","running"],["package","running"],["service","running"],["service","failed"]]);assert.match(result.recoveryNote,/Preserve partial files/);
 for(let i=0;i<40;i++)j.record("verification","running");const bounded=readJournals(dir)[0];assert.equal(bounded.events.length,32);assert.match(bounded.recoveryNote,/may have stopped/);
 j.record("ready","complete");assert.match(readJournals(dir)[0].recoveryNote,/Verify login/);
 }finally{await rm(base,{recursive:true,force:true});}
});
test("legacy records remain readable and new history rejects invalid or mismatched stage data",async()=>{
 const base=await mkdtemp(join(tmpdir(),"mw-legacy-")),dir=join(base,"history");
 try{await mkdir(dir,{mode:0o700});const id="a".repeat(32),file=join(dir,"install-"+id+".json"),at="2026-01-01T00:00:00.000Z";const legacy={format:1,id,created:at,updated:at,stage:"service",status:"failed"};
 await writeFile(file,JSON.stringify(legacy));assert.deepEqual(readJournals(dir)[0].events,[{stage:"service",status:"failed",at}]);
 await writeFile(file,JSON.stringify({...legacy,events:[{stage:"service",status:"failed",at,password:"fixture-secret"}]}));assert.ok(!JSON.stringify(readJournals(dir)).includes("fixture-secret"));
 for(const events of [[{stage:"bad",status:"failed",at}],[{stage:"service",status:"running",at}],[{stage:"service",status:"failed",at:"invalid"}],[]]){await writeFile(file,JSON.stringify({...legacy,events}));assert.deepEqual(readJournals(dir),[]);}
 }finally{await rm(base,{recursive:true,force:true});}
});
