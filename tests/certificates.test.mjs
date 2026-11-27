import test from "node:test";import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";import {join} from "node:path";import {tmpdir} from "node:os";import {execFileSync,spawnSync} from "node:child_process";
import {splitCertificates,prepareCertificates} from "../scripts/maintenance/certificates.mjs";
const available=spawnSync("openssl",["version"],{stdio:"ignore"}).status===0;
test("certificate validation rejects hostname mismatch, key mismatch and expired material",{skip:!available},async()=>{
 const d=await mkdtemp(join(tmpdir(),"mw-cert-test-")),c=join(d,"cert.pem"),k=join(d,"key.pem"),out=join(d,"prepared"),host="lab.example.ts.net";
 try{execFileSync("openssl",["req","-x509","-newkey","rsa:2048","-nodes","-days","3","-subj","/CN="+host,"-addext","subjectAltName=DNS:"+host,"-keyout",k,"-out",c],{stdio:"ignore"});
 const cert=await readFile(c,"utf8"),key=await readFile(k,"utf8");assert.ok(splitCertificates(cert,key,host)["webserver-cert-public.crt"]);assert.throws(()=>splitCertificates(cert,key,"other.example.ts.net"),/mismatch/);assert.throws(()=>splitCertificates(cert,key,host,Date.now()+10*86400000),/mismatch/);assert.throws(()=>splitCertificates("invalid",key,host),/Invalid certificate/);
 await prepareCertificates(c,k,host,out);assert.equal(await readFile(join(out,"webserver-cert-private.key"),"utf8"),key);
 }finally{await rm(d,{recursive:true,force:true});}
});
