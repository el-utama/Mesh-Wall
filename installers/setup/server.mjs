import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {validateSetup,validToken,validReadyURL} from "./model.mjs";
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
