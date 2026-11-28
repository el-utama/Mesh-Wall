// Local operator-only health evidence; no service control, credentials, redirects or remote scanning.
import {get} from "node:https";
import {networkInterfaces} from "node:os";
import {normalize} from "node:path";
import {diagnoseFresh,readFreshEndpoint} from "./diagnose.mjs";
import {inspectAdoptionService,validServiceName} from "./adoption-service.mjs";
import {guidance} from "./catalog.mjs";

const serviceHelp={
 invalid:"Enter the exact registered service name.",
 missing:"Confirm the registered name and whether service installation completed.",
 mismatch:"The registered service points elsewhere. Do not start or stop it.",
 unsupported:"The service launch is not a supported match. Inspect the effective launch locally.",
 unavailable:"Check permissions to read the service manager.",
 stopped:"The matched service is stopped. Inspect local service logs before a controlled start.",
 transitioning:"The service is changing state. Recheck once it settles.",
 running:"Registered launch and running state matched; check HTTPS and login separately.",
 skipped:"Check the installation root and package before inspecting a service."
};
const httpsHelp={
 skipped:"Resolve the file and service findings before checking HTTPS.",
 "invalid-endpoint":"Expected the fresh private Tailscale hostname, IPv4 and port 8443 in config. Review the local configuration.",
 "not-local":"The configured IPv4 is not assigned to this host. Check Tailscale and the private bind.",
 timeout:"Check the identified service, private bind and local network.",
 refused:"No connection accepted at the configured private endpoint. Check the service and bind.",
 tls:"TLS validation failed. Check the trusted chain, hostname and clock; never disable verification.",
 "http-status":"Expected HTTP 200 without redirects. Inspect the local service and route.",
 "unexpected-page":"Expected the MeshWall page; inspect UI placement and service configuration.",
 oversized:"Response exceeded the diagnostic limit. Inspect the actual route locally.",
 unavailable:"HTTPS could not be verified. Inspect local networking and service logs.",
 reachable:"The expected page responded over verified TLS. Sign in and validate an authorized device separately."
};
function result(code,stage,state,next){return {code,stage,state,next,help:guidance(stage)};}
function errorState(error){
 const code=error?.code??"";
 if(code==="ECONNREFUSED")return "refused";
 if(code==="ETIMEDOUT")return "timeout";
 if(/^(ERR_TLS_|ERR_SSL_|CERT_|UNABLE_TO_|DEPTH_ZERO_|SELF_SIGNED_)/.test(code))return "tls";
 return "unavailable";
}
export function probePrivatePage({host,ip},{request=get,timeoutMs=5000,maxBytes=262144}={}){
 return new Promise(resolve=>{
  let req,timer,finished=false;
  function done(state){
   if(finished)return;
   finished=true;clearTimeout(timer);resolve(state);req?.destroy();
  }
  try{
   timer=setTimeout(()=>done("timeout"),timeoutMs);
   req=request({hostname:ip,port:8443,servername:host,path:"/meshwall.html",method:"GET",
    headers:{Host:host+":8443",Accept:"text/html"},rejectUnauthorized:true,agent:false},res=>{
    res.on("error",e=>done(errorState(e)));res.on("aborted",()=>done("unavailable"));
    if(res.statusCode!==200){done("http-status");res.destroy();return;}
    const chunks=[];let bytes=0;
    res.on("data",chunk=>{
     if(finished)return;
     const b=Buffer.from(chunk);bytes+=b.length;
     if(bytes>maxBytes){done("oversized");res.destroy();return;}
     chunks.push(b);
    });
    res.on("end",()=>done(Buffer.concat(chunks).toString("utf8").includes("<title>MeshWall</title>")?"reachable":"unexpected-page"));
   });
   req.on("error",error=>done(errorState(error)));
  }catch(error){done(errorState(error));}
 });
}
export async function diagnoseHealth(root,name,{files=diagnoseFresh,endpoint=readFreshEndpoint,inspect=inspectAdoptionService,interfaces=networkInterfaces,probe=probePrivatePage}={}){
 const report=await files(root);
 const findings=[...report.findings];
 const present=code=>findings.some(x=>x.code===code&&x.state==="present");
 let service="skipped",https="skipped";
 if(!validServiceName(name))service="invalid";
 else if(present("MW-DIAG-ROOT")&&present("MW-DIAG-PACKAGE")){
  try{
   const info=await inspect(normalize(root),name);
   const state=info?.status==="verified"?info.state:info?.status;
   service=Object.hasOwn(serviceHelp,state)?state:"unavailable";
  }catch{service="unavailable";}
 }
 findings.push(result("MW-DIAG-SERVICE","service",service,serviceHelp[service]));
 if(report.status==="files-present"&&service==="running"){
  try{
   const target=await endpoint(root);
   if(!target)https="invalid-endpoint";
   else if(!Object.values(interfaces()).flat().some(x=>x?.family==="IPv4"&&!x.internal&&x.address===target.ip))https="not-local";
   else{
    const state=await probe(target);
    https=Object.hasOwn(httpsHelp,state)?state:"unavailable";
   }
  }catch{https="unavailable";}
 }
 findings.push(result("MW-DIAG-HTTPS","verification",https,httpsHelp[https]));
 return {format:1,mode:"read-only",scope:"default-fresh-install-health",status:report.status==="files-present"&&service==="running"&&https==="reachable"?"page-reachable":"needs-review",findings,note:"No service or file changes. The service registration/state and HTTPS page are separate observations, not proof of process ownership, permissions, backup integrity, login or enrollment. Do not resume, restart or remove files automatically."};
}
