import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync,spawnSync} from "node:child_process";
import {mkdtemp,mkdir,writeFile,readFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {checkFreshPolicy,checkLeafAndKey,diagnoseConfigTLS} from "../installers/support/config-tls.mjs";
const host="fixture.example.ts.net",ip="100.64.1.2";
const config=()=>JSON.parse(execFileSync(process.execPath,["installers/linux/config.mjs",host,ip,"8443"],{encoding:"utf8"}));
test("generated config matches known policy; unsafe or custom changes require review",()=>{
 const c=config();assert.equal(checkFreshPolicy(c),"baseline-matches");
 c.domains[""].userConsentFlags.desktopprompt=false;assert.equal(checkFreshPolicy(c),"baseline-mismatch");
 c.settings.tlsOffload=true;assert.equal(checkFreshPolicy(c),"custom-review");
 assert.equal(checkFreshPolicy([]),"invalid-config");
});
test("config report is read-only and redacts config values and malformed TLS material",async()=>{
 const root=await mkdtemp(join(tmpdir(),"mw-config-tls-"));
 try{
  const data=join(root,"meshcentral-data");await mkdir(data);
  const original=JSON.stringify(config());await writeFile(join(data,"config.json"),original);
  await writeFile(join(data,"webserver-cert-public.crt"),"invalid-certificate-fixture");
  await writeFile(join(data,"webserver-cert-private.key"),"fixture-private-key");
  const report=await diagnoseConfigTLS(root);
  assert.equal(report.status,"needs-review");assert.equal(report.findings[2].state,"invalid-certificate");
  const serialized=JSON.stringify(report);for(const secret of [host,ip,root,"fixture-private-key",JSON.parse(original).settings.sessionKey])assert.ok(!serialized.includes(secret));
  assert.equal(await readFile(join(data,"config.json"),"utf8"),original);
  await writeFile(join(data,"config.json"),"x".repeat(1024*1024+1));assert.equal((await diagnoseConfigTLS(root)).findings[0].state,"oversized");
 }finally{await rm(root,{recursive:true,force:true});}
});
test("leaf/key diagnosis checks host, key, expiry and renewal threshold",{skip:spawnSync("openssl",["version"],{stdio:"ignore"}).status!==0},async()=>{
 const root=await mkdtemp(join(tmpdir(),"mw-leaf-"));
 try{
  const cert=join(root,"cert.pem"),key=join(root,"key.pem"),other=join(root,"other.key");
  execFileSync("openssl",["req","-x509","-newkey","rsa:2048","-nodes","-days","90","-subj","/CN="+host,"-addext","subjectAltName=DNS:"+host,"-keyout",key,"-out",cert],{stdio:"ignore"});
  execFileSync("openssl",["genpkey","-algorithm","RSA","-pkeyopt","rsa_keygen_bits:2048","-out",other],{stdio:"ignore"});
  const c=await readFile(cert,"utf8"),k=await readFile(key,"utf8"),now=Date.now();
  assert.equal(checkLeafAndKey(c,k,host,now),"leaf-key-match");
  assert.equal(checkLeafAndKey(c,k,"wrong.example.ts.net",now),"hostname-mismatch");
  assert.equal(checkLeafAndKey(c,await readFile(other,"utf8"),host,now),"key-mismatch");
  assert.equal(checkLeafAndKey(c,k,host,now-86400000),"not-yet-valid");
  assert.equal(checkLeafAndKey(c,k,host,now+70*86400000),"renew-soon");
  assert.equal(checkLeafAndKey(c,k,host,now+100*86400000),"expired");
 }finally{await rm(root,{recursive:true,force:true});}
});
