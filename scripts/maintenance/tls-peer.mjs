// Validate the actual peer using normal CA and hostname validation.
import tls from "node:tls";
const [ip,host,expected]=process.argv.slice(2);
if(!/^100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(ip||"")||ip.split(".").some(x=>Number(x)>255)||!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(host||"")||!/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(expected||""))throw Error("Invalid TLS probe parameters");
const socket=tls.connect({host:ip,port:8443,servername:host,rejectUnauthorized:true},()=>{if(socket.getPeerCertificate().fingerprint256!==expected)process.exitCode=1;socket.end();});
socket.setTimeout(4000,()=>socket.destroy(Error("Timeout")));socket.on("error",()=>{process.exitCode=1;});
