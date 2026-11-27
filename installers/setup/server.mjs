import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {validateAdoptionPreview,validateSetup,validToken,validReadyURL} from "./model.mjs";
import {guidance,supportReport} from "../support/catalog.mjs";
import {discover as defaultDiscover} from "../support/discovery.mjs";
import {planAdoption} from "./adoption-plan.mjs";
const dir=new URL("./",import.meta.url);
const assets=new Map([["/",["setup.html","text/html; charset=utf-8"]],["/setup.js",["setup.js","text/javascript; charset=utf-8"]],["/setup-adoption.js",["setup-adoption.js","text/javascript; charset=utf-8"]],["/setup.css",["setup.css","text/css; charset=utf-8"]]]);
export function createSetupServer({token,preflight,install,complete=()=>{},discover=defaultDiscover,inspectService}){
  let state={status:"idle",stage:"preflight",message:"Ready for preflight",url:null};
  let reviewingAdoption=false,existingCandidate=false;
  const data=new Map([...assets].map(([path,[name,type]])=>[path,{type,body:readFileSync(new URL(name,dir))}]));
  const json=(res,status,value)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8"});res.end(JSON.stringify(value));};
  const server=createServer(async(req,res)=>{
    res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("X-Frame-Options","DENY");res.setHeader("Referrer-Policy","no-referrer");res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const address=server.address(),host="127.0.0.1:"+address.port,origin="http://"+host;
    if(req.socket.remoteAddress!=="127.0.0.1"||req.headers.host!==host||(req.headers.origin&&req.headers.origin!==origin))return json(res,403,{error:"Local origin only"});
    if(req.method==="GET"&&data.has(req.url)){const a=data.get(req.url);res.writeHead(200,{"Content-Type":a.type});return res.end(a.body);}
    if(!req.url?.startsWith("/api/"))return json(res,404,{error:"Not found"});
    if(!validToken(req.headers.authorization,token))return json(res,401,{error:"Invalid setup token"});
    if(req.method==="GET"&&req.url==="/api/status")return json(res,200,{...state,help:guidance(state.stage)});
    if(req.method==="GET"&&req.url==="/api/support")return json(res,200,supportReport(state));
    if(req.method==="GET"&&req.url==="/api/discovery"){try{const candidates=await discover();existingCandidate ||= candidates.length>0;return json(res,200,{candidates,existingCandidate,help:guidance("discovery")});}catch{return json(res,500,{error:"Discovery unavailable",help:guidance("discovery")});}}
    if(req.method==="GET"&&req.url==="/api/preflight"){
      try{const p=await preflight();return json(res,200,{...p,help:guidance("preflight")});}catch{return json(res,500,{error:"Preflight failed; inspect local terminal"});}
    }
    if(req.method!=="POST"||!["/api/install","/api/adoption/preview"].includes(req.url))return json(res,404,{error:"Not found"});
    if(req.headers.origin!==origin||req.headers["content-type"]!=="application/json")return json(res,403,{error:"Origin or content type rejected"});
    const adoption=req.url==="/api/adoption/preview";
    if(state.status!=="idle"||reviewingAdoption)return json(res,409,{error:"The wizard is already processing a request. Check the current status."});
    let body="",input;
    try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192)throw Error("Request too large");}input=(adoption?validateAdoptionPreview:validateSetup)(JSON.parse(body));}catch(e){return json(res,400,{error:e instanceof SyntaxError?"Invalid JSON":e.message});}
    if(state.status!=="idle"||reviewingAdoption)return json(res,409,{error:"The wizard is already processing a request. Check the current status."});
    if(adoption){
      reviewingAdoption=true;
      state={...state,stage:"adoption"};
      try{
        const plan=await planAdoption(input,()=>{existingCandidate=true;},inspectService);
        return json(res,plan.error?422:200,{...plan,existingCandidate,help:guidance("adoption"),platform:process.platform==="win32"?"windows":"linux"});
      }catch{return json(res,500,{error:"Could not preview adoption. Inspect the local terminal.",existingCandidate,help:guidance("adoption")});}
      finally{reviewingAdoption=false;}
    }
    // Recheck on the server; a stale or forged browser state cannot start install.
    try{const p=await preflight(),existing=await discover();existingCandidate ||= existing.length>0;if(existingCandidate||p.ready!==true)return json(res,409,{error:existingCandidate?"Existing MeshCentral candidate detected; review adoption before fresh install.":"Preflight blocked installation."});}catch{return json(res,409,{error:"Preflight or discovery failed; inspect before continuing."});}
    if(state.status!=="idle"||reviewingAdoption)return json(res,409,{error:"The wizard is already processing a request. Check the current status."});
    state={status:"running",stage:"preflight",message:"Starting installation",url:null};
    json(res,202,state);
    const update=(stage)=>{if(["preflight","certificate","package","configuration","administrator","service","verification"].includes(stage))state={...state,stage,message:"Running: "+stage};};
    try{const url=validReadyURL(await install(input,update));if(!url)throw Error("No verified URL");state={status:"complete",stage:"ready",message:"HTTPS readiness passed. Sign in and validate an authorized PC.",url};}
    catch{state={status:"failed",stage:state.stage,message:"Installation did not complete. Inspect local terminal and service state. Do not retry blindly.",url:null};}
    finally{input=null;body="";complete(state);}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.maxHeadersCount=32;server.maxRequestsPerSocket=50;return server;
}
