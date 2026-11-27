// Thin compatibility adapter around upstream 1.3.2 browser assets.
import {qualityProfile} from "./model.mjs";
globalThis.urlargs={}; // Upstream relay expects this optional page global.
export function createDesktop({control,device,canvas,cookies,profile,onState,onDisplays,onFrame}){
  if(typeof globalThis.CreateAgentRemoteDesktop!=="function"||typeof globalThis.CreateAgentRedirect!=="function")throw Error("Upstream desktop renderer unavailable");
  if(!control.authenticated||!cookies?.cookie||!cookies?.rcookie)throw Error("Authenticated relay required");
  const module=globalThis.CreateAgentRemoteDesktop(canvas);
  module.stopInput=true; // Do not attach keyboard or mouse handlers in the wall.
  const q=qualityProfile(profile);module.CompressionLevel=q.quality;module.ScalingLevel=q.scale;module.FrameRateTimer=q.interval;
  const relay=globalThis.CreateAgentRedirect(control,module,location.host,cookies.cookie,cookies.rcookie,new URL("./",location.href).pathname);
  relay.attemptWebRTC=false;
  let stopped=false,connected=false,firstFrame=false,lastReported=0;
  let timer=setTimeout(()=>{onState("No session / consent pending");stop();},90000);
  // Upstream picture decoding is asynchronous. Mark live only after canvas drawing.
  const ctx=module.Canvas,draw=ctx.drawImage.bind(ctx);
  ctx.drawImage=function(...args){const result=draw(...args);if(!stopped&&connected){if(!firstFrame){firstFrame=true;clearTimeout(timer);}const now=Date.now();if(!lastReported||now-lastReported>=1000){lastReported=now;onFrame();}}return result;};
  module.onDisplayinfo=(_,displays,selected)=>{if(!stopped)onDisplays(displays,selected);};
  relay.onStateChanged=(_,state)=>{if(stopped)return;if(state===3){connected=true;clearTimeout(timer);timer=setTimeout(()=>{if(!firstFrame){onState("No session / no decoded frame");stop();}},60000);onState("Connected · waiting for screen");module.GetDisplayNumbers();}else if(state===0){clearTimeout(timer);stopped=true;onState("Disconnected / denied");}else onState("Connecting / awaiting consent");};
  relay.onConsoleMessageChange=()=>{if(!stopped&&!connected)onState("Awaiting agent / consent");};
  function stop(){if(stopped)return;stopped=true;clearTimeout(timer);relay.onStateChanged=null;relay.Stop();canvas.getContext("2d")?.clearRect(0,0,canvas.width,canvas.height);}
  try{relay.Start(device.id);}catch(e){stop();throw e;}
  return {stop,quality(p,focus=false){const q=qualityProfile(p,focus);if(connected&&!stopped)module.SendCompressionLevel(1,q.quality,q.scale,q.interval);},display(n){if(connected&&!stopped&&Object.hasOwn(module.displays||{},String(n)))module.SetDisplay(Number(n));},get stopped(){return stopped;},get firstFrame(){return firstFrame;}};
}
