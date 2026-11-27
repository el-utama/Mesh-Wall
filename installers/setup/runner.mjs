import {spawn} from "node:child_process";
import {validReadyURL} from "./model.mjs";
export function runInstaller({command,args,env,encode},input,update){
 return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{env,windowsHide:true,stdio:["pipe","pipe","pipe"]});
  let buffer="",url=null;
  function line(s){if(s.startsWith("MW_STAGE ")){update(s.slice(9).trim());return;}if(s.startsWith("MW_READY ")){url=validReadyURL(s.slice(9).trim());return;}if(s.trim())console.log(s.replaceAll(input.password,"[redacted]"));}
  child.stdout.setEncoding("utf8");child.stdout.on("data",d=>{buffer+=d;let i;while((i=buffer.indexOf("\n"))>=0){line(buffer.slice(0,i));buffer=buffer.slice(i+1);}if(buffer.length>16000)buffer="";});
  let errBuffer="";child.stderr.setEncoding("utf8");child.stderr.on("data",d=>{errBuffer+=d;let i;while((i=errBuffer.indexOf("\n"))>=0){const row=errBuffer.slice(0,i);errBuffer=errBuffer.slice(i+1);if(row.trim())console.error(row.replaceAll(input.password,"[redacted]"));}if(errBuffer.length>16000)errBuffer="";}); // Diagnostics stay in the local terminal.
  child.on("error",reject);child.on("close",code=>{if(buffer)line(buffer);code===0&&url?resolve(url):reject(Error("Installer failed: "+code));});
  child.stdin.on("error",()=>{});child.stdin.end(encode(input),"utf8");
 });
}
