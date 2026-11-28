import test from "node:test";import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,rename,lstat,readdir} from "node:fs/promises";import {join} from "node:path";import {tmpdir} from "node:os";import {execFileSync,spawnSync} from "node:child_process";
import {certificateStatus,inspectTLS,rotateTLS,rollbackTLS} from "../scripts/maintenance/tls-rotation.mjs";
const available=spawnSync("openssl",["version"],{stdio:"ignore"}).status===0;
test("TLS rotation keeps previous certificate, refuses mismatched host and supports offline rollback",{skip:!available},async()=>{
 const root=await mkdtemp(join(tmpdir(),"mw-tls-")),data=join(root,"meshcentral-data"),host="lab.example.ts.net";
 try{await mkdir(join(root,"node_modules/meshcentral"),{recursive:true});await mkdir(data);await writeFile(join(root,"node_modules/meshcentral/package.json"),'{"version":"1.3.2"}');await writeFile(join(data,"config.json"),JSON.stringify({settings:{cert:host,port:8443}}));
 const oldC=join(data,"webserver-cert-public.crt"),oldK=join(data,"webserver-cert-private.key"),newC=join(root,"new.pem"),newK=join(root,"new.key"),wrongC=join(root,"wrong.pem"),wrongK=join(root,"wrong.key");
 function cert(c,k,h,days){execFileSync("openssl",["req","-x509","-newkey","rsa:2048","-nodes","-days",String(days),"-subj","/CN="+h,"-addext","subjectAltName=DNS:"+h,"-keyout",k,"-out",c],{stdio:"ignore"});}
 cert(oldC,oldK,host,10);cert(newC,newK,host,90);cert(wrongC,wrongK,"wrong.example.ts.net",90);
 const original=await certificateStatus(root);assert.equal((await inspectTLS(root,oldC,oldK)).changed,false);assert.equal((await inspectTLS(root,newC,newK)).changed,true);await assert.rejects(inspectTLS(root,wrongC,wrongK),/mismatch/);assert.equal((await certificateStatus(root)).fingerprint,original.fingerprint);
 assert.equal(await rotateTLS(root,oldC,oldK),null);await assert.rejects(rotateTLS(root,wrongC,wrongK),/mismatch/);assert.equal((await certificateStatus(root)).fingerprint,original.fingerprint);
 const recovery=await rotateTLS(root,newC,newK);assert.ok(recovery.includes("meshwall-tls-recovery-"));assert.notEqual((await certificateStatus(root)).fingerprint,original.fingerprint);assert.equal(await readFile(join(recovery,"webserver-cert-private.key"),"utf8").then(x=>x.includes("PRIVATE KEY")),true);assert.equal(await rotateTLS(root,newC,newK),null);await assert.rejects(rollbackTLS(root,root),/Recovery directory/);await rollbackTLS(root,recovery);assert.equal((await certificateStatus(root)).fingerprint,original.fingerprint);assert.equal(await readFile(join(data,"config.json"),"utf8"),JSON.stringify({settings:{cert:host,port:8443}}));
 let moves=0;await assert.rejects(rotateTLS(root,newC,newK,{move:async(a,b)=>{if(++moves>=2)throw Error("injected failure");return rename(a,b);}}),/MW-TLS-RECOVERY/);
 assert.ok((await lstat(join(root,".meshwall-maintenance-lock"))).isDirectory());const retained=await readdir(root);assert.ok(retained.some(n=>n.startsWith(".meshwall-tls-stage-")));assert.ok(retained.some(n=>n.startsWith("meshwall-tls-recovery-")));
 }finally{await rm(root,{recursive:true,force:true});}
});
