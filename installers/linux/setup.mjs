// One-time local bootstrap. No persistent privileged web service.
import {createServer} from "node:http";
import {randomBytes} from "node:crypto";
import {readFileSync,existsSync} from "node:fs";
import {spawn,spawnSync} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
import {validateSetup,validToken,validReadyURL} from "./setup-model.mjs";
const dir=new URL("./",import.meta.url);
const assets=new Map([["/",["setup.html","text/html; charset=utf-8"]],["/setup.js",["setup.js","text/javascript; charset=utf-8"]],["/setup.css",["setup.css","text/css; charset=utf-8"]]]);
export function createSetupServer({token,preflight,install,complete=()=>{}}){
  let state={status:"idle",stage:"preflight",message:"Ready for preflight",url:null};
  const data=new Map([...assets].map(([path,[name,type]])=>[path,{type,body:readFileSync(new URL(name,dir))}]));
  const json=(res,status,value)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8"});res.end(JSON.stringify(value));};
  const server=createServer(async(req,res)=>{
    res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("X-Frame-Options","DENY");res.setHeader("Referrer-Policy","no-referrer");res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const address=server.address(),host="127.0.0.1:"+address.port,origin="http://"+host;
    if(req.socket.remoteAddress!=="127.0.0.1"||req.headers.host!==host||(req.headers.origin&&req.headers.origin!==origin))return json(res,403,{error:"Local origin only"});
    if(req.method==="GET"&&data.has(req.url)){const a=data.get(req.url);res.writeHead(200,{"Content-Type":a.type});return res.end(a.body);}
    if(!req.url?.startsWith("/api/"))return json(res,404,{error:"Not found"});
    if(!validToken(req.headers.authorization,token))return json(res,401,{error:"Invalid setup token"});
    if(req.method==="GET"&&req.url==="/api/status")return json(res,200,state);
    if(req.method==="GET"&&req.url==="/api/preflight"){
      try{return json(res,200,await preflight());}catch{return json(res,500,{error:"Preflight failed; inspect local terminal"});}
    }
    if(req.method!=="POST"||req.url!=="/api/install")return json(res,404,{error:"Not found"});
    if(req.headers.origin!==origin||req.headers["content-type"]!=="application/json")return json(res,403,{error:"Origin or content type rejected"});
    if(state.status!=="idle")return json(res,409,{error:"An installation has already been started"});
    let body="",input;
    try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)throw Error("Request too large");}input=validateSetup(JSON.parse(body));}catch(e){return json(res,400,{error:e instanceof SyntaxError?"Invalid JSON":e.message});}
    if(state.status!=="idle")return json(res,409,{error:"An installation has already been started"});
    state={status:"running",stage:"preflight",message:"Starting installation",url:null};
    json(res,202,state);
    const update=(stage)=>{if(["preflight","certificate","package","configuration","administrator","service","verification"].includes(stage))state={...state,stage,message:"Running: "+stage};};
    try{const url=validReadyURL(await install(input,update));if(!url)throw Error("No verified URL");state={status:"complete",stage:"ready",message:"HTTPS readiness passed. Sign in and validate an authorized PC.",url};}
    catch{state={status:"failed",stage:state.stage,message:"Installation did not complete. Inspect local terminal and service state. Do not retry blindly.",url:null};}
    finally{input=null;body="";complete(state);}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.maxHeadersCount=32;server.maxRequestsPerSocket=50;return server;
}
function preflight(){
 const checks=[];const check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
 const cmd=(name,args)=>spawnSync(name,args,{encoding:"utf8",timeout:5000,stdio:["ignore","pipe","pipe"]});
 const arch=process.arch, [a,b,c]=process.versions.node.split(".").map(Number);
 check("Node architecture",arch==="arm64"||arch==="x64",arch);
 check("Node version",a>22||(a===22&&(b>21||(b===21&&c>=1))),process.versions.node);
 for(const name of ["npm","tailscale","systemctl","curl","openssl","runuser","useradd","install","getent"]){const r=cmd("sh",["-c","command -v "+name]);check(name,r.status===0,r.status===0?"Available":"Missing");}
 let ts;try{const r=cmd("tailscale",["status","--json"]);ts=JSON.parse(r.stdout);}catch{}
 check("Tailscale login and MagicDNS",ts?.BackendState==="Running"&&!!ts?.Self?.DNSName,ts?.BackendState==="Running"?"Running":"Authenticate Tailscale first");
 check("Fresh install target",!existsSync("/opt/meshwall")&&!existsSync("/etc/systemd/system/meshwall-engine.service"),"Existing/partial installs are refused");
 return {checks,ready:checks.every(c=>c.ok),note:"The installer repeats checks, validates certificate issuance and requires Tailscale HTTPS enabled."};
}
function runInstall(input,update){
 return new Promise((resolve,reject)=>{
  const child=spawn("bash",[fileURLToPath(new URL("install.sh",dir)),"--wizard"],{env:{PATH:"/usr/local/bin:/usr/bin:/bin",HOME:"/root",LANG:"C.UTF-8"},stdio:["pipe","pipe","pipe"]});
  let buffer="",url=null;
  function line(s){if(s.startsWith("MW_STAGE ")){update(s.slice(9).trim());return;}if(s.startsWith("MW_READY ")){url=validReadyURL(s.slice(9).trim());return;}if(s.trim())console.log(s.replaceAll(input.password,"[redacted]"));}
  child.stdout.setEncoding("utf8");child.stdout.on("data",d=>{buffer+=d;let i;while((i=buffer.indexOf("\n"))>=0){line(buffer.slice(0,i));buffer=buffer.slice(i+1);}if(buffer.length>16000)buffer="";});
  let errBuffer="";child.stderr.setEncoding("utf8");child.stderr.on("data",d=>{errBuffer+=d;let i;while((i=errBuffer.indexOf("\n"))>=0){const row=errBuffer.slice(0,i);errBuffer=errBuffer.slice(i+1);if(row.trim())console.error(row.replaceAll(input.password,"[redacted]"));}if(errBuffer.length>16000)errBuffer="";}); // Diagnostics stay in the local terminal.
  child.on("error",reject);child.on("close",code=>{if(buffer)line(buffer);code===0&&url?resolve(url):reject(Error("Installer failed: "+code));});
  child.stdin.on("error",()=>{});child.stdin.end(input.username+"\n"+input.password+"\n"+input.password+"\n");
 });
}
async function main(){
 if(process.platform!=="linux"||process.getuid?.()!==0||!process.stdout.isTTY)throw Error("Start locally in an interactive Linux terminal using sudo. Do not expose this service.");
 const token=randomBytes(32).toString("hex");let expiry;
 const server=createSetupServer({token,preflight,install:async(input,update)=>{clearTimeout(expiry);return runInstall(input,update);},complete:()=>{setTimeout(()=>{server.close();server.closeAllConnections();},120000).unref();}});
 server.on("error",e=>{console.error("Unable to start local setup:",e.message);process.exitCode=1;});
 server.listen(8787,"127.0.0.1",()=>{console.log("MeshWall one-time setup (local only): http://127.0.0.1:8787/#"+token);console.log("From another PC use an authorized SSH tunnel to 127.0.0.1:8787. Do not publish this port or token.");expiry=setTimeout(()=>{server.close();server.closeAllConnections();},15*60*1000);});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
