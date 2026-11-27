import {X509Certificate,createPrivateKey} from "node:crypto";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
export function splitCertificates(chain,key,host,now=Date.now()){
 if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(host))throw Error("Invalid tailnet DNS name");
 const blocks=chain.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g)||[];
 if(!blocks.length||blocks.length>10||chain.replace(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,"").trim())throw Error("Invalid certificate chain");
 const certs=blocks.map(b=>new X509Certificate(b)),leaf=certs[0];
 if(!leaf.checkHost(host,{subject:"never"})||Date.parse(leaf.validFrom)>now||Date.parse(leaf.validTo)<now+86400000||!leaf.checkPrivateKey(createPrivateKey(key)))throw Error("Certificate hostname, validity or key mismatch");
 for(let i=0;i<certs.length-1;i++)if(!certs[i].checkIssued(certs[i+1])||!certs[i].verify(certs[i+1].publicKey))throw Error("Certificate chain mismatch");
 return {"webserver-cert-public.crt":blocks[0]+"\n","webserver-cert-private.key":key,...Object.fromEntries(blocks.slice(1).map((b,i)=>["webserver-cert-chain"+(i+1)+".crt",b+"\n"]))};
}
export async function prepareCertificates(chainFile,keyFile,host,dest){
 const files=splitCertificates(await readFile(chainFile,"utf8"),await readFile(keyFile,"utf8"),host);
 await mkdir(dest,{mode:0o700});for(const [name,value] of Object.entries(files))await writeFile(join(dest,name),value,{flag:"wx",mode:0o600});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const [chain,key,host,dest]=process.argv.slice(2);try{if(!chain||!key||!host||!dest)throw Error("Expected fullchain, key, DNS name, fresh output directory");await prepareCertificates(chain,key,host,dest);}catch(e){console.error(e.message);process.exitCode=1;}}
