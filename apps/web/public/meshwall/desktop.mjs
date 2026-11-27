// Pinned upstream desktop compatibility adapter. Each connection owns its canvas hook.
import {qualityProfile} from "./model.mjs";
globalThis.urlargs={};
export function createDesktop({control,device,canvas,cookies,profile,focused=false,onState,onDisplays,onFrame}){
 if(typeof globalThis.CreateAgentRemoteDesktop!=="function"||typeof globalThis.CreateAgentRedirect!=="function")throw Error("Upstream desktop renderer unavailable");
 if(!control.authenticated||!cookies?.cookie||!cookies?.rcookie)throw Error("Authenticated relay required");
 const module=globalThis.CreateAgentRemoteDesktop(canvas);
 module.stopInput=true;
 const q=qualityProfile(profile,focused);module.CompressionLevel=q.quality;module.ScalingLevel=q.scale;module.FrameRateTimer=q.interval;
 const relay=globalThis.CreateAgentRedirect(control,module,location.host,cookies.cookie,cookies.rcookie,new URL("./",location.href).pathname);
 relay.attemptWebRTC=false;
 let stopped=false,connected=false,firstFrame=false,lastReported=0,timer;
 const ctx=module.Canvas,original=ctx.drawImage;
 function draw(...args){
  if(stopped)return;
  const result=original.apply(ctx,args);
  if(connected){if(!firstFrame){firstFrame=true;clearTimeout(timer);}const now=Date.now();if(!lastReported||now-lastReported>=1000){lastReported=now;onFrame();}}
  return result;
 }
 ctx.drawImage=draw;
 function finish(message,stopRelay=true){
  if(stopped)return;
  stopped=true;connected=false;clearTimeout(timer);
  relay.onStateChanged=null;relay.onConsoleMessageChange=null;module.onDisplayinfo=null;
  try{if(stopRelay)relay.Stop();}finally{
   if(ctx.drawImage===draw)ctx.drawImage=original;
   if(relay.latency?.lastSend){clearInterval(relay.latency.lastSend);relay.latency.lastSend=null;}
   // Discard queued upstream image work and release the old renderer's canvas.
   module.State=0;module.PendingOperations=[];module.Canvas=null;
   ctx.clearRect(0,0,canvas.width,canvas.height);
   if(message)onState(message);
  }
 }
 timer=setTimeout(()=>finish("No session / consent pending"),90000);
 module.onDisplayinfo=(_,displays,selected)=>{if(!stopped)onDisplays(displays,selected);};
 relay.onStateChanged=(_,state)=>{
  if(stopped)return;
  if(state===3){connected=true;clearTimeout(timer);timer=setTimeout(()=>{if(!firstFrame)finish("No session / no decoded frame");},60000);onState("Connected · waiting for screen");module.GetDisplayNumbers();}
  else if(state===0)finish("Disconnected / denied",false);
  else onState("Connecting / awaiting consent");
 };
 relay.onConsoleMessageChange=()=>{if(!stopped&&!connected)onState("Awaiting agent / consent");};
 try{relay.Start(device.id);}catch(e){finish(null);throw e;}
 return {stop:()=>finish(null),quality(p,focus=false){const q=qualityProfile(p,focus);if(connected&&!stopped)module.SendCompressionLevel(1,q.quality,q.scale,q.interval);},display(n){if(connected&&!stopped&&Object.hasOwn(module.displays||{},String(n)))module.SetDisplay(Number(n));},get stopped(){return stopped;},get firstFrame(){return firstFrame;}};
}
