// Read-only checks for the generated fresh-install security baseline; not a complete upstream schema.
import {X509Certificate,createPrivateKey} from "node:crypto";
import {readFreshMaterial,readFreshEndpoint} from "./diagnose.mjs";
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const flags=["desktopnotify","terminalnotify","filesnotify","desktopprompt","terminalprompt","filesprompt"];
const expected={redirPort:0,mpsPort:0,WANonly:true,selfUpdate:false,allowFraming:false,exactPorts:true,desktopMultiplex:false};
const domainExpected={newAccounts:false,localSessionRecording:false,clipboardGet:false,clipboardSet:false};
const settingKeys=new Set(["cert","port","portBind","sessionKey",...Object.keys(expected)]);
const domainKeys=new Set(["title","userConsentFlags",...Object.keys(domainExpected)]);
export function checkFreshPolicy(conf){
 if(!object(conf)||!object(conf.settings)||!object(conf.domains)||!object(conf.domains[""]))return "invalid-config";
 const s=conf.settings,d=conf.domains[""];
 if(Object.keys(conf).some(k=>!["settings","domains"].includes(k))||Object.keys(conf.domains).some(k=>k!=="")||
 Object.keys(s).some(k=>!settingKeys.has(k))||Object.keys(d).some(k=>!domainKeys.has(k)))return "custom-review";
 if(Object.entries(expected).some(([k,v])=>s[k]!==v)||Object.entries(domainExpected).some(([k,v])=>d[k]!==v)||
 typeof s.sessionKey!=="string"||!/^[a-f0-9]{96}$/i.test(s.sessionKey)||
 !object(d.userConsentFlags)||flags.some(k=>d.userConsentFlags[k]!==true)||Object.keys(d.userConsentFlags).some(k=>!flags.includes(k)))return "baseline-mismatch";
 return "baseline-matches";
}
export function checkLeafAndKey(leaf,key,host,now=Date.now()){
 let cert,privateKey;
 try{cert=new X509Certificate(leaf);}catch{return "invalid-certificate";}
 try{privateKey=createPrivateKey(key);}catch{return "invalid-key";}
 if(!cert.checkHost(host,{subject:"never"}))return "hostname-mismatch";
 if(!cert.checkPrivateKey(privateKey))return "key-mismatch";
 if(Date.parse(cert.validFrom)>now)return "not-yet-valid";
 if(Date.parse(cert.validTo)<=now)return "expired";
 if(Date.parse(cert.validTo)-now<=30*86400000)return "renew-soon";
 return "leaf-key-match";
}
const help={
 "invalid-config":"Preserve the original configuration. Review a known-good verified backup; do not regenerate identity/session settings.",
 "invalid-json":"Preserve the original configuration; review a verified backup locally.",
 "custom-review":"Custom or unknown settings require manual schema and security review. Do not overwrite them.",
 "baseline-mismatch":"Review fresh configuration security and consent settings against the installer; preserve identity and backup.",
 "baseline-matches":"Generated baseline settings match; full schema, endpoint and runtime still require separate checks.",
 "invalid-endpoint":"Review the private Tailscale hostname, bind and port; no public or insecure fallback.",
 "endpoint-present":"Expected private endpoint syntax is present; check the actual local interface separately.",
 "invalid-certificate":"Review installed TLS certificate material; preserve existing files.",
 "invalid-key":"Review the installed private key locally; never share its contents.",
 "hostname-mismatch":"Check the configured tailnet hostname and authorized certificate.",
 "key-mismatch":"Obtain a matching certificate/key pair using the documented TLS procedure.",
 "not-yet-valid":"Check local clock and certificate validity.",
 expired:"Follow the authorized TLS recovery procedure; never disable certificate verification.",
 "renew-soon":"Plan authorized TLS renewal before expiry.",
 "leaf-key-match":"Leaf hostname, date and key match; chain trust and live HTTPS are separate checks.",
 skipped:"Resolve configuration and file findings first."
};
function finding(code,state){return {code,state,next:help[state]??"Inspect the local file and permissions; preserve original state."};}
export async function diagnoseConfigTLS(root,{material=readFreshMaterial,endpoint=readFreshEndpoint,now=Date.now()}={}){
 const findings=[];
 const config=await material(root,"config");
 let policy=config.state;
 if(policy==="present"){try{policy=checkFreshPolicy(JSON.parse(config.text));}catch{policy="invalid-json";}}
 findings.push(finding("MW-CONFIG-POLICY",policy));
 const target=policy==="baseline-matches"||policy==="baseline-mismatch"||policy==="custom-review"?await endpoint(root):null;
 findings.push(finding("MW-CONFIG-ENDPOINT",target?"endpoint-present":policy==="invalid-json"?"skipped":"invalid-endpoint"));
 let tls="skipped";
 if(target){
  const leaf=await material(root,"leaf"),key=await material(root,"key");
  tls=leaf.state!=="present"?leaf.state:key.state!=="present"?key.state:checkLeafAndKey(leaf.text,key.text,target.host,now);
 }
 findings.push(finding("MW-TLS-LEAF",tls));
 return {format:1,mode:"read-only",scope:"fresh-config-and-leaf",status:policy==="baseline-matches"&&target&&tls==="leaf-key-match"?"baseline-observed":"needs-review",findings,note:"No mutation. This is not full MeshCentral schema validation, certificate chain trust, service ownership or login readiness. Reports exclude config values, paths, hostnames and key material. Use documented authorized backup/TLS recovery; do not regenerate configuration blindly."};
}
