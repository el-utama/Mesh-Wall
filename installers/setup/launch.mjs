import {randomBytes} from "node:crypto";
import {createSetupServer} from "./server.mjs";
import {createJournal} from "../support/journal.mjs";
export async function launchSetup({preflight,runInstall}){
 const token=randomBytes(32).toString("hex");let expiry;
 const server=createSetupServer({token,preflight,install:async(input,update)=>{clearTimeout(expiry);const journal=createJournal();let journalError=false;const track=stage=>{update(stage);try{journal.record(stage,"running");}catch{journalError=true;console.error("Support journal update failed; preserve local terminal and partial state.");}};try{const url=await runInstall(input,track);if(journalError)throw Error("Support journal incomplete");journal.record("ready","complete");return url;}catch(e){try{journal.record(journal.current.stage,"failed");}catch{console.error("Support journal could not record failure.");}throw e;}},complete:()=>{setTimeout(()=>{server.close();server.closeAllConnections();},120000).unref();}});
 server.on("error",e=>{console.error("Unable to start local setup:",e.message);process.exitCode=1;});
 server.listen(8787,"127.0.0.1",()=>{console.log("MeshWall one-time setup (local only): http://127.0.0.1:8787/#"+token);console.log("Open locally, or use an authorized SSH tunnel to 127.0.0.1:8787. Do not publish this port or token.");expiry=setTimeout(()=>{server.close();server.closeAllConnections();},15*60*1000);});
}
