import {randomBytes} from "node:crypto";
import {createSetupServer} from "./server.mjs";
export async function launchSetup({preflight,runInstall}){
 const token=randomBytes(32).toString("hex");let expiry;
 const server=createSetupServer({token,preflight,install:async(input,update)=>{clearTimeout(expiry);return runInstall(input,update);},complete:()=>{setTimeout(()=>{server.close();server.closeAllConnections();},120000).unref();}});
 server.on("error",e=>{console.error("Unable to start local setup:",e.message);process.exitCode=1;});
 server.listen(8787,"127.0.0.1",()=>{console.log("MeshWall one-time setup (local only): http://127.0.0.1:8787/#"+token);console.log("Open locally, or use an authorized SSH tunnel to 127.0.0.1:8787. Do not publish this port or token.");expiry=setTimeout(()=>{server.close();server.closeAllConnections();},15*60*1000);});
}
