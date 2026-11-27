// Offline certificate replacement. Run only as the engine account, never as root.
import {lstat,realpath,readFile,readdir,mkdir,writeFile,rename,rm,rmdir} from "node:fs/promises";
import {join,resolve,dirname,basename} from "node:path";
import {randomBytes,X509Certificate} from "node:crypto";
import {splitCertificates} from "./certificates.mjs";
const names=/^webserver-cert-(?:public\.crt|private\.key|chain[1-9][0-9]*\.crt)$/;
async function directory(p){const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error("Unsafe directory");return await realpath(p);}
async function files(p){const out={};for(const n of (await readdir(p)).filter(n=>names.test(n)).sort()){const path=join(p,n),s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>1024*1024)throw Error("Unsafe certificate file: "+n);out[n]=await readFile(path,"utf8");}return out;}
async function context(arg){const root=await directory(resolve(arg)),data=join(root,"meshcentral-data");await directory(data);const p=JSON.parse(await readFile(join(root,"node_modules/meshcentral/package.json"),"utf8"));if(p.version!=="1.3.2")throw Error("Unsupported engine version");const c=JSON.parse(await readFile(join(data,"config.json"),"utf8")),host=c.settings?.cert;if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(host||"")||c.settings?.port!==8443||c.settings?.tlsOffload)throw Error("Only direct TLS on fresh private MeshWall configuration supported");return {root,data,host};}
async function withLock(root,fn){const lock=join(root,".meshwall-maintenance-lock");await mkdir(lock,{mode:0o700});try{return await fn();}finally{await rmdir(lock);}}
function required(f){if(!f["webserver-cert-public.crt"]||!f["webserver-cert-private.key"])throw Error("Missing leaf or key");return f;}
function chain(f){return f["webserver-cert-public.crt"]+"\n"+Object.keys(f).filter(n=>n.includes("-chain")).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0])).map(n=>f[n]).join("\n");}
async function swap(root,data,next){
 const old=required(await files(data)),id=randomBytes(12).toString("hex"),stage=join(root,".meshwall-tls-stage-"+id),recovery=join(root,"meshwall-tls-recovery-"+id);
 await mkdir(stage,{mode:0o700});await mkdir(recovery,{mode:0o700});const moved=[],installed=[];
 try{
  for(const [n,value] of Object.entries(next)){if(!names.test(n))throw Error("Unexpected certificate name");await writeFile(join(stage,n),value,{mode:0o600,flag:"wx"});}
  for(const n of Object.keys(old)){await rename(join(data,n),join(recovery,n));moved.push(n);}
  for(const n of Object.keys(next)){await rename(join(stage,n),join(data,n));installed.push(n);}
  const actual=await files(data);if(Object.keys(actual).length!==Object.keys(next).length||Object.entries(next).some(([n,v])=>actual[n]!==v))throw Error("Certificate swap verification failed");
  await rmdir(stage);return recovery;
 }catch(e){try{for(const n of installed.reverse())await rename(join(data,n),join(stage,n));for(const n of moved.reverse())await rename(join(recovery,n),join(data,n));await rm(stage,{recursive:true,force:true});await rm(recovery,{recursive:true,force:true});}catch{throw Error("TLS rollback failed; retain "+stage+" and "+recovery);}throw e;}
}
export async function certificateStatus(arg){const {data,host}=await context(arg),f=required(await files(data)),cert=new X509Certificate(f["webserver-cert-public.crt"]);return {host,expires:cert.validTo,fingerprint:cert.fingerprint256,daysRemaining:Math.floor((Date.parse(cert.validTo)-Date.now())/86400000)};}
export async function rotateTLS(arg,chainFile,keyFile){const {root,data,host}=await context(arg),next=splitCertificates(await readFile(chainFile,"utf8"),await readFile(keyFile,"utf8"),host);return withLock(root,async()=>{const old=required(await files(data)),a=new X509Certificate(old["webserver-cert-public.crt"]),b=new X509Certificate(next["webserver-cert-public.crt"]);if(a.fingerprint256===b.fingerprint256)return null;if(Date.parse(b.validTo)<=Date.parse(a.validTo))throw Error("Replacement certificate does not extend validity");return swap(root,data,next);});}
export async function rollbackTLS(arg,recoveryArg){const {root,data,host}=await context(arg),recovery=await directory(resolve(recoveryArg));if(dirname(recovery)!==root||!/^meshwall-tls-recovery-[a-f0-9]{24}$/.test(basename(recovery)))throw Error("Recovery directory must belong to this installation");return withLock(root,async()=>{const old=required(await files(recovery));splitCertificates(chain(old),old["webserver-cert-private.key"],host);return swap(root,data,old);});}
