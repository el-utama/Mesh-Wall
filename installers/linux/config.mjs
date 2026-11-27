import {randomBytes} from "node:crypto";
const [host,ip,port]=process.argv.slice(2);
const p=Number(port);
if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(host||"")||!/^100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(ip||"")||ip.split(".").some(x=>Number(x)>255)||!Number.isInteger(p)||p<1024||p>65535)throw Error("Invalid private network parameters");
const config={settings:{cert:host,port:p,portBind:ip,redirPort:0,mpsPort:0,WANonly:true,sessionKey:randomBytes(48).toString("hex"),selfUpdate:false,allowFraming:false,exactPorts:true,desktopMultiplex:false},domains:{"":{title:"MeshWall",newAccounts:false,localSessionRecording:false,clipboardGet:false,clipboardSet:false,userConsentFlags:{desktopnotify:true,terminalnotify:true,filesnotify:true,desktopprompt:true,terminalprompt:true,filesprompt:true}}}};
console.log(JSON.stringify(config,null,2));
