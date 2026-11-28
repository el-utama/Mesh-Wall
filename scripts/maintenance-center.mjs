// Temporary read-only local UI using the existing setup HTTP boundary.
import {randomBytes} from "node:crypto";
import {createSetupServer} from "../installers/setup/server.mjs";
if(process.argv.length!==2){console.error("Usage: node scripts/maintenance-center.mjs");process.exitCode=1;}
else{
 const token=randomBytes(32).toString("hex");
 const server=createSetupServer({token,maintenanceOnly:true});
 server.on("error",()=>{console.error("Unable to open local maintenance center; check port 8787 and local permissions.");process.exitCode=1;});
 server.listen(8787,"127.0.0.1",()=>{
  console.log("MeshWall read-only maintenance (local only): http://127.0.0.1:8787/#"+token);
  console.log("Do not share the token or publish this port. Session expires after 15 minutes; Ctrl+C closes it.");
  setTimeout(()=>{server.close();server.closeAllConnections();},15*60*1000).unref();
 });
}
