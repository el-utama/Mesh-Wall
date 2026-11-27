import {timingSafeEqual} from "node:crypto";
export function validateSetup(body){
  if(!body||typeof body!=="object"||body.authorized!==true)throw Error("Confirm this is an authorized test server.");
  const {username,password,confirmation}=body;
  if(typeof username!=="string"||!/^[a-zA-Z][a-zA-Z0-9_.-]{2,31}$/.test(username))throw Error("Invalid administrator username.");
  if(typeof password!=="string"||password.length<16||password.length>128||!/[a-zA-Z]/.test(password)||/^-/u.test(password)||/[\u0000\r\n]/u.test(password)||password!==confirmation)throw Error("Passwords must match, contain a letter and be 16–128 characters, without line breaks.");
  return {username,password};
}
export function validToken(header,token){if(typeof header!=="string"||!header.startsWith("Bearer "))return false;const a=Buffer.from(header.slice(7)),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);}
export function validReadyURL(value){try{const u=new URL(value);return u.protocol==="https:"&&/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(u.hostname)&&u.port==="8443"&&u.pathname==="/meshwall.html"&&!u.search&&!u.hash&&!u.username&&!u.password?u.href:null;}catch{return null;}}
