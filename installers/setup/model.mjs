import {timingSafeEqual} from "node:crypto";
import {posix,win32} from "node:path";
export function validateSetup(body){
  if(!body||typeof body!=="object"||body.authorized!==true)throw Error("Confirm this is an authorized test server.");
  const {username,password,confirmation}=body;
  if(typeof username!=="string"||!/^[a-zA-Z][a-zA-Z0-9_.-]{2,31}$/.test(username))throw Error("Invalid administrator username.");
  if(typeof password!=="string"||password.length<16||password.length>128||!/[a-zA-Z]/.test(password)||/^-/u.test(password)||/[\u0000\r\n]/u.test(password)||password!==confirmation)throw Error("Passwords must match, contain a letter and be 16–128 characters, without line breaks.");
  return {username,password};
}
export function validToken(header,token){if(typeof header!=="string"||!header.startsWith("Bearer "))return false;const a=Buffer.from(header.slice(7)),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);}
export function validReadyURL(value){try{const u=new URL(value);return u.protocol==="https:"&&/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(u.hostname)&&u.port==="8443"&&u.pathname==="/meshwall.html"&&!u.search&&!u.hash&&!u.username&&!u.password?u.href:null;}catch{return null;}}

export function validAdoptionPath(value,platform=process.platform){
 if(typeof value!=="string"||value.length>1024||/[\u0000-\u001f\u007f]/u.test(value))return null;
 if(platform==="win32"){
  if(!/^[a-z]:[\\/]/i.test(value)||/[<>:"|?*]/.test(value.slice(2)))return null;
  if(value.slice(3).split(/[\\/]/).some(part=>/[. ]$/.test(part)||/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(part)))return null;
  return win32.normalize(value);
 }
 if(!value.startsWith("/")||value.split("/").some(part=>part==="."||part===".."))return null;
 return posix.normalize(value);
}

export function validateAdoptionPreview(body){
 if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).some(key=>!["root","backupParent","serviceName"].includes(key)))throw Error("Invalid preview request.");
 for(const key of Object.keys(body))if(typeof body[key]!=="string"||body[key].length>1024)throw Error("Invalid preview path.");
 if(typeof body.root!=="string"||!body.root.length)throw Error("An installation root is required.");
 return {root:body.root,backupParent:body.backupParent,serviceName:body.serviceName};
}
